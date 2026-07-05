# SPIKE 2 — Single-Capture Crop Pipeline (D011)

Story: `UXL-EXT-007` · Rule: ONE `captureVisibleTab` per issue · Status: **PASS ✅**

## Question
Can we take a single viewport bitmap and derive an accurately-aligned element
crop from it via `bbox × devicePixelRatio` — across DPR 1 / 1.5 / 2, with
fractional bboxes and elements at the viewport edge — without a second capture
call (the 2/sec Chrome quota, D011)?

## Method
`crop.mjs` = the two pure pieces the real service worker needs:
- `deviceRect(bbox, dpr, bitmap)` → integer, clamped device-px source rect.
- `cropRGBA(bitmap, rect)` → the pixels `OffscreenCanvas.drawImage(bitmap,
  sx,sy,sw,sh, 0,0,sw,sh)` + `getImageData` would yield.

`run.mjs` synthesizes a device-resolution "viewport screenshot" (pngjs) with the
element painted teal at `bbox×dpr`, a red **sentinel** band just above it, white
elsewhere — then crops and asserts (a) crop dimensions and (b) the crop is
essentially all teal with **zero** sentinel pixels (proves pixel-accurate
placement, not just size).

## Result (reproduce: `node 2-single-capture-crop/run.mjs`)
```
✅ DPR 1.0: crop 182x40  marker=100.0% sentinel=0
✅ DPR 1.5: crop 273x60  marker=100.0% sentinel=0
✅ DPR 2.0: crop 364x80  marker=100.0% sentinel=0
✅ DPR 1.5 fractional bbox: crop 272x51  marker=100.0% sentinel=0
✅ DPR 2.0 edge-clamped: crop 80x40  marker=100.0% sentinel=0
5/5 — single-capture crop PROVEN ✅
captureVisibleTab calls per issue: 1 (viewport only; crop derived locally).
```

## Findings / decisions for the real implementation
- Multiply CSS bbox by `devicePixelRatio`, `round` to integers, and **clamp** to
  the bitmap — off-viewport elements crop to the visible portion instead of
  throwing (the edge-clamped case proves this).
- Exactly one `captureVisibleTab` per issue; both the highlighted viewport image
  and the element crop come from the same bitmap via OffscreenCanvas.
- Quota-aware save path (retry-once-with-backoff → metadata-only + warning) is a
  service-worker concern, not a math concern — nothing here blocks it.

## Honest caveats
- jsdom/canvas have no real `OffscreenCanvas`; this spike proves the **rect math
  + pixel copy**, which is the risky part. The `drawImage`/`getImageData` calls
  themselves are standard and covered by the Playwright harness (Spike 4) later.
- Real screenshots may have subpixel antialiasing at element borders; the crop
  includes a px of padding in the real impl (docs/03), so exact-edge fidelity is
  not required.

## Verdict
Crop math is exact across DPR values and edge cases with a single capture.
**Ready to implement `UXL-EXT-007`.**
