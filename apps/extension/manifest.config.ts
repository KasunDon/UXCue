import { defineManifest } from "@crxjs/vite-plugin";

// MV3 manifest. Permissions are EXACTLY the five allowed by D013 — no
// <all_urls>, no host_permissions. Capture arms per user gesture (action click
// or the arm-capture command) under activeTab.
export default defineManifest({
  manifest_version: 3,
  name: "UXCue",
  version: "0.0.1",
  description:
    "Capture UI defects from the browser, track them as issues, and export agent-ready work orders.",
  action: { default_title: "UXCue" },
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  side_panel: { default_path: "src/sidepanel/index.html" },
  permissions: ["activeTab", "commands", "sidePanel", "storage", "downloads"],
  commands: {
    "arm-capture": {
      suggested_key: { default: "Alt+Shift+U" },
      description: "Arm UXCue capture on the current page",
    },
  },
});
