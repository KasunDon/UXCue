import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // CRXJS uses a websocket for HMR in dev; harmless for `vite build`.
  server: { port: 5174, strictPort: false },
});
