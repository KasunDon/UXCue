import { test, expect } from "../fixtures";

const DRAFT = {
  element: {
    selector: '[data-testid="upgrade-plan-button"]',
    selectorStatus: "unique",
    domPath: "html > body > main > section > button",
    tagName: "button",
    classList: ["btn", "btn-primary"],
    dataAttributes: { testid: "upgrade-plan-button" },
    outerHtmlSkeleton: '<button data-testid="upgrade-plan-button" class="btn btn-primary"></button>',
    bbox: {
      viewport: { x: 24, y: 96, width: 168, height: 40 },
      page: { x: 24, y: 96, width: 168, height: 40 },
    },
    component: { framework: "unknown" },
    styles: { computed: { display: "inline-flex", "min-height": "40px", padding: "8px 12px" } },
    textSnippet: "Upgrade plan now",
  },
  page: { url: "http://localhost/settings/billing", origin: "http://localhost", pathname: "/settings/billing", capturedAt: "2026-07-04T20:00:00.000Z" },
  capture: { viewport: { width: 1440, height: 900, devicePixelRatio: 2, colorScheme: "light" }, scroll: { x: 0, y: 0 }, browser: { userAgent: "walkthrough" } },
  shots: {},
};

// Visual walkthrough: screenshots each side-panel state into tests/e2e/screens/.
test("visual walkthrough of the review loop", async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 720 });
  page.on("dialog", (d) => d.accept(d.message().includes("session") ? "Billing polish" : "KtKAI Console"));

  const shot = (name: string) => page.screenshot({ path: `screens/${name}.png` });

  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await shot("1-empty");

  await page.getByTestId("new-project").click();
  await page.getByTestId("new-session").click();
  await expect(page.locator("body")).toContainText("No issues captured");
  await shot("2-session-ready");

  // seed a capture draft (what the overlay produces on click) -> composer opens
  await page.evaluate((d) => chrome.storage.local.set({ captureDraft: d }), DRAFT);
  await expect(page.getByTestId("composer")).toBeVisible();
  await shot("3-composer");

  await page.getByTestId("composer-title").fill("Upgrade button label wraps");
  await page.getByTestId("composer-feedback").fill("The primary button label wraps onto two lines and misaligns with Cancel.");
  await page.getByTestId("composer-type").selectOption("visual-defect");
  await page.getByTestId("composer-severity").selectOption("major");
  await shot("4-composer-filled");

  await page.getByTestId("composer-save").click();
  await expect(page.getByTestId("issue-card").first()).toContainText("UX-001");

  // seed + save a second issue so the queue looks real
  await page.evaluate(
    (d) => chrome.storage.local.set({ captureDraft: { ...d, element: { ...d.element, selector: "nav.app-nav > a:nth-of-type(2)", textSnippet: "Billing" }, page: { ...d.page, pathname: "/responsive" } } }),
    DRAFT,
  );
  await expect(page.getByTestId("composer")).toBeVisible();
  await page.getByTestId("composer-title").fill("Nav overlaps title on mobile");
  await page.getByTestId("composer-feedback").fill("Below 640px the nav is absolutely positioned and overlaps the page title.");
  await page.getByTestId("composer-type").selectOption("responsive");
  await page.getByTestId("composer-save").click();
  await expect(page.getByTestId("issue-card")).toHaveCount(2);
  await shot("5-queue");

  // open detail on the first issue
  await page.getByTestId("issue-card").first().click();
  await expect(page.getByTestId("issue-detail")).toBeVisible();
  await page.getByTestId("detail-status").selectOption("ready-for-agent");
  await shot("6-detail");
});
