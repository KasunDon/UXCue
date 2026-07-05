import type { Issue, Project, Session } from "@uxcue/schema";

export const project: Project = {
  schema: "uxlens/1.0",
  id: "p1",
  name: "KtKAI Console",
  baseUrl: "https://app.example.com",
  storageMode: "local",
  createdAt: "2026-07-04T20:00:00.000Z",
  updatedAt: "2026-07-04T20:00:00.000Z",
};

export const session: Session = {
  schema: "uxlens/1.0",
  id: "s1",
  projectId: "p1",
  name: "Billing polish",
  status: "active",
  itemCount: 2,
  createdAt: "2026-07-04T20:00:00.000Z",
  updatedAt: "2026-07-04T20:00:00.000Z",
};

export function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    schema: "uxlens/1.0",
    id: "i1",
    displayId: "UX-001",
    projectId: "p1",
    sessionId: "s1",
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
      capturedAt: "2026-07-04T20:00:00.000Z",
    },
    target: {
      selector: '[data-testid="upgrade-plan-button"]',
      selectorStatus: "unique",
      domPath: "html > body > main > section > button",
      tagName: "button",
      classList: ["btn", "btn-primary"],
      dataAttributes: { testid: "upgrade-plan-button" },
      outerHtmlSkeleton: '<button data-testid="upgrade-plan-button">Upgrade now</button>',
      bbox: {
        viewport: { x: 928, y: 344, width: 182, height: 40 },
        page: { x: 928, y: 344, width: 182, height: 40 },
      },
      component: { framework: "react", name: "UpgradePlanButton" },
      styles: { computed: { display: "inline-flex", "min-height": "40px" } },
    },
    capture: {
      viewport: { width: 1440, height: 900, devicePixelRatio: 2, colorScheme: "light" },
      scroll: { x: 0, y: 0 },
      browser: { userAgent: "test" },
    },
    screenshots: {
      element: {
        id: "e1",
        filename: "UX-001-element.png",
        contentType: "image/png",
        width: 182,
        height: 40,
      },
      viewport: {
        id: "v1",
        filename: "UX-001-viewport.png",
        contentType: "image/png",
        width: 1440,
        height: 900,
      },
    },
    createdAt: "2026-07-04T20:00:00.000Z",
    updatedAt: "2026-07-04T20:00:00.000Z",
    ...overrides,
  };
}
