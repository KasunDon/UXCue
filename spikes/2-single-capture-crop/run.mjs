// Spike runner: build a synthetic device-resolution "viewport screenshot",
// crop the element region using bbox*dpr, and assert alignment + dimensions.
import { PNG } from "pngjs";
import { deviceRect, cropRGBA } from "./crop.mjs";

const VIEWPORT = { width: 1440, height: 900 }; // CSS px
const WHITE = [255, 255, 255, 255];
const MARKER = [0, 168, 143, 255]; // teal = the element's pixels
const SENTINEL = [207, 46, 46, 255]; // red = must NEVER appear in the crop

function makeViewportBitmap(dpr, elementBboxCss) {
  const width = Math.round(VIEWPORT.width * dpr);
  const height = Math.round(VIEWPORT.height * dpr);
  const png = new PNG({ width, height });
  const set = (x, y, [r, g, b, a]) => {
    const i = (y * width + x) * 4;
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  };
  // white background + a red sentinel band 1px above the element
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) set(x, y, WHITE);
  // paint the element rectangle in device px (this is what a real screenshot shows)
  const ex = Math.round(elementBboxCss.x * dpr);
  const ey = Math.round(elementBboxCss.y * dpr);
  const ew = Math.round(elementBboxCss.width * dpr);
  const eh = Math.round(elementBboxCss.height * dpr);
  for (let y = Math.max(0, ey - 2); y < ey; y++) for (let x = ex; x < ex + ew; x++) set(x, y, SENTINEL);
  for (let y = ey; y < ey + eh; y++) for (let x = ex; x < ex + ew; x++) set(x, y, MARKER);
  return { width, height, data: png.data };
}

function analyze(crop) {
  let marker = 0;
  let sentinel = 0;
  const total = crop.width * crop.height;
  for (let i = 0; i < crop.data.length; i += 4) {
    const [r, g, b] = [crop.data[i], crop.data[i + 1], crop.data[i + 2]];
    if (r === MARKER[0] && g === MARKER[1] && b === MARKER[2]) marker++;
    if (r === SENTINEL[0] && g === SENTINEL[1] && b === SENTINEL[2]) sentinel++;
  }
  return { total, marker, sentinel, markerPct: (marker / total) * 100 };
}

const cases = [
  { name: "DPR 1.0", dpr: 1, bbox: { x: 928, y: 344, width: 182, height: 40 } },
  { name: "DPR 1.5", dpr: 1.5, bbox: { x: 928, y: 344, width: 182, height: 40 } },
  { name: "DPR 2.0", dpr: 2, bbox: { x: 928, y: 344, width: 182, height: 40 } },
  { name: "DPR 1.5 fractional bbox", dpr: 1.5, bbox: { x: 100.5, y: 220.25, width: 181.5, height: 33.75 } },
  { name: "DPR 2.0 edge-clamped", dpr: 2, bbox: { x: 1400, y: 880, width: 100, height: 40 } },
];

let pass = 0;
for (const c of cases) {
  const bitmap = makeViewportBitmap(c.dpr, c.bbox);
  const rect = deviceRect(c.bbox, c.dpr, bitmap);
  const crop = cropRGBA(bitmap, rect);
  const a = analyze(crop);
  const expW = Math.min(Math.round(c.bbox.width * c.dpr), bitmap.width - rect.sx);
  const expH = Math.min(Math.round(c.bbox.height * c.dpr), bitmap.height - rect.sy);
  const dimsOk = crop.width === expW && crop.height === expH;
  // Alignment: crop should be essentially all marker, and contain ZERO sentinel.
  const alignedOk = a.markerPct >= 99 && a.sentinel === 0;
  const ok = dimsOk && alignedOk;
  pass += ok ? 1 : 0;
  console.log(
    `${ok ? "✅" : "❌"} ${c.name}: crop ${crop.width}x${crop.height} ` +
      `(expect ${expW}x${expH}) marker=${a.markerPct.toFixed(1)}% sentinel=${a.sentinel} ` +
      `rect=${JSON.stringify(rect)}`,
  );
}
console.log(`\n${pass}/${cases.length} cases passed — single-capture crop ${pass === cases.length ? "PROVEN ✅" : "NEEDS WORK ❌"}`);
console.log("captureVisibleTab calls per issue in this pipeline: 1 (viewport only; crop derived locally).");
