// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { zElementContext } from "@uxcue/schema";
import { overlayMain } from "./overlay";

interface Captured {
  type: string;
  element?: unknown;
  page?: { pathname?: string };
}
let messages: Captured[];

beforeEach(() => {
  messages = [];
  vi.stubGlobal("chrome", { runtime: { sendMessage: (m: Captured) => messages.push(m) } });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  document.body.innerHTML = "";
  document.getElementById("__uxcue_overlay__")?.remove();
});

describe("overlayMain (UXL-EXT-004)", () => {
  it("selects a clicked element and posts schema-valid CAPTURE_SELECTED", () => {
    document.body.innerHTML = `<main><button data-testid="upgrade" class="btn">Upgrade now</button></main>`;
    const button = document.querySelector("button")!;
    // The overlay hit-tests by coordinates; jsdom has no layout, so stub it.
    document.elementFromPoint = (() => button) as typeof document.elementFromPoint;
    overlayMain();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(messages).toHaveLength(1);
    const m = messages[0]!;
    expect(m.type).toBe("CAPTURE_SELECTED");
    expect(() => zElementContext.parse(m.element)).not.toThrow();
    const el = m.element as { selector: string; tagName: string; textSnippet?: string };
    expect(el.selector).toBe('[data-testid="upgrade"]');
    expect(el.tagName).toBe("button");
    expect(el.textSnippet).toBe("Upgrade now");
  });

  it("selects a DISABLED element (which never fires its own mouse events)", () => {
    document.body.innerHTML = `<form><button data-testid="pay" disabled>Pay</button></form>`;
    const disabled = document.querySelector("button")!;
    // Coordinate hit-testing returns the disabled button even though clicking it
    // dispatches no event; the capture layer receives the click instead.
    document.elementFromPoint = (() => disabled) as typeof document.elementFromPoint;
    overlayMain();
    // The click lands on the overlay's capture layer, not the disabled button.
    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const m = messages.find((x) => x.type === "CAPTURE_SELECTED");
    expect(m).toBeTruthy();
    expect((m!.element as { selector: string }).selector).toBe('[data-testid="pay"]');
  });

  it("renders in a closed shadow DOM and never double-arms", () => {
    overlayMain();
    overlayMain();
    const hosts = document.querySelectorAll("#__uxcue_overlay__");
    expect(hosts).toHaveLength(1);
    expect((hosts[0] as HTMLElement).shadowRoot).toBeNull(); // closed shadow is not exposed
  });

  it("cancels on Escape and removes itself", () => {
    overlayMain();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(messages.some((m) => m.type === "CAPTURE_CANCELLED")).toBe(true);
    expect(document.getElementById("__uxcue_overlay__")).toBeNull();
  });
});
