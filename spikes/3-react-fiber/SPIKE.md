# SPIKE 3 — React Fiber Component-Name Extraction

Story: `UXL-EXT-006` (component hint) · Constraint: best-effort, never crash
capture · Status: **PASS ✅**

## Question
Can we read the nearest React component name from a target DOM node via the
fiber the renderer attaches to host nodes — and **degrade silently** (never
throw) on plain DOM / non-React pages / moved internals?

## Method
`fiber.mjs` (pure, no React import): find the `__reactFiber$*` (or legacy
`__reactInternalInstance$*`) property on the node, then walk `fiber.return`
collecting names from function/class/`forwardRef`/`memo` types; the first named
ancestor is the component, the rest is the owner chain. Every path is wrapped so
any failure returns `{ framework: "unknown" }`.

`run.mjs` renders a real tree (`App > Card > UpgradeButton > <button>`) into
jsdom with `react-dom/client` + `flushSync`, then extracts from host nodes.

## Result (reproduce: `node 3-react-fiber/run.mjs`)
```
React version: 19.2.7
✅ #btn         -> react:UpgradeButton   chain=[UpgradeButton < Card < App]
✅ p.muted      -> react:Card            chain=[Card < App]
✅ section.card -> react:Card            chain=[Card < App]
✅ main         -> react:App             chain=[App]
✅ plain non-React <div> -> unknown (no throw)
✅ bogus input never throws
6/6 — React fiber extraction PROVEN ✅
```

## Findings / decisions for the real implementation
- Works on **React 19** (current). The fiber-key scan is the standard technique
  and gives us both the nearest component `name` and an `ownerChain` — exactly
  the `component` shape already in `@uxcue/schema` (`framework`, `name`,
  `ownerChain`).
- This runs in the **page world** (the fiber keys live on the page's DOM nodes),
  so it belongs in the page-world shim (docs/21 §4), postMessage-bridged back to
  the content script — never in the isolated content-script world.
- Degradation is unconditional: no fiber, non-React, or internals moved →
  `{ framework: "unknown" }`, and capture falls back to plain DOM info.

## Honest caveats
- React internals are **private**; a future major could rename the keys. The
  degradation path is the insurance — treat the name as a *hint*, never a
  dependency (docs/21 hard constraint #8).
- Angular/Vue/Svelte detection is separate best-effort work (P2, docs/08); not
  attempted here.
- Minified production builds yield minified component names (e.g. `t`, `Xe`) —
  the hint is still directional; dev builds give real names.

## Verdict
Extraction + graceful degradation proven on React 19. **Ready to fold into
`UXL-EXT-006` as a page-world, best-effort hint.**
