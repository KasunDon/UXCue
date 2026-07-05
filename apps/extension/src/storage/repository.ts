import { SCHEMA_VERSION, type Project, type Session, type Issue } from "@uxcue/schema";
import { openUXCueDB, type UXCueDatabase } from "./db";

const now = () => new Date().toISOString();
const uuid = () => globalThis.crypto.randomUUID();
const displayId = (n: number) => `UX-${String(n).padStart(3, "0")}`;

export type CreateProjectInput = {
  name: string;
  baseUrl?: string;
  storageMode?: Project["storageMode"];
};
export type CreateSessionInput = { projectId: string; name: string; baseUrl?: string };

/** Everything needed to create an issue except the fields storage owns. */
export type CreateIssueInput = Omit<
  Issue,
  "id" | "displayId" | "schema" | "createdAt" | "updatedAt"
>;

/** Editable issue fields (metadata/screenshots are set at capture time). */
export type IssuePatch = Partial<
  Pick<
    Issue,
    | "title"
    | "feedback"
    | "expected"
    | "suggestedFix"
    | "type"
    | "severity"
    | "status"
    | "assigneeHint"
    | "agentLabel"
  >
>;

export interface Repository {
  createProject(input: CreateProjectInput): Promise<Project>;
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;

  createSession(input: CreateSessionInput): Promise<Session>;
  listSessions(projectId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;

  createIssue(input: CreateIssueInput): Promise<Issue>;
  listIssues(sessionId: string): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | undefined>;
  updateIssue(id: string, patch: IssuePatch): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;

  putScreenshot(id: string, blob: Blob): Promise<void>;
  getScreenshot(id: string): Promise<Blob | undefined>;
}

/** IndexedDB-backed repository shared by the side panel and service worker. */
export class IndexedDbRepository implements Repository {
  private dbPromise: Promise<UXCueDatabase>;

  constructor(dbName?: string) {
    this.dbPromise = openUXCueDB(dbName);
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const db = await this.dbPromise;
    const ts = now();
    const project: Project = {
      schema: SCHEMA_VERSION,
      id: uuid(),
      name: input.name,
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      storageMode: input.storageMode ?? "local",
      createdAt: ts,
      updatedAt: ts,
    };
    await db.put("projects", project);
    return project;
  }

  async listProjects(): Promise<Project[]> {
    const db = await this.dbPromise;
    return db.getAll("projects");
  }

  getProject(id: string): Promise<Project | undefined> {
    return this.dbPromise.then((db) => db.get("projects", id));
  }

  async createSession(input: CreateSessionInput): Promise<Session> {
    const db = await this.dbPromise;
    const ts = now();
    const session: Session = {
      schema: SCHEMA_VERSION,
      id: uuid(),
      projectId: input.projectId,
      name: input.name,
      status: "active",
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      itemCount: 0,
      createdAt: ts,
      updatedAt: ts,
    };
    await db.put("sessions", session);
    return session;
  }

  async listSessions(projectId: string): Promise<Session[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex("sessions", "byProject", projectId);
  }

  getSession(id: string): Promise<Session | undefined> {
    return this.dbPromise.then((db) => db.get("sessions", id));
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const db = await this.dbPromise;
    const ts = now();

    // Allocate a stable, non-renumbering display id from a per-session counter.
    const tx = db.transaction(["counters", "issues", "sessions"], "readwrite");
    const counters = tx.objectStore("counters");
    const current = await counters.get(input.sessionId);
    const next = (current?.last ?? 0) + 1;
    await counters.put({ sessionId: input.sessionId, last: next });

    const issue: Issue = {
      ...input,
      schema: SCHEMA_VERSION,
      id: uuid(),
      displayId: displayId(next),
      createdAt: ts,
      updatedAt: ts,
    };
    await tx.objectStore("issues").put(issue);

    const session = await tx.objectStore("sessions").get(input.sessionId);
    if (session) {
      await tx.objectStore("sessions").put({
        ...session,
        itemCount: session.itemCount + 1,
        updatedAt: ts,
      });
    }
    await tx.done;
    return issue;
  }

  async listIssues(sessionId: string): Promise<Issue[]> {
    const db = await this.dbPromise;
    const issues = await db.getAllFromIndex("issues", "bySession", sessionId);
    return issues.sort((a, b) =>
      a.displayId.localeCompare(b.displayId, undefined, { numeric: true }),
    );
  }

  getIssue(id: string): Promise<Issue | undefined> {
    return this.dbPromise.then((db) => db.get("issues", id));
  }

  async updateIssue(id: string, patch: IssuePatch): Promise<Issue> {
    const db = await this.dbPromise;
    const existing = await db.get("issues", id);
    if (!existing) throw new Error(`Issue ${id} not found`);
    const updated: Issue = { ...existing, ...patch, updatedAt: now() };
    await db.put("issues", updated);
    return updated;
  }

  async deleteIssue(id: string): Promise<void> {
    const db = await this.dbPromise;
    const issue = await db.get("issues", id);
    if (!issue) return;
    const tx = db.transaction(["issues", "sessions", "screenshots"], "readwrite");
    await tx.objectStore("issues").delete(id);
    // Deleting never renumbers other issues (D006): the counter is untouched.
    for (const ref of [issue.screenshots.element, issue.screenshots.viewport]) {
      if (ref?.localBlobKey) await tx.objectStore("screenshots").delete(ref.localBlobKey);
    }
    const session = await tx.objectStore("sessions").get(issue.sessionId);
    if (session) {
      await tx.objectStore("sessions").put({
        ...session,
        itemCount: Math.max(0, session.itemCount - 1),
        updatedAt: now(),
      });
    }
    await tx.done;
  }

  async putScreenshot(id: string, blob: Blob): Promise<void> {
    const db = await this.dbPromise;
    await db.put("screenshots", { id, blob });
  }

  async getScreenshot(id: string): Promise<Blob | undefined> {
    const db = await this.dbPromise;
    const rec = await db.get("screenshots", id);
    return rec?.blob;
  }
}
