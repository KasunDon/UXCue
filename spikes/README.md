# Phase 1 — Risk Spikes (throwaway)

docs/21 §5 Phase 1. Throwaway prototypes that de-risk the four capture
mechanisms everything downstream depends on. **HUMAN GATE:** owner reviews these
four SPIKE.md files before Phase 2.

| # | Spike | Story | Result |
| --- | --- | --- | --- |
| 1 | [Selector generation](1-selector-generation/SPIKE.md) | `UXL-EXT-005` | **PASS** — 28/28 unique (bar ≥80%); generated-id detector 6/6 |
| 2 | [Single-capture crop (D011)](2-single-capture-crop/SPIKE.md) | `UXL-EXT-007` | **PASS** — 5/5 at DPR 1/1.5/2, fractional + edge-clamped; one capture call |
| 3 | [React fiber component name](3-react-fiber/SPIKE.md) | `UXL-EXT-006` | **PASS** — 6/6 on React 19; graceful degradation; never throws |
| 4 | [Playwright MV3 harness (D007)](4-playwright-harness/SPIKE.md) | `UXL-QA-001` | **PASS** — 7/7 headless, no display; SW + side panel + messaging |

Run them:
```
cd spikes && npm install jsdom react react-dom pngjs playwright
npx playwright install chromium
node 1-selector-generation/run.mjs
node 2-single-capture-crop/run.mjs
node 3-react-fiber/run.mjs
node 4-playwright-harness/harness.mjs
```

All four green → the risky mechanisms are proven. Recommendation: proceed to
Phase 2 (extension shell + capture), fixture app first.
