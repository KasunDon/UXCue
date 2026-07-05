import { describe, it, expect } from "vitest";
import { safeParseProject, safeParseSession } from "../src/index";

const now = "2026-07-04T20:00:00.000Z";

describe("project schema", () => {
  const valid = {
    schema: "uxlens/1.0",
    id: "proj-1",
    name: "KtKAI Console",
    storageMode: "local",
    createdAt: now,
    updatedAt: now,
  };

  it("accepts a valid local-only project", () => {
    expect(safeParseProject(valid).success).toBe(true);
  });

  it("rejects an unknown storage mode", () => {
    expect(safeParseProject({ ...valid, storageMode: "peer" }).success).toBe(false);
  });
});

describe("session schema", () => {
  const valid = {
    schema: "uxlens/1.0",
    id: "sess-1",
    projectId: "proj-1",
    name: "Billing polish",
    status: "active",
    itemCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  it("accepts a valid active session", () => {
    expect(safeParseSession(valid).success).toBe(true);
  });

  it("requires an integer itemCount", () => {
    expect(safeParseSession({ ...valid, itemCount: 1.5 }).success).toBe(false);
  });
});
