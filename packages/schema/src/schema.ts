import { z } from "zod";

/**
 * Portable schema version. Deliberately kept as "uxlens/1.0" (historical
 * version identifier) independent of the UXLens -> UXCue product rename (D014).
 */
export const SCHEMA_VERSION = "uxlens/1.0" as const;
export const zSchemaVersion = z.literal(SCHEMA_VERSION);

/** ISO-8601 timestamp string. */
export const zIsoDate = z.string().min(1);

export const zRect = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const zIssueType = z.enum([
  "visual-defect",
  "ux-issue",
  "a11y",
  "copy",
  "responsive",
  "performance",
  "enhancement",
  "bug",
]);

export const zSeverity = z.enum(["blocker", "major", "minor", "polish"]);

export const zIssueStatus = z.enum([
  "open",
  "reviewing",
  "ready-for-agent",
  "exported",
  "synced",
  "fixed",
  "ignored",
]);

/**
 * Role-based, never vendor-based (D014). Free-text `agentLabel` on the issue
 * lets users note "codex" / "claude-code" / "cursor" for their own reference;
 * it never appears in this enum, export logic, or UI defaults.
 */
export const zAssigneeHint = z.enum(["code-agent", "design-agent", "human", "unassigned"]);

export const zStorageMode = z.enum(["local", "cloud", "hybrid"]);
export const zSessionStatus = z.enum(["active", "exported", "archived"]);
export const zSelectorStatus = z.enum(["unique", "multiple", "not-found", "unverified"]);
export const zFramework = z.enum(["react", "angular", "vue", "svelte", "unknown"]);
export const zColorScheme = z.enum(["light", "dark", "unknown"]);
export const zContentType = z.enum(["image/png", "image/jpeg"]);
export const zCloudStatus = z.enum(["local-only", "pending-upload", "synced", "conflict", "error"]);
export const zGitHubState = z.enum(["open", "closed"]);

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

export const zGitHubRepoRef = z.object({
  owner: z.string(),
  repo: z.string(),
});

export const zGitHubIssueLink = z.object({
  provider: z.literal("github"),
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number().int(),
  url: z.string().url(),
  state: zGitHubState.optional(),
  createdAt: zIsoDate,
  syncedAt: zIsoDate.optional(),
});

export const zSyncState = z.object({
  cloudStatus: zCloudStatus,
  cloudRevision: z.number().int().optional(),
  lastSyncedAt: zIsoDate.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

export const zPageContext = z.object({
  url: z.string(),
  origin: z.string(),
  pathname: z.string(),
  routePattern: z.string().optional(),
  title: z.string().optional(),
  capturedAt: zIsoDate,
});

export const zStyleContext = z.object({
  computed: z.record(z.string(), z.string()),
  parentLayout: z
    .object({
      selector: z.string().optional(),
      display: z.string().optional(),
      gap: z.string().optional(),
      alignItems: z.string().optional(),
      justifyContent: z.string().optional(),
      gridTemplateColumns: z.string().optional(),
      flexDirection: z.string().optional(),
    })
    .optional(),
  designTokens: z.record(z.string(), z.string()).optional(),
  contrast: z
    .object({
      foreground: z.string(),
      background: z.string(),
      ratio: z.number(),
      wcagAA: z.boolean(),
      wcagAAA: z.boolean(),
    })
    .optional(),
});

export const zElementContext = z.object({
  selector: z.string(),
  selectorStatus: zSelectorStatus,
  domPath: z.string(),
  xpath: z.string().optional(),
  tagName: z.string(),
  id: z.string().optional(),
  classList: z.array(z.string()),
  dataAttributes: z.record(z.string(), z.string()),
  aria: z
    .object({
      role: z.string().optional(),
      name: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
  textSnippet: z.string().optional(),
  outerHtmlSkeleton: z.string(),
  bbox: z.object({
    viewport: zRect,
    page: zRect,
  }),
  component: z
    .object({
      framework: zFramework,
      name: z.string().optional(),
      ownerChain: z.array(z.string()).optional(),
      source: z
        .object({
          file: z.string().optional(),
          line: z.number().int().optional(),
          column: z.number().int().optional(),
        })
        .optional(),
    })
    .optional(),
  styles: zStyleContext,
});

export const zCaptureContext = z.object({
  viewport: z.object({
    width: z.number(),
    height: z.number(),
    devicePixelRatio: z.number(),
    colorScheme: zColorScheme.optional(),
  }),
  scroll: z.object({
    x: z.number(),
    y: z.number(),
  }),
  browser: z.object({
    userAgent: z.string(),
    language: z.string().optional(),
  }),
});

export const zScreenshotRef = z.object({
  id: z.string(),
  localBlobKey: z.string().optional(),
  cloudKey: z.string().optional(),
  filename: z.string(),
  contentType: zContentType,
  width: z.number(),
  height: z.number(),
  sizeBytes: z.number().optional(),
  sha256: z.string().optional(),
});

export const zScreenshotRefs = z.object({
  element: zScreenshotRef.optional(),
  viewport: zScreenshotRef.optional(),
});

// ---------------------------------------------------------------------------
// Diagnostics (VS Code parity: attached page console output)
// ---------------------------------------------------------------------------

export const zConsoleLevel = z.enum(["log", "info", "warn", "error", "debug"]);

export const zConsoleEntry = z.object({
  level: zConsoleLevel,
  text: z.string(),
  at: zIsoDate,
});

export const zDiagnostics = z.object({
  console: z.array(zConsoleEntry),
});

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const zProject = z.object({
  schema: zSchemaVersion,
  id: z.string(),
  cloudId: z.string().optional(),
  name: z.string(),
  baseUrl: z.string().optional(),
  defaultRepo: zGitHubRepoRef.optional(),
  storageMode: zStorageMode,
  createdAt: zIsoDate,
  updatedAt: zIsoDate,
  archivedAt: zIsoDate.optional(),
});

export const zSession = z.object({
  schema: zSchemaVersion,
  id: z.string(),
  cloudId: z.string().optional(),
  projectId: z.string(),
  name: z.string(),
  status: zSessionStatus,
  baseUrl: z.string().optional(),
  itemCount: z.number().int(),
  createdAt: zIsoDate,
  updatedAt: zIsoDate,
  exportedAt: zIsoDate.optional(),
});

/** Session-scoped human display id, e.g. UX-001. */
export const zDisplayId = z.string().regex(/^UX-\d{3,}$/, "displayId must look like UX-001");

export const zIssue = z.object({
  schema: zSchemaVersion,
  id: z.string(),
  displayId: zDisplayId,
  cloudId: z.string().optional(),
  projectId: z.string(),
  sessionId: z.string(),

  title: z.string(),
  feedback: z.string().min(1, "feedback is required"),
  expected: z.string().optional(),
  suggestedFix: z.string().optional(),

  type: zIssueType,
  severity: zSeverity,
  status: zIssueStatus,

  assigneeHint: zAssigneeHint,
  agentLabel: z.string().optional(),

  page: zPageContext,
  target: zElementContext.optional(),
  capture: zCaptureContext,
  screenshots: zScreenshotRefs,
  diagnostics: zDiagnostics.optional(),
  github: zGitHubIssueLink.optional(),
  sync: zSyncState.optional(),

  createdAt: zIsoDate,
  updatedAt: zIsoDate,
  archivedAt: zIsoDate.optional(),
});
