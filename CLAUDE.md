# UXCue

Local-first Chrome extension (MV3) that captures UI/UX defects as portable,
agent-ready issues. Planning docs in ./docs are the source of truth;
docs/21-build-handover.md sequences the work; docs/14-decision-log.md is
the tiebreaker — never contradict a decision, add to Open Decisions instead.

## Current scope (D016)

Building the **local-first MVP only**: capture → track → export, fully offline.
Cloud (Phase 5), GitHub (Phase 6), and public launch + Web Store (Phase 7) are
**deferred** — do not build `UXL-GH-*`, `UXL-INFRA/CLOUD/SYNC/CONSOLE/AUTH-*`,
`LP7-*`, or `WS7-*`. Chrome Web Store publish is tracked in GitHub issue #1.

## Read before any task

docs/21-build-handover.md, docs/11-refined-prd.md,
docs/04-data-model-and-exports.md, docs/14-decision-log.md,
docs/19-research-round-2.md, and the assigned story in docs/03.

## Non-negotiables (defects if violated)

- Local-first: capture/track/export works offline, no account.
- Manifest permissions: activeTab, commands, sidePanel, storage, downloads.
  Never <all_urls> or default host_permissions (D013).
- ONE captureVisibleTab call per issue; crop locally (2/sec hard quota) (D011).
- Overlay in closed shadow DOM; never persistently mutate reviewed pages.
- Schema uxlens/1.0; stable UX-nnn IDs; no renumbering (D006).
- Agent-agnostic output: no vendor names in code, schema, or exports;
  assigneeHint is role-based (code-agent | design-agent | human) (D014).
- No chrome.* calls outside the platform adapter layer (D015).
- No secrets in repo.

## Stack & commands

TypeScript, Vite+CRXJS, React, zod, idb, fflate, pnpm workspaces,
Playwright + Vitest.
pnpm install | build | typecheck | test | e2e | lint | format | package:extension

## Working agreement

One story per branch (branch = story ID). Story acceptance criteria =
definition of done; prove them with tests. `needs-spike` stories produce
SPIKE.md before implementation. Blocked on a product decision → append to
docs/14 Open Decisions and stop.
