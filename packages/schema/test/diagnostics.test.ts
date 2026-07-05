import { describe, it, expect } from "vitest";
import { safeParseIssue, zDiagnostics } from "../src/index";
import { validIssue } from "./fixtures";

describe("issue diagnostics (console)", () => {
  it("accepts an issue with attached console entries", () => {
    const withConsole = {
      ...validIssue,
      diagnostics: {
        console: [
          {
            level: "error",
            text: "Uncaught TypeError: x is undefined",
            at: "2026-07-04T20:00:00.000Z",
          },
          { level: "warn", text: "deprecated API", at: "2026-07-04T20:00:01.000Z" },
        ],
      },
    };
    expect(safeParseIssue(withConsole).success).toBe(true);
  });

  it("rejects an unknown console level", () => {
    const r = zDiagnostics.safeParse({
      console: [{ level: "trace", text: "x", at: "2026-07-04T20:00:00.000Z" }],
    });
    expect(r.success).toBe(false);
  });

  it("diagnostics is optional", () => {
    expect(safeParseIssue(validIssue).success).toBe(true);
  });
});
