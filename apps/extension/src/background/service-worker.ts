/**
 * MV3 service worker (UXL-EXT-001). Session state + message routing + capture
 * arming. Talks to the browser only through the platform adapter (D015).
 *
 * Capture arming (D013, docs/19 F5): the `arm-capture` command is a user gesture,
 * so it is safe to grant capture on the active tab. For this shell story it just
 * records the armed state; the overlay content-script injection under `activeTab`
 * lands in UXL-EXT-004 (which also validates the activeTab-only scripting path).
 */
import { getPlatform } from "../platform/index";

const platform = getPlatform();

// In-memory + persisted state; proves side-panel <-> SW messaging in smoke tests.
let pings = 0;
const contentReadyOn = new Set<string>();

platform.sidePanel.openOnActionClick(true).catch(() => {
  /* side panel still opens via the manifest default_path if this is unsupported */
});

platform.runtime.onMessage((message, sender) => {
  switch (message.type) {
    case "PING":
      pings += 1;
      return { ok: true, pings };
    case "CONTENT_READY": // received once UXL-EXT-004 injects the overlay
      contentReadyOn.add(message.url || sender.url || "");
      return { ok: true, armedPages: contentReadyOn.size };
    case "ARM_CAPTURE":
    default:
      return { ok: true };
  }
});

platform.commands.onCommand((command) => {
  if (command === "arm-capture") {
    void platform.storage.set("armedAt", Date.now());
  }
});
