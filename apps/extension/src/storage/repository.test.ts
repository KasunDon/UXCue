import { beforeEach, describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbRepository } from "./repository";
import { issueInput } from "./test-factories";

// Fresh in-memory IndexedDB per test.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function seed() {
  const repo = new IndexedDbRepository();
  const project = await repo.createProject({ name: "KtKAI" });
  const session = await repo.createSession({ projectId: project.id, name: "Billing polish" });
  return { repo, project, session };
}

describe("projects & sessions", () => {
  it("creates and lists projects and sessions", async () => {
    const { repo, project, session } = await seed();
    expect(project.schema).toBe("uxlens/1.0");
    expect(await repo.listProjects()).toHaveLength(1);
    expect(await repo.listSessions(project.id)).toEqual([session]);
  });
});

describe("issue display ids (D006)", () => {
  it("allocates UX-001.. in order and never renumbers on delete", async () => {
    const { repo, project, session } = await seed();
    const base = { projectId: project.id, sessionId: session.id };

    const a = await repo.createIssue(issueInput(base));
    const b = await repo.createIssue(issueInput(base));
    const c = await repo.createIssue(issueInput(base));
    expect([a.displayId, b.displayId, c.displayId]).toEqual(["UX-001", "UX-002", "UX-003"]);

    await repo.deleteIssue(b.id);
    const list = await repo.listIssues(session.id);
    expect(list.map((i) => i.displayId)).toEqual(["UX-001", "UX-003"]);

    // next allocation continues past the highest-ever, no reuse of UX-002
    const d = await repo.createIssue(issueInput(base));
    expect(d.displayId).toBe("UX-004");

    const session2 = await repo.getSession(session.id);
    expect(session2?.itemCount).toBe(3); // 4 created - 1 deleted
  });

  it("scopes counters per session", async () => {
    const { repo, project } = await seed();
    const s1 = await repo.createSession({ projectId: project.id, name: "S1" });
    const s2 = await repo.createSession({ projectId: project.id, name: "S2" });
    const i1 = await repo.createIssue(issueInput({ projectId: project.id, sessionId: s1.id }));
    const i2 = await repo.createIssue(issueInput({ projectId: project.id, sessionId: s2.id }));
    expect(i1.displayId).toBe("UX-001");
    expect(i2.displayId).toBe("UX-001");
  });
});

describe("issue edit & screenshots", () => {
  it("updates editable fields and persists updatedAt", async () => {
    const { repo, project, session } = await seed();
    const issue = await repo.createIssue(
      issueInput({ projectId: project.id, sessionId: session.id }),
    );
    const updated = await repo.updateIssue(issue.id, {
      status: "ready-for-agent",
      severity: "blocker",
    });
    expect(updated.status).toBe("ready-for-agent");
    expect(updated.severity).toBe("blocker");
    expect((await repo.getIssue(issue.id))?.status).toBe("ready-for-agent");
  });

  it("stores and reads screenshot blobs", async () => {
    const { repo } = await seed();
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    await repo.putScreenshot("shot-1", blob);
    const back = await repo.getScreenshot("shot-1");
    expect(back).toBeInstanceOf(Blob);
    expect(await back!.arrayBuffer()).toEqual(await blob.arrayBuffer());
  });

  it("throws when updating a missing issue", async () => {
    const { repo } = await seed();
    await expect(repo.updateIssue("nope", { title: "x" })).rejects.toThrow();
  });
});
