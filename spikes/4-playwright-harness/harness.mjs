// Spike: prove the Playwright MV3 extension harness (D007, UXL-QA-001).
// - load the unpacked extension via launchPersistentContext + --load-extension
// - resolve the extension id from the service worker
// - drive the side panel as a directly-loaded extension page
// - prove side-panel <-> service-worker messaging
// - drive the service worker via evaluate(), and prove the handle stays valid
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const extPath = join(here, "ext");
const userDataDir = mkdtempSync(join(tmpdir(), "uxcue-e2e-"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? "  " + extra : ""}`);
};

const context = await chromium.launchPersistentContext(userDataDir, {
  // new headless supports extensions and needs no display (WSL/CI friendly)
  headless: false,
  args: [
    "--headless=new",
    `--disable-extensions-except=${extPath}`,
    `--load-extension=${extPath}`,
    "--no-sandbox",
  ],
});

try {
  // 1. service worker registers -> gives us the extension id
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extId = new URL(sw.url()).host;
  check("extension loaded; service worker registered", !!extId, `id=${extId}`);

  // 2. drive the service worker via evaluate()
  const runtimeId = await sw.evaluate(() => chrome.runtime.id);
  check("service worker reachable via evaluate()", runtimeId === extId, `runtime.id=${runtimeId}`);
  const startedAt = await sw.evaluate(() => globalThis.__uxcue?.startedAt ?? null);
  check("service worker in-memory state readable", typeof startedAt === "number");

  // 3. side panel driven as a directly-loaded extension page (docs/19 F3 pattern)
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extId}/sidepanel.html`);
  const title = await page.textContent("#title");
  check("side panel loads as extension page", title === "UXCue", `title=${title}`);

  // 4. side panel <-> service worker messaging
  await page.click("#ping");
  await page.waitForFunction(() => document.getElementById("count").textContent === "1", null, {
    timeout: 5000,
  });
  const count = await page.textContent("#count");
  check("side panel <-> SW messaging works", count === "1", `count=${count}`);

  // 5. handle stays valid across a re-evaluate (proxy for surviving suspension);
  //    Playwright keeps the same SW handle valid across MV3 suspend/restart.
  const counterAfter = await sw.evaluate(() => globalThis.__uxcue.counter);
  check("SW handle still valid after page interaction", counterAfter === 1, `counter=${counterAfter}`);

  // 6. navigate a real page in the same context (content-script world target)
  const web = await context.newPage();
  await web.setContent("<!doctype html><h1 id='h'>fixture</h1>");
  check("can drive a normal page in the same context", (await web.textContent("#h")) === "fixture");
} finally {
  await context.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} — Playwright MV3 harness ${passed === results.length ? "PROVEN ✅" : "NEEDS WORK ❌"}`);
process.exit(passed === results.length ? 0 : 1);
