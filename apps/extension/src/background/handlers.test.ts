import { beforeEach, describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import type { ElementContext, PageContext, CaptureContext, ConsoleEntry } from "@uxcue/schema";
import { createMockPlatform, type MockPlatform } from "../platform/mock";
import { IndexedDbRepository } from "../storage/repository";
import { DRAFT_KEY, type CaptureDraft } from "../capture/draft";
import { createHandlers } from "./handlers";

// Deterministic screenshot pipeline — no OffscreenCanvas/createImageBitmap in node.
// It still calls captureViewport() so the mock's captureRejects flag drives failures.
vi.mock("../capture/screenshot", () => ({
  async captureAndCrop(platform: MockPlatform, opts: { bbox?: { width: number; height: number } }) {
    await platform.capture.captureViewport();
    const png = new Blob([new Uint8Array([1, 2])], { type: "image/png" });
    return { viewport: png, element: opts.bbox ? png : undefined };
  },
}));

const page = (): PageContext =>
  ({
    url: "https://x.test/p",
    origin: "https://x.test",
    pathname: "/p",
    capturedAt: new Date().toISOString(),
  }) as unknown as PageContext;

const capture = (): CaptureContext =>
  ({
    viewport: { width: 1000, height: 800, devicePixelRatio: 2, colorScheme: "light" },
    scroll: { x: 0, y: 0 },
    browser: { userAgent: "test", language: "en" },
  }) as unknown as CaptureContext;

const element = (): ElementContext =>
  ({
    selector: "#a",
    selectorStatus: "unique",
    domPath: "html > body > #a",
    tagName: "div",
    classList: [],
    dataAttributes: {},
    bbox: {
      viewport: { x: 1, y: 2, width: 10, height: 20 },
      page: { x: 1, y: 2, width: 10, height: 20 },
    },
    component: { framework: "unknown" },
    styles: { computed: {} },
  }) as unknown as ElementContext;

const consoleLines: ConsoleEntry[] = [
  { level: "error", text: "boom", at: new Date().toISOString() },
];

let platform: MockPlatform;
let repo: IndexedDbRepository;
let h: ReturnType<typeof createHandlers>;

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  platform = createMockPlatform();
  repo = new IndexedDbRepository();
  h = createHandlers(platform, repo);
});

const draft = () => platform.store.get(DRAFT_KEY) as CaptureDraft | undefined;

describe("PING", () => {
  it("counts pings", async () => {
    expect(await h.handleMessage({ type: "PING" })).toEqual({ ok: true, pings: 1 });
    expect(await h.handleMessage({ type: "PING" })).toEqual({ ok: true, pings: 2 });
  });
});

describe("ARM_CAPTURE (Capture element button)", () => {
  it("arms the overlay by MESSAGING the content script — no executeScript, no activeTab", async () => {
    const res = await h.handleMessage({ type: "ARM_CAPTURE" });
    expect(res).toEqual({ ok: true, armed: true });
    expect(platform.tabMessages).toEqual([{ tabId: 1, message: { type: "SHOW_OVERLAY" } }]);
    expect(platform.injectedFns).toHaveLength(0);
  });

  it("falls back to injecting the overlay function when no content script is present", async () => {
    platform.sendMessageRejects = true;
    const res = await h.handleMessage({ type: "ARM_CAPTURE" });
    expect(res).toEqual({ ok: true, armed: true });
    expect(platform.injectedFns).toHaveLength(1);
  });

  it("reports armed:false when neither messaging nor injection works", async () => {
    platform.sendMessageRejects = true;
    vi.spyOn(platform.activeTab, "injectFunction").mockRejectedValue(new Error("no activeTab"));
    expect(await h.handleMessage({ type: "ARM_CAPTURE" })).toEqual({ ok: true, armed: false });
  });
});

describe("TRIGGER_ACTIVE (composer add-context buttons)", () => {
  it("messages the active tab with the matching CAPTURE_* trigger", async () => {
    const res = await h.handleMessage({ type: "TRIGGER_ACTIVE", action: "viewport" });
    expect(res).toEqual({ ok: true, sent: true });
    expect(platform.tabMessages).toEqual([{ tabId: 1, message: { type: "CAPTURE_VIEWPORT" } }]);
  });

  it("maps each action to its trigger", async () => {
    await h.handleMessage({ type: "TRIGGER_ACTIVE", action: "area" });
    await h.handleMessage({ type: "TRIGGER_ACTIVE", action: "console" });
    expect(platform.tabMessages.map((m) => m.message.type)).toEqual([
      "CAPTURE_AREA",
      "CAPTURE_CONSOLE",
    ]);
  });

  it("returns sent:false when there is no active tab (so the UI can stop spinning)", async () => {
    platform.activeTab_id = null;
    expect(await h.handleMessage({ type: "TRIGGER_ACTIVE", action: "viewport" })).toEqual({
      ok: true,
      sent: false,
    });
  });

  it("injects the content script and retries once when messaging fails", async () => {
    platform.sendMessageRejects = true;
    const res = await h.handleMessage({ type: "TRIGGER_ACTIVE", action: "console" });
    expect(res).toEqual({ ok: true, sent: false });
    expect(platform.injectedTabs).toEqual([1]);
  });
});

describe("onCapture (CAPTURE_SELECTED / CAPTURE_PAGE merge into draft)", () => {
  it("stores element metadata + viewport & element screenshots", async () => {
    const res = await h.handleMessage({
      type: "CAPTURE_SELECTED",
      element: element(),
      page: page(),
      capture: capture(),
    });
    expect(res.result).toMatchObject({ element: true, viewportShot: true, elementShot: true });
    const d = draft()!;
    expect(d.element?.selector).toBe("#a");
    expect(d.shots.viewport?.blobKey).toBeTruthy();
    expect(d.shots.element?.blobKey).toBeTruthy();
    expect(platform.captureCount).toBe(1); // exactly ONE captureVisibleTab (D011)
  });

  it("keeps a metadata-only draft when the screenshot fails (no activeTab/host)", async () => {
    platform.captureRejects = true;
    const res = await h.handleMessage({
      type: "CAPTURE_SELECTED",
      element: element(),
      page: page(),
      capture: capture(),
    });
    expect(res.result).toMatchObject({
      element: true,
      screenshotFailed: true,
      viewportShot: false,
    });
    const d = draft()!;
    expect(d.element?.selector).toBe("#a");
    expect(d.shots.viewport).toBeUndefined();
  });

  it("console mode attaches logs and takes NO screenshot", async () => {
    const res = await h.handleMessage({
      type: "CAPTURE_PAGE",
      mode: "console",
      page: page(),
      capture: capture(),
      console: consoleLines,
    });
    expect(res.result).toMatchObject({ console: true, screenshotFailed: false });
    expect(platform.captureCount).toBe(0);
    expect(draft()!.console).toHaveLength(1);
  });

  it("attaches a page shot onto an EXISTING draft (attach-to-draft)", async () => {
    await h.handleMessage({
      type: "CAPTURE_SELECTED",
      element: element(),
      page: page(),
      capture: capture(),
      // element capture with screenshot failure to isolate the merge
    });
    platform.captureRejects = false;
    await h.handleMessage({
      type: "CAPTURE_PAGE",
      mode: "viewport",
      page: page(),
      capture: capture(),
    });
    const d = draft()!;
    expect(d.element?.selector).toBe("#a"); // element preserved
    expect(d.shots.viewport?.blobKey).toBeTruthy(); // page shot added
  });
});

describe("onMenuClick (right-click submenu)", () => {
  it("opens the panel and drives the content script", async () => {
    const openSpy = vi.spyOn(platform.sidePanel, "open");
    await h.onMenuClick("uxcue-screenshot", 7);
    expect(openSpy).toHaveBeenCalledWith(7);
    expect(platform.tabMessages).toEqual([{ tabId: 7, message: { type: "CAPTURE_VIEWPORT" } }]);
  });

  it("arms the overlay when the page had no content script and it was a feedback click", async () => {
    platform.sendMessageRejects = true;
    await h.onMenuClick("uxcue-feedback", 7);
    expect(platform.injectedTabs).toContain(7);
    // after injecting, it re-messages SHOW_OVERLAY (still rejected here) then injects the fn
    expect(platform.injectedFns).toHaveLength(1);
  });

  it("ignores unknown menu ids", async () => {
    await h.onMenuClick("nope", 7);
    expect(platform.tabMessages).toHaveLength(0);
  });
});
