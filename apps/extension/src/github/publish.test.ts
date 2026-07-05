// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { Blob as NodeBlob } from "node:buffer";
import { IndexedDbRepository } from "../storage/repository";
import { issueInput } from "../storage/test-factories";
import { publishIssue } from "./publish";
import type { GitHubClient } from "./client";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("publishIssue", () => {
  it("commits screenshots, creates the issue, and stores the link", async () => {
    const repo = new IndexedDbRepository();
    const project = await repo.createProject({ name: "P" });
    const session = await repo.createSession({ projectId: project.id, name: "S" });
    const issue = await repo.createIssue(
      issueInput({ projectId: project.id, sessionId: session.id }),
    );
    // A real browser IndexedDB returns a Blob with arrayBuffer(); fake-indexeddb
    // under jsdom returns a prototype-less object, so stub the read with a real Blob.
    vi.spyOn(repo, "getScreenshot").mockResolvedValue(
      new NodeBlob([new Uint8Array([1, 2, 3])], { type: "image/png" }) as unknown as Blob,
    );
    await repo.setScreenshots(issue.id, {
      element: {
        id: "k1",
        localBlobKey: "k1",
        filename: `${issue.displayId}-element.png`,
        contentType: "image/png",
        width: 10,
        height: 10,
      },
    });
    const withShot = (await repo.getIssue(issue.id))!;

    const client = {
      putFile: vi
        .fn()
        .mockResolvedValue("https://raw.githubusercontent.com/o/r/main/.uxcue/screenshots/x.png"),
      createIssue: vi.fn().mockResolvedValue({ number: 7, url: "https://github.com/o/r/issues/7" }),
    } as unknown as GitHubClient;

    const created = await publishIssue(client, { owner: "o", repo: "r" }, withShot, repo);

    expect(created).toEqual({ number: 7, url: "https://github.com/o/r/issues/7" });
    expect(client.putFile).toHaveBeenCalledWith(
      { owner: "o", repo: "r" },
      `.uxcue/screenshots/${issue.displayId}-element.png`,
      expect.any(String),
      expect.stringContaining("Add UXCue screenshot"),
    );
    // body embeds the committed raw URL
    const body = (client.createIssue as ReturnType<typeof vi.fn>).mock.calls[0]![1].body as string;
    expect(body).toContain("![element](https://raw.githubusercontent.com/");

    const stored = await repo.getIssue(issue.id);
    expect(stored?.github?.url).toBe("https://github.com/o/r/issues/7");
    expect(stored?.status).toBe("synced");
  });

  it("still creates the issue when screenshot commit fails", async () => {
    const repo = new IndexedDbRepository();
    const project = await repo.createProject({ name: "P" });
    const session = await repo.createSession({ projectId: project.id, name: "S" });
    const issue = await repo.createIssue(
      issueInput({ projectId: project.id, sessionId: session.id }),
    );

    const client = {
      putFile: vi.fn().mockRejectedValue(new Error("no contents perm")),
      createIssue: vi.fn().mockResolvedValue({ number: 8, url: "https://github.com/o/r/issues/8" }),
    } as unknown as GitHubClient;

    const created = await publishIssue(client, { owner: "o", repo: "r" }, issue, repo);
    expect(created.number).toBe(8);
    const body = (client.createIssue as ReturnType<typeof vi.fn>).mock.calls[0]![1].body as string;
    expect(body).toContain("Screenshots are available in the UXCue export bundle.");
  });
});
