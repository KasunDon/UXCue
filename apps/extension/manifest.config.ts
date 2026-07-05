import { defineManifest } from "@crxjs/vite-plugin";

// MV3 manifest. `scripting` enables chrome.scripting.executeScript (the overlay);
// `contextMenus` adds the right-click "Give UXCue feedback" entry. The
// context-capture content script needs to be present on the page BEFORE a
// right-click to know which element was clicked, so it runs on http/https —
// which grants host access (D013 amended per owner request for VS Code-style
// right-click capture; privacy mitigations: local-first, redaction, explicit
// sync; a per-site opt-in variant is a future refinement).
export default defineManifest({
  manifest_version: 3,
  name: "UXCue",
  version: "0.0.1",
  description:
    "Capture UI defects from the browser, track them as issues, and export agent-ready work orders.",
  action: { default_title: "UXCue" },
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  side_panel: { default_path: "src/sidepanel/index.html" },
  permissions: [
    "activeTab",
    "scripting",
    "contextMenus",
    "commands",
    "sidePanel",
    "storage",
    "downloads",
    // Read the active tab's URL so we can request per-site capture access for it.
    "tabs",
  ],
  // Static host grants stay minimal: GitHub API + where committed screenshots
  // resolve (#9). NO static all-sites grant.
  host_permissions: ["https://api.github.com/*", "https://raw.githubusercontent.com/*"],
  // Opt-in capture access: chrome.tabs.captureVisibleTab requires the literal
  // <all_urls> (or activeTab) permission — a per-origin/host-list grant does NOT
  // satisfy its check, and a side-panel click can't grant activeTab. So <all_urls>
  // is declared OPTIONAL and requested at runtime from the user gesture (never a
  // STATIC all-sites grant; declining leaves capture/track/export fully working).
  // @ts-expect-error `optional_host_permissions` is valid MV3, missing from CRXJS's types
  optional_host_permissions: ["<all_urls>"],
  content_scripts: [
    {
      // Isolated world: right-click capture + buffers uncaught errors/rejections.
      // (A MAIN-world console.* hook is a follow-up — CRXJS wraps content scripts
      // in a chrome.runtime loader that can't run in the MAIN world.)
      matches: ["http://*/*", "https://*/*"],
      js: ["src/content/context-capture.ts"],
      run_at: "document_start",
    },
  ],
  commands: {
    "arm-capture": {
      suggested_key: { default: "Alt+Shift+U" },
      description: "Arm UXCue capture on the current page",
    },
  },
});
