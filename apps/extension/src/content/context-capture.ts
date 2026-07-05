/**
 * Right-click capture content script (isolated world). Records the right-clicked
 * element, buffers page console output (forwarded from the MAIN-world hook), and
 * responds to the four context-menu triggers by extracting schema-shaped
 * metadata (reusing the tested selector/metadata modules) and posting a result
 * to the service worker.
 *
 * Content scripts are the chrome.* messaging boundary (D015 exempts src/content).
 */
import type { ConsoleEntry } from "@uxcue/schema";
import {
  extractElementContext,
  extractPageContext,
  extractCaptureContext,
} from "../capture/metadata";
import { pickArea } from "./area-overlay";
import { overlayMain } from "./overlay";

const MAX_LOGS = 50;
const recentLogs: ConsoleEntry[] = [];

const recentConsole = (): ConsoleEntry[] => recentLogs.slice(-MAX_LOGS);

let lastRightClicked: Element | null = null;

// Guard against double-init (the SW may re-inject this into an already-open tab).
const w = window as unknown as { __uxcueCaptureInit?: boolean };
if (!w.__uxcueCaptureInit) {
  w.__uxcueCaptureInit = true;

  const pushLog = (level: ConsoleEntry["level"], text: string) => {
    recentLogs.push({ level, text: text.slice(0, 2000), at: new Date().toISOString() });
    if (recentLogs.length > MAX_LOGS) recentLogs.shift();
  };

  // Buffer uncaught errors + rejections from the page (isolated world sees these
  // window events). CSP-safe; no MAIN world needed. console.* method interception
  // is a follow-up (needs a MAIN-world hook that survives the CRXJS loader).
  window.addEventListener("error", (e) => pushLog("error", e.message || "Uncaught error"));
  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e as PromiseRejectionEvent).reason as { message?: string } | undefined;
    pushLog("error", "Unhandled rejection: " + (reason?.message ?? String(reason)));
  });

  // Also accept entries from a future MAIN-world console hook (postMessage).
  window.addEventListener("message", (e) => {
    const entry = (e.data as { __uxcueLog?: ConsoleEntry })?.__uxcueLog;
    if (entry && typeof entry.level === "string") {
      recentLogs.push(entry);
      if (recentLogs.length > MAX_LOGS) recentLogs.shift();
    }
  });

  document.addEventListener(
    "contextmenu",
    (e) => {
      lastRightClicked = e.target as Element | null;
    },
    true,
  );

  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    void handle(message?.type);
  });
}

async function handle(type: string | undefined): Promise<void> {
  try {
    // Arm the element picker in-page (no activeTab needed; we're already here).
    if (type === "SHOW_OVERLAY") {
      overlayMain();
      return;
    }

    const page = extractPageContext(window);
    const capture = extractCaptureContext(window);

    if (type === "CAPTURE_CONTEXT") {
      if (!lastRightClicked) return;
      const element = extractElementContext(lastRightClicked, window);
      lastRightClicked = null;
      chrome.runtime.sendMessage({
        type: "CAPTURE_SELECTED",
        element,
        page,
        capture,
        console: recentConsole(),
      });
    } else if (type === "CAPTURE_VIEWPORT") {
      chrome.runtime.sendMessage({
        type: "CAPTURE_PAGE",
        mode: "viewport",
        page,
        capture,
        console: recentConsole(),
      });
    } else if (type === "CAPTURE_CONSOLE") {
      chrome.runtime.sendMessage({
        type: "CAPTURE_PAGE",
        mode: "console",
        page,
        capture,
        console: recentConsole(),
      });
    } else if (type === "CAPTURE_AREA") {
      const rect = await pickArea();
      if (!rect) return; // cancelled
      chrome.runtime.sendMessage({
        type: "CAPTURE_PAGE",
        mode: "area",
        page,
        capture,
        areaRect: rect,
        console: recentConsole(),
      });
    }
  } catch {
    // never disrupt the page
  }
}
