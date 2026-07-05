/**
 * Right-click capture content script (VS Code-style "Give feedback on this
 * element"). Runs on http/https pages so it is present when the user
 * right-clicks. It records the right-clicked element, and when the service
 * worker relays the context-menu click it extracts rich, schema-shaped metadata
 * (reusing the tested selector/metadata modules) and posts CAPTURE_SELECTED.
 *
 * Content scripts are the chrome.* messaging boundary (D015 exempts src/content).
 */
import {
  extractElementContext,
  extractPageContext,
  extractCaptureContext,
} from "../capture/metadata";

let lastRightClicked: Element | null = null;

// Capture phase so we see the true target even if the page stops propagation.
document.addEventListener(
  "contextmenu",
  (e) => {
    lastRightClicked = e.target as Element | null;
  },
  true,
);

chrome.runtime.onMessage.addListener((message: { type?: string }) => {
  if (message?.type !== "CAPTURE_CONTEXT") return;
  const el = lastRightClicked;
  if (!el) return;
  try {
    chrome.runtime.sendMessage({
      type: "CAPTURE_SELECTED",
      element: extractElementContext(el, window),
      page: extractPageContext(window),
      capture: extractCaptureContext(window),
    });
  } catch {
    // never disrupt the page
  }
  lastRightClicked = null;
});
