import { test, expect } from "../fixtures";

// docs/07 Smoke 2 — Extension startup + local project/session creation.
test("side panel loads, and a project/session can be created locally", async ({
  context,
  extensionId,
}) => {
  expect(extensionId).toBeTruthy();

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);

  await expect(page.getByTestId("uxcue-header")).toContainText("UXCue");
  await expect(page.getByTestId("empty-state")).toContainText("No project selected");

  // prompt() dialogs are answered by Playwright
  page.on("dialog", (d) =>
    d.accept(d.message().includes("session") ? "Smoke session" : "Smoke project"),
  );

  await page.getByTestId("new-project").click();
  await expect(page.getByTestId("project-select")).toContainText("Smoke project");
  await expect(page.locator("body")).toContainText("No session selected");

  await page.getByTestId("new-session").click();
  await expect(page.getByTestId("session-select")).toContainText("Smoke session");
  await expect(page.locator("body")).toContainText("No issues captured");
});

// docs/07 Smoke 4 — Persistence across reload (local-first, no account).
test("created project persists across a reload", async ({ context, extensionId }) => {
  const page = await context.newPage();
  page.on("dialog", (d) => d.accept("Persisted project"));
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);
  await page.getByTestId("new-project").click();
  await expect(page.getByTestId("project-select")).toContainText("Persisted project");

  await page.reload();
  await expect(page.getByTestId("project-select")).toContainText("Persisted project");
});
