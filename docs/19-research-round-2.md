# Research Round 2: Technical Validation And Decision Updates

Research date: 2026-07-04

Purpose: close the highest-risk open questions from `13-validation-plan.md` (research backlog) and `14-decision-log.md` before handing the pack to Claude Code for implementation. Each finding below ends with a concrete amendment to an existing doc.

## Summary Of Outcomes

| # | Question | Verdict | Doc impact |
| --- | --- | --- | --- |
| F1 | UXCue name collision | Clear. No software product collision. npm `uxcue` and `uxcue-mcp` unregistered. | Confirm naming; register npm names; note Appcues adjacency |
| F2 | `captureVisibleTab` limits | Hard 2 calls/sec quota, cannot be raised. Needs `activeTab` or host permission. | New design rule: one capture per issue, crop locally. New decision D011 |
| F3 | Cypress vs Playwright for extension e2e | Playwright is the correct tool for extension e2e; revise D007 | Amend D007; update 07-testing doc |
| F4 | GitHub issue image upload via API | Still impossible via API/PAT/OAuth/App as of 2026. | Close backlog item; confirm signed-URL / repo-commit strategy in 09-doc |
| F5 | activeTab and multi-page sessions | activeTab grant is per-invocation; multi-page review needs re-invocation per page or optional host permission | Amend R2/permission strategy in 11-refined-prd and 08-launch backlog |

---

## F1: Naming — UXCue Is Clear

Checked 2026-07-04:

- Web search for "UXCue" as a software product: no collisions. All results are billiard cue extensions (irrelevant category).
- npm registry: `uxcue` → 404 (unregistered). `uxcue-mcp` → 404. `uxlens` (former name) → also 404, useful as fallback.
- GitHub: 3 repos matching "uxcue". One is `KasunDon/UXCue` (ours). The others are a dormant 0-star bug tracker under an org username `UXcue` and an unrelated Illustrator asset repo. No active product.
- Adjacency note: **Appcues** (established user-onboarding SaaS with a Chrome extension) is the phonetically nearest product name. Different category (product tours vs design QA), different spelling, low confusion risk — but worth knowing it exists before trademark spend.

Actions:

1. Register `uxcue` and `uxcue-mcp` on npm immediately (free, prevents squatting; publish placeholder 0.0.1).
2. Note the GitHub org name `UXcue` is taken by a dormant account; product repos stay under `KasunDon/` or a new org like `uxcue-dev`.
3. Proceed with domain purchases per `17-naming-and-monetization.md`.
4. Add Appcues to `16-competitor-references.md` as a naming-adjacency note only.

## F2: Screenshot Capture Quota Is A Hard Design Constraint

Confirmed from Chrome docs and Chromium tracker:

- `captureVisibleTab` requires either `<all_urls>`/host permission or `activeTab`.
- `MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND` = 2, introduced in Chrome 92 after a crash bug; Chromium maintainers confirmed there is no way to increase it.
- With `activeTab`, capture also works on otherwise-restricted pages, and triggers **no permission warning** — good for the Web Store story.

Design rules to add (proposed **D011** in decision log):

- **One `captureVisibleTab` call per issue.** Capture the viewport once, then derive the element crop from that same bitmap in an OffscreenCanvas using bbox × devicePixelRatio. Never call twice for element + viewport.
- Debounce capture: if the user saves two issues within 500ms (unlikely but possible via keyboard), queue the second capture.
- Retry-with-backoff once on quota error; if it still fails, save the issue with `screenshot: failed` warning (already allowed by R5).
- Scroll-and-stitch full-page capture is explicitly out of scope (quota makes it slow and fragile; competitors' full-page bugs confirm this).

## F3: Revise D007 — Playwright For Extension E2E

New evidence changes the testing decision:

- Playwright now has an **official Chrome extensions testing guide**, including MV3-specific handling: it documents that MV3 service workers suspend after ~30s and that Playwright keeps the same worker handle valid across restarts, stalling and resuming in-flight `evaluate()` calls automatically.
- Known limitation is documented too: the side panel cannot be opened programmatically (user gesture required); the practical pattern is to load the side panel page directly as an extension page (`chrome-extension://<id>/sidepanel.html`) and drive the service worker via `evaluate` — a well-trodden workaround.
- Ecosystem signal (mid-2026): Playwright leads adoption by a wide margin (~45% vs ~14% for Cypress in QA surveys, ~33M vs ~6.5M weekly npm downloads), with free built-in parallel sharding; Cypress parallelization requires paid Cypress Cloud. Cypress's in-process architecture is precisely what makes extension contexts (service worker, multiple extension pages, content script world) awkward for it.

Proposed decision amendment:

> **D007 (revised): Playwright owns extension e2e and smoke.** Cypress remains acceptable for the cloud console SPA if desired, but the default is to consolidate everything on Playwright to avoid running two e2e stacks. The test-app fixture, smoke list, and CI gates in `07-testing-release-and-smoke.md` all carry over unchanged — only the runner changes.

Concrete updates to `07-testing-release-and-smoke.md`:

- Replace Cypress launch-args section with Playwright `launchPersistentContext` + `--load-extension` fixture (per official docs), unique `userDataDir` per worker for parallel runs.
- Side panel spec strategy: test side panel UI as a directly-loaded extension page; test capture overlay by navigating a page in the same context and messaging the service worker.
- Keep `cy.request`-style API smoke as Playwright `request` fixtures or plain Vitest+fetch.

## F4: GitHub Image Attachment — Confirmed Still Blocked (Close Backlog Item)

The `13-validation-plan.md` backlog asked to "check whether GitHub issue image upload through official APIs has improved." Answer: **no.**

- GitHub staff confirmed the API does not support issue attachments; the upload endpoint is tied to a browser session and does not accept PATs, OAuth Apps, or GitHub Apps.
- As of Feb–Mar 2026 the community is still working around this: a `gh-attach` CLI exists that uses Playwright browser automation to fake the drag-and-drop upload, and a March 2026 `gh` CLI issue calls attachments "the single biggest gap in gh's agentic usability" — multiple prior requests were closed as blocked on the platform API.

This **validates the pack's existing strategy** (`09-agent-integrations-mcp-github.md` and D-open O003):

1. MVP local-only: GitHub issue body says screenshots live in the UXCue export bundle.
2. Cloud alpha: embed UXCue Cloud **signed/share URLs** in the issue body (`![element](https://…)` renders fine; only uploads are blocked, not hotlinks).
3. Optional later: commit screenshots into the repo under `.uxcue/screenshots/` via the Contents API and reference raw URLs — fully supported, no session hackery.
4. Do **not** adopt browser-automation upload tricks (ToS-gray, brittle).

Extra product insight from F4: the pain in that `gh` CLI thread ("an agent can write a perfect issue body but can't attach the screenshot that makes it actionable") is *precisely* UXCue's wedge — UXCue Cloud hosting the screenshot and handing agents a URL is a differentiator worth naming in positioning copy.

## F5: activeTab Semantics vs Multi-Page Sessions

`activeTab` grants temporary host access **only in response to a user invocation** (clicking the action, keyboard shortcut, context menu) and it does not survive navigation to a new origin/page load.

Implication for the multi-page review workflow (FR/R2, R4):

- Capture mode must be (re)armed per page via a user gesture. The keyboard shortcut (`chrome.commands`) counts as invocation, so the flow "land on page → hit shortcut → capture" works with zero scary permissions.
- The side panel itself stays open across navigation (it is extension UI), so the *session* persists even though the *page grant* does not — the docs' model already matches this, but the PRD should state it explicitly so implementers don't reach for `<all_urls>`.
- Offer optional per-origin host permission (`chrome.permissions.request` at runtime) as a convenience toggle per project ("Always allow capture on app.ktkai.com") for heavy dogfooding — requested at runtime, revocable, and honest in the Web Store listing.

Amendments:

- `11-refined-prd.md` R2: add "capture arming is per user invocation; shortcut counts; optional per-origin grant per project."
- `08-public-launch-backlog.md` P1 permission item: add runtime `permissions.request` flow.

## Competitive Delta Since Round 1

Nothing category-changing since the 2026-07-04 round-1 snapshot. Agentation remains npm-inject-only (no Chrome extension shipped), BugHerd MCP remains SaaS-board-first, and Anthropic's Claude in Chrome + Claude Code integration remains agent-driven browsing rather than reviewer-owned capture — and still unsupported in WSL, preserving that wedge. The window for a local-first, extension-form-factor, agent-ready issue tracker is still open.

## Updated Decision Log Entries (to merge into 14-decision-log.md)

- **D007 (revised):** Playwright owns extension e2e; Cypress optional for console only; default consolidate on Playwright.
- **D011 (new):** One `captureVisibleTab` per issue; element crop derived locally; quota-aware retry; no full-page stitching.
- **D012 (new):** GitHub screenshots via UXCue Cloud signed URLs (cloud users) or export-bundle note (local users); repo-commit via Contents API as later option; never browser-automation upload.
- **D013 (new):** Permission model — `activeTab` + `chrome.commands` shortcut for capture arming; optional runtime per-origin host grant per project; never default `<all_urls>`.
- **O001 partial close:** npm names `uxcue`, `uxcue-mcp` free as of research date — register immediately. GitHub org `UXcue` squatted (dormant); use `KasunDon/UXCue` or a new org.
- **D009 (flip pending owner confirmation):** planning-only phase ends; pack moves to Claude Code implementation per `20-claude-code-handover.md`.
