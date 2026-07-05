import { describe, it, expect } from "vitest";
import { createMockPlatform } from "./mock";

/**
 * Contract for the per-site capture-access flow the side panel relies on
 * (useHostAccess). The gesture timing is browser-only; here we lock the adapter
 * semantics: resolve the active origin, grant on request, and stay idempotent.
 */
describe("permissions adapter", () => {
  it("resolves the active tab origin", async () => {
    const p = createMockPlatform({ activeOrigin: "https://shop.test" });
    expect(await p.permissions.activeTabOrigin()).toBe("https://shop.test");
  });

  it("starts without host access and grants it on request", async () => {
    const p = createMockPlatform({ activeOrigin: "https://shop.test" });
    expect(await p.permissions.hasHostAccess("https://shop.test")).toBe(false);

    expect(await p.permissions.requestHostAccess("https://shop.test")).toBe(true);
    expect(await p.permissions.hasHostAccess("https://shop.test")).toBe(true);
  });

  it("is idempotent — re-requesting a granted origin resolves true without changing state", async () => {
    const p = createMockPlatform();
    await p.permissions.requestHostAccess("https://a.test");
    expect(await p.permissions.requestHostAccess("https://a.test")).toBe(true);
    expect([...p.grantedOrigins]).toEqual(["https://a.test"]);
  });

  it("reflects the user declining the prompt", async () => {
    const p = createMockPlatform({ grantAccess: false });
    expect(await p.permissions.requestHostAccess("https://a.test")).toBe(false);
    expect(await p.permissions.hasHostAccess("https://a.test")).toBe(false);
  });

  it("returns null when there is no http(s) active tab", async () => {
    const p = createMockPlatform({ activeOrigin: null });
    expect(await p.permissions.activeTabOrigin()).toBeNull();
  });
});
