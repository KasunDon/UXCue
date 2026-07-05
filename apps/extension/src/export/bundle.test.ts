import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { parseIssue, safeParseProject, safeParseSession } from "@uxcue/schema";
import { buildReviewJson } from "./review-json";
import { buildBundleZip, bundleFiles, dropInFiles } from "./bundle";
import { project, session, sampleIssues } from "./export-fixtures";

describe("buildReviewJson", () => {
  const json = buildReviewJson({ project, session, issues: sampleIssues() });

  it("is schema-valid and self-contained", () => {
    expect(json.schema).toBe("uxlens/1.0");
    expect(safeParseProject(json.project).success).toBe(true);
    expect(safeParseSession(json.session).success).toBe(true);
    for (const issue of json.issues) expect(() => parseIssue(issue)).not.toThrow();
  });

  it("builds a screenshot manifest keyed by issue + kind", () => {
    expect(json.screenshots).toContainEqual({
      issueId: "i1",
      displayId: "UX-001",
      kind: "element",
      filename: "UX-001-element.png",
    });
  });
});

describe("buildBundleZip", () => {
  const zip = buildBundleZip({
    project,
    session,
    issues: sampleIssues(),
    screenshots: [{ filename: "UX-001-element.png", bytes: new Uint8Array([1, 2, 3]) }],
  });
  const entries = unzipSync(zip);

  it("contains review.md, review.json, per-issue md, and screenshots", () => {
    const names = Object.keys(entries);
    expect(names).toContain("uxcue-review/review.md");
    expect(names).toContain("uxcue-review/review.json");
    expect(names).toContain("uxcue-review/issues/UX-001.md");
    expect(names).toContain("uxcue-review/screenshots/UX-001-element.png");
  });

  it("review.json inside the zip round-trips valid issues", () => {
    const parsed = JSON.parse(strFromU8(entries["uxcue-review/review.json"]!));
    expect(parsed.schema).toBe("uxlens/1.0");
    expect(() => parseIssue(parsed.issues[0])).not.toThrow();
  });

  it("bundle works offline with zero screenshots", () => {
    const files = bundleFiles({ project, session, issues: sampleIssues(), screenshots: [] });
    expect(Object.keys(files)).toContain("uxcue-review/review.md");
  });

  it("drop-in layout roots at .uxcue (D014)", () => {
    const files = dropInFiles({ project, session, issues: sampleIssues(), screenshots: [] });
    expect(Object.keys(files)).toContain(".uxcue/review.json");
  });
});
