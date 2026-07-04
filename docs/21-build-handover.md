# UXCue — Complete Build Handover

Date: 2026-07-04
Audience: the coding agent implementing this product (Claude Code today; the instructions themselves are agent-agnostic)
Status: authoritative work order. This document supersedes nothing — it *sequences* the planning pack in `./docs` and adds the final decisions needed to build. Where this doc and the pack disagree, this doc wins and the pack must be amended.

---

## 0. Mission

Build **UXCue**: a local-first Chrome (MV3) extension that lets a reviewer click broken UI on any web page, capture rich context automatically (screenshot, selector, DOM path, styles, viewport, component hints), track the result as a portable issue, and export **agent-ready work orders** that ANY AI coding agent can execute — Claude Code, Codex CLI, Cursor, Copilot, Gemini CLI, Windsurf, or a human.

One-line positioning:

> Capture UI defects from the browser, track them as issues, and hand any AI coding agent an unambiguous, fixable work order.

## 1. Prime Directive: Agent-Agnostic By Design (Decision D014)

UXCue is built *with* Claude Code but must never be built *around* it. Every output, integration, and naming choice must work identically for non-Anthropic agents.

Binding rules:

1. **Neutral vocabulary everywhere.** No "Claude" in product code, schema values, export formats, UI copy, or file names. The extension does not know or care which agent consumes its output.
2. **Role-based assignee, not vendor-based.** Amend the schema (docs/04): `assigneeHint: "code-agent" | "design-agent" | "human" | "unassigned"`, plus an optional free-text `agentLabel?: string` where users may type "codex", "claude-code", "cursor", etc. Migrate the markdown templates accordingly.
3. **Exports are the API.** `review.md` + `review.json` (schema `uxlens/1.0`) are the primary integration surface. They must be self-contained: an agent with zero UXCue knowledge, given only the bundle, should locate and fix issues. The "Agent Instructions" section in review.md must read generically ("Use the issue IDs in commits/PRs; prefer existing design tokens; verify against the captured viewport") with no vendor references.
4. **Repo drop-in convention.** The export flow offers a "drop into repo" layout: `.uxcue/review.json`, `.uxcue/review.md`, `.uxcue/screenshots/`. Generate a short pointer snippet the user can paste into **either** `AGENTS.md` **or** `CLAUDE.md` (both conventions supported, neither required): "UI review issues live in .uxcue/; each issue has a stable UX-nnn ID; mark fixes by referencing the ID in commits."
5. **MCP is the vendor-neutral bridge.** The later `uxcue-mcp` server (post-MVP) uses the Model Context Protocol precisely because it is an open standard supported across agent vendors. No Anthropic-proprietary transports (e.g., no native-messaging to Claude-specific hosts).
6. **Validation across agents.** The dogfood acceptance test (H2) must be run against at least two different agent families before public beta (e.g., Claude Code and Codex/Cursor): ≥8/10 issues fixed without clarification *on each*. If one agent family underperforms, fix the export format, not the agent.

## 2. What To Build (MVP Scope)

Authoritative scope: `docs/02-mvp-breakdown.md` and `docs/11-refined-prd.md` (R1–R10). Summary:

**In:** MV3 extension; side panel issue queue; element picker with hover overlay; feedback composer (title, feedback required, expected, suggested fix, type, severity, status, role-based assignee); metadata capture (URL/route, viewport/DPR/scheme, scroll, selector + DOM path + XPath, tag/id/classes/data-attrs, ARIA, outerHTML skeleton, bbox, computed-style subset, parent layout, best-effort React component name); screenshots (single viewport capture, element crop derived locally); local storage (projects, sessions, issues, screenshot blobs in IndexedDB); issue workflow (list, filter, edit, delete, status); exports (review.md, per-issue md, review.json, zip bundle, clipboard copy, repo drop-in layout); cloud sync alpha (Cognito Google SSO, API GW + Lambda + DynamoDB + S3, minimal console); optional manual GitHub issue creation; Playwright e2e + Vitest units + Terraform checks.

**Out (do not build, even if tempting):** MCP server, billing, teams, area/multi/text selection modes, console/network log capture, request bodies, full-page stitched screenshots, source-map file:line resolution, iframe/shadow-DOM piercing, responsive recapture, Web Store listing, automated defect detection.

## 3. Hard Constraints (Non-Negotiable)

These come from platform research (docs/19) and product decisions (docs/14). Violating any of these is a defect.

1. **Local-first.** Capture, tracking, and export must work with no account, no cloud, no GitHub, no network.
2. **Permissions:** `activeTab`, `commands`, `sidePanel`, `storage`, `downloads` only. NEVER `<all_urls>` or default `host_permissions` (D013). Capture arming is per user invocation (toolbar click or keyboard shortcut); optional runtime per-origin grant via `chrome.permissions.request` is a per-project convenience toggle.
3. **Screenshots:** exactly ONE `chrome.tabs.captureVisibleTab` call per issue — a hard Chrome quota of 2 calls/second exists and cannot be raised (D011). Derive the element crop from the same bitmap via OffscreenCanvas using bbox × devicePixelRatio. Quota error → one retry with backoff → save issue with screenshot-failed warning.
4. **Zero page interference.** Content-script overlay in a **closed shadow DOM**; no persistent mutation of the reviewed page; Escape always cancels; works on CSP-strict pages (no inline script injection).
5. **Data portability:** schema `uxlens/1.0`; stable UUID internal IDs; session-scoped `UX-001` display IDs; deleting never renumbers; every issue exportable as markdown and JSON (D006).
6. **Privacy:** screenshots and DOM metadata are sensitive. Local by default; cloud sync explicit per project; redact obvious secret-looking values (token-like strings, password-type inputs) from captured text/attributes; never capture cookies, request bodies, or form values.
7. **Security hygiene:** no secrets in repo; Google OAuth and GitHub tokens via env/secret storage; Terraform state per docs/05; AWS budgets and quotas in the first apply.
8. **Framework detection is best-effort.** React fiber walking may break across versions — degrade to plain DOM info silently, never crash capture.

## 4. Architecture

```txt
Extension (apps/extension)
  service worker  — session state, screenshot capture, export orchestration
  content script  — picker overlay (closed shadow DOM), metadata extraction,
                    highlight, messaging (isolated world)
  page-world shim — React fiber / framework introspection only; postMessage
                    bridge back to content script
  side panel      — React UI: project/session, issue queue, composer,
                    detail, export modal, settings
  platform adapter— thin wrapper over ALL chrome.* APIs (D015); no feature
                    code calls chrome.* directly; the e2e mock seam
  storage         — IndexedDB (issues + screenshot blobs via idb),
                    chrome.storage.local (prefs) — via the platform adapter

Shared (packages/)
  schema    — zod types + validators for uxlens/1.0 (single source of truth)
  markdown  — pure generators: review.md, per-issue md, GitHub body
  ui        — shared React components/tokens per docs/18

Cloud (apps/api, apps/console, terraform/uxcue)  — per docs/05, unchanged.

Tests (tests/)
  fixture-app — deterministic defect app (docs/07 routes/elements)
  e2e         — Playwright: launchPersistentContext + --load-extension,
                unique userDataDir per worker; side panel tested as a
                directly-loaded extension page; SW driven via evaluate
```

Stack: TypeScript everywhere; Vite + CRXJS for the extension; React side panel; zod; idb; fflate; pnpm workspaces; Playwright + Vitest; Terraform for all AWS.

## 5. Build Sequence

Work one story per branch (branch = story ID, e.g. `uxl-ext-003`); story text and acceptance criteria in `docs/03-agent-stories.md` are the definition of done. Sequence:

**Phase 0 — Repo + schema (Session 0)**
`UXL-ARCH-001` monorepo scaffold → `UXL-ARCH-002` shared schema package **with the D014 assigneeHint amendment applied**. Root scripts: build, typecheck, test, e2e, lint, package:extension. Update CLAUDE.md/AGENTS.md command list when scripts change.

**Phase 1 — Risk spikes (Session 1, throwaway code allowed, SPIKE.md each)**
1. Selector generation vs fixture-app + 2 real apps (target ≥80% unique at capture).
2. Single-capture crop pipeline at DPR 1 / 1.5 / 2.
3. React fiber component-name extraction with graceful degradation.
4. Playwright extension harness proof (load unpacked, drive side panel page, survive MV3 SW suspension).

**HUMAN GATE:** owner reviews the four SPIKE.md files before Phase 2 proceeds.

**Phase 2 — Extension shell + capture (Sessions 2–4)**
Fixture app first, then Epic B/C stories: shell, storage adapter, picker overlay, metadata extractor, screenshot pipeline, composer, issue list/detail. Smoke after every story (docs/07 Smoke 2–4). `UXL-EXT-001` acceptance gains the **platform adapter layer + lint rule** (D015, X6-001): all `chrome.*` access goes through the adapter and a lint rule (`no-restricted-globals`/custom ESLint) fails the build on any direct `chrome.*` call outside it.

**Phase 3 — Issue workflow + exports (Session 5)**
Filters/edit/status; `packages/markdown` generators with exhaustive unit tests against the exact formats in docs/04 (as amended by D014); zip bundle; clipboard; repo drop-in layout + AGENTS.md/CLAUDE.md pointer snippet. Export validation: re-verify selectors, mark stale, warn on missing assets.

**Phase 4 — Dogfood (owner-driven)**
Run docs/07 manual script on a real app; export; feed the bundle to **two different agent families**; record fix-without-clarification rate per agent. Iterate on export format until ≥8/10 on both. Capture UXCue's own defects with UXCue.

**Phase 5 — Cloud alpha (Sessions 7+) — DEFERRED (D016)**
Not started until D016 is revisited. When resumed: Terraform module-by-module per docs/05 (auth → data → storage → api → console → observability → budget). Infra sessions separate from extension sessions. Then extension sign-in, sync queue, revision-based conflict handling, minimal console.

**Phase 6 — GitHub alpha**
Per docs/09: PAT dogfood path, repo setting per project, generated issue body (neutral wording), create + link + store URL. Screenshots: cloud signed URLs when synced, bundle note when local (D012 — API upload is platform-blocked; never browser-automation upload).

**Phase 7 — Launch (post definition-of-done) — DEFERRED (D016)**
Not started until D016 is revisited. Chrome Web Store publishing (Track B, `WS7-*`) is tracked in GitHub issue #1. When resumed, per docs/24: Track A (landing page, `LP7-*`) and Track B (store) run in parallel; the landing page is a separate session/worktree — a Terraform + static-site task (`terraform/uxcue/modules/landing/`), not an extension task. Store listing copy is generated from docs/17 + docs/18 and reviewed by the owner before submission. Publish unlisted first (WS7-006), then flip public after a clean soak.

## 6. Testing Bar

- Unit (Vitest): selector gen, DOM/XPath, style normalization, skeleton truncation, ID allocation, markdown generators, schema validation, sync conflict logic, GitHub body.
- E2E (Playwright): startup, capture-element, page-note, persistence-across-restart, export-download, cloud-sync-mocked, github-create-mocked. Chrome for Testing/Chromium in CI; unique userDataDir per worker.
- Smoke list and CI gates: docs/07, unchanged except runner (Cypress → Playwright per revised D007).
- Infra: `terraform fmt -check`, `validate`, `plan` gate every cloud change.

## 7. Repo Instruction Files

Create BOTH at repo root, near-identical content (many agents read AGENTS.md; Claude Code reads CLAUDE.md):

```markdown
# UXCue

Local-first Chrome extension (MV3) that captures UI/UX defects as portable,
agent-ready issues. Planning docs in ./docs are the source of truth;
docs/21-build-handover.md sequences the work; docs/14-decision-log.md is
the tiebreaker — never contradict a decision, add to Open Decisions instead.

## Read before any task
docs/21-build-handover.md, docs/11-refined-prd.md,
docs/04-data-model-and-exports.md, docs/14-decision-log.md,
docs/19-research-round-2.md, and the assigned story in docs/03.

## Non-negotiables (defects if violated)
- Local-first: capture/track/export works offline, no account.
- Manifest permissions: activeTab, commands, sidePanel, storage, downloads.
  Never <all_urls> or default host_permissions.
- ONE captureVisibleTab call per issue; crop locally (2/sec hard quota).
- Overlay in closed shadow DOM; never persistently mutate reviewed pages.
- Schema uxlens/1.0; stable UX-nnn IDs; no renumbering.
- Agent-agnostic output: no vendor names in code, schema, or exports;
  assigneeHint is role-based (code-agent | design-agent | human).
- No chrome.* calls outside the platform adapter layer (D015).
- No secrets in repo.

## Stack & commands
TypeScript, Vite+CRXJS, React, zod, idb, fflate, pnpm workspaces,
Playwright + Vitest, Terraform.
pnpm install | build | typecheck | test | e2e | package:extension

## Working agreement
One story per branch (branch = story ID). Story acceptance criteria =
definition of done; prove them with tests. `needs-spike` stories produce
SPIKE.md before implementation. Blocked on product decision → append to
docs/14 Open Decisions and stop.
```

## 8. Doc Amendments To Apply Before Coding

1. `docs/14-decision-log.md`: revise D007 (Playwright for extension e2e); add D011 (single-capture rule), D012 (GitHub screenshot strategy), D013 (permission model), **D014 (agent-agnostic principle, §1 above)**; close O001 npm portion; flip D009 to build mode.
2. `docs/04-data-model-and-exports.md`: assigneeHint → role-based + optional agentLabel; scrub vendor names from review.md/GitHub body templates; add repo drop-in bundle layout (`.uxcue/`).
3. `docs/07`: swap Cypress mechanics for Playwright fixture pattern; smoke list unchanged.
4. `docs/11`: R2 activeTab re-arming note; R5 single-capture rule; success criteria add "validated on ≥2 agent families".
5. `docs/01/10/16`: positioning copy — replace "Claude Code, Codex, Cursor…" examples with "any AI coding agent (e.g., …)" framing so no vendor reads as privileged.

## 9. Kickoff Prompt (Paste As First Message)

> Read CLAUDE.md, then docs/21-build-handover.md in full, then docs/README.md, docs/11, docs/14, docs/19. Confirm understanding in 10 bullets: product thesis, the agent-agnostic principle, the five hard platform constraints, the MVP out-of-scope list, and the phase sequence. List anything ambiguous or contradictory across the docs. Then apply the doc amendments in handover §8 as your first commit (docs only, no code). Stop for review before starting UXL-ARCH-001.

## 10. Definition Of Done (MVP)

1. Fresh Chrome profile: install unpacked extension → create project + session → capture 10 issues across 4 pages of a real app in under 12 minutes → restart browser → issues persist.
2. Export bundle: review.md with stable UX-001…UX-010, valid uxlens/1.0 JSON, screenshots present, selectors re-verified.
3. Bundle handed to two different AI coding agents: each fixes ≥8/10 without asking "which element?" or "where is this?".
4. Cloud: Google sign-in, sync of the session, console shows issues + screenshots, sign-out leaves local data intact.
5. GitHub: 2 issues created from selected UXCue issues with stored links; disconnect leaves UXCue data intact.
6. All smoke tests green in CI; no default host permissions in the manifest; no secrets in repo; AWS budget alarms live.
