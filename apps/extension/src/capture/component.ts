import type { Framework } from "@uxcue/schema";

/**
 * Best-effort React component name from a DOM node (UXL-EXT-006, ported from
 * spike 3). Runs in the page world (the fiber lives on the page's DOM nodes).
 * MUST degrade silently — plain DOM, non-React pages, or moved internals return
 * `{ framework: "unknown" }` and never throw (docs/21 hard constraint #8).
 */
export interface ComponentInfo {
  framework: Framework;
  name?: string;
  ownerChain?: string[];
}

interface FiberLike {
  type?: unknown;
  return?: FiberLike | null;
}

function getFiber(node: Element): FiberLike | null {
  for (const key in node) {
    if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
      return (node as unknown as Record<string, FiberLike>)[key] ?? null;
    }
  }
  return null;
}

function nameOfType(type: unknown): string | null {
  if (!type) return null;
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName || fn.name || "Anonymous";
  }
  if (typeof type === "object") {
    const obj = type as { displayName?: string; render?: unknown; type?: unknown };
    if (obj.displayName) return obj.displayName;
    const inner = obj.render ?? obj.type;
    if (typeof inner === "function") {
      const fn = inner as { displayName?: string; name?: string };
      return fn.displayName || fn.name || "Anonymous";
    }
  }
  return null;
}

export function getReactComponent(el: Element): ComponentInfo {
  try {
    const fiber = getFiber(el);
    if (!fiber) return { framework: "unknown" };

    const ownerChain: string[] = [];
    let name: string | undefined;
    let f: FiberLike | null = fiber;
    let guard = 0;
    while (f && guard++ < 1000) {
      const n = nameOfType(f.type);
      if (n) {
        if (!name) name = n;
        ownerChain.push(n);
      }
      f = f.return ?? null;
    }
    return name ? { framework: "react", name, ownerChain } : { framework: "react" };
  } catch {
    return { framework: "unknown" };
  }
}
