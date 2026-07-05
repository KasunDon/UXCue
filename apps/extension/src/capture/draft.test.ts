import { beforeEach, describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbRepository } from "../storage/repository";
import {
  createIssueFromDraft,
  screenshotRefsFromDraft,
  type CaptureDraft,
  type ComposerForm,
} from "./draft";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const draft = (): CaptureDraft => ({
  element: {
    selector: '[data-testid="upgrade"]',
    selectorStatus: "unique",
    domPath: "html > body > button",
    tagName: "button",
    classList: ["btn"],
    dataAttributes: { testid: "upgrade" },
    outerHtmlSkeleton: "<button>Upgrade</button>",
    bbox: {
      viewport: { x: 10, y: 20, width: 100, height: 40 },
      page: { x: 10, y: 20, width: 100, height: 40 },
    },
    component: { framework: "unknown" },
    styles: { computed: { display: "inline-flex" } },
  },
  page: {
    url: "http://localhost/billing",
    origin: "http://localhost",
    pathname: "/billing",
    capturedAt: "2026-07-04T20:00:00.000Z",
  },
  capture: {
    viewport: { width: 1440, height: 900, devicePixelRatio: 2, colorScheme: "light" },
    scroll: { x: 0, y: 0 },
    browser: { userAgent: "test" },
  },
  shots: {
    element: { blobKey: "eKey", width: 200, height: 80 },
    viewport: { blobKey: "vKey", width: 2880, height: 1800 },
  },
});

const form: ComposerForm = {
  title: "Button wraps",
  feedback: "wraps badly",
  type: "visual-defect",
  severity: "major",
  status: "open",
  assigneeHint: "code-agent",
};

describe("screenshotRefsFromDraft", () => {
  it("names files by displayId and points at stored blob keys", () => {
    const refs = screenshotRefsFromDraft("UX-007", draft());
    expect(refs.element?.filename).toBe("UX-007-element.png");
    expect(refs.element?.localBlobKey).toBe("eKey");
    expect(refs.viewport?.filename).toBe("UX-007-viewport.png");
  });
});

describe("createIssueFromDraft", () => {
  it("creates a tracked issue with metadata + screenshot refs", async () => {
    const repo = new IndexedDbRepository();
    const project = await repo.createProject({ name: "P" });
    const session = await repo.createSession({ projectId: project.id, name: "S" });
    await repo.putScreenshot("eKey", new Blob([new Uint8Array([1])], { type: "image/png" }));
    await repo.putScreenshot("vKey", new Blob([new Uint8Array([2])], { type: "image/png" }));

    const issue = await createIssueFromDraft(
      repo,
      { projectId: project.id, sessionId: session.id },
      draft(),
      form,
    );

    expect(issue.displayId).toBe("UX-001");
    expect(issue.target?.selector).toBe('[data-testid="upgrade"]');
    expect(issue.screenshots.element?.filename).toBe("UX-001-element.png");

    const stored = await repo.getIssue(issue.id);
    expect(stored?.screenshots.viewport?.localBlobKey).toBe("vKey");
    expect(stored?.feedback).toBe("wraps badly");
  });
});
