import { test, expect } from "../fixtures";

// docs/07 Smoke 2 — Extension startup. Loads the unpacked build, opens the side
// panel as a directly-loaded extension page, asserts the shell, and proves the
// side-panel <-> service-worker channel (through the platform adapter).
test("side panel shell loads and messages the service worker", async ({ context, extensionId }) => {
  expect(extensionId).toBeTruthy();

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);

  await expect(page.getByTestId("uxcue-header")).toHaveText("UXCue");
  await expect(page.getByTestId("empty-state")).toContainText("No project selected");

  // side panel -> SW -> side panel round trip
  await page.getByTestId("ping-sw").click();
  await expect(page.getByTestId("ping-count")).toHaveText("1");
  await page.getByTestId("ping-sw").click();
  await expect(page.getByTestId("ping-count")).toHaveText("2");
});
