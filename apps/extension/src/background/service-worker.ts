/**
 * MV3 service worker (UXL-EXT-001 shell + UXL-EXT-004/007 capture). Talks to the
 * browser only through the platform adapter (D015).
 *
 * Capture flow (D013, docs/19 F5): the `arm-capture` command is a user gesture,
 * so it grants activeTab; the SW injects the overlay into the active tab. On
 * CAPTURE_SELECTED it takes ONE viewport screenshot, crops the element locally
 * (D011), stores both blobs, and writes a draft to storage that the side panel
 * watches to open the composer.
 */
import { getPlatform, type RuntimeMessage } from "../platform/index";
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

// Right-click "Give UXCue feedback" -> ask the content script to capture the
// element the user right-clicked (VS Code-style).
platform.contextMenus.register([{ id: "uxcue-feedback", title: "Give UXCue feedback" }]);
platform.contextMenus.onClicked((menuItemId, tabId) => {
  if (menuItemId === "uxcue-feedback" && tabId != null) {
    platform.tabs
      .sendMessage(tabId, { type: "CAPTURE_CONTEXT" })
      .catch((e) => console.error("[uxcue] context capture", e));
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
      void onCaptureSelected(m);
      return { ok: true };
    default:
      return { ok: true };
  }
});

async function onCaptureSelected(
  m: Extract<RuntimeMessage, { type: "CAPTURE_SELECTED" }>,
): Promise<void> {
  const dpr = m.capture.viewport.devicePixelRatio || 1;
  const bbox = m.element.bbox.viewport;

  const draft: CaptureDraft = {
    element: m.element,
    page: m.page,
    capture: m.capture,
    shots: {},
  };

  try {
    const shots = await captureAndCrop(platform, { bbox, devicePixelRatio: dpr, padding: 8 });
    const vKey = uuid();
    await repo.putScreenshot(vKey, shots.viewport);
    draft.shots.viewport = {
      blobKey: vKey,
      width: Math.round(m.capture.viewport.width * dpr),
      height: Math.round(m.capture.viewport.height * dpr),
    };
    if (shots.element) {
      const eKey = uuid();
      await repo.putScreenshot(eKey, shots.element);
      draft.shots.element = {
        blobKey: eKey,
        width: Math.round(bbox.width * dpr),
        height: Math.round(bbox.height * dpr),
      };
    }
  } catch {
    // screenshot failed (quota etc.) — save a metadata-only draft (R5)
  }

  await platform.storage.set(DRAFT_KEY, draft);
}
