import { test, expect } from "../fixtures";
import { overlayMain } from "../../../apps/extension/src/content/overlay";

// Runs the ACTUAL overlay function in real Chromium against real markup (closer
// than the jsdom unit test). The only remaining unverified step is the browser's
// chrome.scripting.executeScript(activeTab) call, which needs a manual gesture.
test("overlayMain selects a real element and emits a schema-shaped payload", async ({
  context,
}) => {
  const page = await context.newPage();
  await page.setContent(
    `<main><section class="card"><button data-testid="upgrade-plan-button" class="btn btn-primary">Upgrade now</button></section></main>`,
  );

  // shim chrome.runtime so the overlay can post its result, then run it in-page
  await page.evaluate(() => {
    (window as unknown as { __msgs: unknown[] }).__msgs = [];
    (window as unknown as { chrome: unknown }).chrome = {
      runtime: {
        sendMessage: (m: unknown) => (window as unknown as { __msgs: unknown[] }).__msgs.push(m),
      },
    };
  });
  await page.evaluate(overlayMain);

  await page.click('[data-testid="upgrade-plan-button"]');

  const msg = await page.evaluate(
    () =>
      (
        window as unknown as {
          __msgs: { type: string; element: { selector: string; tagName: string } }[];
        }
      ).__msgs[0],
  );
  expect(msg.type).toBe("CAPTURE_SELECTED");
  expect(msg.element.selector).toBe('[data-testid="upgrade-plan-button"]');
  expect(msg.element.tagName).toBe("button");
});
