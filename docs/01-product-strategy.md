# UXCue Product Strategy

## Positioning

UXCue is a design QA issue tracker for AI coding workflows.

It is not primarily a project management board, generic bug tracker, or SaaS feedback widget. It is a capture-and-handoff tool for people reviewing frontend quality and for AI coding agents that need exact context to fix defects without guessing.

One-line positioning:

> Capture UI defects from the browser, track them as UXCue issues, and export agent-ready work to GitHub, markdown, JSON, or MCP.

## The Problem

UI/UX review observations are visual, but AI coding agents usually receive text. Reviewers manually describe issues like "the button near the top right is misaligned", attach a screenshot, and hope the agent locates the right element. This causes slow review cycles, ambiguous fixes, and repeated clarification.

UXCue closes that gap by capturing:

- Reviewer intent: feedback, type, severity, expected outcome, suggested fix.
- Visual evidence: selected element crop and viewport screenshot with highlight.
- Code-facing context: selector, DOM path, data attributes, ARIA, component hints.
- Design-facing context: computed styles, typography, spacing, colors, viewport.
- Tracking state: issue ID, status, history, export/sync links.

## Target Users

### Primary: AI-first frontend builder

Someone building with any AI coding agent (e.g., Claude Code, Codex, Cursor, Windsurf, Copilot). No single agent is privileged — the output serves them all equally (D014).

Needs:

- Review an app visually.
- Capture defects quickly.
- Create a clean work order for an agent.
- Keep feedback local when working on private/staging apps.
- Push selected issues to GitHub when ready.

### Secondary: product/design reviewer

Someone reviewing UI quality but not necessarily editing code.

Needs:

- Point at an issue instead of describing it manually.
- Track design polish, copy, responsive, a11y, and flow problems.
- Share review sessions with a developer.
- Avoid installing a widget in the target app.

### Secondary: small team/agency

Someone who wants client or internal review without adopting a heavy PM system.

Needs:

- Projects and review sessions.
- Cloud sync.
- Shareable review links later.
- GitHub issue export.

### Machine user: AI coding agent

The agent is a consumer of the artifact, not a UI user.

Needs:

- Stable IDs.
- Reliable selectors and fallback DOM paths.
- Screenshots available locally or through signed URLs.
- Clear actual/expected/suggested-fix sections.
- Minimal noisy logs.
- Status sync back to UXCue after fixes.

## Product Modes

### Mode 1: Local-only

No account required.

- Issues stored in IndexedDB.
- Screenshots stored locally.
- Export markdown/JSON/zip.
- Optional manual GitHub token is allowed, but not required.

This mode is the wedge for privacy, staging apps, localhost, and fast dogfooding.

### Mode 2: UXCue Cloud

Google SSO account.

- Projects, sessions, issues, and screenshot assets sync to cloud.
- Cloud console provides issue review, filtering, exports, settings.
- Enables sharing and cross-device continuity.

This is the path to a real product.

### Mode 3: GitHub integration

Separate optional authorization.

- Create GitHub issues from selected UXCue issues.
- Link existing GitHub issues.
- Store GitHub URL, number, repo, sync state.
- Pull status back from GitHub.

GitHub is an integration, not the source of truth.

### Mode 4: Agent bridge

Optional MCP/local bridge.

- AI coding agents list and retrieve UXCue issues.
- Agents mark issues resolved with PR/commit links.
- Batch work orders can be generated for a session.

This should come after the issue object and exports are stable.

## Differentiation

UXCue competes near Marker.io, BugHerd, and AI browser/code tools. The wedge is not "more comments on screenshots"; the wedge is "visual QA issues made useful to coding agents."

Differentiators:

- Local-first usage with no target-app widget.
- Works on localhost, staging, authenticated apps, and production.
- Works in your real browser (real profile, extensions, sessions) and produces tracked, portable issues that serve any agent — unlike editor-embedded capture (e.g., VS Code's integrated browser "Add to Chat") that welds the captured context to a single vendor's chat surface and discards it when the session ends (see docs/16, docs/23).
- UXCue-owned issue tracker with markdown/JSON portability.
- Agent-ready issue bodies instead of human-only PM tasks.
- Optional GitHub sync instead of GitHub lock-in.
- Metadata built for code fixes and design review.
- Future MCP bridge focused on UXCue data, not generic GitHub operations.

## Product Principles

- The reviewer should capture an issue in under 20 seconds.
- The generated issue should be understandable without the extension.
- Every issue must be portable as markdown and JSON.
- GitHub and MCP must never be required for basic use.
- Permissions must be explainable in one sentence.
- Screenshots and DOM context are sensitive; default to local and explicit sync.
- The first public version should feel like a small, sharp tool, not a half-built PM platform.

## Success Metrics

MVP quality metrics:

- Reviewer can capture 10 issues across 4 pages in under 12 minutes.
- At least 8 of 10 issues can be fixed by an AI coding agent from the issue markdown plus screenshots without follow-up.
- Exported markdown has stable issue IDs and enough context for batch work.
- Side panel remains responsive with at least 100 issues in local storage.
- Cloud sync handles offline capture then eventual upload without duplicate issue IDs.

Public beta metrics:

- Time from capture to GitHub issue creation under 30 seconds.
- 90% of created GitHub issues include screenshot, selector, route, severity, and expected behavior.
- Fewer than 5% of exports fail due to stale or missing assets.
- Chrome Web Store review passes without broad or unexplained permissions.

## Non-Goals For Early Versions

- Replacing Jira, Linear, GitHub Issues, or BugHerd boards.
- Full session replay.
- Full network/request body capture.
- Native desktop app.
- Pixel-perfect visual regression testing.
- Automatic AI defect detection without reviewer input.
- Team billing and roles before capture quality is proven.

## Product Risks

- Browser extension permission prompts may scare users if host permissions are too broad.
- Screenshots are sensitive; cloud sync must be explicit and transparent.
- GitHub screenshot attachment is awkward through API; use UXCue-hosted signed URLs or repo file uploads later.
- React/Angular component detection is best effort and can break across framework versions.
- Chrome extension e2e tests are trickier than normal web app tests; CI must use Chrome for Testing or Chromium.
- AWS free-tier assumptions can drift; budgets and quotas must be part of the first Terraform module.

## Product Bet

The best version of UXCue is not "BugHerd but cheaper." It is a narrow, excellent workbench for turning visual design review into fixable AI work.
