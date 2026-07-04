# UXLens MVP Breakdown

## MVP Goal

Build a Chrome extension and minimal cloud console that can:

- Capture UI/UX defects from any webpage.
- Create tracked UXLens issues locally.
- Sync issues to UXLens Cloud when signed in.
- Export a review as markdown/JSON.
- Optionally create GitHub issues from selected UXLens issues.
- Prove the full review-to-agent workflow with Playwright smoke/e2e coverage (D007 revised).

## MVP Definition

The MVP is public-alpha quality, not Web Store public launch quality.

It should be usable by the owner on real projects, produce useful agent-ready artifacts, and have enough cloud/GitHub architecture to avoid rewriting the product later.

## In Scope

- MV3 Chrome extension.
- Side panel issue queue.
- Element picker with hover highlight and click capture.
- Feedback composer with required feedback text.
- Issue type, severity, status, and assignee hint.
- Metadata capture:
  - URL, title, route, timestamp.
  - viewport, DPR, color scheme, scroll position.
  - selector, DOM path, XPath fallback.
  - tag/id/classes/data attributes/ARIA.
  - truncated outerHTML skeleton.
  - bounding box.
  - computed style subset.
  - parent layout context.
  - best-effort React component name.
- Screenshots:
  - selected element crop.
  - viewport screenshot with highlight overlay.
- Local storage:
  - one active local workspace.
  - multiple projects.
  - multiple review sessions.
  - issues and screenshots.
- Export:
  - session `review.md`.
  - per-issue markdown.
  - `review.json`.
  - zip bundle with screenshots.
  - copy markdown to clipboard.
- Cloud account:
  - Google SSO.
  - project/session/issue sync.
  - screenshot upload/download through signed URLs.
  - basic web console.
- GitHub integration:
  - separate connect flow.
  - choose repo per project.
  - create GitHub issue manually from a UXLens issue.
  - store linked GitHub URL and issue number.
- Testing:
  - Playwright smoke tests.
  - Playwright e2e for extension core flow.
  - API smoke tests.
  - Terraform validate/plan checks.

## Out Of Scope For MVP

- Public billing.
- Team roles beyond single-owner account.
- Multi-user shared sessions.
- Real-time collaboration.
- MCP server implementation.
- Auto-detecting UI bugs without reviewer input.
- Full console/network log capture.
- Request/response body capture.
- Multi-browser extension support.
- Chrome Web Store public listing submission.
- Advanced source maps to file/line.
- Full iframe and shadow DOM piercing.
- Responsive recapture across breakpoints.

## MVP Milestones

### M0: Foundation Spike

Purpose: prove the highest-risk browser capabilities before building product UI.

Deliverables:

- Selector-generation spike against 3 target apps.
- Screenshot capture/crop spike using `chrome.tabs.captureVisibleTab`.
- Content script overlay in closed shadow DOM.
- React component-name best-effort spike.
- Playwright extension loading proof with Chrome for Testing or Chromium (`launchPersistentContext` + `--load-extension`).

Acceptance:

- Captures the correct element screenshot on at least 3 representative pages.
- Generated selector is unique at capture time in at least 80% of sampled elements.
- Extension test runner can load the unpacked extension in CI-style command.

### M1: Local Extension Shell

Deliverables:

- MV3 extension scaffold.
- React side panel.
- Service worker.
- Content script messaging.
- Local IndexedDB schema.
- Project/session/issue primitives.

Acceptance:

- User opens side panel from toolbar.
- User creates a project and review session.
- Issue list persists after browser reload.
- No cloud/GitHub dependency.

### M2: Capture Flow

Deliverables:

- Capture mode toggle.
- Hover highlight overlay.
- Click-to-select.
- Feedback composer.
- Metadata extractor.
- Screenshot capture and crop.
- Issue detail view.

Acceptance:

- User can capture an element issue in under 20 seconds.
- Issue includes element crop, viewport screenshot, selector, URL, bbox, and feedback.
- User can cancel capture with Escape.
- Capture mode never permanently mutates the target page.

### M3: Local Issue Workflow And Export

Deliverables:

- Issue edit/delete/status.
- Filters by status/type/severity.
- Markdown issue body generator.
- Session review markdown.
- JSON export.
- Zip export with screenshots.

Acceptance:

- Reviewer captures 10 issues across 4 pages.
- Export includes stable IDs `UX-001` through `UX-010`.
- `review.md` is usable as an agent prompt/work order.
- JSON validates against the documented schema.

### M4: Cloud Sync Alpha

Deliverables:

- AWS Terraform dev stack.
- Cognito user pool with Google social IdP.
- API Gateway HTTP API.
- Lambda API.
- DynamoDB single-table storage.
- S3 screenshot bucket.
- CloudFront/S3 static web console.
- Extension sign-in and token refresh.
- Offline local queue and sync.

Acceptance:

- User signs in with Google.
- Local project/session/issues sync to cloud.
- Screenshot upload uses signed URL or API-mediated upload.
- Cloud console lists synced projects, sessions, and issues.
- Signing out leaves local data intact.

### M5: GitHub Optional Integration

Deliverables:

- GitHub connect settings.
- Repo picker or manual owner/repo entry.
- Create issue action.
- GitHub issue body template.
- Link existing issue action.
- Store issue sync state.

Acceptance:

- User creates a GitHub issue from one UXLens issue.
- UXLens stores repo, issue number, URL, created time.
- Failure states show actionable errors.
- GitHub integration can be disconnected without deleting UXLens issues.

### M6: MVP Hardening

Deliverables:

- Playwright smoke/e2e test suite.
- API smoke tests.
- Terraform validation.
- Build/package checks.
- Permission review.
- Privacy/security checklist.
- Dogfood run against at least one real project.

Acceptance:

- All smoke tests pass in CI.
- Extension package builds reproducibly.
- Dogfood review exports 10+ issues and at least 8 are agent-fixable without clarification.
- No secrets are stored in repo.

## MVP Acceptance Test

Run a complete review against `kdon.dev`, KtKAI console, or another owned app:

1. Create project.
2. Create review session.
3. Capture 10 issues across at least 4 pages.
4. Sync to UXLens Cloud.
5. Export `review.md`, `review.json`, and screenshots.
6. Create 2 GitHub issues manually from selected UXLens issues.
7. Feed the markdown review to Claude Code or Codex.
8. Agent should locate and fix at least 8 of the 10 issues without follow-up questions.

## Suggested MVP Tech Stack

Extension:

- TypeScript.
- Vite.
- React for side panel and extension pages.
- MV3 service worker.
- Content scripts for picker/metadata.
- `idb` or a small IndexedDB wrapper.
- `fflate` for zip export.
- Zod or TypeScript-first schema validation.

Cloud/API:

- TypeScript Lambda handlers.
- API Gateway HTTP API.
- Cognito User Pool with Google IdP.
- DynamoDB single-table design.
- S3 for screenshots and export bundles.
- CloudFront + S3 for web console.
- Terraform for all AWS resources.

Testing:

- Playwright for e2e and smoke (extension: `launchPersistentContext` + `--load-extension`, unique `userDataDir` per worker).
- Unit tests for selector generation, markdown, schema, issue reducers.
- Contract tests for API request/response payloads.

## MVP Quality Bar

- The side panel feels like a tool, not a marketing page.
- The issue composer never blocks the target website permanently.
- Export artifacts can stand alone outside the extension.
- Local-only usage is fully useful.
- Cloud sync is visibly optional.
- GitHub is visibly optional.
- All sensitive upload actions are explicit.
