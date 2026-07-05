// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { zElementContext, zPageContext, zCaptureContext } from "@uxcue/schema";
import {
  extractElementContext,
  extractPageContext,
  extractCaptureContext,
  outerHtmlSkeleton,
} from "./metadata";

describe("extractElementContext", () => {
  it("assembles a schema-valid ElementContext", () => {
    document.body.innerHTML = `
      <main><button data-testid="upgrade" data-plan="pro" id="go" role="button"
        aria-label="Upgrade plan" class="btn btn-primary">Upgrade now</button></main>`;
    const el = document.querySelector("button")!;
    const ctx = extractElementContext(el, window);

    expect(() => zElementContext.parse(ctx)).not.toThrow();
    expect(ctx.selector).toBe(`[data-testid="upgrade"]`);
    expect(ctx.tagName).toBe("button");
    expect(ctx.id).toBe("go");
    expect(ctx.classList).toEqual(["btn", "btn-primary"]);
    expect(ctx.dataAttributes).toEqual({ testid: "upgrade", plan: "pro" });
    expect(ctx.aria).toEqual({ role: "button", name: "Upgrade plan" });
    expect(ctx.textSnippet).toBe("Upgrade now");
    expect(ctx.component).toEqual({ framework: "unknown" });
    expect(ctx.bbox.viewport).toHaveProperty("width");
  });

  it("skeletonizes children instead of dumping full HTML", () => {
    document.body.innerHTML = `<ul class="grid"><li>a</li><li>b</li><li>c</li></ul>`;
    const ul = document.querySelector("ul")!;
    const sk = outerHtmlSkeleton(ul);
    expect(sk).toContain("<ul");
    expect(sk).toContain("child element(s)");
    expect(sk).not.toContain("<li>");
  });
});

describe("page & capture context", () => {
  it("produces schema-valid page and capture contexts", () => {
    const page = extractPageContext(window);
    const capture = extractCaptureContext(window);
    expect(() => zPageContext.parse(page)).not.toThrow();
    expect(() => zCaptureContext.parse(capture)).not.toThrow();
    expect(page.origin).toBe(window.location.origin);
    expect(capture.viewport.devicePixelRatio).toBeGreaterThan(0);
  });
});
