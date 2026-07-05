import { z } from "zod";
import { zIssue, zProject, zSession } from "./schema";

export * from "./schema";

// ---------------------------------------------------------------------------
// Inferred types (single source of truth for the whole workspace)
// ---------------------------------------------------------------------------

export type Project = z.infer<typeof zProject>;
export type Session = z.infer<typeof zSession>;
export type Issue = z.infer<typeof zIssue>;

// ---------------------------------------------------------------------------
// Validators — used at API boundaries and local import/export.
// `parse*` throws ZodError; `safeParse*` returns a result; `is*` narrows.
// ---------------------------------------------------------------------------

export const parseIssue = (value: unknown): Issue => zIssue.parse(value);
export const safeParseIssue = (value: unknown) => zIssue.safeParse(value);
export const isIssue = (value: unknown): value is Issue => zIssue.safeParse(value).success;

export const parseProject = (value: unknown): Project => zProject.parse(value);
export const safeParseProject = (value: unknown) => zProject.safeParse(value);
export const isProject = (value: unknown): value is Project => zProject.safeParse(value).success;

export const parseSession = (value: unknown): Session => zSession.parse(value);
export const safeParseSession = (value: unknown) => zSession.safeParse(value);
export const isSession = (value: unknown): value is Session => zSession.safeParse(value).success;
