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
  ],
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/content/context-capture.ts"],
      run_at: "document_idle",
    },
  ],
  commands: {
    "arm-capture": {
      suggested_key: { default: "Alt+Shift+U" },
      description: "Arm UXCue capture on the current page",
    },
  },
});
