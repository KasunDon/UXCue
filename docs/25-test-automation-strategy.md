# 25 — Test automation strategy (no gaps, nothing blocked)

Goal: automate every layer of the MV3 extension so nothing depends on a human
clicking through Chrome, and so the gaps that are *genuinely* un-automatable are
tiny, named, and monitored — not silent. This complements docs/07 (smoke/release)
and the D007 testing bar.

## 1. Where we are today

| Layer | Tool | Coverage |
| --- | --- | --- |
| Unit / integration | Vitest (node + jsdom) | 69 ext tests + schema/markdown. Handlers via the mock adapter, overlay, selector, metadata, storage, publish, permissions contract. |
| Real-browser e2e | Playwright + `--load-extension`, `--headless=new` | Side-panel load, project/session, seeded-draft → composer → save, visual walkthrough, real `overlayMain` payload. |

Two things make us well-positioned:

- **The adapter seam (D015).** Only `platform/chrome.ts` touches `chrome.*`. Every
  other module is testable without a browser, and the mock adapter
  (`platform/mock.ts`) already drives the service-worker handlers.
- **Playwright loads the *real* built extension** and can reach the service
  worker (`context.serviceWorkers()`), so we can execute code *inside* the SW and
  read real `chrome.*` state.

Acknowledged gaps in the current specs (called out in the specs themselves):
`capture-save` **seeds the draft** instead of driving the real overlay→SW→
screenshot path; `overlay-browser` leaves `executeScript`/gesture unverified;
nothing exercises real content-script auto-injection, cross-context messaging,
`captureVisibleTab` pixels, the context menu, the keyboard command, or the
per-site permission request.

## 2. Core principle — shrink the untestable surface, then pin it

1. **Push logic behind the adapter** so it's unit-testable; keep `chrome.ts` a
   thin, boring pass-through. The smaller `chrome.ts` is, the smaller the surface
   that needs a real browser.
2. **Contract-test the thin seam.** For each `chrome.ts` method, a Playwright test
   runs the *real* method against real Chrome and asserts it satisfies the *same
   contract the mock promises*. This is what closes the "does the mock lie?" gap
   and keeps the 69 fast unit tests trustworthy.
3. **Automate golden paths end-to-end** with the real extension + a real page.
4. **Name and monitor the residue** (native prompts/menus/shortcuts) — don't let
   it hide.

## 3. Target layers

### L1 — Unit / integration (Vitest) — *expand*
Pure logic + handlers via `createMockPlatform`. Already strong. Add: area-overlay
math, download/export builders, github body edge cases, draft→issue mapping.

### L2 — Component (Vitest + jsdom + react-dom) — *new; one blocker to remove*
Render `App`, `Composer`, `IssueDetail` with the **mock platform injected** and
assert behavior: composer pending watchdog clears + shows the hint, `ensureAccess`
is called before a screenshot action (and skipped for console), attachment chips,
first-run onboarding, GitHub panel states.

> **Blocker:** components call `getPlatform()` directly, so a test can't swap in
> the mock. Fix: a tiny injection seam — either a React `PlatformProvider`/context
> or a settable module singleton (`setPlatform()` for tests, default = chrome).
> This is the single highest-leverage change; it unlocks the whole L2 layer.

### L3 — Adapter contract tests (Playwright, real Chrome) — *new; the anti-gap layer*
Run each `chrome.ts` method for real and assert the mock's contract holds:

- `storage.get/set/onChange` round-trips (via `sw.evaluate`).
- `tabs.activeTabId` / `activeTabOrigin` return the focused fixture tab/origin.
- `permissions.hasHostAccess` false→true after a grant (see §4 for the grant).
- `tabs.sendMessage` to a declared content script resolves; rejects when absent.
- `capture.captureViewport` returns a non-empty PNG when host access is held.
- `contextMenus.register` actually registers the four items.

Pattern: `const sw = context.serviceWorkers()[0]; await sw.evaluate(async () => { /* call chrome.* */ })`.

### L4 — E2E golden paths (Playwright + real extension + fixture-app) — *expand*
Serve `tests/fixture-app` (it has `server.mjs`), open a real page so the **declared
content scripts auto-inject**, then drive the real flows:

1. Side panel → **Capture element** button → SW messages the content script →
   `overlayMain` appears **on the fixture page** → click an element → draft is
   written → composer opens → save → issue in queue → export. This is now fully
   automatable because arming goes through a **message**, not a keyboard gesture.
2. Composer **Page shot** → `captureVisibleTab` → assert a real screenshot blob on
   the draft (needs host access, §4).
3. **Console**: emit `console.error` on the fixture page → Attach console → assert
   the log rides along.
4. Export `.zip` / inline `.md` / per-issue `.md`, and (mocked) GitHub publish.

## 4. Chrome-surface → technique matrix (the "no gaps" map)

| Surface | Automate how | Automatable in CI? |
| --- | --- | --- |
| `storage.*` | `sw.evaluate` round-trip (L3) | ✅ |
| Service-worker routing | Mock adapter (L1) + `sw.evaluate` smoke (L3) | ✅ |
| Content-script inject + messaging | Real fixture page; assert overlay/CAPTURE round-trip (L4) | ✅ |
| `overlayMain` element pick | Real page + click (have it); wire into full flow (L4) | ✅ |
| `captureVisibleTab` pixels | Test build grants fixture host (§ below); assert PNG bytes | ✅ |
| `permissions.request` (per-site) | See grant strategies below | ⚠️ workaround |
| Context menu click | Handler unit-tested (L1); e2e drives the **equivalent message** | ⚠️ native UI not clickable |
| Keyboard command (Alt+Shift+U) | Handler unit-tested; e2e uses the **button→message** path | ⚠️ OS shortcut not simulable |
| Side panel *docking* (`sidePanel.open`) | Open panel HTML as a page (have it) | ⚠️ dock UI not needed for logic |
| `downloads` | Playwright `page.on('download')` on the fixture context | ✅ |

**Granting host access without a human, three options (pick per test):**
- **A — Test manifest (recommended default):** a build-time flag adds the fixture
  origin (e.g. `http://localhost:*/*`) to `host_permissions` for the *test* build
  only. No prompt; `captureVisibleTab`/`executeScript` just work. Keep the
  *production* request-flow covered by L1 + the contract test.
- **B — Programmatic grant:** call `chrome.permissions.request` from a real button
  click inside the panel page; under `--headless=new` this can auto-resolve, but
  it's flakier than A. Use it in *one* test that specifically asserts the
  request→grant→capture chain.
- **C — CDP:** `Browser.grantPermissions` covers the Permissions API, **not**
  extension host permissions — so it doesn't help here. Documented so nobody
  burns time on it.

**Native, genuinely un-clickable (the named residue):** the optional-permission
bubble, the OS-level context menu, and the OS keyboard shortcut. We cover their
*handlers* (L1) and their *effects* via messages (L4); only the final native
chrome is unverified. Track these three items explicitly in docs/07 as the manual
smoke checklist so the residue is visible, not silent.

## 5. Enabling changes to make first

1. **Injectable platform** (`setPlatform`/context) → unlocks L2 component tests.
2. **Stable extension id**: add a `key` to the manifest so `chrome-extension://<id>`
   URLs are deterministic (today the id is scraped from the SW each run).
3. **Test build variant** (`MODE=test`) that widens `host_permissions` to the
   fixture origin and can add a `key`. Keep it out of the shipped build.
4. **Fixture-app in the e2e harness**: start `server.mjs` as a Playwright
   `webServer` (or global setup) and point specs at it.
5. **`sw.evaluate` helpers** in `fixtures.ts` (`readStorage`, `callInSW`) to make
   L3 concise.

## 6. Coverage, CI, and flake

- **Coverage gates:** enable Vitest coverage (v8) with thresholds per package;
  fail CI below target. Exempt `chrome.ts` (covered by L3, not L1) and generated
  files.
- **Surface checklist:** keep §4 as a living table; a new `chrome.*` call in
  `chrome.ts` must arrive with an L3 contract test — enforce in review (and,
  ideally, a lint/greptest that every `chrome.` in `chrome.ts` has a matching
  contract spec).
- **CI:** `--headless=new` already runs display-less; cache the Playwright browser;
  run e2e with `workers: 1` (extension state is shared) and `retries: 1` for
  network/timing flake; upload traces + `screens/`.
- **Determinism:** freeze time/uuid in unit tests; for e2e prefer `getByTestId`
  and explicit waits over sleeps.

## 7. Sequenced backlog (proposed issues)

1. **TEST-001** Injectable platform seam + L2 component tests (composer watchdog,
   ensureAccess gating, chips, onboarding). *Unblocks the most.*
2. **TEST-002** L3 adapter contract suite (`sw.evaluate` per `chrome.ts` method).
3. **TEST-003** Test build variant (fixture host_permissions + manifest `key`) +
   fixture-app `webServer` wiring.
4. **TEST-004** L4 full capture path: real content-script arm → overlay → select →
   save → export, incl. real screenshot bytes.
5. **TEST-005** Console + downloads + GitHub-publish (mocked API) e2e.
6. **TEST-006** Coverage gates + the surface-checklist lint + docs/07 manual-residue
   list (the 3 native items).

Net effect: the only steps a human ever needs to click are the three named native
prompts/menus/shortcuts — everything else, including per-site capture, is verified
in CI on every push.
