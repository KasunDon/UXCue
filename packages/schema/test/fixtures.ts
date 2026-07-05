import type { Issue } from "../src/index";

/** A fully-populated, valid uxlens/1.0 issue used as the baseline in tests. */
export const validIssue: Issue = {
  schema: "uxlens/1.0",
  id: "0f8a2c1e-3b4d-4a5f-9c6b-1e2d3f4a5b6c",
  displayId: "UX-001",
  projectId: "proj-1",
  sessionId: "sess-1",
  title: "Billing button wraps awkwardly",
  feedback: "Button text wraps and looks misaligned next to the secondary action.",
  expected: "Button should remain 40px high and align with the sibling action.",
  suggestedFix: "Check flex alignment and button min-height in billing card actions.",
  type: "visual-defect",
  severity: "major",
  status: "open",
  assigneeHint: "code-agent",
  page: {
    url: "https://app.example.com/settings/billing",
    origin: "https://app.example.com",
    pathname: "/settings/billing",
    routePattern: "/settings/billing",
    title: "Billing",
    capturedAt: "2026-07-04T20:00:00.000Z",
  },
  target: {
    selector: '[data-testid="upgrade-plan-button"]',
    selectorStatus: "unique",
    domPath: "html > body > div#root > main > section > button",
    tagName: "button",
    classList: ["btn", "btn-primary"],
    dataAttributes: { testid: "upgrade-plan-button" },
    aria: { role: "button", name: "Upgrade plan" },
    outerHtmlSkeleton: '<button data-testid="upgrade-plan-button">Upgrade plan</button>',
    bbox: {
      viewport: { x: 928, y: 344, width: 182, height: 40 },
      page: { x: 928, y: 344, width: 182, height: 40 },
    },
    component: { framework: "react", name: "UpgradePlanButton" },
    styles: {
      computed: { display: "inline-flex", "min-height": "40px" },
    },
  },
  capture: {
    viewport: { width: 1440, height: 900, devicePixelRatio: 2, colorScheme: "light" },
    scroll: { x: 0, y: 0 },
    browser: { userAgent: "Mozilla/5.0", language: "en-US" },
  },
  screenshots: {
    element: {
      id: "shot-el-1",
      localBlobKey: "blob:el-1",
      filename: "UX-001-element.png",
      contentType: "image/png",
      width: 182,
      height: 40,
    },
    viewport: {
      id: "shot-vp-1",
      localBlobKey: "blob:vp-1",
      filename: "UX-001-viewport.png",
      contentType: "image/png",
      width: 1440,
      height: 900,
    },
  },
  createdAt: "2026-07-04T20:00:00.000Z",
  updatedAt: "2026-07-04T20:00:00.000Z",
};
