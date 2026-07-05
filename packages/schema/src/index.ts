import { z } from "zod";
import {
  zIssue,
  zProject,
  zSession,
  zIssueType,
  zSeverity,
  zIssueStatus,
  zAssigneeHint,
  zStorageMode,
  zSessionStatus,
  zSelectorStatus,
  zFramework,
  zColorScheme,
  zContentType,
  zCloudStatus,
  zPageContext,
  zElementContext,
  zCaptureContext,
  zStyleContext,
  zScreenshotRef,
  zScreenshotRefs,
  zConsoleLevel,
  zConsoleEntry,
  zDiagnostics,
  zGitHubIssueLink,
  zSyncState,
} from "./schema";

export * from "./schema";

// ---------------------------------------------------------------------------
// Inferred types (single source of truth for the whole workspace)
// ---------------------------------------------------------------------------

export type Project = z.infer<typeof zProject>;
export type Session = z.infer<typeof zSession>;
export type Issue = z.infer<typeof zIssue>;

export type IssueType = z.infer<typeof zIssueType>;
export type Severity = z.infer<typeof zSeverity>;
export type IssueStatus = z.infer<typeof zIssueStatus>;
export type AssigneeHint = z.infer<typeof zAssigneeHint>;
export type StorageMode = z.infer<typeof zStorageMode>;
export type SessionStatus = z.infer<typeof zSessionStatus>;
export type SelectorStatus = z.infer<typeof zSelectorStatus>;
export type Framework = z.infer<typeof zFramework>;
export type ColorScheme = z.infer<typeof zColorScheme>;
export type ContentType = z.infer<typeof zContentType>;
export type CloudStatus = z.infer<typeof zCloudStatus>;

export type PageContext = z.infer<typeof zPageContext>;
export type ElementContext = z.infer<typeof zElementContext>;
export type CaptureContext = z.infer<typeof zCaptureContext>;
export type StyleContext = z.infer<typeof zStyleContext>;
export type ScreenshotRef = z.infer<typeof zScreenshotRef>;
export type ScreenshotRefs = z.infer<typeof zScreenshotRefs>;
export type ConsoleLevel = z.infer<typeof zConsoleLevel>;
export type ConsoleEntry = z.infer<typeof zConsoleEntry>;
export type Diagnostics = z.infer<typeof zDiagnostics>;
export type GitHubIssueLink = z.infer<typeof zGitHubIssueLink>;
export type SyncState = z.infer<typeof zSyncState>;

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
