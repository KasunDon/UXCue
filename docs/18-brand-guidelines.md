# Brand Guidelines

Research date: 2026-07-04

Working product name in current planning: UXCue.

Former working title: UXLens.

## Brand Goal

UXCue should feel like a sharp developer instrument with a little electricity in it.

It should not feel like:

- A generic SaaS dashboard.
- A client-agency feedback board.
- A noisy AI product covered in gradients.
- A dense enterprise QA system.

It should feel like:

- Fast.
- Precise.
- Confident.
- Modern.
- Slightly premium.
- Built for people who are already context-switching.

## Research Signals

### Users Scan, They Do Not Carefully Read

NN/g research on web scanning shows users often try to minimize effort and find answers quickly. Their recommendations include strong headings, bolding important phrases, bullets, grouping related content, and removing unnecessary content.

Brand implication:

- Make important labels and actions visually loud enough.
- Use short headings and front-load meaning.
- Prefer structured chunks over paragraphs.
- Do not rely on subtle microcopy to explain critical state.

Source:

- https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

### Visual Hierarchy Is The Product

NN/g defines visual hierarchy as guiding the eye to the most important elements through color/contrast, scale, and grouping. They caution that when everything competes, nothing stands out.

Brand implication:

- Use bolder and slightly larger typography for issue titles, IDs, status, and primary actions.
- Use a small number of strong contrast levels.
- Limit large elements to the one or two things that matter in the current view.

Source:

- https://www.nngroup.com/articles/visual-hierarchy-ux-definition/

### Users Ignore Ad-Like Noise

NN/g banner-blindness research says users ignore things that look like ads, are animated in ad-like ways, or sit in ad-like placements.

Brand implication:

- Avoid banner-like promos inside the product.
- Avoid decorative motion near the working area.
- Avoid loud cards that do not directly help capture, triage, export, or fix issues.

Source:

- https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/

### Developer Tools Need Productive Type

IBM Carbon separates productive type from expressive type. Productive type supports task focus in product spaces, while expressive type is better for editorial/marketing moments.

Brand implication:

- In the extension and console, use productive type: compact, clear, bolder than average, and highly scannable.
- On the landing page, use expressive type for the hero and a few product moments.

Source:

- https://carbondesignsystem.com/elements/typography/overview/

### Color Should Be Role-Based

IBM Carbon recommends neutral UI foundations, purposeful action colors, tokenized roles, and sparing use of additional colors. W3C WCAG contrast guidance requires 4.5:1 for normal text and 3:1 for large text.

Brand implication:

- Do not use color as decoration.
- Assign colors to roles: capture, link, warning, error, success, selected, fixed.
- Keep text contrast above WCAG AA, and aim above minimum for developer readability.

Sources:

- https://carbondesignsystem.com/elements/color/overview/
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

## Audience Model

The product is for developers and AI-first frontend builders.

Assume they are:

- Busy.
- Switching between browser, editor, terminal, GitHub, and agent.
- Slightly impatient.
- Scanning, not reading.
- Sensitive to performance and privacy.
- Easily sidetracked by visual noise.
- Will judge trust from polish, speed, permissions, and export quality.

Design consequence:

- Bigger type than a typical cramped extension.
- Bolder issue hierarchy.
- Fewer visible controls at once.
- Fast capture path.
- Low-noise chrome.
- Clear local/cloud/GitHub status.
- One obvious next action per state.

## Brand Personality

### Core Traits

Precise:

- Uses exact IDs, selectors, screenshots, statuses.
- Design avoids ambiguity.

Bold:

- Larger headings.
- Semibold labels.
- High-contrast action states.

Sleek:

- Crisp surfaces.
- Tight spacing rhythm.
- No decorative clutter.

Calm:

- No chaos dashboard.
- No celebratory noise.
- No excessive color.

Developer-native:

- Monospace where meaningful.
- GitHub/export/MCP concepts feel natural.
- UI respects keyboard and repeated use.

### Voice

Use:

- "Capture"
- "Ready for agent"
- "Local only"
- "Synced"
- "Create GitHub issue"
- "Export review"
- "Selector verified"

Avoid:

- "Magic"
- "Revolutionary"
- "AI-powered everything"
- "Boost productivity by 10x"
- "Click here"

## Visual Design Principle

> Wow at the moment of focus, quiet everywhere else.

The wow factor should appear in:

- Capture overlay precision.
- Element highlight.
- Screenshot focus frame.
- Clean issue brief preview.
- Smooth export bundle confirmation.

The wow factor should not appear as:

- Decorative gradients everywhere.
- Animated backgrounds.
- Random glow blobs.
- Overdesigned cards.
- Mascots or playful clutter.

## Theme Direction

### Recommended Default

Default product theme:

- Light working surface.
- Dark command header.
- Electric teal capture accent.
- Cobalt focus/link color.
- Strong neutral typography.

Why:

- Developers often like dark tools, but browser side panels embedded beside arbitrary websites need excellent readability.
- A light working surface supports screenshot review and issue forms.
- A dark header gives product identity and modern developer feel without making every surface heavy.

### Dark Mode

Dark mode should exist later, but not drive MVP.

Dark mode should be:

- Near black, not blue-slate soup.
- Clear layer separation.
- No purple-heavy gradient theme.
- High contrast text.

## Color System

### Brand Palette

```css
:root {
  --cue-ink-950: #0b0f14;
  --cue-ink-900: #101418;
  --cue-ink-800: #17202a;
  --cue-ink-700: #263241;

  --cue-slate-600: #52606d;
  --cue-slate-500: #6b7a8a;
  --cue-slate-300: #b8c4d1;
  --cue-slate-200: #d4dde7;
  --cue-slate-100: #eef3f7;
  --cue-slate-050: #f6f8fb;

  --cue-surface: #ffffff;
  --cue-surface-raised: #ffffff;
  --cue-surface-muted: #eef3f7;

  --cue-teal-500: #00a88f;
  --cue-teal-600: #008a78;
  --cue-teal-700: #007060;

  --cue-blue-500: #2563eb;
  --cue-blue-600: #1d4ed8;

  --cue-amber-500: #d69222;
  --cue-red-500: #cf2e2e;
  --cue-green-500: #23845a;
}
```

### Color Roles

| Role | Token | Use |
| --- | --- | --- |
| Primary action | `--cue-teal-500` | Capture, save issue, sync now |
| Primary hover | `--cue-teal-600` | Button hover |
| Link/focus | `--cue-blue-500` | Text links, focus ring |
| Text primary | `--cue-ink-900` | Main content |
| Text secondary | `--cue-slate-600` | Metadata, descriptions |
| Surface | `--cue-surface` | Panels, issue detail |
| Background | `--cue-slate-050` | App background |
| Border | `--cue-slate-200` | Dividers, input borders |
| Warning | `--cue-amber-500` | Needs review, unsynced, caution |
| Error | `--cue-red-500` | Blocker, failed sync |
| Success | `--cue-green-500` | Fixed, synced |

### Color Rules

- Use teal for primary actions only.
- Use blue for focus and links.
- Use amber only when attention is required.
- Use red only for blockers, errors, or destructive actions.
- Use green only for fixed/synced/success.
- Do not use color alone to convey state.
- Do not use more than 2 accent colors in a single view unless issue severity badges require it.

## Typography

### Recommended Font Stack

Primary UI:

```css
font-family: Inter, "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Metadata/code:

```css
font-family: "IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", Consolas,
  monospace;
```

Rationale:

- Inter is highly legible and modern for product UI.
- IBM Plex Sans fits a technical tool and has strong design-system precedent.
- IBM Plex Mono or JetBrains Mono gives developer-native metadata without making the whole UI look like a terminal.

### Typography Personality

The user specifically wants bolder and slightly bigger type. Accept that direction.

Rules:

- Body text should not go below 14px.
- Prefer 15px body in the cloud console.
- Issue titles should be 15px or 16px semibold.
- Primary buttons should be 14px or 15px semibold.
- Metadata can be 12px only when monospace and secondary.
- Avoid thin weights.
- Avoid letter-spacing below 0.

### Extension Type Scale

Extension panels are narrow, so use a compact but bold scale:

| Token | Size | Line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `display-sm` | 20px | 28px | 700 | Empty-state title, export title |
| `title-lg` | 18px | 26px | 700 | Issue detail title |
| `title-md` | 16px | 24px | 650 | Issue card title |
| `body-md` | 14px | 21px | 450 | Forms, body copy |
| `body-sm` | 13px | 19px | 450 | Secondary copy |
| `label-md` | 13px | 18px | 650 | Field labels, filters |
| `meta-sm` | 12px | 17px | 500 | Metadata, badges |
| `mono-sm` | 12px | 17px | 500 | Selectors, paths |

### Cloud Console Type Scale

The console can breathe more:

| Token | Size | Line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `display-lg` | 32px | 40px | 750 | Marketing/hero only |
| `page-title` | 24px | 32px | 720 | Console page title |
| `section-title` | 18px | 26px | 700 | Panels, session headers |
| `item-title` | 16px | 24px | 650 | Issue list title |
| `body-lg` | 16px | 24px | 450 | Console body |
| `body-md` | 15px | 23px | 450 | Tables/forms |
| `label-md` | 13px | 18px | 650 | Controls |
| `meta-sm` | 12px | 17px | 500 | Status, metadata |

### Type Rules

- No negative letter spacing.
- Use semibold for scan anchors: IDs, issue titles, section labels.
- Use bold sparingly for the active item and primary action.
- Do not use all caps for long labels.
- Use monospace only for code-like values.
- Keep line lengths short in side panel.
- Use text truncation only when full value is available on hover/copy.

## Layout And Density

### Extension

Panel width target:

- 360px default.
- Must work from 320px to 420px.

Density:

- More spacious than a typical extension.
- Less spacious than a marketing UI.
- Issue cards should feel clickable and readable.

Spacing:

- 4px micro gaps.
- 8px control gaps.
- 12px card padding.
- 16px section padding.
- 24px major section breaks.

Cards:

- Use cards for individual issues only.
- Do not nest cards.
- Avoid decorative page-section cards.

Buttons:

- Primary button min height: 36px extension, 40px console.
- Icon-only buttons: 32px extension, 36px console.
- Primary labels semibold.

### Console

The console should be clean and operational:

- Left project/session rail.
- Main issue table/list.
- Right detail panel or detail route.
- Strong top-level status.
- No huge marketing hero inside the app.

## Product Surfaces

### Capture Overlay

This is the signature moment.

Design:

- Thin electric teal outline around selected element.
- Soft but restrained glow.
- Dark compact label with white text.
- Metadata in mono: `button#save 182 x 40`.
- Capture pill with Escape hint.

Rules:

- Overlay must be precise, not playful.
- No bouncing animation.
- No large instructional banner.
- Keep website content visible.

### Issue Cards

Issue cards are the working memory.

Must show:

- ID.
- Title.
- Severity.
- Type.
- Status.
- Sync/GitHub state.

Visual hierarchy:

- ID and title are strongest.
- Severity is color-coded plus text.
- Metadata is quiet.

### Issue Detail

This is where trust is earned.

Must show:

- Screenshot first.
- Feedback and expected behavior.
- Target selector.
- Agent-ready markdown preview.
- Status/actions.

Do not bury:

- Screenshot.
- Selector.
- Export/copy.
- GitHub link.

### Export Preview

This should feel satisfying.

Show:

- Number of issues.
- Pages covered.
- Files included.
- Agent-readiness checklist.

Micro-wow:

- A compact preview of the generated markdown.
- A clear "Ready for agent" status.

## Motion

Motion should support focus, not decoration.

Allowed:

- 120ms hover transitions.
- 160ms panel/detail transitions.
- Capture outline fade-in.
- Export success check.

Avoid:

- Infinite animations.
- Animated backgrounds.
- Pulsing badges except while actively capturing.
- Confetti.

## Logo Direction

Name:

- UXCue.

Logo concepts:

- Cursor/crosshair plus cue mark.
- Bracketed highlight around a small rectangle.
- Speech cue plus selection outline.
- Minimal `UX` wordmark with a small capture corner.

Logo style:

- Bold wordmark.
- Slightly squared letterforms.
- No mascot.
- No complex icon.
- Should work at 16px extension icon size.

Icon direction:

- Dark rounded square.
- Electric teal focus bracket.
- Small white/teal cue dot.

## Marketing Visual Direction

Landing page:

- First viewport should show the product, not abstract AI art.
- Use a real product screenshot or high-fidelity mock of capture overlay.
- H1 can be bigger and more expressive.
- Keep supporting text short.

Hero concept:

```txt
Capture UX cues your coding agent can fix.
```

Support:

```txt
Click broken UI, add quick feedback, and export an issue with screenshots,
selectors, styles, viewport, and agent-ready markdown.
```

## Do And Do Not

Do:

- Use larger, bolder type.
- Keep strong hierarchy.
- Make issue IDs prominent.
- Use color for state and action.
- Use screenshots as the visual anchor.
- Make local/cloud/GitHub state obvious.
- Use concise labels.

Do not:

- Make dense 11px developer UI.
- Use decorative gradients as the main brand.
- Use multiple competing accent colors.
- Hide important actions in menus.
- Put cards inside cards.
- Use thin fonts.
- Rely on tiny gray text.
- Make the interface look like a generic SaaS admin.

## Brand QA Checklist

Before approving a screen, ask:

1. Can a distracted developer understand the main state in 3 seconds?
2. Is the primary action obvious?
3. Is the type large and bold enough?
4. Is the screenshot or selected element visually anchored?
5. Are colors tied to roles?
6. Does the screen avoid decorative noise?
7. Does it feel trustworthy with private UI screenshots?
8. Would the design still work in a narrow side panel?
9. Can issue ID, severity, status, and sync state be scanned quickly?
10. Does it feel a little premium without slowing the workflow?

## Recommended Update To Existing UX Docs

The planning pack has now been renamed from UXLens to UXCue (2026-07-04). Applied conventions:

- Brand references use UXCue; "UXLens" survives only as former-working-title history.
- Issue IDs stay `UX-001` (schema string stays `uxlens/1.0`, D014).
- Replace older teal-only palette with the token system above.
- Use 14px minimum extension body text.
- Use 15px or 16px semibold issue titles.
- Use dark command header plus light working surface as default.

## Open Brand Questions

- Should UXCue default to light mode or follow system theme?
- Should `.dev` or `.app` be the app domain if `.com` is marketing?
- Should the brand lean more "design QA" or more "agent-ready issues"?
- Should the Chrome extension icon use `UX` letters or an abstract capture mark?
- Should the cloud console use the same dense side-panel style, or a more spacious desktop app style?
