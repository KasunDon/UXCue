import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Project, Session, Issue } from "@uxcue/schema";

/**
 * Local IndexedDB schema. Issues and screenshot blobs live here; lightweight
 * prefs live in chrome.storage.local (via the platform adapter). A per-session
 * counter store guarantees stable UX-nnn display ids that never renumber (D006).
 */
export interface UXCueDB extends DBSchema {
  projects: { key: string; value: Project };
  sessions: { key: string; value: Session; indexes: { byProject: string } };
  issues: { key: string; value: Issue; indexes: { bySession: string } };
  screenshots: { key: string; value: { id: string; blob: Blob } };
  counters: { key: string; value: { sessionId: string; last: number } };
}

export type UXCueDatabase = IDBPDatabase<UXCueDB>;

export const DB_NAME = "uxcue";
export const DB_VERSION = 1;

export function openUXCueDB(name = DB_NAME): Promise<UXCueDatabase> {
  return openDB<UXCueDB>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("projects", { keyPath: "id" });
      const sessions = db.createObjectStore("sessions", { keyPath: "id" });
      sessions.createIndex("byProject", "projectId");
      const issues = db.createObjectStore("issues", { keyPath: "id" });
      issues.createIndex("bySession", "sessionId");
      db.createObjectStore("screenshots", { keyPath: "id" });
      db.createObjectStore("counters", { keyPath: "sessionId" });
    },
  });
}
