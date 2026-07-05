import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const pathToExtension = resolve(here, "../../apps/extension/dist");

/**
 * Loads the built extension via launchPersistentContext + --load-extension,
 * unique userDataDir per worker, headless (new) so it runs with no display
 * (docs/19 F3, proven in spike 4).
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture idiom
  context: async ({}, use) => {
    const userDataDir = mkdtempSync(resolve(tmpdir(), "uxcue-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        "--headless=new",
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        "--no-sandbox",
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent("serviceworker", { timeout: 15000 });
    await use(new URL(sw.url()).host);
  },
});

export const expect = test.expect;
