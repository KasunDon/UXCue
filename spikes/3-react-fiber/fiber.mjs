// Spike prototype: best-effort React component name from a DOM node (UXL-EXT-006).
// THROWAWAY. Pure: operates on a DOM node, no React import. MUST degrade
// silently (never throw) when there is no fiber — plain DOM, non-React pages,
// or a React version whose internals moved.

function getFiber(node) {
  for (const key in node) {
    if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
      return node[key];
    }
  }
  return null;
}

function nameOfType(type) {
  if (!type) return null;
  if (typeof type === "function") return type.displayName || type.name || "Anonymous";
  if (typeof type === "object") {
    // forwardRef / memo wrappers
    if (type.displayName) return type.displayName;
    const inner = type.render || type.type;
    if (typeof inner === "function") return inner.displayName || inner.name || "Anonymous";
  }
  return null; // host component (string tag) or unknown
}

export function getReactComponent(el) {
  try {
    const fiber = getFiber(el);
    if (!fiber) return { framework: "unknown" }; // graceful degradation

    const ownerChain = [];
    let name = null;
    let f = fiber;
    let guard = 0;
    while (f && guard++ < 1000) {
      const n = nameOfType(f.type);
      if (n) {
        if (!name) name = n;
        ownerChain.push(n);
      }
      f = f.return;
    }
    return name ? { framework: "react", name, ownerChain } : { framework: "react" };
  } catch {
    return { framework: "unknown" }; // never crash capture (docs/21 hard constraint)
  }
}
