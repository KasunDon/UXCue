# SPIKE 4 — Playwright MV3 Extension Harness

Story: `UXL-QA-001` · Decision: D007 (Playwright owns extension e2e) · Status:
**PASS ✅**

## Question
Can Playwright load our unpacked MV3 extension, resolve its id, drive the side
panel as a directly-loaded extension page, exercise side-panel ↔ service-worker
messaging, and drive the service worker via `evaluate()` — headless, with no
display (WSL/CI)?

## Method
Minimal MV3 extension in `ext/` (manifest, `sw.js`, `sidepanel.html/js`). The
harness (`harness.mjs`) uses the docs/19 F3 pattern:
- `chromium.launchPersistentContext(userDataDir, { headless: false, args: ["--headless=new", "--disable-extensions-except=…", "--load-extension=…", "--no-sandbox"] })`
  — `headless:false` selects the **full** Chromium build (headless-shell can't
  load extensions), `--headless=new` runs it displaylessly *and* supports
  extensions.
- extension id from the service-worker URL host.
- side panel opened via `page.goto("chrome-extension://<id>/sidepanel.html")`
  (the side panel can't be opened programmatically — user-gesture only — so we
  load its page directly).
- SW driven with `serviceWorker.evaluate()`.

## Result (reproduce: `npx playwright install chromium && node 4-playwright-harness/harness.mjs`)
```
✅ extension loaded; service worker registered  id=lmlafnoac…
✅ service worker reachable via evaluate()  runtime.id matches
✅ service worker in-memory state readable
✅ side panel loads as extension page  title=UXCue
✅ side panel <-> SW messaging works  count=1
✅ SW handle still valid after page interaction
✅ can drive a normal page in the same context
7/7 — Playwright MV3 harness PROVEN ✅
```
Environment: Playwright chromium 149, Node 22, WSL2, **no X display** (new
headless).

## Findings / decisions for the real implementation
- The harness shape is settled: `launchPersistentContext` + `--load-extension`,
  unique `userDataDir` per worker (use `mkdtemp`), extension id from the SW,
  side panel as an extension page, SW via `evaluate`. Port this into
  `tests/e2e/` as the shared fixture in `UXL-QA-001`.
- `--headless=new` + `--no-sandbox` makes it CI/WSL-friendly with no xvfb.
- This is exactly what D007 (revised) promised; Cypress is not needed.

## Honest caveats
- Full **SW-suspension survival** (idle ~30s → terminate → restart, handle stays
  valid) is documented (docs/19 F3) and relied upon but not force-triggered here
  — forcing it needs an idle timer or `serviceworker-internals`. Add an explicit
  suspension test in `UXL-QA-001` (cheap once the fixture exists).
- Used `--no-sandbox` for the sandboxed CI environment; revisit sandbox flags for
  the real CI image.

## Verdict
Harness proven end-to-end, headless, no display. **Ready to implement
`UXL-QA-001` and adopt Playwright as the extension e2e runner (D007).**
