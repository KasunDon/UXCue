import { beforeEach, describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbRepository } from "../storage/repository";
import { issueInput } from "../storage/test-factories";
import { validateReview, hasWarnings } from "./validate";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("validateReview", () => {
  it("flags missing screenshot blobs and stale selectors", async () => {
    const repo = new IndexedDbRepository();
    const project = await repo.createProject({ name: "P" });
    const session = await repo.createSession({ projectId: project.id, name: "S" });
    const base = { projectId: project.id, sessionId: session.id };

    // issue with a screenshot ref pointing at a blob that was never stored
    const withMissing = await repo.createIssue(
      issueInput({
        ...base,
        screenshots: {
          element: {
            id: "x",
            localBlobKey: "gone",
            filename: "UX-001-element.png",
            contentType: "image/png",
            width: 1,
            height: 1,
          },
        },
      }),
    );
    // issue with a non-unique selector
    await repo.createIssue(
      issueInput({
        ...base,
        target: {
          selector: ".btn",
          selectorStatus: "multiple",
          domPath: "html > body > button",
          tagName: "button",
          classList: ["btn"],
          dataAttributes: {},
          outerHtmlSkeleton: "<button></button>",
          bbox: {
            viewport: { x: 0, y: 0, width: 1, height: 1 },
            page: { x: 0, y: 0, width: 1, height: 1 },
          },
          styles: { computed: {} },
        },
      }),
    );

    const issues = await repo.listIssues(session.id);
    const w = await validateReview(repo, issues);
    expect(hasWarnings(w)).toBe(true);
    expect(w.missingScreenshots).toContainEqual({
      displayId: withMissing.displayId,
      kind: "element",
    });
    expect(w.staleSelectors).toContainEqual({ displayId: "UX-002", status: "multiple" });
  });

  it("is clean when assets exist and selectors are unique", async () => {
    const repo = new IndexedDbRepository();
    const project = await repo.createProject({ name: "P" });
    const session = await repo.createSession({ projectId: project.id, name: "S" });
    await repo.createIssue(issueInput({ projectId: project.id, sessionId: session.id }));
    const w = await validateReview(repo, await repo.listIssues(session.id));
    expect(hasWarnings(w)).toBe(false);
  });
});
