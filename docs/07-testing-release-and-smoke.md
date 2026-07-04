# Testing, Smoke, And Release Plan

## Testing Principles

- Playwright owns extension e2e and smoke coverage (D007 revised). Cypress remains acceptable for the cloud-console SPA if desired, but the default is to consolidate on Playwright.
- Unit tests cover pure logic: selectors, schemas, markdown, reducers, conflict resolution.
- API tests cover auth, validation, ownership, and sync behavior.
- Terraform checks run before any cloud deployment.
- Smoke tests are short enough to run before every handoff.

## Playwright Strategy

Use Playwright for:

- Extension capture flow against a fixture app.
- Side panel UI behavior.
- Cloud console e2e.
- API smoke through Playwright `request` fixtures (or plain Vitest + fetch).
- Export download checks.

Important extension-run choice:

- Load the built extension with `launchPersistentContext` + `--load-extension`, using a unique `userDataDir` per worker so parallel runs stay isolated.
- Prefer Chrome for Testing or Chromium in CI for deterministic automation.
- Playwright keeps the same MV3 service-worker handle valid across ~30s SW suspension and resumes in-flight `evaluate()` calls automatically.
- The side panel cannot be opened programmatically (user gesture required); load the side panel page directly as an extension page (`chrome-extension://<id>/sidepanel.html`) and drive the service worker via `evaluate`.

## Test App Fixture

Create a local fixture app for deterministic UI defects.

Routes:

- `/dashboard`
- `/settings/billing`
- `/settings/profile`
- `/responsive`

Elements:

- Button with `data-testid="upgrade-plan-button"`.
- Card grid with deliberate spacing bug.
- Responsive nav overlap.
- Low-contrast copy sample.
- Element with generated-looking ID.
- Duplicate class list requiring nth fallback.

Purpose:

- Validate selector generation.
- Validate screenshot cropping.
- Validate route/page grouping.
- Validate Playwright capture flows.

## Test Matrix

### Unit Tests

Run on every commit.

Coverage:

- Selector generation.
- DOM path/XPath generation.
- Style subset normalization.
- outerHTML skeleton truncation.
- Accessible metadata helper.
- Issue ID allocation.
- Markdown generator.
- JSON schema validation.
- Sync conflict logic.
- GitHub issue body generation.

### Extension E2E

Run in CI and locally before release.

Core specs:

- `extension-startup.spec.ts`
- `capture-element.spec.ts`
- `capture-page-note.spec.ts`
- `local-persistence.spec.ts`
- `export-review.spec.ts`
- `cloud-sync-mocked.spec.ts`
- `github-create-mocked.spec.ts`

### Cloud Console E2E

Core specs:

- `console-startup.spec.ts`
- `console-projects.spec.ts`
- `console-issues.spec.ts`
- `console-export.spec.ts`
- `console-settings.spec.ts`

### API Tests

Can be implemented with Vitest/Supertest locally and Playwright `request` smoke against deployed dev.

Coverage:

- `GET /health`.
- Create/list/update project.
- Create/list/update session.
- Create/list/update issue.
- Screenshot signed upload URL.
- Unauthorized request rejected.
- Cross-user record access rejected.
- Sync conflict returned.

### Terraform Tests

Commands:

```bash
terraform fmt -check
terraform validate
terraform plan -var-file=envs/dev.tfvars
```

Add `tflint` later if desired.

## Smoke Tests

Smoke tests must be fast and high-signal.

### Smoke 1: Build Smoke

Purpose:

- Verify all apps/packages compile.

Steps:

1. Install dependencies.
2. Build shared packages.
3. Build extension.
4. Build console.
5. Build API.

Pass:

- Build exits zero.
- Extension output contains `manifest.json`.
- API artifact exists.
- Console static output exists.

### Smoke 2: Extension Startup

Purpose:

- Verify unpacked extension loads.

Steps:

1. Launch Chrome for Testing/Chromium with built extension.
2. Open fixture app.
3. Open extension side panel or extension page.
4. Assert UXLens shell appears.

Pass:

- No extension runtime error.
- Side panel displays project/session UI.

### Smoke 3: Capture And Save

Purpose:

- Verify the core product loop.

Steps:

1. Open fixture `/settings/billing`.
2. Start capture.
3. Select `[data-testid="upgrade-plan-button"]`.
4. Enter feedback.
5. Save issue.

Pass:

- Issue appears as `UX-001`.
- Issue has URL, selector, bbox, viewport.
- Element screenshot exists.

### Smoke 4: Persistence

Purpose:

- Verify local storage.

Steps:

1. Capture one issue.
2. Reload browser/page.
3. Open side panel.

Pass:

- Issue remains visible.
- Screenshot preview remains available.

### Smoke 5: Export

Purpose:

- Verify portable artifact.

Steps:

1. Capture two issues.
2. Export markdown.
3. Export zip.

Pass:

- `review.md` includes `UX-001`, `UX-002`.
- `review.json` validates.
- Zip includes screenshots.

### Smoke 6: Cloud API Health

Purpose:

- Verify deployed API is reachable.

Steps:

1. Call `GET /health`.
2. Assert version/build response.

Pass:

- 200 response.
- Includes environment and commit/build ID.

### Smoke 7: Cloud Sync Mocked

Purpose:

- Verify extension sync behavior without real Google login.

Steps:

1. Stub auth token and API responses.
2. Capture issue.
3. Trigger sync.

Pass:

- Issue status changes from `pending-upload` to `synced`.
- Cloud ID/revision stored.

### Smoke 8: GitHub Create Mocked

Purpose:

- Verify GitHub issue path without hitting GitHub API.

Steps:

1. Create local issue.
2. Connect fake GitHub account.
3. Preview issue body.
4. Submit with mocked API response.

Pass:

- GitHub URL and issue number stored.
- Labels warnings shown if mocked response indicates label failure.

## Playwright E2E Details

### Extension Load Pattern

Load the built extension with `chromium.launchPersistentContext` using a fresh `userDataDir` per worker:

```ts
const context = await chromium.launchPersistentContext(userDataDir, {
  channel: "chromium", // or Chrome for Testing
  args: [
    `--disable-extensions-except=${distExtensionPath}`,
    `--load-extension=${distExtensionPath}`,
  ],
});
```

Run deterministically in CI:

```bash
npx playwright test
```

Resolve the extension ID from the registered service worker, then drive the side panel as an extension page (`chrome-extension://<id>/sidepanel.html`) and the SW via `evaluate`. Playwright keeps the SW handle valid across MV3 suspension.

### Network Stubbing

Use `page.route` / `context.route` for:

- Cloud API.
- GitHub API.
- Signed URL upload.

Real third-party OAuth should not be used in normal CI. Use API-level test tokens or mocked auth states.

### Downloads

Assert exported files via Playwright's `download` event (`page.waitForEvent("download")`) and `download.path()`.

### Traces/Screenshots/Videos

Keep failure artifacts in CI for debugging:

- Playwright trace on first retry (`trace: "on-first-retry"`).
- Screenshot and video retained on failure.

## CI Gates

Required before merge:

- Typecheck.
- Unit tests.
- Build smoke.
- Extension smoke.
- API unit tests.
- Terraform fmt/validate.

Required before dogfood package:

- Full extension e2e.
- Export e2e.
- Cloud sync mocked e2e.
- API deployed dev smoke.

Required before public beta:

- Chrome Web Store package validation.
- Permission review.
- Privacy/data disclosure review.
- Account deletion/export test.
- Real GitHub test repo integration smoke.
- Cloud cost budget/alarm verification.

## Release Package Checklist

Extension package:

- Manifest version incremented.
- Changelog updated.
- Zip built from clean output.
- No sourcemaps if they expose secrets or internal paths; decide deliberately.
- Permissions reviewed.
- Content security policy reviewed.
- Icons present.
- Store screenshots updated.

Cloud:

- Terraform plan reviewed.
- API deployed.
- Console deployed.
- Smoke tests passed.
- Budget alarms configured.
- CloudWatch log retention configured.

Docs:

- Privacy policy.
- Support contact.
- Data deletion instructions.
- Permission explanation.
- Known limitations.

## Chrome Web Store Readiness

Before public listing:

- Use Manifest V3.
- Provide clear permission justifications.
- Include privacy policy URL.
- Declare data collection accurately.
- Avoid broad host permissions if activeTab/on-demand permissions are enough.
- Include tested screenshots.
- Provide support email/site.

## Manual Dogfood Script

1. Install unpacked extension.
2. Open owned app.
3. Create project and session.
4. Capture 10 issues across 4 pages.
5. Restart browser.
6. Confirm local issues remain.
7. Sign in to cloud.
8. Sync project.
9. Open cloud console.
10. Confirm screenshots and issue details.
11. Export review bundle.
12. Create 2 GitHub issues.
13. Give `review.md` to AI coding agent.
14. Record which issue IDs were fixed without clarification.

## Exit Criteria For MVP QA

- Smoke suite green.
- Dogfood script completed.
- No P0/P1 data-loss bugs.
- No unbounded cloud cost path known.
- No broad permission unexplained.
- Export artifacts are usable outside the extension.
