/**
 * MV3 service worker: shell + capture routing (UXL-EXT-001/004/007 + #6 VS Code
 * parity). Talks to the browser only through the platform adapter (D015).
 *
 * Right-click menu -> the content script gathers metadata/console -> here we take
 * ONE screenshot per capture (D011), store blobs, and MERGE into the current
 * draft (attach-to-current-draft), which the side panel watches to open the
 * composer. Alt+Shift+U overlay remains a secondary element-capture path.
 */
import type { ElementContext } from "@uxcue/schema";
import { getPlatform, type RuntimeMessage, type AreaRect } from "../platform/index";
import { overlayMain } from "../content/overlay";
import { IndexedDbRepository } from "../storage/repository";
import { captureAndCrop } from "../capture/screenshot";
import { DRAFT_KEY, type CaptureDraft } from "../capture/draft";

const platform = getPlatform();
const repo = new IndexedDbRepository();
const uuid = () => globalThis.crypto.randomUUID();
let pings = 0;

platform.sidePanel.openOnActionClick(true).catch(() => {});

platform.commands.onCommand((command) => {
  if (command === "arm-capture") {
    platform.activeTab.injectFunction(overlayMain).catch((e) => console.error("[uxcue] arm", e));
  }
});

// Right-click "UXCue" submenu (VS Code parity).
const MENU: Record<string, RuntimeMessage["type"]> = {
  "uxcue-feedback": "CAPTURE_CONTEXT",
  "uxcue-screenshot": "CAPTURE_VIEWPORT",
  "uxcue-area": "CAPTURE_AREA",
  "uxcue-console": "CAPTURE_CONSOLE",
};

platform.contextMenus.register([
  { id: "uxcue", title: "UXCue" },
  { id: "uxcue-feedback", title: "Give feedback on this element", parentId: "uxcue" },
  { id: "uxcue-screenshot", title: "Add screenshot", parentId: "uxcue" },
  { id: "uxcue-area", title: "Add area screenshot", parentId: "uxcue" },
  { id: "uxcue-console", title: "Add console logs", parentId: "uxcue" },
]);

platform.contextMenus.onClicked(async (menuItemId, tabId) => {
  const trigger = MENU[menuItemId];
  if (!trigger || tabId == null) return;

  // Open the composer surface (the click is a user gesture, so this is allowed).
  platform.sidePanel.open(tabId).catch(() => {});

  try {
    await platform.tabs.sendMessage(tabId, { type: trigger } as RuntimeMessage);
  } catch {
    // Content script not present (page opened before the extension loaded).
    // Inject the declared scripts now so this and future captures work.
    await platform.tabs.injectContentScripts(tabId);
    if (trigger === "CAPTURE_CONTEXT") {
      console.warn("[uxcue] armed this tab — right-click the element again to capture it");
    } else {
      await platform.tabs
        .sendMessage(tabId, { type: trigger } as RuntimeMessage)
        .catch((e) => console.error("[uxcue] menu retry", menuItemId, e));
    }
  }
});

platform.runtime.onMessage((message) => {
  const m = message as RuntimeMessage;
  switch (m.type) {
    case "PING":
      pings += 1;
      return { ok: true, pings };
    case "ARM_CAPTURE":
      void platform.activeTab.injectFunction(overlayMain);
      return { ok: true };
    case "CAPTURE_SELECTED":
      void onCapture({
        element: m.element,
        page: m.page,
        capture: m.capture,
        console: m.console,
        shot: "element",
      });
      return { ok: true };
    case "CAPTURE_PAGE":
      void onCapture({
        page: m.page,
        capture: m.capture,
        areaRect: m.areaRect,
        console: m.console,
        shot: m.mode,
      });
      return { ok: true };
    default:
      return { ok: true };
  }
});

interface CaptureInput {
  element?: ElementContext;
  page: CaptureDraft["page"];
  capture: CaptureDraft["capture"];
  areaRect?: AreaRect;
  console?: CaptureDraft["console"];
  shot: "element" | "viewport" | "area" | "console";
}

/** Take a screenshot (if any) and MERGE this capture into the current draft. */
async function onCapture(input: CaptureInput): Promise<void> {
  const dpr = input.capture.viewport.devicePixelRatio || 1;
  const existing = (await platform.storage.get<CaptureDraft>(DRAFT_KEY)) ?? null;

  const draft: CaptureDraft = existing ?? {
    page: input.page,
    capture: input.capture,
    shots: {},
  };
  if (input.element) draft.element = input.element;
  if (input.console?.length) draft.console = input.console;

  // Region to crop: the element's bbox, or the drawn area, or none (viewport-only).
  const bbox = input.element?.bbox.viewport ?? input.areaRect;
  const needsShot = input.shot !== "console";

  try {
    if (needsShot) {
      const shots = await captureAndCrop(platform, { bbox, devicePixelRatio: dpr, padding: 8 });
      const vKey = uuid();
      await repo.putScreenshot(vKey, shots.viewport);
      draft.shots.viewport = {
        blobKey: vKey,
        width: Math.round(input.capture.viewport.width * dpr),
        height: Math.round(input.capture.viewport.height * dpr),
      };
      if (shots.element && bbox) {
        const eKey = uuid();
        await repo.putScreenshot(eKey, shots.element);
        draft.shots.element = {
          blobKey: eKey,
          width: Math.round(bbox.width * dpr),
          height: Math.round(bbox.height * dpr),
        };
      }
    }
  } catch {
    // screenshot failed (quota etc.) — keep the metadata-only draft (R5)
  }

  await platform.storage.set(DRAFT_KEY, draft);
}
