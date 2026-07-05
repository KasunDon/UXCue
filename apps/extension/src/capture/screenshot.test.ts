import { describe, it, expect } from "vitest";
import { deviceRect } from "./screenshot";

// Rect math is the risky part (proven in spike 2); re-tested on the shipped code.
describe("deviceRect (single-capture crop math, D011)", () => {
  const bitmap = (dpr: number) => ({ width: 1440 * dpr, height: 900 * dpr });
  const bbox = { x: 928, y: 344, width: 182, height: 40 };

  it.each([
    [1, 928, 344, 182, 40],
    [1.5, 1392, 516, 273, 60],
    [2, 1856, 688, 364, 80],
  ])("DPR %s scales the source rect by dpr", (dpr, sx, sy, sw, sh) => {
    expect(deviceRect(bbox, dpr, bitmap(dpr))).toEqual({ sx, sy, sw, sh });
  });

  it("rounds fractional bboxes", () => {
    const r = deviceRect({ x: 100.5, y: 220.25, width: 181.5, height: 33.75 }, 1.5, bitmap(1.5));
    expect(r).toEqual({ sx: 151, sy: 330, sw: 272, sh: 51 });
  });

  it("clamps a rect that runs off the viewport edge", () => {
    const r = deviceRect({ x: 1400, y: 880, width: 100, height: 40 }, 2, bitmap(2));
    expect(r.sw).toBe(80); // 2880 - 2800
    expect(r.sh).toBe(40);
  });
});
