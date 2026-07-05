import type { SelectorStatus } from "@uxcue/schema";

/**
 * Selector generation (UXL-EXT-005). Pure, DOM-in / string-out. Priority order
 * (docs/03): test attributes -> stable id -> shortest unique tag.class path ->
 * :nth-of-type fallback. Never anchors on build-generated ids/classes. Runs in
 * the page world during capture.
 */

const TEST_ATTRS = ["data-testid", "data-test", "data-cy", "data-qa"] as const;

export interface GeneratedSelector {
  selector: string;
  status: SelectorStatus;
  strategy: "test-attr" | "id" | "path" | "path-full";
}

/** Does this id look framework/build generated rather than authored? */
export function isGeneratedId(id: string | null | undefined): boolean {
  if (!id) return true;
  if (/^:r[0-9a-z]+:?$/i.test(id)) return true; // React useId ":r0:"
  if (/^[0-9a-f]{8,}$/i.test(id)) return true; // long hex/hash
  if (/^[0-9a-f-]{16,}$/i.test(id) && id.includes("-")) return true; // uuid-ish
  if (/[_-][a-z0-9]{5,}$/i.test(id) && /\d/.test(id)) return true; // css-modules-ish
  if (/\d{4,}/.test(id)) return true; // long digit run
  if (id.length > 24) return true;
  return false;
}

/** A class is "stable" if it doesn't look hashed / css-in-js ephemeral. */
export function isStableClass(cls: string): boolean {
  if (!cls) return false;
  if (/^[a-z0-9]{5,}$/i.test(cls) && /\d/.test(cls)) return false; // hashed
  if (/^(css|sc|jsx)-[0-9a-z]+$/i.test(cls)) return false; // styled-components / emotion
  if (/^[a-z]+_[a-z]+__[a-z0-9]+$/i.test(cls)) return false; // css-modules
  return true;
}

function cssEscape(value: string): string {
  const g = globalThis as { CSS?: { escape?: (v: string) => string } };
  if (g.CSS?.escape) return g.CSS.escape(value);
  return value.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}

function isUnique(root: Document, selector: string): boolean {
  try {
    return root.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function nthOfType(el: Element): string {
  const tag = el.tagName.toLowerCase();
  let i = 1;
  let sib: Element | null = el;
  while ((sib = sib.previousElementSibling)) {
    if (sib.tagName.toLowerCase() === tag) i++;
  }
  return `${tag}:nth-of-type(${i})`;
}

function segmentFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const stableClasses = Array.from(el.classList).filter(isStableClass);
  const parent = el.parentElement;
  if (stableClasses.length && parent) {
    const sel = `${tag}.${stableClasses.map(cssEscape).join(".")}`;
    const among = Array.from(parent.children).filter((c) => c.matches(sel));
    if (among.length === 1) return sel;
  }
  return nthOfType(el);
}

export function generateSelector(
  el: Element,
  root: Document = el.ownerDocument,
): GeneratedSelector {
  for (const attr of TEST_ATTRS) {
    const v = el.getAttribute(attr);
    if (v) {
      const sel = `[${attr}="${cssEscape(v)}"]`;
      if (isUnique(root, sel)) return { selector: sel, status: "unique", strategy: "test-attr" };
    }
  }

  const id = el.getAttribute("id");
  if (id && !isGeneratedId(id)) {
    const sel = `#${cssEscape(id)}`;
    if (isUnique(root, sel)) return { selector: sel, status: "unique", strategy: "id" };
  }

  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== "html") {
    parts.unshift(segmentFor(cur));
    const candidate = parts.join(" > ");
    if (isUnique(root, candidate))
      return { selector: candidate, status: "unique", strategy: "path" };
    cur = cur.parentElement;
  }

  const full = parts.join(" > ");
  let count = 0;
  try {
    count = root.querySelectorAll(full).length;
  } catch {
    count = 0;
  }
  return {
    selector: full,
    status: count === 1 ? "unique" : count === 0 ? "not-found" : "multiple",
    strategy: "path-full",
  };
}

/** Full ancestor path with ids, always available as a fallback. */
export function domPath(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    let seg = cur.tagName.toLowerCase();
    if (cur.id) seg += `#${cur.id}`;
    parts.unshift(seg);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

/** Absolute XPath by tag position — robust fallback locator. */
export function xpath(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    let i = 1;
    let sib: Element | null = cur;
    while ((sib = sib.previousElementSibling)) {
      if (sib.tagName === cur.tagName) i++;
    }
    parts.unshift(`${cur.tagName.toLowerCase()}[${i}]`);
    cur = cur.parentElement;
  }
  return "/" + parts.join("/");
}

/** Re-verify a selector against the current document (export-time check). */
export function verifySelector(selector: string, root: Document): SelectorStatus {
  try {
    const n = root.querySelectorAll(selector).length;
    return n === 1 ? "unique" : n === 0 ? "not-found" : "multiple";
  } catch {
    return "unverified";
  }
}
