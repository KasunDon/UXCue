import type { PlatformAdapter } from "../platform/index";

/**
 * Screenshot pipeline (UXL-EXT-007, D011). Exactly ONE captureVisibleTab per
 * issue; the element crop is derived locally from that same bitmap via
 * bbox × devicePixelRatio (rect math ported from spike 2). Never a second call.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** CSS-pixel viewport bbox -> integer, clamped device-pixel source rect. */
export function deviceRect(
  bbox: Rect,
  dpr: number,
  bitmap: { width: number; height: number },
): { sx: number; sy: number; sw: number; sh: number } {
  const sx = Math.max(0, Math.round(bbox.x * dpr));
  const sy = Math.max(0, Math.round(bbox.y * dpr));
  const sw = Math.max(1, Math.round(bbox.width * dpr));
  const sh = Math.max(1, Math.round(bbox.height * dpr));
  return {
    sx,
    sy,
    sw: Math.min(sw, bitmap.width - sx),
    sh: Math.min(sh, bitmap.height - sy),
  };
}

export interface CapturedShots {
  viewport: Blob;
  element?: Blob;
}

/**
 * Capture the viewport once and (if a bbox is given) crop the element from the
 * same bitmap in an OffscreenCanvas. Quota error -> one retry with backoff;
 * still failing -> throws so the caller saves a metadata-only issue (R5).
 */
export async function captureAndCrop(
  platform: PlatformAdapter,
  opts: { bbox?: Rect; devicePixelRatio: number; padding?: number },
): Promise<CapturedShots> {
  const viewport = await withQuotaRetry(() => platform.capture.captureViewport());
  if (!opts.bbox) return { viewport };

  const bitmap = await createImageBitmap(viewport);
  try {
    const pad = opts.padding ?? 0;
    const padded: Rect = {
      x: opts.bbox.x - pad,
      y: opts.bbox.y - pad,
      width: opts.bbox.width + pad * 2,
      height: opts.bbox.height + pad * 2,
    };
    const r = deviceRect(padded, opts.devicePixelRatio, bitmap);
    const canvas = new OffscreenCanvas(r.sw, r.sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { viewport };
    ctx.drawImage(bitmap, r.sx, r.sy, r.sw, r.sh, 0, 0, r.sw, r.sh);
    const element = await canvas.convertToBlob({ type: "image/png" });
    return { viewport, element };
  } finally {
    bitmap.close();
  }
}

async function withQuotaRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 600)); // back off under the 2/sec quota
    return fn();
  }
}
