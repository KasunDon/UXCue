# Refined Product Requirements

## Product Name

Working name: UXLens

Possible positioning names:

- UXLens
- ReviewLens
- DefectLens
- AgentQA
- PixelBrief

Keep UXLens until naming collision and trademark checks are done.

## Product Statement

UXLens is a design QA issue tracker for AI-assisted frontend work. It lets reviewers capture UI/UX defects directly from a browser, track them locally or in UXLens Cloud, and export or sync agent-ready issues to GitHub and coding agents.

## Primary User Story

As a frontend builder using AI agents, I want to click a broken UI element, write quick feedback, and get a tracked issue containing screenshot, selector, styles, URL, viewport, and an agent-ready fix brief, so that Claude Code, Codex, Cursor, or another agent can fix the issue without asking where it is.

## Product Modes

### Local Mode

No account required.

Capabilities:

- Create projects.
- Create review sessions.
- Capture issues.
- Store screenshots locally.
- Track status.
- Export markdown/JSON/zip.

Constraints:

- No cross-device sync.
- No share link.
- GitHub optional through separately connected token/app if supported.

### Cloud Mode

Google SSO account.

Capabilities:

- Sync project/session/issue data.
- Store screenshots in UXLens Cloud.
- View issues in cloud console.
- Export from cloud.
- Enable share links later.
- Enable production GitHub integration.

Constraints:

- Sync must be explicit.
- Screenshots are sensitive and private by default.

### GitHub Integration Mode

Separate optional authorization.

Capabilities:

- Create GitHub issue from UXLens issue.
- Link existing GitHub issue.
- Refresh GitHub issue state.
- Store repo, issue number, URL, labels, and sync status.

Constraints:

- GitHub is never required for capture.
- Disconnecting GitHub does not delete UXLens issues.

### Agent/MCP Mode

Later phase.

Capabilities:

- Agent reads UXLens sessions and issues.
- Agent gets screenshot references and metadata.
- Agent marks issue fixed or links PR/commit.

Constraints:

- MCP is not required for MVP.
- Direct markdown/JSON export remains the baseline.

## MVP Requirements

### R1: Project And Session Tracking

UXLens must allow the user to create/select:

- Project.
- Review session.

Acceptance:

- Active session is visible in side panel.
- Issue IDs are session-scoped as `UX-001`, `UX-002`.
- Deleting an issue does not renumber other issues.

### R2: Element Capture

UXLens must let the user select a page element.

Acceptance:

- User starts capture from side panel or extension action.
- Hover shows highlight and compact element label.
- Click selects element.
- Escape cancels capture.
- Capture mode does not persist after save/cancel.

Permission note (D013, per docs/19 F5):

- Capture arming is per user invocation; the `chrome.commands` keyboard shortcut counts as invocation, so "land on page → hit shortcut → capture" works with zero broad permissions.
- The `activeTab` grant does not survive navigation to a new page, so capture must be re-armed by a user gesture on each page. The side panel stays open across navigation, so the review *session* persists even though the page grant does not.
- Optional per-origin host grant (`chrome.permissions.request` at runtime) can be offered as a per-project convenience toggle for heavy dogfooding; never reach for `<all_urls>`.

### R3: Feedback Composer

UXLens must turn a selected element into an issue draft.

Fields:

- Title.
- Feedback, required.
- Expected behavior.
- Suggested fix.
- Type.
- Severity.
- Assignee hint.
- Status.

Acceptance:

- Save creates issue.
- Cancel discards draft.
- Title can be generated from feedback and edited.

### R4: Metadata Capture

UXLens must capture enough metadata for an agent to locate and reason about the UI.

MVP fields:

- URL, title, route/path.
- Timestamp.
- Viewport width/height/DPR/color scheme.
- Scroll position.
- Selector and selector status.
- DOM path and XPath fallback.
- Tag, id, classes, data attributes.
- ARIA role/name/label where available.
- Truncated outerHTML skeleton.
- Bounding box.
- Computed style subset.
- Parent layout summary.
- Best-effort React component name.

Acceptance:

- Metadata is stored with the issue.
- Metadata can be exported to markdown/JSON.
- Missing metadata degrades gracefully.

### R5: Screenshots

UXLens must capture:

- Element crop.
- Viewport screenshot with highlighted element.

Acceptance:

- Screenshot refs appear in issue detail.
- Screenshots are included in zip export.
- If screenshot fails, the issue can still be saved with a warning.

Single-capture rule (D011, per docs/19 F2):

- Exactly ONE `chrome.tabs.captureVisibleTab` call per issue — a hard Chrome quota of 2 calls/sec cannot be raised. Capture the viewport once, then derive the element crop from that same bitmap in an OffscreenCanvas using bbox × devicePixelRatio. Never call twice for element + viewport.
- Quota error → one retry with backoff → save the issue with a screenshot-failed warning.
- Full-page scroll-and-stitch capture is out of scope.

### R6: Local Issue Workflow

UXLens must behave as a small issue tracker.

Acceptance:

- List issues by session.
- Filter by status, type, severity.
- Edit issue fields.
- Delete/archive issue.
- Mark issue fixed/ignored.
- Copy per-issue markdown.

### R7: Exports

UXLens must export portable artifacts.

Acceptance:

- Copy full session markdown.
- Download zip with `review.md`, `review.json`, issue markdown, and screenshots.
- JSON validates against `uxlens/1.0`.
- Markdown is useful as an AI agent work order.

### R8: Cloud Account

UXLens Cloud must be optional and use Google SSO.

Acceptance:

- User can sign in with Google.
- User can sign out without deleting local data.
- User can choose whether to sync local project/session.
- Cloud console lists synced projects/sessions/issues.

### R9: GitHub Optional Integration

UXLens must support creating GitHub issues later in MVP/beta.

Acceptance:

- GitHub connection is separate from UXLens account.
- User previews generated issue body before creation.
- Created GitHub issue link is stored on UXLens issue.
- Failure states are understandable.

### R10: Playwright Smoke Coverage

UXLens must include smoke-level test planning (Playwright per D007 revised).

Acceptance:

- Extension startup smoke.
- Capture and save smoke.
- Persistence smoke.
- Export smoke.
- Cloud API health smoke.
- Cloud sync mocked smoke.
- GitHub create mocked smoke.

## Non-Functional Requirements

### Privacy

- Local-only mode by default for sensitive reviews.
- Cloud sync explicit.
- Screenshots private by default.
- No cookies/passwords/request bodies captured in MVP.
- Secret-looking text/attributes should be redacted where feasible.

### Performance

- Capture should complete within 2 seconds after user save, excluding network sync.
- Side panel should stay responsive with 100 local issues.
- Screenshot handling should not freeze the page.

### Reliability

- Local issue save must not depend on cloud.
- Export must work offline.
- Sync queue must survive browser restart.
- Cloud failures should not block local capture.

### Accessibility

- Side panel keyboard accessible.
- Capture cancel via Escape.
- Dialogs manage focus.
- Status indicators include text, not only color.

### Publishability

- MV3.
- Minimal permissions.
- Permission explanations.
- Privacy policy.
- Account deletion/export.
- Budget/cost guardrails for cloud.

## Success Criteria

Dogfood success:

- Capture 10 issues across 4 pages.
- Export a review bundle.
- Create 2 GitHub issues.
- Give the bundle to two different AI coding agent families (e.g., Claude Code and Codex/Cursor).
- Each agent fixes at least 8/10 without follow-up — validated on ≥2 agent families (D014). If one family underperforms, fix the export format, not the agent.

Public beta success:

- At least 20 external users complete one review session.
- At least 70% of captured issues include screenshots and selector metadata.
- At least 50% of users export or create GitHub issue within first session.
- Fewer than 5% of issue saves fail.

## Product Constraints

- Do not implement code in planning phase.
- Do not make cloud required.
- Do not make GitHub required.
- Do not require installing code into reviewed app.
- Do not depend on native messaging for MVP.
- Do not require MCP for MVP.

## Open Questions

- Should public beta require UXLens Cloud account, or allow Web Store local-only use first?
- Should local-only GitHub use PAT, or should GitHub require cloud-backed OAuth/App from the start?
- Should screenshots be hosted by UXLens Cloud for GitHub issues, or stored only in local export until later?
- Should UXLens support team sharing in beta, or wait until v1?
- Which product domain should be used?
