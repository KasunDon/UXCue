// Spike prototype: derive an element crop from ONE viewport bitmap (D011).
// THROWAWAY. Mirrors what the real service worker does with OffscreenCanvas:
//   captureVisibleTab() -> single viewport bitmap (device px)
//   crop = bitmap[ bbox * devicePixelRatio ]  (NO second capture call)

// Map a CSS-pixel viewport bbox to an integer device-pixel source rect,
// clamped to the bitmap. Rounding mirrors canvas drawImage integer sampling.
export function deviceRect(bbox, dpr, bitmap) {
  const sx = Math.max(0, Math.round(bbox.x * dpr));
  const sy = Math.max(0, Math.round(bbox.y * dpr));
  const sw = Math.max(1, Math.round(bbox.width * dpr));
  const sh = Math.max(1, Math.round(bbox.height * dpr));
  // clamp so the rect never exceeds the captured bitmap
  const cw = Math.min(sw, bitmap.width - sx);
  const ch = Math.min(sh, bitmap.height - sy);
  return { sx, sy, sw: cw, sh: ch };
}

// Pure RGBA crop (what OffscreenCanvas.drawImage(bitmap, sx,sy,sw,sh, 0,0,sw,sh)
// + getImageData produces).
export function cropRGBA(bitmap, rect) {
  const { sx, sy, sw, sh } = rect;
  const out = Buffer.alloc(sw * sh * 4);
  for (let row = 0; row < sh; row++) {
    const srcStart = ((sy + row) * bitmap.width + sx) * 4;
    const dstStart = row * sw * 4;
    bitmap.data.copy(out, dstStart, srcStart, srcStart + sw * 4);
  }
  return { width: sw, height: sh, data: out };
}
