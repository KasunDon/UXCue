import { test, expect } from "../fixtures";

const DRAFT = {
  element: {
    selector: '[data-testid="upgrade-plan-button"]',
    selectorStatus: "unique",
    domPath: "html > body > button",
    tagName: "button",
    classList: ["btn"],
    dataAttributes: {},
    outerHtmlSkeleton: "<button></button>",
    bbox: {
      viewport: { x: 0, y: 0, width: 10, height: 10 },
      page: { x: 0, y: 0, width: 10, height: 10 },
    },
    component: { framework: "unknown" },
    styles: { computed: {} },
    textSnippet: "Upgrade now",
  },
  page: {
    url: "http://localhost/billing",
    origin: "http://localhost",
    pathname: "/billing",
    capturedAt: "2026-07-04T20:00:00.000Z",
  },
  capture: {
    viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
    scroll: { x: 0, y: 0 },
    browser: { userAgent: "e2e" },
  },
  shots: {},
};

// docs/07 Smoke 3 — capture -> composer -> save, then it appears in the queue.
// The overlay writes a draft to chrome.storage; we seed that draft directly
// (the SW injection path needs a keyboard-command gesture, exercised by units).
test("a capture draft opens the composer and saves a tracked issue", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  page.on("dialog", (d) => d.accept(d.message().includes("session") ? "Sess" : "Proj"));
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);

  await page.getByTestId("new-project").click();
  await page.getByTestId("new-session").click();
  await expect(page.locator("body")).toContainText("No issues captured");

  // simulate the overlay's output
  await page.evaluate((draft) => chrome.storage.local.set({ captureDraft: draft }), DRAFT);

  await expect(page.getByTestId("composer")).toBeVisible();
  await expect(page.getByTestId("composer")).toContainText('[data-testid="upgrade-plan-button"]');

  await page.getByTestId("composer-feedback").fill("Button label wraps and misaligns.");
  await page.getByTestId("composer-severity").selectOption("major");
  await page.getByTestId("composer-save").click();

  // composer closes and the issue shows in the queue
  await expect(page.getByTestId("composer")).toHaveCount(0);
  const card = page.getByTestId("issue-card").first();
  await expect(card).toContainText("UX-001");
  await expect(card).toContainText("major");

  // export is now enabled
  await expect(page.getByTestId("export")).toBeEnabled();

  // detail: edit + persist (UXL-ISSUE-001)
  await card.click();
  await expect(page.getByTestId("issue-detail")).toBeVisible();
  await page.getByTestId("detail-title").fill("Renamed issue");
  await page.getByTestId("detail-status").selectOption("ready-for-agent");
  await page.getByTestId("detail-save").click();
  await page.getByTestId("detail-back").click();
  await expect(page.getByTestId("issue-card").first()).toContainText("Renamed issue");
  await expect(page.getByTestId("issue-card").first()).toContainText("ready-for-agent");

  // detail: delete (confirm() accepted by the dialog handler)
  await page.getByTestId("issue-card").first().click();
  await page.getByTestId("detail-delete").click();
  await expect(page.getByTestId("issue-detail")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("No issues captured");
});
