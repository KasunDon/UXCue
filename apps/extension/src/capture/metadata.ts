import type { ElementContext, PageContext, CaptureContext, StyleContext } from "@uxcue/schema";
import { generateSelector, domPath, xpath } from "./selector";
import { getReactComponent } from "./component";

/** MVP computed-style subset (docs/04). */
const STYLE_KEYS = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "box-sizing",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "margin",
  "padding",
  "border",
  "border-radius",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "color",
  "background-color",
  "opacity",
  "box-shadow",
  "transform",
  "transition",
  "overflow",
  "white-space",
  "text-overflow",
  "flex-direction",
  "align-items",
  "justify-content",
  "gap",
  "grid-template-columns",
] as const;

const SKELETON_MAX = 600;

function pickStyles(el: Element, view: Window): StyleContext {
  const cs = view.getComputedStyle(el);
  const computed: Record<string, string> = {};
  for (const key of STYLE_KEYS) {
    const v = cs.getPropertyValue(key);
    if (v && v.trim()) computed[key] = v.trim();
  }

  const style: StyleContext = { computed };
  const parent = el.parentElement;
  if (parent) {
    const pcs = view.getComputedStyle(parent);
    const parentLayout: NonNullable<StyleContext["parentLayout"]> = {};
    const psel = generateSelector(parent).selector;
    if (psel) parentLayout.selector = psel;
    for (const [k, css] of [
      ["display", "display"],
      ["gap", "gap"],
      ["alignItems", "align-items"],
      ["justifyContent", "justify-content"],
      ["gridTemplateColumns", "grid-template-columns"],
      ["flexDirection", "flex-direction"],
    ] as const) {
      const v = pcs.getPropertyValue(css);
      if (v && v.trim()) parentLayout[k] = v.trim();
    }
    style.parentLayout = parentLayout;
  }
  return style;
}

/** Opening tag with attributes only (children collapsed), capped. */
export function outerHtmlSkeleton(el: Element): string {
  const attrs = Array.from(el.attributes)
    .map((a) => (a.value ? `${a.name}="${a.value}"` : a.name))
    .join(" ");
  const tag = el.tagName.toLowerCase();
  const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
  const childCount = el.children.length;
  const inner = childCount
    ? `…${childCount} child element(s)…`
    : (el.textContent ?? "").trim().slice(0, 80);
  const skeleton = `${open}${inner}</${tag}>`;
  return skeleton.length > SKELETON_MAX ? skeleton.slice(0, SKELETON_MAX) + "…" : skeleton;
}

function dataAttributes(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-")) out[attr.name.slice(5)] = attr.value;
  }
  return out;
}

export function extractElementContext(el: Element, view: Window): ElementContext {
  const doc = el.ownerDocument;
  const sel = generateSelector(el, doc);
  const rect = el.getBoundingClientRect();

  const ctx: ElementContext = {
    selector: sel.selector,
    selectorStatus: sel.status,
    domPath: domPath(el),
    xpath: xpath(el),
    tagName: el.tagName.toLowerCase(),
    classList: Array.from(el.classList),
    dataAttributes: dataAttributes(el),
    outerHtmlSkeleton: outerHtmlSkeleton(el),
    bbox: {
      viewport: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      page: {
        x: rect.x + view.scrollX,
        y: rect.y + view.scrollY,
        width: rect.width,
        height: rect.height,
      },
    },
    component: getReactComponent(el),
    styles: pickStyles(el, view),
  };

  const id = el.getAttribute("id");
  if (id) ctx.id = id;

  const role = el.getAttribute("role");
  const ariaLabel = el.getAttribute("aria-label");
  if (role || ariaLabel) {
    ctx.aria = {};
    if (role) ctx.aria.role = role;
    if (ariaLabel) ctx.aria.name = ariaLabel;
  }

  const text = (el.textContent ?? "").trim();
  if (text) ctx.textSnippet = text.slice(0, 200);

  return ctx;
}

export function extractPageContext(view: Window): PageContext {
  const loc = view.location;
  const ctx: PageContext = {
    url: loc.href,
    origin: loc.origin,
    pathname: loc.pathname,
    capturedAt: new Date().toISOString(),
  };
  const title = view.document.title;
  if (title) ctx.title = title;
  return ctx;
}

export function extractCaptureContext(view: Window): CaptureContext {
  const scheme = view.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  return {
    viewport: {
      width: view.innerWidth,
      height: view.innerHeight,
      devicePixelRatio: view.devicePixelRatio || 1,
      colorScheme: scheme,
    },
    scroll: { x: view.scrollX, y: view.scrollY },
    browser: {
      userAgent: view.navigator.userAgent,
      language: view.navigator.language,
    },
  };
}
