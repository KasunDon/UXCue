import { describe, it, expect } from "vitest";
import { renderGitHubBody, gitHubTitle, labelsFor } from "../src/index";
import { issue } from "./fixtures";

describe("renderGitHubBody", () => {
  it("is neutral, agent-ready, and includes target + styles", () => {
    const body = renderGitHubBody(issue());
    expect(body).toContain("## UI Defect");
    expect(body).toContain('- Selector: `[data-testid="upgrade-plan-button"]` (unique)');
    expect(body).toContain("## Relevant Styles");
    expect(body).toContain("Created from UXCue issue `UX-001`.");
    expect(body.toLowerCase()).not.toMatch(/\bclaude\b|\bcodex\b|\bcursor\b/);
  });

  it("embeds committed image URLs when provided, else a bundle note", () => {
    const withImgs = renderGitHubBody(issue(), {
      imageUrls: {
        element: "https://raw.githubusercontent.com/o/r/main/.uxcue/screenshots/UX-001-element.png",
      },
    });
    expect(withImgs).toContain("![element](https://raw.githubusercontent.com/");

    const without = renderGitHubBody(issue({ screenshots: {} }));
    expect(without).toContain("Screenshots are available in the UXCue export bundle.");
  });

  it("puts console logs in a collapsible details block", () => {
    const body = renderGitHubBody(
      issue({
        diagnostics: {
          console: [{ level: "error", text: "Boom", at: "2026-07-04T20:00:00.000Z" }],
        },
      }),
    );
    expect(body).toContain("<details><summary>Console logs</summary>");
    expect(body).toContain("[error] Boom");
  });

  it("maps title and labels", () => {
    const i = issue();
    expect(gitHubTitle(i)).toBe("[visual-defect] Billing button wraps awkwardly");
    expect(labelsFor(i)).toEqual(["uxcue", "ui-defect", "severity:major"]);
  });
});
