# UXLens Simplified UX/UI Design

## Design Direction

UXLens should feel like a precise review instrument, not a marketing product.

For the deeper brand system, typography scale, color tokens, and "wow without noise" rules, see [18-brand-guidelines.md](18-brand-guidelines.md).

Tone:

- Bold but controlled.
- Fast to scan.
- Clear status at a glance.
- Developer-serious without feeling cold.
- Trustworthy around privacy and sync.

Visual direction:

- Base: near-black command surface and crisp light surfaces, depending on theme.
- Accent: electric teal for capture/action, cobalt for links/focus, amber for attention, red for blocker/error, green for fixed.
- Prefer bold typography, strong contrast, and sharp hierarchy over decorative gradients.
- Use the "wow" in the capture overlay, screenshot focus treatment, and export preview, not in noisy dashboards.
- Use small radius, 6 to 8px.
- Use clear icons for capture, export, sync, GitHub, settings.

## Core Extension Surfaces

### 1. Toolbar Action

Behavior:

- Click opens side panel.
- Badge shows open issue count for active session.
- Optional context menu:
  - Start capture.
  - Open side panel.
  - Export active session.

Badge:

- Gray: no active session.
- Teal: active session with issues.
- Amber: unsynced changes.
- Red: sync/export error.

### 2. Side Panel Layout

Target width: 360px.

```txt
+------------------------------------+
| UXLens          8 open      [gear] |
+------------------------------------+
| Project: KtKAI Console        [v] |
| Session: Billing polish       [v] |
+------------------------------------+
| [Capture] [Page note] [Export]    |
+------------------------------------+
| Search issues...                  |
| [Open] [Major+] [Type]            |
+------------------------------------+
| /settings/billing                 |
| +--------------------------------+ |
| | UX-001  major  visual-defect  | |
| | Billing button wraps awkwardly | |
| | open          synced          | |
| +--------------------------------+ |
| +--------------------------------+ |
| | UX-002  polish  copy          | |
| | Label is vague                | |
| | open       local-only         | |
| +--------------------------------+ |
|                                    |
+------------------------------------+
```

Primary actions:

- Capture.
- Page note.
- Export.

Secondary:

- Sync.
- GitHub create.
- Settings.

### 3. Capture Mode Overlay

Hover label:

```txt
button#upgrade-plan  182 x 40
```

Overlay behavior:

- Highlight hovered element.
- Label stays just above or below element.
- Press Escape to cancel.
- Click selects element and opens composer.
- If hovering near viewport edge, label flips inward.

Do not show a large instructional banner over the app. Use a small floating capture pill only if needed:

```txt
Capture mode  [Esc]
```

### 4. Feedback Composer

Appears as a compact popover near selected element when possible. If space is tight, open in side panel.

```txt
+------------------------------------+
| New issue                    [x]   |
+------------------------------------+
| Title                              |
| [Billing button wraps awkwardly]   |
|                                    |
| Feedback                           |
| [Text area]                        |
|                                    |
| Expected                           |
| [Optional text area]               |
|                                    |
| Type           Severity            |
| [visual-defect v] [major v]        |
|                                    |
| Assignee       Status              |
| [code-agent v] [open v]            |
|                                    |
| [Save issue] [Discard]             |
+------------------------------------+
```

Rules:

- Feedback is required.
- Title can be auto-generated but editable.
- Type and severity use sensible defaults.
- Composer should show "element screenshot captured" once available.

Defaults:

- Type: `visual-defect`.
- Severity: `minor`.
- Assignee: `code-agent` (role-based, never a vendor name — D014; an optional free-text agent label is separate).
- Status: `open`.

### 5. Issue Detail

Side panel detail view:

```txt
+------------------------------------+
| [<] UX-001             [Copy] [...]|
+------------------------------------+
| Billing button wraps awkwardly     |
| major - visual-defect - open       |
| synced - GitHub not linked         |
+------------------------------------+
| [element screenshot preview]       |
| [viewport screenshot preview]      |
+------------------------------------+
| Feedback                           |
| Button text wraps and misaligns... |
|                                    |
| Expected                           |
| Button should remain 40px high...  |
+------------------------------------+
| Target                             |
| /settings/billing                  |
| [data-testid="upgrade-plan-button"]|
| unique selector                    |
+------------------------------------+
| [Ready for agent] [GitHub issue]   |
+------------------------------------+
```

Tabs/sections:

- Brief.
- Screenshots.
- Target.
- Styles.
- Activity.

### 6. Export Modal

```txt
+------------------------------------+
| Export review                      |
+------------------------------------+
| Billing polish                     |
| 12 issues across 4 pages           |
|                                    |
| [x] review.md                      |
| [x] review.json                    |
| [x] issue markdown files           |
| [x] screenshots                    |
|                                    |
| [Copy markdown] [Download zip]     |
+------------------------------------+
```

### 7. Settings

Sections:

- Account.
- Storage.
- Integrations.
- Permissions.
- Data.

```txt
Account
  Local only
  Sign in with Google

Storage
  Local issues: 18
  Cloud sync: off

Integrations
  GitHub: not connected
  Default repo: none

Data
  Export all local data
  Clear local data
```

## Cloud Console

The cloud console is a focused review workspace.

### Console Navigation

```txt
+-------------------------------------------------------------+
| UXLens       Projects   Reviews   Issues   Settings   User |
+---------------+---------------------------------------------+
| Projects      | Billing polish                              |
| KtKAI Console | 12 open - 3 major - last synced 2 min ago    |
| kdon.dev      |                                             |
| PipBop        | [Create issue] [Export] [Sync GitHub]        |
|               |                                             |
|               | Issue table                                 |
|               | UX-001 Billing button wraps awkwardly        |
|               | UX-002 Mobile nav overlaps title             |
+---------------+---------------------------------------------+
```

### Console Screens

#### Projects

- List projects.
- Create project.
- Open project.
- Show local/cloud/sync status.
- Default GitHub repo.

#### Sessions

- List review sessions.
- Create session.
- Archive session.
- Export session.

#### Issues

- Table view:
  - ID.
  - Title.
  - Page.
  - Type.
  - Severity.
  - Status.
  - GitHub.
  - Updated.
- Filters:
  - status.
  - severity.
  - type.
  - page.
  - GitHub linked/unlinked.
- Bulk actions:
  - export selected.
  - create GitHub issues later, not MVP if risky.

#### Issue Detail

Two-column layout:

```txt
+-------------------------------------------------------------+
| UX-001 Billing button wraps awkwardly       [GitHub issue] |
+-------------------------------+-----------------------------+
| Screenshot viewer             | Brief                       |
|                               | Feedback                    |
| [element/viewport toggle]     | Expected                    |
|                               | Suggested fix               |
|                               |                             |
|                               | Metadata                    |
|                               | Selector                    |
|                               | Styles                      |
+-------------------------------+-----------------------------+
```

### Console Settings

- Account profile.
- Cloud storage usage.
- Connected GitHub account.
- Default labels.
- Data export.
- Delete account.

## UI Components

Required components:

- Icon button with tooltip.
- Segmented control.
- Select/menu.
- Text area with character count.
- Severity pill.
- Status pill.
- Screenshot viewer.
- Metadata disclosure.
- Empty state.
- Toast.
- Confirmation dialog.
- Sync status indicator.

## Status Semantics

Issue status:

- `open`: captured but not triaged.
- `reviewing`: reviewer is refining.
- `ready-for-agent`: ready to hand off.
- `exported`: included in an export.
- `synced`: synced to cloud.
- `fixed`: fixed or accepted as resolved.
- `ignored`: intentionally not fixing.

Sync status:

- `local-only`: stored only in extension.
- `pending-upload`: queued for cloud.
- `synced`: cloud is up to date.
- `conflict`: local and cloud changed.
- `error`: sync failed.

GitHub status:

- `not-linked`.
- `ready-to-create`.
- `created`.
- `open`.
- `closed`.
- `sync-error`.

## Empty States

Project empty:

```txt
No project selected
Create a project to collect UI review issues.
[Create project]
```

Session empty:

```txt
No active review
Start a review session for this app.
[New session]
```

Issue empty:

```txt
No issues captured
Use Capture to point at a UI defect.
[Capture]
```

Cloud signed out:

```txt
Local mode
Issues stay on this browser until you export or sign in.
[Sign in with Google]
```

## Visual Tokens

Initial product tokens. The fuller brand system is defined in [18-brand-guidelines.md](18-brand-guidelines.md).

```css
:root {
  --ux-bg: #f6f8fb;
  --ux-surface: #ffffff;
  --ux-surface-muted: #eef3f7;
  --ux-text: #101418;
  --ux-text-muted: #52606d;
  --ux-border: #d4dde7;
  --ux-primary: #00a88f;
  --ux-primary-strong: #007f70;
  --ux-link: #2563eb;
  --ux-attention: #b7791f;
  --ux-danger: #cf2e2e;
  --ux-success: #23845a;
  --ux-focus: #2563eb;
  --ux-dark-bg: #0b0f14;
  --ux-dark-surface: #121821;
  --ux-dark-border: #283342;
  --ux-radius: 8px;
}
```

Typography:

- UI font: Inter, IBM Plex Sans, or system sans-serif.
- Mono font: IBM Plex Mono, JetBrains Mono, SFMono-Regular, Consolas, monospace.
- Extension body: 14px minimum; 15px preferred where space allows.
- Issue title: 15px or 16px, semibold.
- Section labels: 12px semibold, normal case or compact uppercase only when useful.
- Metadata: 12px monospace where helpful.

## Accessibility Requirements

- Full keyboard path for side panel.
- Escape cancels capture/composer.
- Focus trap only inside modal dialogs.
- Tooltip text available to screen readers through labels.
- Contrast AA for all text.
- No color-only status indicators.
- Screenshot previews have issue ID alt text.

## UX Risks

- Too many fields in composer can slow capture. Keep required fields minimal.
- Metadata can overwhelm. Keep it collapsed by default.
- Sync state can feel scary. Use simple local/cloud language.
- GitHub can distract from core capture. Keep it in issue detail/settings, not first-run.
