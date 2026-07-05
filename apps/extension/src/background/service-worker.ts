/**
 * MV3 service worker: shell + capture routing (UXL-EXT-001/004/007 + #6 VS Code
 * parity). Talks to the browser only through the platform adapter (D015); all
 * routing lives in ./handlers so it's unit-testable with the mock platform.
 *
 * Right-click menu / side-panel buttons drive the declared content script by
 * MESSAGE (it's already present, so no activeTab needed); the content script
 * gathers metadata/console and we take ONE screenshot per capture (D011), store
 * blobs, and MERGE into the current draft the side panel watches.
 */
import { getPlatform } from "../platform/index";
import { IndexedDbRepository } from "../storage/repository";
import { createHandlers } from "./handlers";

const platform = getPlatform();
const repo = new IndexedDbRepository();
const h = createHandlers(platform, repo);

platform.sidePanel.openOnActionClick(true).catch(() => {});

// On install/update/startup, inject the capture scripts into already-open tabs
// so right-click works without the user reloading each page.
platform.runtime.onLifecycle(() => {
  platform.tabs.injectContentScriptsEverywhere().catch(() => {});
});

// Alt+Shift+U grants activeTab, so the overlay can be injected on any page.
platform.commands.onCommand((command) => {
  if (command === "arm-capture") void h.armOverlay(null);
});

platform.contextMenus.register(h.MENU_ITEMS);
platform.contextMenus.onClicked((menuItemId, tabId) => void h.onMenuClick(menuItemId, tabId));

platform.runtime.onMessage((message) => h.handleMessage(message));
