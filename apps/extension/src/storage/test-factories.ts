import type { CreateIssueInput } from "./repository";

/** Minimal valid CreateIssueInput for tests (storage owns id/displayId/dates). */
export function issueInput(overrides: Partial<CreateIssueInput> = {}): CreateIssueInput {
  return {
    projectId: "proj-1",
    sessionId: "sess-1",
    title: "Button wraps",
    feedback: "The primary button label wraps.",
    type: "visual-defect",
    severity: "major",
    status: "open",
    assigneeHint: "code-agent",
    page: {
      url: "http://localhost/settings/billing",
      origin: "http://localhost",
      pathname: "/settings/billing",
      capturedAt: "2026-07-04T20:00:00.000Z",
    },
    capture: {
      viewport: { width: 1440, height: 900, devicePixelRatio: 2 },
      scroll: { x: 0, y: 0 },
      browser: { userAgent: "test" },
    },
    screenshots: {},
    ...overrides,
  };
}
