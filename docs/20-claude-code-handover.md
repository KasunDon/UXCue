# Claude Code Handover Kit

Date: 2026-07-04
Purpose: move the UXCue planning pack from documentation into implementation with Claude Code (and Claude Design for UI passes), with minimal re-explaining and maximal use of the existing docs as the source of truth.

This flips decision **D009** (docs-only) to build mode. The pack is implementation-ready: every P0 story in `03-agent-stories.md` already has agent prompts and acceptance criteria. What was missing is the glue below — repo layout, a `CLAUDE.md`, a session strategy, and kickoff prompts.

## 1. Repo Layout

Move the planning pack *into* the product repo so Claude Code can read it natively:

```txt
UXCue/
  CLAUDE.md                  <- §2 below
  docs/                      <- the entire planning pack (00..20)
  apps/
    extension/
    console/
    api/
  packages/
    schema/
    markdown/
    ui/
  tests/
    e2e/                     <- Playwright (per D007 revised)
    fixture-app/             <- deterministic defect app from 07-testing doc
  terraform/uxcue/
  .uxcue/                    <- runtime drop zone for review exports (gitignored)
```

Rules:

- Docs are read-only context for agents; product decisions change docs first, code second.
- `docs/14-decision-log.md` is the tiebreaker. If an agent hits an undecided question, it must stop and add an entry to "Open Decisions" rather than invent an answer.

## 2. CLAUDE.md Draft

Copy this to the repo root (trim to taste — shorter is better; link out to docs rather than duplicating them):

```markdown
# UXCue

Local-first Chrome extension (MV3) that captures UI/UX defects as tracked,
agent-ready issues, with optional cloud sync (AWS serverless) and optional
GitHub issue creation. Planning docs in ./docs are the source of truth.

## Read before any task
- docs/11-refined-prd.md      — requirements (R1–R10)
- docs/04-data-model-and-exports.md — schema uxlens/1.0, markdown formats
- docs/14-decision-log.md     — decisions D001–D015; NEVER contradict these
- docs/03-agent-stories.md    — the story you were assigned, verbatim
- docs/19-research-round-2.md — hard platform constraints (quota, permissions)

## Non-negotiable constraints
- Local-first: capture/export must work with no account, no cloud, no GitHub.
- Permissions: activeTab + commands only; optional runtime per-origin grant.
  Never add <all_urls> or host_permissions to the default manifest (D013).
- Screenshots: exactly ONE chrome.tabs.captureVisibleTab call per issue;
  derive the element crop from that bitmap locally (D011, 2/sec hard quota).
- Every issue portable as markdown + JSON, schema "uxlens/1.0", stable
  UX-nnn display IDs, no renumbering on delete (D006).
- No secrets in repo. pip/npm creds, Google OAuth, GitHub tokens: env only.
- Content script overlay lives in a closed shadow DOM; never mutate the
  reviewed page persistently.

## Stack
- Extension: TypeScript, Vite + CRXJS, React side panel, idb, fflate, zod.
- API: TypeScript Lambda, API GW HTTP API, DynamoDB single-table, S3,
  Cognito (Google IdP). All infra via Terraform (docs/05).
- Tests: Playwright for extension e2e (launchPersistentContext +
  --load-extension, unique userDataDir per worker); Vitest for units;
  fixture app in tests/fixture-app per docs/07.

## Commands
- pnpm install / pnpm build / pnpm test / pnpm e2e / pnpm package:extension
  (create these in UXL-ARCH-001 and keep this list current)

## Working agreement
- One story per branch, branch name story ID (e.g. uxl-ext-003).
- Reference story ID + any UX-nnn issue IDs in commits.
- Acceptance criteria in the story are the definition of done; add tests
  that prove them.
- If a story is `needs-spike`, produce a SPIKE.md with findings before code.
- If blocked on a product decision, append to docs/14 Open Decisions and stop.
```

## 3. Session Strategy (What To Run, In What Order)

Claude Code works best with one milestone slice per session and fresh context per epic. Recommended sequence (maps to `02-mvp-breakdown.md` milestones):

**Session 0 — Bootstrap (1 session)**
Stories: UXL-ARCH-001, UXL-ARCH-002.
Prompt seed:

> Read CLAUDE.md, docs/03-agent-stories.md (Epic A), docs/04. Implement UXL-ARCH-001 then UXL-ARCH-002. pnpm workspaces, shared tsconfig, zod schemas matching docs/04 exactly with unit tests for valid/invalid issue payloads.

**Session 1 — M0 spikes (1–2 sessions, throwaway code allowed)**
The three risk spikes from M0, each producing a SPIKE.md:

1. Selector generation quality against tests/fixture-app + 2 real apps (uniqueness ≥80% target).
2. `captureVisibleTab` → OffscreenCanvas crop at DPR 1/1.5/2, single-call rule (D011).
3. React fiber component-name extraction (best effort, graceful degradation).
4. Playwright harness: load unpacked extension, drive side panel as extension page, survive SW suspension.

Gate: review the four SPIKE.md files yourself before Session 2. This is the only manual review gate that really matters — everything downstream depends on these mechanisms.

**Sessions 2–4 — M1/M2 (extension shell, capture flow)**
Epic B stories in order. Each session: implement story → run e2e smoke → commit. Fixture app first so every later story has a test target.

**Session 5 — M3 (issue workflow + exports)**
Markdown/JSON/zip generators are pure functions in `packages/markdown` — perfect Claude Code territory; demand full unit coverage against the exact formats in docs/04.

**Session 6 — Dogfood loop (you + extension + Claude Code together)**
Run the manual dogfood script from docs/07 on kdon.dev or the KtKAI console, export `review.md`, and feed it back to Claude Code against those codebases. This is the H2 validation (≥8/10 fixed without clarification) — and it is the moment UXCue starts building itself: every defect you find in UXCue gets captured *with* UXCue.

**Sessions 7+ — M4/M5 (cloud, GitHub)**
Terraform module-by-module (docs/05 layout). Keep infra sessions separate from extension sessions; different mental models, different blast radius. GitHub alpha per docs/09 (PAT dogfood path first, D012 screenshot strategy).

**Claude Design passes:** after M2 and M5, hand `docs/06-ux-ui-design.md` + `docs/18-brand-guidelines.md` + current screenshots to Claude Design for a polish pass on the side panel and export preview ("wow at the moment of focus"). Capture its output as issues in UXCue itself.

## 4. CAF Mapping (Optional But Natural)

If running through the Claude Agent Framework instead of raw sessions:

- `@po` — owns docs/, turns open decisions into decision-log entries, slices stories.
- `@dev` — one story per git worktree, branch = story ID.
- `@qa` — runs Playwright suite + smoke list from docs/07; later, consumes `.uxcue/review.json` exports so UXCue reviews feed the pipeline directly (the Phase-3 file-drop transport).
- `@ops` — Terraform plan/apply sessions only; never touches app code.

Telemetry: story ID + UX-nnn IDs in the JSONL hooks give you traceability from captured defect → fix commit for free.

## 5. Kickoff Prompt (Paste Into First Claude Code Session)

> This repo contains a complete planning pack in ./docs for UXCue, a local-first Chrome extension that turns UI/UX review into agent-ready tracked issues. Read CLAUDE.md, then docs/README.md, docs/11, docs/14, and docs/19. Confirm your understanding in 10 bullet points (product thesis, hard constraints, stack, what is out of scope for MVP), list anything in the docs that is ambiguous or contradictory, then wait. Do not write code yet.

The "confirm understanding, list contradictions, wait" step is cheap insurance: with ~6,500 lines of docs, surfacing misreads before code is written pays for itself immediately.

## 6. Known Doc Amendments To Apply First

Before Session 0, apply the round-2 findings (docs/19) to the pack so agents never see stale guidance:

1. `14-decision-log.md`: revise D007 (Playwright), add D011–D013, close O001 npm portion, flip D009.
2. `07-testing-release-and-smoke.md`: swap Cypress launch mechanics for Playwright fixture pattern; keep the smoke list and CI gates unchanged.
3. `11-refined-prd.md` R2/R5: add activeTab re-arming note and single-capture rule.
4. `09-agent-integrations-mcp-github.md`: mark GitHub image-upload question resolved (blocked; use signed URLs / repo commit).
5. `17-naming-and-monetization.md`: record npm registrations once done.
