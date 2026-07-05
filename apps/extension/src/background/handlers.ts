/**
 * Capture routing, extracted from the service worker so it's unit-testable with
 * the mock platform (D015). The SW just wires a real platform + repo to these.
 *
 * Key fix: arming the element overlay and the composer "add" actions are
 * initiated from the SIDE PANEL, which does NOT grant activeTab. So we drive the
 * already-present declared content script by MESSAGE (SHOW_OVERLAY / CAPTURE_*)
 * instead of chrome.scripting.executeScript, which would need activeTab/host.
 */
import type { ElementContext } from "@uxcue/schema";
import type { PlatformAdapter, RuntimeMessage, RuntimeResponse, AreaRect } from "../platform/index";
import type { Repository } from "../storage/repository";
import { overlayMain } from "../content/overlay";
import { captureAndCrop } from "../capture/screenshot";
import { DRAFT_KEY, type CaptureDraft } from "../capture/draft";

/** Right-click "UXCue" submenu id -> content-script trigger. */
export const MENU: Record<string, RuntimeMessage["type"]> = {
  "uxcue-feedback": "CAPTURE_CONTEXT",
  "uxcue-screenshot": "CAPTURE_VIEWPORT",
  "uxcue-area": "CAPTURE_AREA",
  "uxcue-console": "CAPTURE_CONSOLE",
};

export const MENU_ITEMS = [
  { id: "uxcue", title: "UXCue" },
  { id: "uxcue-feedback", title: "Give feedback on this element", parentId: "uxcue" },
  { id: "uxcue-screenshot", title: "Screenshot the visible page", parentId: "uxcue" },
  { id: "uxcue-area", title: "Screenshot a selected area", parentId: "uxcue" },
  { id: "uxcue-console", title: "Attach recent console logs", parentId: "uxcue" },
];

interface CaptureInput {
  element?: ElementContext;
  page: CaptureDraft["page"];
  capture: CaptureDraft["capture"];
  areaRect?: AreaRect;
  console?: CaptureDraft["console"];
  shot: "element" | "viewport" | "area" | "console";
}

/** What a capture actually added — lets the UI stop "Capturing…" and report. */
export interface CaptureResult {
  element: boolean;
  viewportShot: boolean;
  elementShot: boolean;
  console: boolean;
  screenshotFailed: boolean;
}

export function createHandlers(platform: PlatformAdapter, repo: Repository) {
  const uuid = () => globalThis.crypto.randomUUID();
  let pings = 0;

  /**
   * Show the element-picker overlay on a tab. Prefer messaging the declared
   * content script (works without activeTab); fall back to injecting the
   * self-contained overlay function (used by the keyboard command, which does
   * grant activeTab).
   */
  async function armOverlay(tabId: number | null): Promise<boolean> {
    if (tabId != null) {
      try {
        await platform.tabs.sendMessage(tabId, { type: "SHOW_OVERLAY" });
        return true;
      } catch {
        /* content script not present — fall through to injection */
      }
    }
    try {
      await platform.activeTab.injectFunction(overlayMain);
      return true;
    } catch {
      return false;
    }
  }

  /** Take a screenshot (if any) and MERGE this capture into the current draft. */
  async function onCapture(input: CaptureInput): Promise<CaptureResult> {
    const dpr = input.capture.viewport.devicePixelRatio || 1;
    const existing = (await platform.storage.get<CaptureDraft>(DRAFT_KEY)) ?? null;

    const draft: CaptureDraft = existing ?? {
      page: input.page,
      capture: input.capture,
      shots: {},
    };
    const result: CaptureResult = {
      element: false,
      viewportShot: false,
      elementShot: false,
      console: false,
      screenshotFailed: false,
    };
    if (input.element) {
      draft.element = input.element;
      result.element = true;
    }
    if (input.console?.length) {
      draft.console = input.console;
      result.console = true;
    }

    const bbox = input.element?.bbox.viewport ?? input.areaRect;
    const needsShot = input.shot !== "console";
    if (needsShot) {
      try {
        const shots = await captureAndCrop(platform, { bbox, devicePixelRatio: dpr, padding: 8 });
        const vKey = uuid();
        await repo.putScreenshot(vKey, shots.viewport);
        draft.shots.viewport = {
          blobKey: vKey,
          width: Math.round(input.capture.viewport.width * dpr),
          height: Math.round(input.capture.viewport.height * dpr),
        };
        result.viewportShot = true;
        if (shots.element && bbox) {
          const eKey = uuid();
          await repo.putScreenshot(eKey, shots.element);
          draft.shots.element = {
            blobKey: eKey,
            width: Math.round(bbox.width * dpr),
            height: Math.round(bbox.height * dpr),
          };
          result.elementShot = true;
        }
      } catch {
        // Screenshot failed (no activeTab/host for this page, or quota). Keep
        // the metadata-only draft (R5) so the issue can still be created.
        result.screenshotFailed = true;
      }
    }

    await platform.storage.set(DRAFT_KEY, draft);
    return result;
  }

  /** Composer "add" buttons: message the active tab's content script to capture. */
  async function triggerActive(action: "viewport" | "area" | "console"): Promise<boolean> {
    const tabId = await platform.tabs.activeTabId();
    if (tabId == null) return false;
    const trigger = {
      viewport: "CAPTURE_VIEWPORT",
      area: "CAPTURE_AREA",
      console: "CAPTURE_CONSOLE",
    }[action] as RuntimeMessage["type"];
    try {
      await platform.tabs.sendMessage(tabId, { type: trigger } as RuntimeMessage);
      return true;
    } catch {
      await platform.tabs.injectContentScripts(tabId);
      try {
        await platform.tabs.sendMessage(tabId, { type: trigger } as RuntimeMessage);
        return true;
      } catch {
        return false;
      }
    }
  }

  /** Right-click menu click: open the panel and drive the content script. */
  async function onMenuClick(menuItemId: string, tabId: number | undefined): Promise<void> {
    const trigger = MENU[menuItemId];
    if (!trigger || tabId == null) return;
    platform.sidePanel.open(tabId).catch(() => {});
    try {
      await platform.tabs.sendMessage(tabId, { type: trigger } as RuntimeMessage);
    } catch {
      await platform.tabs.injectContentScripts(tabId);
      if (trigger === "CAPTURE_CONTEXT") {
        await armOverlay(tabId);
      } else {
        await platform.tabs.sendMessage(tabId, { type: trigger } as RuntimeMessage).catch(() => {});
      }
    }
  }

  async function handleMessage(m: RuntimeMessage): Promise<RuntimeResponse> {
    switch (m.type) {
      case "PING":
        pings += 1;
        return { ok: true, pings };
      case "ARM_CAPTURE": {
        const armed = await armOverlay(await platform.tabs.activeTabId());
        return { ok: true, armed };
      }
      case "TRIGGER_ACTIVE": {
        const sent = await triggerActive(m.action);
        return { ok: true, sent };
      }
      case "CAPTURE_SELECTED": {
        const result = await onCapture({
          element: m.element,
          page: m.page,
          capture: m.capture,
          console: m.console,
          shot: "element",
        });
        return { ok: true, result };
      }
      case "CAPTURE_PAGE": {
        const result = await onCapture({
          page: m.page,
          capture: m.capture,
          areaRect: m.areaRect,
          console: m.console,
          shot: m.mode,
        });
        return { ok: true, result };
      }
      default:
        return { ok: true };
    }
  }

  return { handleMessage, triggerActive, onCapture, armOverlay, onMenuClick, MENU, MENU_ITEMS };
}

export type Handlers = ReturnType<typeof createHandlers>;
