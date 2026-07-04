# Backlog Amendment: Cross-Browser Extension Support

Date: 2026-07-04
Status: accepted for backlog (P3 → promoted to a defined Release 6 track)
Trigger: begin only after the Chrome public launch succeeds (gate defined below).

## Decision (add as D015 to docs/14-decision-log.md)

> UXCue ships Chrome-first. Cross-browser support (Edge → Firefox → Safari, in that order) enters the backlog now as a planned track, gated on Chrome launch success. To keep the port cheap, one architectural rule applies from the FIRST line of extension code: all `chrome.*` API access goes through a thin platform adapter layer (`packages/extension-platform` or `apps/extension/src/platform/`). No feature code calls `chrome.*` directly.

The adapter rule costs almost nothing now and is the difference between a 2-week port and a rewrite later. It also gives the e2e suite a clean seam for mocking.

## Launch-Success Gate

Start cross-browser work only when ALL of:

- Chrome Web Store listing is public and stable for ≥ 1 release cycle.
- ≥ 20 external users have completed a review session (per docs/11 beta metric).
- H2 holds in the wild: ≥ 70% agent fix-without-clarification on real user exports.
- No open P0/P1 data-loss or capture bugs.

## Port Order And Effort Profile

| Order | Browser | Effort | Notes |
| --- | --- | --- | --- |
| 1 | Edge | Small | Chromium: same MV3 code and APIs. Work = Edge Add-ons store listing, install/QA pass, store assets. Highest user overlap with dev audience for lowest cost — do this almost immediately after the gate. |
| 2 | Firefox | Medium | WebExtensions is close but not identical: `sidebar_action` instead of `chrome.sidePanel` (adapter absorbs it); promise-based `browser.*` namespace (use `webextension-polyfill` or the adapter); verify `captureVisibleTab` crop behavior and quota semantics; MV3 differences in background scripts (event pages vs service worker); AMO review process. Budget a spike first. |
| 3 | Safari | Large | Requires Xcode conversion to a Safari Web Extension, an Apple Developer account, macOS packaging, and App Store review. Side-panel-style UI needs redesign (no equivalent API). Do only on demonstrated user demand. |

## Backlog Entries

Paste into `docs/08-public-launch-backlog.md` (replacing the single P3 "Edge" line) and mirror in `docs/12-prioritized-backlog.md` as Release 6:

### Release 6: Cross-Browser (post-Chrome-launch gate)

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| X6-001 | P0* | Platform adapter layer enforced from day one | No `chrome.*` outside adapter; lint rule (`no-restricted-globals`/custom ESLint) blocks violations; e2e mocks use the adapter seam |
| X6-002 | P2 | Edge port + Edge Add-ons listing | Full smoke suite green on Edge; listing live; permission copy reviewed |
| X6-003 | P2 | Firefox spike | SPIKE.md covering sidebar_action mapping, capture/crop parity, polyfill choice, MV3 background model, AMO requirements |
| X6-004 | P3 | Firefox port + AMO listing | Smoke suite green on Firefox (Playwright Firefox runner where applicable); AMO approved |
| X6-005 | P3 | Safari feasibility spike | Effort/demand assessment only; no commitment |
| X6-006 | P3 | Cross-browser CI matrix | e2e runs on Chrome for Testing + Edge (+ Firefox once ported) |

*X6-001 is P0 **now** — it lands in UXL-EXT-001, not in Release 6. It is listed here because it exists solely to enable this release.

## Handover Impact

- `docs/21-build-handover.md` §4 architecture: add `platform adapter` to the extension component list; §5 Phase 0/2: UXL-EXT-001 acceptance gains the adapter + lint rule.
- Instruction files (CLAUDE.md/AGENTS.md) non-negotiables: add "No `chrome.*` calls outside the platform adapter layer."
- MVP scope statement stays Chrome-only; this amendment changes *how* code is written, not *what* ships first.
