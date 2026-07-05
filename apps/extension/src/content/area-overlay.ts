import type { AreaRect } from "../platform/index";

/**
 * Drag-a-rectangle area picker (UXL "Add area screenshot"). Renders a closed
 * shadow-DOM overlay that dims the page, lets the user drag a rectangle, and
 * resolves the viewport-pixel rect (or null on Escape / zero-size). Never
 * mutates page layout.
 */
export function pickArea(): Promise<AreaRect | null> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;";
    const shadow = host.attachShadow({ mode: "closed" });

    const dim = document.createElement("div");
    dim.style.cssText = "position:fixed;inset:0;background:rgba(11,15,20,.25);";
    const rect = document.createElement("div");
    rect.style.cssText =
      "position:fixed;border:2px solid #00a88f;background:rgba(0,168,143,.12);display:none;";
    const hint = document.createElement("div");
    hint.textContent = "Drag to select an area · Esc to cancel";
    hint.style.cssText =
      "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0b0f14;color:#fff;font:13px sans-serif;padding:6px 12px;border-radius:20px;";
    shadow.append(dim, rect, hint);
    document.documentElement.appendChild(host);

    let sx = 0;
    let sy = 0;
    let dragging = false;

    const geom = (e: MouseEvent) => ({
      x: Math.min(sx, e.clientX),
      y: Math.min(sy, e.clientY),
      width: Math.abs(e.clientX - sx),
      height: Math.abs(e.clientY - sy),
    });

    const cleanup = () => {
      host.remove();
      document.removeEventListener("keydown", onKey, true);
    };
    const finish = (r: AreaRect | null) => {
      cleanup();
      resolve(r);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(null);
    };

    host.addEventListener("mousedown", (e) => {
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      rect.style.display = "block";
    });
    host.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const g = geom(e);
      rect.style.left = `${g.x}px`;
      rect.style.top = `${g.y}px`;
      rect.style.width = `${g.width}px`;
      rect.style.height = `${g.height}px`;
    });
    host.addEventListener("mouseup", (e) => {
      const g = geom(e);
      finish(g.width > 4 && g.height > 4 ? g : null);
    });
    document.addEventListener("keydown", onKey, true);
  });
}
