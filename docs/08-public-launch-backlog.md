# Public Launch Backlog

This backlog covers the path from MVP to a world-publishable extension and cloud console.

Priority:

- P0: required for MVP/dogfood.
- P1: required for public beta.
- P2: required for polished public launch.
- P3: later product expansion.

## P0: Dogfood MVP

### Extension

- MV3 shell.
- Side panel.
- Capture mode.
- Element hover overlay.
- Feedback composer.
- Local project/session/issue storage.
- Metadata extraction.
- Screenshot capture/crop.
- Issue detail/edit.
- Markdown/JSON/zip export.
- Local data reset/export.

### Cloud

- Terraform dev stack.
- Cognito Google SSO.
- API health/project/session/issue endpoints.
- Screenshot upload/download.
- Basic cloud console.
- Extension cloud sync.
- Budget alarms.

### GitHub

- Manual GitHub connect.
- Create GitHub issue from UXCue issue.
- Link issue URL back to UXCue.

### QA

- Playwright extension smoke.
- Playwright export smoke.
- API smoke.
- Terraform validate.
- Dogfood report.

## P1: Public Beta

### Extension Quality

- Better selector confidence scoring.
- Selector re-verification on export.
- Page-level notes.
- Capture retry when screenshot fails.
- Offline sync queue UI.
- Conflict resolution UI.
- Keyboard shortcuts.
- Onboarding screen explaining local/cloud/GitHub modes.
- Permission explanation screen.
- Error reporting copy with actionable fixes.

### Cloud Console

- Project settings.
- Session archive/restore.
- Issue bulk actions.
- Markdown preview.
- Screenshot zoom/pan.
- GitHub integration settings.
- Account export.
- Account deletion request.
- Cloud storage usage meter.

### GitHub

- OAuth or GitHub App production flow.
- Repo picker.
- Label mapping settings.
- Create missing labels when permission allows.
- Link existing GitHub issue.
- Refresh linked issue state.
- Add UXCue comment to existing GitHub issue.

### Security/Privacy

- Privacy policy.
- Terms or acceptable use.
- Data retention policy.
- Account deletion implementation.
- Screenshot redaction option.
- Secret-looking attribute/text redaction.
- Rate limits.
- Per-user quotas.

### Testing

- Full Playwright e2e suite in CI.
- Real dev cloud smoke.
- Real test GitHub repo smoke.
- API contract tests.
- Extension permission snapshot test.
- Accessibility checks for extension UI and console.

### Release

- Chrome Web Store listing draft.
- Store screenshots.
- Support email.
- Landing page.
- Public docs.
- Versioned changelog.

## P2: Public Launch

### Product Polish

- Multi-session dashboard.
- Duplicate issue detection.
- Reorder issues.
- Batch export selected issues.
- Share read-only review link.
- Comments/activity timeline.
- Better generated titles.
- Design brief export variant.
- Status dashboard for synced/GitHub issues.

### Capture Improvements

- Area/rectangle selection.
- Text selection capture.
- Full-page note.
- Shadow DOM support.
- Same-origin iframe support.
- Responsive recapture at multiple breakpoints.
- Contrast ratio calculation.
- Basic a11y checks:
  - missing accessible name.
  - low contrast.
  - missing focus style hint.
  - image alt presence.

### Framework Awareness

- React owner chain.
- Angular component detection.
- Vue component detection.
- Svelte component hints.
- Source path when dev builds expose it.

### Diagnostics

- Console warning/error buffer.
- Uncaught exception capture.
- Unhandled promise rejection capture.
- Network error digest without bodies.
- Per-issue diagnostic correlation window.

### Test & Automation Tooling

- Interaction recording → replayable regression tests (record extension/capture flows, export a JSON step list, generate Playwright specs; reuses `UXL-EXT-005` selectors + `UXL-QA-001` harness; local-only/opt-in). Tracked in **GitHub issue #2** (`QA-REC-001` recorder / `QA-REC-002` spec generator). P2/P3, after the capture/export core (D016).

### Cloud

- Team/workspace model.
- Invite members.
- Project sharing.
- Billing plan decision.
- Audit log.
- Better object lifecycle policies.
- DynamoDB backup/PITR decision.
- Production monitoring dashboard.

### Integrations

- MCP local server.
- MCP cloud mode.
- Linear issue export.
- Jira issue export.
- Slack notification.
- Agent work-order export for Claude Code/Codex/Cursor.

## P3: Product Expansion

- Automated UI smell suggestions.
- AI-assisted issue title/expected behavior drafting.
- Visual regression comparison against prior review.
- Cross-browser support (Edge → Firefox → Safari): promoted to a defined, gated track — see Release 6 below (D015).
- Desktop companion for local repo file-drop.
- CAF pipeline integration.
- Agent resolves issue and uploads before/after screenshot.
- Design token mapping from app CSS variables.
- Team review assignments.
- Public API/webhooks.

## Release 6: Cross-Browser (post-Chrome-launch gate)

Status: accepted for backlog (D015). Chrome-first ships as MVP; this is a planned track, not scope creep. See docs/22 for the full rationale.

Launch-success gate — start only when ALL hold:

- Chrome Web Store listing public and stable for ≥ 1 release cycle.
- ≥ 20 external users have completed a review session.
- H2 holds in the wild: ≥ 70% agent fix-without-clarification on real user exports.
- No open P0/P1 data-loss or capture bugs.

Port order and effort: Edge (small — same Chromium MV3; store listing + QA) → Firefox (medium — `sidebar_action` vs `chrome.sidePanel`, `browser.*` promises/polyfill, capture/quota parity, MV3 background model, AMO review; spike first) → Safari (large — Xcode conversion, Apple Developer account, App Store review, side-panel UI redesign; demand-gated only).

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| X6-001 | P0* | Platform adapter layer enforced from day one | No `chrome.*` outside the adapter; lint rule (`no-restricted-globals`/custom ESLint) blocks violations; e2e mocks use the adapter seam |
| X6-002 | P2 | Edge port + Edge Add-ons listing | Full smoke suite green on Edge; listing live; permission copy reviewed |
| X6-003 | P2 | Firefox spike | SPIKE.md covering `sidebar_action` mapping, capture/crop parity, polyfill choice, MV3 background model, AMO requirements |
| X6-004 | P3 | Firefox port + AMO listing | Smoke suite green on Firefox (Playwright Firefox runner where applicable); AMO approved |
| X6-005 | P3 | Safari feasibility spike | Effort/demand assessment only; no commitment |
| X6-006 | P3 | Cross-browser CI matrix | e2e runs on Chrome for Testing + Edge (+ Firefox once ported) |

*X6-001 is P0 **now** — it lands in `UXL-EXT-001`, not in Release 6. It is listed here because it exists solely to enable this release.

## Release 7: Public Launch Assets (landing page + Chrome Web Store)

Status: **DEFERRED (D016)** — postponed until the local-first MVP works end-to-end (Phases 0–4) and the two-agent-family dogfood passes. Chrome Web Store publishing tracked in **GitHub issue #1**. Gate when resumed: MVP definition-of-done (docs/21 §10) passed.

### Track A: Landing Page (uxcue.com)

Static site on S3 + CloudFront, Terraform module `terraform/uxcue/modules/landing/`, Route 53 once the domain is purchased. No backend for v1.

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| LP7-001 | P1 | Buy domains (uxcue.com/.dev/.app per docs/17) | Registered; DNS delegated; recorded in docs/14 O001 |
| LP7-002 | P1 | Landing page v1 | Live on uxcue.com; Lighthouse ≥95 perf/a11y; follows docs/18 brand (dark command header, light surface, teal accent, bold type, product-first hero) |
| LP7-003 | P1 | Web Store CTA | "Add to Chrome" links to the listing when live, else "Get notified" fallback |
| LP7-004 | P1 | Legal pages | /privacy and /support live (Web Store requires them); privacy covers local-first default, optional cloud sync, screenshot handling, GitHub integration |
| LP7-005 | P2 | Demo asset | 30–45s capture-to-fix recording or animated hero |
| LP7-006 | P2 | Docs section | Quickstart, permission explanations, export-format reference, "works with any AI coding agent" guide (equal billing per D014) |
| LP7-007 | P3 | Mailing list + changelog page | Signup stored; changelog auto-published from CHANGELOG.md |

### Track B: Chrome Web Store Publishing

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| WS7-001 | P0 | Developer account | Web Store dev account registered ($5 one-time), 2FA on, publisher name decided (KGLABS LTD vs UXCue) |
| WS7-002 | P0 | Store-compliant package | Reproducible zip from clean build; manifest version bumped; icons 16/32/48/128; no remote code; CSP reviewed |
| WS7-003 | P0 | Permission justifications | Written justification per permission (activeTab, commands, sidePanel, storage, downloads); no host_permissions to justify (D013 pays off) |
| WS7-004 | P0 | Data disclosure | Data-usage form accurate: local by default; what uploads on cloud sync opt-in; links to privacy policy (LP7-004 dependency) |
| WS7-005 | P0 | Listing content | Title, short + full description (docs/17 copy), 3–5 screenshots at 1280×800, category, support URL/email |
| WS7-006 | P1 | Unlisted beta release | Publish UNLISTED first; dogfood install from the store build; full smoke suite against store install |
| WS7-007 | P1 | Public release | Flip to public after unlisted soak with no P0/P1; rollback plan documented |
| WS7-008 | P2 | Post-launch ops | Review-response process; crash/error triage; version cadence; screenshot A/B later |

Sequencing: LP7-004 blocks WS7-004/005 (store needs live URLs — legal pages before store assets). Publish unlisted first. The minimal-permission model (D013) is the biggest de-risker for store review — protect it against scope creep.

## World-Publish Requirements

Before Chrome Web Store public release:

- Chrome extension package reviewed for permissions.
- Privacy policy live.
- Data usage disclosure accurate.
- Support URL/email live.
- Account deletion available.
- Cloud budget alarms live.
- Rate limits and quotas live.
- Security contact documented.
- Terms/acceptable-use decision made.
- GitHub integration reviewed against GitHub policies.
- OAuth consent screen configured and verified if required.
- Landing page explains local-only mode clearly.

## Launch Risks And Mitigations

### Risk: Broad Extension Permissions

Mitigation:

- Start with `activeTab`.
- Request host permissions only on user action.
- Explain permissions in onboarding and Web Store listing.

### Risk: Screenshot Privacy

Mitigation:

- Local-only by default.
- Explicit cloud sync.
- Private S3 objects.
- Short-lived signed URLs.
- Delete/export controls.

### Risk: Cloud Cost Surprise

Mitigation:

- Budgets.
- Quotas.
- API throttles.
- S3 lifecycle.
- DynamoDB provisioned caps.
- Log retention.

### Risk: GitHub Complexity Delays Core Product

Mitigation:

- Keep GitHub optional.
- MVP supports manual create/link.
- Production GitHub App can come after core issue workflow.

### Risk: Agent Output Still Needs Clarification

Mitigation:

- Dogfood acceptance test measures fixability.
- Improve issue markdown before adding breadth.
- Capture styles/selectors/screenshots reliably.

## Suggested Release Names

- v0.1 Dogfood: local capture/export.
- v0.2 Cloud Alpha: sync and console.
- v0.3 GitHub Alpha: create/link GitHub issues.
- v0.4 Public Beta: Web Store unlisted/listed beta.
- v1.0 Public: polished extension, cloud console, privacy/support, stable exports.
