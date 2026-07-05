# UXCue Data Model And Exports

## Schema Policy

All portable data uses a versioned schema.

Current schema:

```json
{
  "schema": "uxlens/1.0"
}
```

Rules:

- Local IDs must remain stable after cloud sync.
- Cloud IDs may exist, but must not replace local issue IDs in exports.
- Every exported issue must have a human-readable markdown representation.
- Binary screenshots are referenced by manifest entries, not embedded in `review.json`.
- Exception — **inline export mode** (#7): an optional single self-contained `review.inline.md` embeds screenshots as base64 `data:image/png` URIs (`![](data:…)`) so the whole review is one paste-able text artifact. The default file-based bundle (zip / `.uxcue/`) is unchanged; `review.json` still never embeds binaries. Note: GitHub sanitizes `data:` image URIs, so inline `.md` is for local/agent use, not GitHub issue bodies (see docs/09 / issue #9).
- Breaking schema changes require a new schema version and importer.

## Core Entities

### Project

```ts
type UXCueProject = {
  schema: "uxlens/1.0";
  id: string;
  cloudId?: string;
  name: string;
  baseUrl?: string;
  defaultRepo?: GitHubRepoRef;
  storageMode: "local" | "cloud" | "hybrid";
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};
```

### Review Session

```ts
type UXCueSession = {
  schema: "uxlens/1.0";
  id: string;
  cloudId?: string;
  projectId: string;
  name: string;
  status: "active" | "exported" | "archived";
  baseUrl?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  exportedAt?: string;
};
```

### Issue

```ts
type UXCueIssue = {
  schema: "uxlens/1.0";
  id: string;              // stable local UUID
  displayId: string;       // UX-001
  cloudId?: string;
  projectId: string;
  sessionId: string;

  title: string;
  feedback: string;
  expected?: string;
  suggestedFix?: string;

  type:
    | "visual-defect"
    | "ux-issue"
    | "a11y"
    | "copy"
    | "responsive"
    | "performance"
    | "enhancement"
    | "bug";

  severity: "blocker" | "major" | "minor" | "polish";
  status:
    | "open"
    | "reviewing"
    | "ready-for-agent"
    | "exported"
    | "synced"
    | "fixed"
    | "ignored";

  // Role-based, never vendor-based (D014). Optional free-text agentLabel
  // lets users type "codex", "claude-code", "cursor", etc. for their own
  // reference — it never appears in schema enums, export logic, or UI defaults.
  assigneeHint:
    | "code-agent"
    | "design-agent"
    | "human"
    | "unassigned";
  agentLabel?: string;

  page: PageContext;
  target?: ElementContext;
  capture: CaptureContext;
  screenshots: ScreenshotRefs;
  github?: GitHubIssueLink;
  sync?: SyncState;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};
```

### Page Context

```ts
type PageContext = {
  url: string;
  origin: string;
  pathname: string;
  routePattern?: string;
  title?: string;
  capturedAt: string;
};
```

### Element Context

```ts
type ElementContext = {
  selector: string;
  selectorStatus: "unique" | "multiple" | "not-found" | "unverified";
  domPath: string;
  xpath?: string;
  tagName: string;
  id?: string;
  classList: string[];
  dataAttributes: Record<string, string>;
  aria?: {
    role?: string;
    name?: string;
    label?: string;
  };
  textSnippet?: string;
  outerHtmlSkeleton: string;
  bbox: {
    viewport: Rect;
    page: Rect;
  };
  component?: {
    framework: "react" | "angular" | "vue" | "svelte" | "unknown";
    name?: string;
    ownerChain?: string[];
    source?: {
      file?: string;
      line?: number;
      column?: number;
    };
  };
  styles: StyleContext;
};
```

### Capture Context

```ts
type CaptureContext = {
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    colorScheme?: "light" | "dark" | "unknown";
  };
  scroll: {
    x: number;
    y: number;
  };
  browser: {
    userAgent: string;
    language?: string;
  };
};
```

### Style Context

```ts
type StyleContext = {
  computed: Record<string, string>;
  parentLayout?: {
    selector?: string;
    display?: string;
    gap?: string;
    alignItems?: string;
    justifyContent?: string;
    gridTemplateColumns?: string;
    flexDirection?: string;
  };
  designTokens?: Record<string, string>;
  contrast?: {
    foreground: string;
    background: string;
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  };
};
```

MVP computed style subset:

- `display`
- `position`
- `top`, `right`, `bottom`, `left`
- `z-index`
- `box-sizing`
- `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`
- `margin`, `padding`
- `border`, `border-radius`
- `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`
- `color`, `background-color`
- `opacity`
- `box-shadow`
- `transform`
- `transition`
- `overflow`, `white-space`, `text-overflow`
- flex/grid properties when present

### Screenshot Refs

```ts
type ScreenshotRefs = {
  element?: ScreenshotRef;
  viewport?: ScreenshotRef;
};

type ScreenshotRef = {
  id: string;
  localBlobKey?: string;
  cloudKey?: string;
  filename: string;
  contentType: "image/png" | "image/jpeg";
  width: number;
  height: number;
  sizeBytes?: number;
  sha256?: string;
};
```

### GitHub Link

```ts
type GitHubIssueLink = {
  provider: "github";
  owner: string;
  repo: string;
  issueNumber: number;
  url: string;
  state?: "open" | "closed";
  createdAt: string;
  syncedAt?: string;
};
```

### Sync State

```ts
type SyncState = {
  cloudStatus: "local-only" | "pending-upload" | "synced" | "conflict" | "error";
  cloudRevision?: number;
  lastSyncedAt?: string;
  error?: {
    code: string;
    message: string;
  };
};
```

## Markdown Export Bundle

Bundle structure:

```txt
uxcue-review/
  review.md
  review.json
  issues/
    UX-001.md
    UX-002.md
  screenshots/
    UX-001-element.png
    UX-001-viewport.png
    UX-002-element.png
    UX-002-viewport.png
```

### Repo Drop-In Layout (`.uxcue/`)

The export flow also offers a "drop into repo" layout so an AI coding agent finds the review where it already looks (D014). Same files, fixed folder name at the repo root:

```txt
.uxcue/
  review.json
  review.md
  screenshots/
    UX-001-element.png
    UX-001-viewport.png
```

Alongside it, generate a short pointer snippet the user can paste into **either** `AGENTS.md` **or** `CLAUDE.md` (both supported, neither required):

```md
UI review issues live in `.uxcue/`; each issue has a stable `UX-nnn` ID.
Mark fixes by referencing the ID in commits/PRs. Prefer existing design
tokens; verify each fix against the captured viewport.
```

Note: `.uxcue/` is the drop-in convention name (per docs/21 §1.4) and is independent of the `uxlens/1.0` schema string.

## `review.md` Format

```md
# UI/UX Review: {sessionName}

Generated by UXCue {version}
Date: {date}
Project: {projectName}
Base URL: {baseUrl}
Items: {issueCount}

## Summary

| ID | Page | Type | Severity | Status | Assignee | Title |
| --- | --- | --- | --- | --- | --- | --- |
| UX-001 | /settings/billing | visual-defect | major | open | code-agent | Billing button wraps awkwardly |

## Agent Instructions

Use the issue IDs in commits, PRs, and comments. Prefer existing design tokens and component patterns. Verify each fix against the captured viewport and current responsive behavior.

## Page: /settings/billing

### UX-001: Billing button wraps awkwardly

Status: open
Type: visual-defect
Severity: major
Assignee hint: code-agent

#### Feedback

Button text wraps and looks misaligned next to the secondary action.

#### Expected

Button should remain 40px high and align with the sibling action.

#### Suggested Fix

Check flex alignment and button min-height in billing card actions.

#### Target

- URL: https://app.example.com/settings/billing
- Selector: `[data-testid="upgrade-plan-button"]`
- Selector status: unique
- DOM path: `html > body > div#root > main > section > button`
- Component: `UpgradePlanButton`
- BBox: 182x40 at 928,344
- Viewport: 1440x900 @2x, light

#### Relevant Styles

| Property | Value |
| --- | --- |
| display | inline-flex |
| align-items | center |
| padding | 8px 12px |
| font-size | 14px |
| line-height | 20px |
| min-height | 40px |

#### Screenshots

- Element: `screenshots/UX-001-element.png`
- Viewport: `screenshots/UX-001-viewport.png`
```

## Per-Issue Markdown

Per-issue files use the same issue block without the global summary.

Filename:

```txt
issues/UX-001.md
```

## GitHub Issue Body

GitHub issue body should be shorter than full export but still agent-ready.

````md
## UI Defect

{feedback}

## Expected

{expected}

## Target

- Page: `{pathname}`
- URL: {url}
- Selector: `{selector}`
- Selector status: `{selectorStatus}`
- Component: `{componentName}`
- Viewport: `{width}x{height} @{dpr}x`

## Evidence

{screenshotLinkOrNote}

## Relevant Styles

```text
display: inline-flex
padding: 8px 12px
font-size: 14px
line-height: 20px
```

## Suggested Fix

{suggestedFix}

## Agent Instructions

Fix this UI/UX issue using existing design-system patterns and tokens. Preserve behavior unless the issue explicitly asks for a UX change. Add or update tests where the project already has coverage for this component or page.

---
Created from UXCue issue `{displayId}`.
````

## Label Mapping

Default GitHub labels:

| UXCue field | GitHub label |
| --- | --- |
| any UXCue issue | `uxcue` |
| `visual-defect` | `ui-defect` |
| `ux-issue` | `ux` |
| `a11y` | `accessibility` |
| `copy` | `copy` |
| `responsive` | `responsive` |
| `performance` | `performance` |
| `enhancement` | `enhancement` |
| `blocker` | `severity:blocker` |
| `major` | `severity:major` |
| `minor` | `severity:minor` |
| `polish` | `severity:polish` |

If labels do not exist or permission is insufficient, issue creation should still proceed and UXCue should record a warning.

## Issue ID Policy

- Display IDs are session-scoped and human-friendly: `UX-001`, `UX-002`.
- Internal IDs are UUIDs.
- Deleting an issue does not renumber existing issues.
- Imported sessions preserve display IDs unless there is a collision; collisions get a suffix and a warning.

## Export Validation

Before export:

- Re-query current page for selector if page is available.
- Mark selector as `not-found`, `multiple`, or `unverified` when it cannot be confirmed.
- Ensure every screenshot ref points to an existing local blob or cloud key.
- Warn when screenshot assets are missing.
- Validate JSON against schema before writing bundle.
