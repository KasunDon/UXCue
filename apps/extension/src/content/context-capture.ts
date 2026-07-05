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

const MAX_LOGS = 50;
const recentLogs: ConsoleEntry[] = [];

const recentConsole = (): ConsoleEntry[] => recentLogs.slice(-MAX_LOGS);

let lastRightClicked: Element | null = null;

// Guard against double-init (the SW may re-inject this into an already-open tab).
const w = window as unknown as { __uxcueCaptureInit?: boolean };
if (!w.__uxcueCaptureInit) {
  w.__uxcueCaptureInit = true;

  // Buffer console entries forwarded by the MAIN-world hook (console-hook.ts).
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
