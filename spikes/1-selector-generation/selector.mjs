// Spike prototype: selector generation (UXL-EXT-005). THROWAWAY.
// Goal: prove we can produce a *unique-at-capture* CSS selector for a target
// element ≥80% of the time, with a stable-attribute priority order and an
// nth-of-type fallback. Also emits a full DOM path (always available).

const TEST_ATTRS = ["data-testid", "data-test", "data-cy", "data-qa"];

// Heuristic: does this id look framework/build generated rather than authored?
export function isGeneratedId(id) {
  if (!id) return true;
  if (/^:r[0-9a-z]+:?$/i.test(id)) return true; // React useId ":r0:"
  if (/^[0-9a-f]{8,}$/i.test(id)) return true; // long hex/hash
  if (/^[0-9a-f-]{16,}$/i.test(id) && id.includes("-")) return true; // uuid-ish
  if (/[_-][a-z0-9]{5,}$/i.test(id) && /\d/.test(id)) return true; // css-modules Button_root__x1y2
  if (/\d{4,}/.test(id)) return true; // long digit run
  if (id.length > 24) return true; // implausibly long authored id
  return false;
}

// A class is "stable" if it doesn't look hashed/utility-ephemeral.
function isStableClass(cls) {
  if (!cls) return false;
  if (/^[a-z0-9]{5,}$/i.test(cls) && /\d/.test(cls)) return false; // hashed
  if (/^(css|sc|jsx)-[0-9a-z]+$/i.test(cls)) return false; // styled-components / emotion
  if (/^[a-z]+_[a-z]+__[a-z0-9]+$/i.test(cls)) return false; // css-modules
  return true;
}

function cssEscape(value) {
  return value.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}

function isUnique(root, selector) {
  try {
    return root.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function nthOfType(el) {
  const tag = el.tagName.toLowerCase();
  let i = 1;
  let sib = el;
  while ((sib = sib.previousElementSibling)) {
    if (sib.tagName.toLowerCase() === tag) i++;
  }
  return `${tag}:nth-of-type(${i})`;
}

// Build a compact segment for one element: prefer a stable class, else tag,
// adding :nth-of-type when needed to disambiguate among siblings.
function segmentFor(el) {
  const tag = el.tagName.toLowerCase();
  const stableClasses = Array.from(el.classList).filter(isStableClass);
  const parent = el.parentElement;
  if (stableClasses.length && parent) {
    const sel = `${tag}.${stableClasses.map(cssEscape).join(".")}`;
    const sameAmongSiblings = Array.from(parent.children).filter((c) => c.matches(sel));
    if (sameAmongSiblings.length === 1) return sel;
  }
  return nthOfType(el);
}

export function generateSelector(el, root) {
  const doc = root;

  // 1. test attributes (highest priority — authored for automation)
  for (const attr of TEST_ATTRS) {
    const v = el.getAttribute(attr);
    if (v) {
      const sel = `[${attr}="${v}"]`;
      if (isUnique(doc, sel)) return { selector: sel, status: "unique", strategy: attr };
    }
  }

  // 2. stable id
  const id = el.getAttribute("id");
  if (id && !isGeneratedId(id)) {
    const sel = `#${cssEscape(id)}`;
    if (isUnique(doc, sel)) return { selector: sel, status: "unique", strategy: "id" };
  }

  // 3/4/5. shortest unique ancestor path with stable-class/tag + nth fallback
  const parts = [];
  let cur = el;
  while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== "html") {
    parts.unshift(segmentFor(cur));
    const candidate = parts.join(" > ");
    if (isUnique(doc, candidate)) {
      return { selector: candidate, status: "unique", strategy: "path" };
    }
    cur = cur.parentElement;
  }

  const full = parts.join(" > ");
  const count = (() => {
    try {
      return doc.querySelectorAll(full).length;
    } catch {
      return 0;
    }
  })();
  return {
    selector: full,
    status: count === 1 ? "unique" : count === 0 ? "not-found" : "multiple",
    strategy: "path-full",
  };
}

export function domPath(el) {
  const parts = [];
  let cur = el;
  while (cur && cur.nodeType === 1) {
    let seg = cur.tagName.toLowerCase();
    if (cur.id) seg += `#${cur.id}`;
    parts.unshift(seg);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}
