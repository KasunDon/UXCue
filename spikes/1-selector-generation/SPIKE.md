# SPIKE 1 — Selector Generation Quality

Story: `UXL-EXT-005` · Target: ≥80% unique-at-capture · Status: **PASS ✅**

## Question
Can we generate a CSS selector that resolves back to exactly the target element,
often enough (≥80%), using a stable-attribute priority order with an
nth-of-type fallback — and avoid trusting build-generated ids?

## Method
`selector.mjs` implements the docs/03 priority order:
1. test attributes (`data-testid|test|cy|qa`)
2. stable `id` (rejected if `isGeneratedId`)
3. shortest unique ancestor path of `tag.stableClass`, adding `:nth-of-type`
4. full path fallback

`run.mjs` builds 6 representative DOMs in jsdom (fixture-app pages + realistic
SaaS/marketing/table markup with css-modules hashes, styled-components classes,
React `useId` (`:r7:`), uuid-ish ids, and duplicate rows), picks 28 interactive/
content targets, generates a selector for each, and **verifies it resolves to
that same element uniquely** (`querySelectorAll(sel).length===1 && [0]===el`).

## Result (reproduce: `node 1-selector-generation/run.mjs`)
```
Targets: 28  Unique & correct: 28  (100.0%)
By strategy: { path: 25, 'data-testid': 3 }
Target ≥80%: PASS ✅
isGeneratedId: 6/6
```
- Every target got a verified-unique selector.
- Generated-id detector correctly rejected `:r7:`, `a3f9c8e1b2d4`,
  `Button_root__p0q1r`, `user-1234567` and kept authored ids (`main-nav`).
- Hashed / styled-components / css-modules classes were correctly skipped in
  favor of `:nth-of-type`, so we never anchor on ephemeral class names.

## Findings / decisions for the real implementation
- The priority order and the "don't trust generated ids/classes" heuristics are
  the right shape; port them into `packages/*` (pure, unit-testable) behind the
  platform-agnostic capture code.
- `isGeneratedId` / `isStableClass` are heuristics — keep them data-driven and
  unit-tested; expect to tune thresholds against real corpora.
- Selector generation must also emit the **full DOM path + XPath** (always
  available) and a `selectorStatus` (`unique|multiple|not-found`) that export
  re-verifies (docs/04) — already modeled in `@uxcue/schema`.

## Honest caveats
- Corpus is synthetic and relatively clean; **100% will not hold on messy real
  apps.** The mechanism and the ≥80% bar are clearly achievable, but real-app
  validation is owed at Phase 4 dogfood (fixture-app first, D016).
- No Shadow DOM / iframe piercing (out of MVP scope, docs/02).

## Verdict
Mechanism proven, bar cleared with margin. **Ready to implement `UXL-EXT-005`.**
