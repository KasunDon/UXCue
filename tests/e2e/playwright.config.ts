import { defineConfig } from "@playwright/test";

// Extension e2e runs through a custom persistent-context fixture (fixtures.ts),
// so we don't declare browser projects here. Chrome for Testing / Chromium is
// downloaded via `npx playwright install chromium`.
export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
