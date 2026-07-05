/**
 * Capture overlay (UXL-EXT-004). Injected into the active tab as a self-contained
 * function via activeTab (D013 — no host permissions, re-armed per page). Runs in
 * the content isolated world; renders a CLOSED shadow DOM overlay that never
 * mutates the page layout, highlights the hovered element, cancels on Escape, and
 * on click gathers schema-shaped metadata and posts CAPTURE_SELECTED to the SW.
 *
 * MUST be self-contained (no imports/closures) — executeScript serializes it.
 * Richer metadata (styles subset, React component via a page-world module) is a
 * follow-up; the tested selector.ts/metadata.ts run at export re-verification.
 */
export function overlayMain(): void {
  const EXISTING = "__uxcue_overlay__";
  if (document.getElementById(EXISTING)) return; // already armed

  const host = document.createElement("div");
  host.id = EXISTING;
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(host);

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;border:2px solid #00a88f;background:rgba(0,168,143,.08);pointer-events:none;transition:all 40ms;border-radius:2px;";
  const label = document.createElement("div");
  label.style.cssText =
    "position:fixed;background:#0b0f14;color:#fff;font:12px ui-monospace,monospace;padding:2px 6px;border-radius:3px;pointer-events:none;white-space:nowrap;";
  const pill = document.createElement("div");
  pill.textContent = "Capture mode — click a UI defect · Esc to cancel";
  pill.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0b0f14;color:#fff;font:13px sans-serif;padding:6px 12px;border-radius:20px;pointer-events:none;";
  shadow.append(box, label, pill);

  let current: Element | null = null;

  function isGenId(id: string): boolean {
    return (
      !id ||
      /^:r/.test(id) ||
      /^[0-9a-f]{8,}$/i.test(id) ||
      /\d{4,}/.test(id) ||
      (/[_-][a-z0-9]{5,}$/i.test(id) && /\d/.test(id))
    );
  }
  function nth(el: Element): string {
    const tag = el.tagName.toLowerCase();
    let i = 1;
    let s = el.previousElementSibling;
    while (s) {
      if (s.tagName.toLowerCase() === tag) i++;
      s = s.previousElementSibling;
    }
    return `${tag}:nth-of-type(${i})`;
  }
  function selectorFor(el: Element): { selector: string; status: string } {
    for (const a of ["data-testid", "data-test", "data-cy", "data-qa"]) {
      const v = el.getAttribute(a);
      if (v) {
        const s = `[${a}="${v}"]`;
        if (document.querySelectorAll(s).length === 1) return { selector: s, status: "unique" };
      }
    }
    const id = el.getAttribute("id");
    if (id && !isGenId(id) && document.querySelectorAll(`#${CSS.escape(id)}`).length === 1) {
      return { selector: `#${CSS.escape(id)}`, status: "unique" };
    }
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur.tagName.toLowerCase() !== "html") {
      parts.unshift(nth(cur));
      const cand = parts.join(" > ");
      if (document.querySelectorAll(cand).length === 1) return { selector: cand, status: "unique" };
      cur = cur.parentElement;
    }
    const full = parts.join(" > ");
    const n = document.querySelectorAll(full).length;
    return { selector: full, status: n === 1 ? "unique" : n === 0 ? "not-found" : "multiple" };
  }
  function pathOf(el: Element): string {
    const p: string[] = [];
    let c: Element | null = el;
    while (c) {
      p.unshift(c.tagName.toLowerCase() + (c.id ? `#${c.id}` : ""));
      c = c.parentElement;
    }
    return p.join(" > ");
  }

  function descriptor(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const tid = el.getAttribute("data-testid") || el.getAttribute("data-test");
    if (tid) return `${tag}[${tid}]`;
    if (el.id) return `${tag}#${el.id}`;
    const named = el.getAttribute("name") || el.getAttribute("aria-label");
    if (named) return `${tag}[${named}]`;
    const cls = Array.from(el.classList)[0];
    return cls ? `${tag}.${cls}` : tag;
  }

  function highlight(el: Element): void {
    const r = el.getBoundingClientRect();
    box.style.top = `${r.top}px`;
    box.style.left = `${r.left}px`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
    // VS Code-style label: "div.idea-box  587 × 205"
    label.innerHTML = `<b style="color:#5eead4">${descriptor(el)}</b>  ${Math.round(r.width)} × ${Math.round(r.height)}`;
    const above = r.top > 24;
    label.style.top = `${above ? r.top - 22 : r.bottom + 4}px`;
    label.style.left = `${Math.max(0, r.left)}px`;
  }

  function cleanup(): void {
    host.remove();
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
  }

  function onMove(e: MouseEvent): void {
    const el = e.target as Element;
    if (!el || el === current || host.contains(el)) return;
    current = el;
    highlight(el);
  }
  function onKey(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      cleanup();
      chrome.runtime.sendMessage({ type: "CAPTURE_CANCELLED" });
    }
  }
  function onClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target as Element;
    if (!el || host.contains(el)) return;
    const rect = el.getBoundingClientRect();
    const sel = selectorFor(el);
    const styles: Record<string, string> = {};
    const cs = getComputedStyle(el);
    for (const k of [
      "display",
      "position",
      "width",
      "height",
      "margin",
      "padding",
      "font-size",
      "line-height",
      "color",
      "background-color",
    ]) {
      const v = cs.getPropertyValue(k);
      if (v) styles[k] = v.trim();
    }
    const data: Record<string, string> = {};
    for (const a of Array.from(el.attributes))
      if (a.name.startsWith("data-")) data[a.name.slice(5)] = a.value;

    cleanup();
    chrome.runtime.sendMessage({
      type: "CAPTURE_SELECTED",
      element: {
        selector: sel.selector,
        selectorStatus: sel.status,
        domPath: pathOf(el),
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classList: Array.from(el.classList),
        dataAttributes: data,
        textSnippet: (el.textContent || "").trim().slice(0, 200) || undefined,
        outerHtmlSkeleton:
          el.cloneNode(false) instanceof Element
            ? (el.cloneNode(false) as Element).outerHTML
            : `<${el.tagName.toLowerCase()}>`,
        bbox: {
          viewport: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          page: {
            x: rect.x + scrollX,
            y: rect.y + scrollY,
            width: rect.width,
            height: rect.height,
          },
        },
        component: { framework: "unknown" },
        styles: { computed: styles },
      },
      page: {
        url: location.href,
        origin: location.origin,
        pathname: location.pathname,
        title: document.title || undefined,
        capturedAt: new Date().toISOString(),
      },
      capture: {
        viewport: {
          width: innerWidth,
          height: innerHeight,
          devicePixelRatio: devicePixelRatio || 1,
          colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        },
        scroll: { x: scrollX, y: scrollY },
        browser: { userAgent: navigator.userAgent, language: navigator.language },
      },
    });
  }

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}
