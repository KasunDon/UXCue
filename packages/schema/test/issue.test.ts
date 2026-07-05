import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  parseIssue,
  safeParseIssue,
  isIssue,
  zAssigneeHint,
  zIssue,
} from "../src/index";
import { validIssue } from "./fixtures";

describe("uxlens/1.0 issue schema", () => {
  it("accepts a fully-populated valid issue", () => {
    expect(() => parseIssue(validIssue)).not.toThrow();
    expect(isIssue(validIssue)).toBe(true);
  });

  it("accepts a minimal issue without optional element/screenshot data", () => {
    const minimal = {
      ...validIssue,
      target: undefined,
      expected: undefined,
      suggestedFix: undefined,
      agentLabel: undefined,
      github: undefined,
      sync: undefined,
      screenshots: {},
    };
    expect(safeParseIssue(minimal).success).toBe(true);
  });

  it("pins the schema version string to uxlens/1.0 (D014)", () => {
    expect(SCHEMA_VERSION).toBe("uxlens/1.0");
    const wrong = { ...validIssue, schema: "uxcue/1.0" };
    expect(safeParseIssue(wrong).success).toBe(false);
  });

  it("requires non-empty feedback", () => {
    const noFeedback = { ...validIssue, feedback: "" };
    expect(safeParseIssue(noFeedback).success).toBe(false);
  });

  it("rejects a missing required field (title)", () => {
    const { title: _title, ...noTitle } = validIssue;
    expect(safeParseIssue(noTitle).success).toBe(false);
  });

  it("enforces UX-nnn display ids", () => {
    expect(safeParseIssue({ ...validIssue, displayId: "CUE-001" }).success).toBe(false);
    expect(safeParseIssue({ ...validIssue, displayId: "UX-042" }).success).toBe(true);
  });
});

describe("assigneeHint is role-based, never vendor-based (D014)", () => {
  it.each(["code-agent", "design-agent", "human", "unassigned"])("accepts %s", (role) => {
    expect(zAssigneeHint.safeParse(role).success).toBe(true);
  });

  it.each(["codex", "claude-code", "claude-design", "cursor", "copilot"])(
    "rejects vendor value %s",
    (vendor) => {
      expect(zAssigneeHint.safeParse(vendor).success).toBe(false);
      expect(safeParseIssue({ ...validIssue, assigneeHint: vendor }).success).toBe(false);
    },
  );

  it("keeps vendor names only in the optional free-text agentLabel", () => {
    const labelled = { ...validIssue, assigneeHint: "code-agent", agentLabel: "codex" };
    expect(safeParseIssue(labelled).success).toBe(true);
  });
});

describe("enum guards", () => {
  it("rejects an unknown severity", () => {
    expect(safeParseIssue({ ...validIssue, severity: "critical" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(safeParseIssue({ ...validIssue, status: "done" }).success).toBe(false);
  });

  it("strips no known-good enums (all issue-type values accepted)", () => {
    const types = zIssue.shape.type.options;
    for (const type of types) {
      expect(safeParseIssue({ ...validIssue, type }).success).toBe(true);
    }
  });
});
