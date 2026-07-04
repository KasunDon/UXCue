# UXCue Agent Stories

These stories are written so coding agents can take one slice at a time. Each story should be implemented with tests appropriate to its risk.

## Story Status Labels

- `ready`: decision-complete enough to implement.
- `needs-spike`: requires technical proof before full implementation.
- `blocked`: depends on a product/account decision.

## Epic A: Repository And Build Foundation

### UXL-ARCH-001: Create Monorepo Scaffold

Status: ready

Agent prompt:

> Create the UXCue monorepo scaffold with packages for the Chrome extension, cloud API, cloud console, shared schemas, Terraform, and Playwright tests.

Acceptance criteria:

- Root package manager is chosen and documented.
- Workspace packages exist:
  - `apps/extension`
  - `apps/console`
  - `apps/api`
  - `packages/schema`
  - `packages/markdown`
  - `packages/ui`
  - `tests/e2e`
  - `terraform/uxcue`
- Root scripts exist for build, typecheck, test, e2e, lint, format, package-extension.
- Shared TypeScript config is used.
- No cloud secrets or local tokens are committed.

Implementation notes:

- Prefer pnpm workspaces unless the repo already chooses another JS package manager.
- Keep cloud/extension code separated; shared schemas live in `packages/schema`.

### UXL-ARCH-002: Define Shared Schema Package

Status: ready

Agent prompt:

> Implement shared UXCue TypeScript types and runtime validators for projects, sessions, issues, screenshots, exports, sync events, and GitHub links.

Acceptance criteria:

- Schemas match [04-data-model-and-exports.md](04-data-model-and-exports.md).
- Runtime validation exists for API boundaries and local import/export.
- Schema version is included as `uxlens/1.0`.
- Unit tests cover valid and invalid issue payloads.

Dependencies:

- UXL-ARCH-001.

## Epic B: Chrome Extension Foundation

### UXL-EXT-001: MV3 Extension Shell

Status: ready

Agent prompt:

> Build the MV3 extension shell with service worker, side panel, action icon behavior, content script registration, and basic messaging.

Acceptance criteria:

- Manifest V3 compiles.
- Manifest permissions are `activeTab`, `commands`, `sidePanel`, `storage`, `downloads` only — no `<all_urls>` or default `host_permissions` (D013).
- Side panel opens from extension action.
- Service worker can receive messages from side panel and content script.
- Content script is injected per user invocation (toolbar click or `chrome.commands` shortcut) under `activeTab`; capture re-arms per page.
- Platform adapter layer exists and is the ONLY place `chrome.*` is called (D015, X6-001); a lint rule (`no-restricted-globals`/custom ESLint) fails the build on any direct `chrome.*` call outside the adapter.
- Dev build supports loading as unpacked extension.

Implementation notes:

- Use the Chrome side panel API for the main review UI, accessed through the platform adapter.
- Do not add `<all_urls>` or default `host_permissions`; offer an optional runtime per-origin grant via `chrome.permissions.request` only as a per-project convenience toggle (D013).

### UXL-EXT-002: Local Storage Adapter

Status: ready

Agent prompt:

> Implement local storage for projects, sessions, issues, screenshots, preferences, and sync queue.

Acceptance criteria:

- IndexedDB stores issue records and screenshot blobs.
- `chrome.storage.local` stores lightweight preferences and auth/session metadata.
- Data access is behind a repository interface.
- Local storage can create, read, update, delete, and list issues by session.
- Unit tests cover issue creation, update, deletion, and ID allocation.

Implementation notes:

- Do not store large screenshots in `chrome.storage`.
- Use stable local IDs that can sync to cloud without replacement.

### UXL-EXT-003: Side Panel Project And Session UI

Status: ready

Agent prompt:

> Build the side panel UI for project selection, session selection, issue list, filters, and empty states.

Acceptance criteria:

- User can create/select a project.
- User can create/rename/select a review session.
- Issue list groups by page or route.
- Filters exist for status, severity, type, and text search.
- Issue count badge updates after create/delete.
- UI is usable at 320px to 420px panel width.

Implementation notes:

- Keep controls dense and work-focused.
- No marketing hero or explanatory panels inside the tool.

### UXL-EXT-004: Capture Mode Toggle And Overlay

Status: needs-spike

Agent prompt:

> Implement capture mode with hover highlight, element label, keyboard cancel, and page-safe overlay.

Acceptance criteria:

- Toolbar button and side panel button can toggle capture mode.
- Hovering elements shows a highlight box and compact label with tag/id/class/size.
- Clicking an element opens the feedback composer.
- Escape cancels capture mode.
- Overlay uses shadow DOM and fixed positioning.
- Overlay does not change target page layout.
- Capture works after SPA route changes.

Implementation notes:

- Use content script isolated world for overlay.
- Avoid inline scripts to reduce CSP issues.

### UXL-EXT-005: Selector Generation

Status: needs-spike

Agent prompt:

> Implement selector generation that prioritizes stable attributes and verifies uniqueness at capture and export time.

Acceptance criteria:

- Preferred selector order:
  - `data-testid`, `data-test`, `data-cy`, `data-qa`.
  - stable `id` if not generated-looking.
  - ARIA role/name helper selector if useful for metadata, not as sole CSS selector.
  - shortest unique class/tag path.
  - nth-child fallback.
- Full DOM path and XPath fallback are always captured.
- Selector uniqueness check returns `unique`, `multiple`, or `not-found`.
- Unit tests cover stable attributes, duplicate classes, generated IDs, nested structures.

Implementation notes:

- Generated-looking IDs include long hashes, framework-generated IDs, UUID-ish strings.
- Export should mark stale selectors instead of silently trusting them.

### UXL-EXT-006: Metadata Extraction

Status: ready

Agent prompt:

> Capture element, style, accessibility, layout, environment, and page metadata for a selected element.

Acceptance criteria:

- Captures identity fields:
  - tag, id, classes, text snippet.
  - data attributes.
  - ARIA role and accessible name when available.
  - truncated outerHTML skeleton.
- Captures location:
  - URL, title, route, timestamp.
  - viewport size, DPR, zoom approximation if possible.
  - scroll position.
  - bounding box in viewport and page coordinates.
- Captures style subset:
  - display, position, flex/grid fields.
  - margin, padding, width, height.
  - font family, size, weight, line height.
  - color, background, border, radius, shadow, opacity.
  - transition/transform.
  - parent layout display/gap/alignment.
- Unit tests cover normalization/truncation helpers.

Dependencies:

- UXL-EXT-004.
- UXL-EXT-005.

### UXL-EXT-007: Screenshot Capture And Crop

Status: needs-spike

Agent prompt:

> Capture viewport screenshots and generate element crops based on selected element bounding boxes and devicePixelRatio.

Acceptance criteria:

- Exactly ONE `chrome.tabs.captureVisibleTab` call per issue (D011 — 2/sec hard quota); routed through the platform adapter and service worker.
- Derives the element crop from that same bitmap in an OffscreenCanvas using bbox × devicePixelRatio — never a second capture call.
- Creates full viewport screenshot with highlight overlay from the same bitmap.
- Handles DPR correctly (verified at DPR 1 / 1.5 / 2).
- Stores screenshots locally as blobs.
- Quota error → one retry with backoff → save as metadata-only issue with a screenshot-failed warning.

Implementation notes:

- Content scripts cannot call all tab APIs directly; route through the service worker via the platform adapter.
- For MVP, capture only visible elements. Full-page stitching is out of scope (D011).

### UXL-EXT-008: Feedback Composer

Status: ready

Agent prompt:

> Build the issue feedback composer that appears after selection and creates a UXCue issue.

Acceptance criteria:

- Required feedback text.
- Optional title, suggested fix, expected behavior.
- Type choices:
  - `visual-defect`
  - `ux-issue`
  - `a11y`
  - `copy`
  - `responsive`
  - `performance`
  - `enhancement`
  - `bug`
- Severity choices:
  - `blocker`
  - `major`
  - `minor`
  - `polish`
- Assignee hint (role-based, never vendor-based — D014):
  - `code-agent`
  - `design-agent`
  - `human`
  - `unassigned`
- Optional free-text `agentLabel` (e.g., "codex", "claude-code", "cursor") for the user's own reference; it never appears in schema enums, export logic, or UI defaults.
- Save creates an issue with next stable ID.
- Cancel discards captured draft and screenshots.

Implementation notes:

- Issue title can be generated from feedback but must be editable.

## Epic C: Issue Workflow And Export

### UXL-ISSUE-001: Issue Detail And Edit

Status: ready

Agent prompt:

> Build issue detail view with screenshot preview, metadata summary, status changes, edit, duplicate, delete, and copy markdown.

Acceptance criteria:

- Status values:
  - `open`
  - `reviewing`
  - `ready-for-agent`
  - `exported`
  - `synced`
  - `fixed`
  - `ignored`
- User can edit title, feedback, expected behavior, suggested fix, severity, type, assignee hint.
- User can delete with confirmation.
- User can copy per-issue markdown.
- Metadata is visible but collapsed by default.

### UXL-EXPORT-001: Markdown Generator

Status: ready

Agent prompt:

> Implement markdown generation for one issue and a full review session.

Acceptance criteria:

- Per-issue markdown follows the format in [04-data-model-and-exports.md](04-data-model-and-exports.md).
- Session markdown includes summary table and page grouping.
- Generated markdown includes screenshot relative paths when exported as a bundle.
- Generated markdown includes stable IDs.
- Unit tests snapshot generated markdown.

### UXL-EXPORT-002: JSON Export And Import

Status: ready

Agent prompt:

> Implement versioned JSON export/import for projects, sessions, issues, metadata, and screenshot manifest references.

Acceptance criteria:

- Export includes `schema: "uxlens/1.0"`.
- Export includes all issue metadata except raw binary screenshots.
- Screenshot manifest maps issue IDs to asset filenames.
- Import validates schema and reports incompatible versions.
- Round-trip test passes for a session with multiple issues.

### UXL-EXPORT-003: Zip Bundle Export

Status: ready

Agent prompt:

> Implement zip bundle export containing review markdown, JSON, per-issue markdown files, and screenshots.

Acceptance criteria:

- Bundle structure:
  - `review.md`
  - `review.json`
  - `issues/UX-001.md`
  - `screenshots/UX-001-element.png`
  - `screenshots/UX-001-viewport.png`
- Zip download works from extension.
- Bundle export works offline.
- Large exports show progress.

## Epic D: Cloud API And Sync

### UXL-INFRA-001: Terraform Dev Stack

Status: ready

Agent prompt:

> Create Terraform for the UXCue dev cloud stack with API Gateway, Lambda, DynamoDB, S3, Cognito, CloudFront, budgets, and outputs.

Acceptance criteria:

- Stack follows [05-cloud-console-and-infra.md](05-cloud-console-and-infra.md).
- `terraform validate` passes.
- `terraform plan` produces no undeclared variables.
- Budget alarm is configured.
- DynamoDB uses provisioned capacity within free-tier-friendly defaults.
- S3 buckets block public access except static console bucket through CloudFront origin access.

### UXL-CLOUD-001: API Lambda Scaffold

Status: ready

Agent prompt:

> Build the TypeScript Lambda API scaffold with routing, auth context extraction, validation, error handling, and health endpoint.

Acceptance criteria:

- `/health` returns build/version info without auth.
- Authenticated routes require Cognito JWT.
- Shared schemas validate request bodies.
- API errors follow a consistent shape.
- API unit tests cover auth/no-auth and validation errors.

### UXL-CLOUD-002: Project And Session API

Status: ready

Agent prompt:

> Implement cloud APIs for projects and review sessions.

Acceptance criteria:

- Create/list/update/archive project.
- Create/list/update/archive session.
- All records are scoped to authenticated user.
- Updated records include `updatedAt` and sync revision.
- Contract tests cover success and unauthorized access.

### UXL-CLOUD-003: Issue API

Status: ready

Agent prompt:

> Implement cloud issue CRUD, status updates, and sync revision handling.

Acceptance criteria:

- Create/list/get/update/archive issue.
- Create accepts extension-generated local IDs.
- Conflict handling uses `syncRevision` or `updatedAt`.
- API never allows cross-user access.
- Tests cover conflict and ownership checks.

### UXL-CLOUD-004: Screenshot Upload

Status: ready

Agent prompt:

> Implement screenshot upload/download using private S3 keys and signed URLs.

Acceptance criteria:

- API creates signed upload URL for an issue screenshot.
- API creates signed read URL for issue screenshot preview.
- S3 key includes user/project/session/issue path.
- Screenshot metadata is stored with size, content type, hash if available.
- File size limit enforced.

### UXL-SYNC-001: Extension Cloud Sync

Status: ready

Agent prompt:

> Implement extension sync queue for local issues and cloud API records.

Acceptance criteria:

- Unsynced local changes queue while offline or signed out.
- Signing in can upload selected local project/session.
- Cloud updates merge into local storage.
- Sync conflict UI marks issue needing review.
- Sync status is visible per issue and session.

Implementation notes:

- Use simple last-write-wins for MVP except when both local and cloud changed the same editable fields.

## Epic E: Cloud Console

### UXL-CONSOLE-001: Console Shell

Status: ready

Agent prompt:

> Build the UXCue Cloud console shell with Google sign-in, project list, session list, and issue list.

Acceptance criteria:

- Static web app served from CloudFront/S3.
- User can sign in and sign out.
- Project list loads from API.
- Session list loads after selecting project.
- Issue list supports status/type/severity filters.
- Console handles empty/error/loading states.

### UXL-CONSOLE-002: Issue Detail

Status: ready

Agent prompt:

> Build cloud console issue detail with screenshot viewer, markdown preview, metadata tabs, status update, and GitHub link.

Acceptance criteria:

- User can view element and viewport screenshots.
- User can edit core issue fields.
- User can copy markdown.
- User can see linked GitHub issue if present.
- User can mark fixed/ignored.

### UXL-CONSOLE-003: Exports Page

Status: ready

Agent prompt:

> Build a console export page for downloading markdown/JSON bundles from cloud data.

Acceptance criteria:

- User can export a session as markdown.
- User can export a session as JSON.
- User can request a zip bundle when screenshots are available.
- Export includes the same IDs and schema as local export.

## Epic F: Auth And Accounts

### UXL-AUTH-001: Google SSO Through Cognito

Status: blocked

Blocker:

- Requires Google OAuth client and Cognito domain/callback decisions.

Agent prompt:

> Configure Cognito User Pool with Google social sign-in and connect extension/console login flows.

Acceptance criteria:

- Google SSO works in console.
- Extension login uses `chrome.identity.launchWebAuthFlow` or an equivalent OAuth web flow.
- Tokens are stored only in extension storage appropriate for auth state.
- Refresh/re-login behavior is documented.
- Sign out clears cloud tokens but not local issues.

### UXL-AUTH-002: Account Data Management

Status: ready

Agent prompt:

> Add account export and delete-account request flows to the console and API.

Acceptance criteria:

- User can export all cloud data as JSON.
- User can request account deletion.
- Deletion removes DynamoDB records and S3 screenshots, or queues deletion job.
- Local extension data is not deleted by cloud account deletion unless user chooses local reset.

## Epic G: GitHub Integration

### UXL-GH-001: GitHub Integration Settings

Status: ready

Agent prompt:

> Add optional GitHub connection settings to extension and console.

Acceptance criteria:

- GitHub is shown as disconnected/connected.
- User can disconnect GitHub.
- User can set default repo per project.
- Local-only users can manually enter owner/repo and token for MVP, while cloud users can use OAuth/GitHub App later.

### UXL-GH-002: Create GitHub Issue

Status: ready

Agent prompt:

> Create a GitHub issue from a selected UXCue issue using the documented issue template.

Acceptance criteria:

- User can preview issue title/body before creating.
- API call creates issue with title, body, and labels when permitted.
- UXCue stores GitHub issue number, URL, repo, and sync state.
- Error messages distinguish auth, permission, missing repo, validation, and rate limit cases.

### UXL-GH-003: GitHub Status Sync

Status: ready

Agent prompt:

> Sync linked GitHub issue state back to UXCue.

Acceptance criteria:

- User can refresh GitHub status for one issue.
- Closed GitHub issue can mark UXCue issue as fixed after user confirmation.
- Reopened GitHub issue can mark UXCue issue as open after user confirmation.
- Sync never deletes UXCue issues.

## Epic H: MCP And Agent Integrations

### UXL-MCP-001: MCP Protocol Design

Status: ready

Agent prompt:

> Define the MCP tool surface for UXCue without implementing the server yet.

Acceptance criteria:

- Tool names and JSON shapes are documented.
- Security model is documented.
- Local and cloud transport options are compared.
- MVP excludes MCP implementation.

### UXL-MCP-002: Local MCP Server Prototype

Status: future

Agent prompt:

> Build a local MCP server that exposes local exported UXCue sessions to AI coding agents.

Acceptance criteria:

- `list_sessions`.
- `list_issues`.
- `get_issue`.
- `get_session_export`.
- `mark_resolved`.
- Reads the local `.uxcue` drop-in export directory (D014) or cloud API with token.

## Epic I: Testing And Quality

### UXL-QA-001: Playwright Extension Harness

Status: needs-spike

Agent prompt:

> Configure Playwright to load the unpacked extension in Chrome for Testing or Chromium (`launchPersistentContext` + `--load-extension`, unique `userDataDir` per worker) and run tests against a local fixture app.

Acceptance criteria:

- Playwright launches with the extension loaded via `launchPersistentContext`.
- Fixture app runs locally in CI.
- Test can drive the side panel as a directly-loaded extension page (`chrome-extension://<id>/sidepanel.html`) and the service worker via `evaluate`.
- Test survives MV3 service-worker suspension.
- Test can simulate capture and save issue.

Implementation notes:

- The side panel cannot be opened programmatically (user gesture required); load it directly as an extension page.
- Playwright's official Chrome-extensions guide covers the MV3 SW-suspension handling this spike must prove (D007 revised).

### UXL-QA-002: Smoke Test Suite

Status: ready

Agent prompt:

> Implement smoke tests for build, extension startup, capture, local persistence, export, API health, and cloud console shell.

Acceptance criteria:

- Smoke suite runs in under 5 minutes locally.
- Smoke suite can run in CI.
- Failing smoke test reports the broken subsystem.
- Playwright trace/screenshot/video are captured on failures.

### UXL-QA-003: Security And Permission Review

Status: ready

Agent prompt:

> Add a release gate that checks extension permissions, manifest, CSP, secrets, and cloud upload boundaries.

Acceptance criteria:

- Build fails if forbidden host permissions are introduced without review.
- Build fails if common secret patterns are found in source.
- Manifest permissions are documented.
- Cloud API enforces size limits and ownership checks.

## Epic J: Release And Public Readiness

### UXL-REL-001: Chrome Web Store Preparation

Status: future

Agent prompt:

> Prepare Chrome Web Store public listing assets and compliance docs.

Acceptance criteria:

- Store description.
- Screenshots.
- Privacy policy URL.
- Support email.
- Permission explanations.
- Data usage disclosure.
- Versioned release notes.

### UXL-REL-002: Dogfood Release

Status: ready

Agent prompt:

> Package a dogfood build and run the owner acceptance test on a real app.

Acceptance criteria:

- Extension package created.
- Dogfood session captures at least 10 issues.
- Exported review is given to an AI coding agent.
- Results are documented with issue IDs fixed/unfixed.
