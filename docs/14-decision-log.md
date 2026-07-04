# Decision Log

This file records product and architecture decisions so future planning does not loop.

## D001: UXCue Owns The Issue Workflow

Status: accepted

Decision:

- UXCue creates and tracks its own issues.
- GitHub is optional sync/export.
- Cloud is optional sync/share.

Reason:

- Making GitHub the system of record too early would make the product less useful for local-only review and non-GitHub workflows.

Implication:

- UXCue needs stable issue IDs, statuses, markdown, JSON, and local persistence.

## D002: Local-First MVP

Status: accepted

Decision:

- The first usable workflow must work without account, cloud, GitHub, or MCP.

Reason:

- Privacy and speed are key differentiators against SaaS feedback tools.

Implication:

- IndexedDB/local storage and export quality are P0.

## D003: Google SSO For UXCue Cloud

Status: accepted for plan

Decision:

- UXCue Cloud account should support Google SSO.

Reason:

- The user requested cloud account attached to Chrome with Google SSO.
- Cognito can support Google social IdP.

Open:

- Final OAuth callback model depends on extension ID/domain.

## D004: GitHub Authorization Is Separate

Status: accepted

Decision:

- GitHub authorization is separate from UXCue Cloud identity.

Reason:

- A user may want local-only, cloud-only, GitHub-only, or cloud plus GitHub.
- GitHub permissions are sensitive and should be explicit.

Implication:

- Settings should show Account and Integrations separately.

## D005: Direct GitHub API Before MCP

Status: accepted

Decision:

- Creating GitHub issues should use GitHub API/integration directly.
- MCP is not needed for issue creation.

Reason:

- GitHub already exposes APIs and its own MCP server.
- UXCue MCP should expose UXCue data, not duplicate GitHub.

Implication:

- MCP moves to later phase.

## D006: Markdown/JSON Are First-Class

Status: accepted

Decision:

- Every issue and session must be exportable as markdown and JSON.

Reason:

- This preserves portability and supports agent workflows without cloud.

Implication:

- Data model and markdown generator must be designed early.

## D007 (revised): Playwright Owns Extension E2E And Smoke

Status: accepted (revised 2026-07-04 per docs/19 F3)

Decision:

- Playwright is the e2e/smoke framework for the extension. Cypress remains acceptable for the cloud-console SPA if desired, but the default is to consolidate everything on Playwright to avoid running two e2e stacks.

Reason:

- Playwright now has an official Chrome-extensions testing guide with MV3-specific handling: it keeps the same service-worker handle valid across ~30s SW suspension and resumes in-flight `evaluate()` calls automatically.
- Playwright leads adoption with free built-in parallel sharding; Cypress's in-process architecture makes extension contexts (service worker, multiple extension pages, content-script world) awkward and its parallelization needs paid Cypress Cloud.

Implication:

- Extension e2e uses `launchPersistentContext` + `--load-extension` with a unique `userDataDir` per worker.
- The side panel is tested as a directly-loaded extension page (`chrome-extension://<id>/sidepanel.html`); the service worker is driven via `evaluate`.
- The test-app fixture, smoke list, and CI gates in `07-testing-release-and-smoke.md` all carry over unchanged — only the runner changes.
- Superseded original: Cypress was the planned framework; the extension harness was a spike. That spike is now the Playwright harness proof.

## D008: AWS Serverless With Terraform

Status: accepted

Decision:

- Cloud planning targets AWS serverless components managed by Terraform.

Reason:

- User requested Terraform and AWS free-tier-aware components.

Implication:

- Budgets, quotas, lifecycle, and alarms are P0 cloud planning concerns.

## D009 (flipped): Planning Phase Complete — Build Mode Active

Status: flipped to build mode 2026-07-04 (per docs/20, docs/21, docs/24)

Decision:

- The documentation-only planning phase is complete. The pack is implementation-ready and moves to build mode. `docs/21-build-handover.md` sequences the work.

History:

- Originally accepted as docs-only after the user clarified: "dont do code just do the .md with research and backlog and refinement etc". That constraint held through the planning pack (docs 01–20) and is now formally lifted.

Implication:

- Coding may begin at `UXL-ARCH-001`. Docs remain the source of truth and change before code; `docs/14` stays the tiebreaker.
- Product decisions still change docs first, code second. Undecided questions stop work and get appended to Open Decisions.

## D010: Competitor Framing

Status: accepted

Decision:

- UXCue should not position as a general BugHerd/Marker.io clone.

Reason:

- BugHerd MCP already covers AI-agent task access for website feedback.
- Marker.io is mature for bug reporting/UAT.

Implication:

- Positioning should emphasize local-first, agent-ready issue quality, markdown/JSON portability, and design QA.

## D011: Single-Capture Screenshot Rule

Status: accepted (2026-07-04 per docs/19 F2)

Decision:

- Exactly ONE `chrome.tabs.captureVisibleTab` call per issue. Capture the viewport once, then derive the element crop from that same bitmap in an OffscreenCanvas using bbox × devicePixelRatio. Never call twice for element + viewport.

Reason:

- `MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND` = 2 is a hard Chrome quota (since Chrome 92) and cannot be raised.

Implication:

- Debounce capture; queue a second capture if two issues are saved within ~500ms.
- Retry-with-backoff once on quota error; if it still fails, save the issue with a `screenshot: failed` warning (allowed by R5).
- Scroll-and-stitch full-page capture is explicitly out of scope.

## D012: GitHub Screenshot Strategy

Status: accepted (2026-07-04 per docs/19 F4)

Decision:

- GitHub issue screenshots use UXCue Cloud signed/share URLs (cloud users) or an export-bundle note (local users). Committing screenshots into the repo under `.uxcue/screenshots/` via the Contents API is an allowed later option. Never use browser-automation upload tricks.

Reason:

- The GitHub API does not support issue attachments; the upload endpoint is tied to a browser session and rejects PATs, OAuth Apps, and GitHub Apps. This remains true as of 2026. Hotlinked image URLs (`![](https://…)`) render fine; only uploads are blocked.

Implication:

- Closes the `13-validation-plan.md` backlog item asking whether GitHub image upload via API improved (answer: no).
- Confirms the strategy already described in `09-agent-integrations-mcp-github.md` and resolves the MVP portion of O003.

## D013: Permission Model

Status: accepted (2026-07-04 per docs/19 F5)

Decision:

- Manifest permissions are `activeTab`, `commands`, `sidePanel`, `storage`, `downloads` only. Capture arming is per user invocation (toolbar click or `chrome.commands` keyboard shortcut). Optional runtime per-origin host grant via `chrome.permissions.request` is a per-project convenience toggle. Never add `<all_urls>` or default `host_permissions`.

Reason:

- `activeTab` grants temporary host access only in response to a user gesture and does not survive navigation; it also triggers no permission warning, which protects the Web Store review story.

Implication:

- Multi-page review re-arms capture per page via a user gesture; the side panel (extension UI) persists across navigation, so the session persists even though the page grant does not.
- The minimal-permission model is the single biggest de-risker for Web Store review; protect it against scope creep.

## D014: Agent-Agnostic By Design

Status: accepted (2026-07-04 per docs/21 §1)

Decision:

- UXCue is built *with* Claude Code but never *around* it. Every output, integration, and naming choice must work identically for any AI coding agent.

Binding rules:

- Neutral vocabulary everywhere — no vendor agent names ("Claude", "Codex", etc.) in product code, schema values, export formats, UI copy, or file names.
- Role-based assignee, not vendor-based: `assigneeHint: "code-agent" | "design-agent" | "human" | "unassigned"`, plus an optional free-text `agentLabel?: string`.
- Exports are the API: self-contained `review.md` + `review.json` (schema `uxlens/1.0`); an agent with zero UXCue knowledge should be able to locate and fix issues from the bundle alone.
- Repo drop-in convention writes `.uxcue/`; the pointer snippet supports both `AGENTS.md` and `CLAUDE.md`, requiring neither.
- MCP (post-MVP) is the vendor-neutral bridge; no Anthropic-proprietary transports.
- Dogfood acceptance (H2) must pass on ≥2 agent families before public beta; fix the export format, not the agent, if one underperforms.

Note:

- The schema *string* stays `uxlens/1.0` deliberately (historical version identifier), independent of the UXLens→UXCue product rename.

## D015: Chrome-First With A Platform Adapter

Status: accepted for backlog (2026-07-04 per docs/22)

Decision:

- UXCue ships Chrome-first. Cross-browser support (Edge → Firefox → Safari, in that order) enters the backlog now as a planned track (Release 6), gated on Chrome launch success. From the FIRST line of extension code, all `chrome.*` API access goes through a thin platform adapter layer (`packages/extension-platform` or `apps/extension/src/platform/`); no feature code calls `chrome.*` directly.

Reason:

- The adapter rule costs almost nothing now and is the difference between a ~2-week port and a rewrite later. It also gives the e2e suite a clean seam for mocking.

Implication:

- Adapter enforcement (lint rule blocking `chrome.*` outside the adapter) lands in `UXL-EXT-001`, not in Release 6 — it is P0 now.
- MVP scope stays Chrome-only; this changes *how* code is written, not *what* ships first. See Release 6 in `08`/`12` for the gated port backlog.

## D016: Local-First MVP First — Cloud, Launch, And Store Deferred

Status: accepted (owner decision 2026-07-04)

Decision:

- The immediate goal is a **local-first MVP that fully works offline** (docs/21 Phases 0–4): capture, tracking, and export with no account, no cloud, no GitHub required. "Everything works locally after the build" is the bar.
- **Phase 5 (cloud alpha)** and **Phase 7 (public launch: landing page Track A + Chrome Web Store Track B)** are **deferred**. Chrome Web Store publishing is tracked in GitHub issue #1.

Reason:

- Prove capture/export quality and the two-agent-family dogfood (H2) before spending on cloud infra, domains, legal pages, and store review. Local-first is the wedge (D002) and needs no external dependencies to validate.

Implication:

- In scope now: Phase 0 (repo+schema), Phase 1 (spikes), Phases 2–3 (extension shell, capture, issue workflow, exports), Phase 4 (dogfood — **against the deterministic fixture app first**, per owner; a real-app dogfood target is chosen only when Phase 4 is reached).
- **Phase 6 (GitHub) is also deferred** (owner decision 2026-07-04): the local MVP is capture + track + export only. The GitHub epic (`UXL-GH-*`) — including the PAT path — waits until this decision is revisited, alongside cloud. The export bundle remains the sole handoff surface for the local MVP.
- Do not build GitHub (`UXL-GH-*`), cloud (`UXL-INFRA-*`, `UXL-CLOUD-*`, `UXL-SYNC-*`, `UXL-CONSOLE-*`, `UXL-AUTH-*`), the landing page (`LP7-*`), or the store package (`WS7-*`) until this decision is revisited. The `uxcue-*` infra names (O006) and the store checklist (issue #1) are preserved for when it is.
- Definition of done for this milestone = docs/21 §10 items 1–2 (local capture/persistence, valid `uxlens/1.0` export bundle) + item 3 run against ≥2 agent families using the fixture-app review. Items 4–6 (cloud, GitHub, store/budget) move with their phases.

## Open Decisions

### O001: Product Domain

Options:

- `uxcue.ktek.cloud`
- `uxcue.tools.ktek.cloud`
- independent product domain later

Default:

- Use a KTEK subdomain for dev; decide product domain before public beta.

Partial resolution — naming/npm (2026-07-04 per docs/19 F1):

- npm names `uxcue` and `uxcue-mcp` confirmed unregistered (404) as of the research date — register immediately (publish placeholder 0.0.1) to prevent squatting. `uxlens` (former name) also free as a fallback.
- GitHub org name `UXcue` is taken by a dormant account; product repos stay under `KasunDon/UXCue` or a new org (e.g., `uxcue-dev`).
- Product-domain choice (`uxcue.com/.dev/.app`, purchase tracked as LP7-001) remains open pending purchase; record the registered domain here once bought.

### O002: GitHub Integration Production Model

Options:

- Fine-grained PAT.
- OAuth App.
- GitHub App.

Default:

- Dogfood can use PAT or mocked GitHub.
- Production should prefer GitHub App.

### O003: Screenshot Hosting For GitHub Issues

Options:

- UXCue Cloud signed/share links.
- GitHub repo file upload.
- Local export only.

Default:

- MVP local export; cloud alpha signed links; public beta decide shareable screenshot policy.

Partial resolution (2026-07-04):

- D012 fixes the mechanism (signed URLs / export-bundle note / optional Contents-API repo commit; never browser-automation upload). What remains open is the *public-beta shareable screenshot policy* (whether cloud screenshot links are shareable in GitHub issues by default).

### O004: Cloud Free Plan Limits

Options:

- Local unlimited, cloud limited by project/issues/storage.
- Cloud trial only.
- Paid-only cloud.

Default:

- Free cloud alpha with conservative quotas and retention.

### O005: Team Sharing Timing

Options:

- Public beta.
- v1.
- post-v1.

Default:

- Delay until capture/export/GitHub workflows are validated.

### O006: Product-Name Reconciliation (UXLens → UXCue) — RESOLVED

Status: RESOLVED 2026-07-04 (owner confirmed: "uxcue is the name").

Resolution:

- Product name is **UXCue**. The pack was renamed from UXLens → UXCue across docs 01–24 and both READMEs. "UXLens" now survives only as former-working-title history (this log's D009 history, docs/11 Product Name, docs/17 §Recommended Actions, docs/18 §5).
- Deliberately preserved (D014): the portable schema string `uxlens/1.0` and the `UX-nnn` display IDs; the `uxlens` npm name as a documented fallback.
- Infra identifiers in docs now read `uxcue-*` consistently (`terraform/uxcue`, DynamoDB `uxcue-{env}`, buckets `uxcue-{env}-*`, Cognito `uxcue-{env}`, DNS `uxcue.tools.ktek.cloud`, `api.uxcue.tools.ktek.cloud`). These are the names to apply from the first `UXL-INFRA-001` Terraform run — renaming a deployed table/bucket/pool later is costly, so they are fixed now while still docs-only.

No open sub-items remain. Domain *purchase* is still tracked separately as LP7-001 / the O001 domain question (which registrar/TLD to buy), not a naming question.

### O007: Story-ID Scheme Reconciliation (docs/03 vs docs/12)

Raised 2026-07-04.

Context:

- docs/03 uses `UXL-*` story IDs (e.g., `UXL-ARCH-001`, `UXL-EXT-001`) and the handover §5 build sequence sequences work by these.
- docs/12 uses release-scoped IDs (`R0-*`, `L1-*`, `C2-*`, `G3-*`, `B4-*`, `M5-*`, and the newly added `X6-*`, `LP7-*`, `WS7-*`).
- No mapping table connects the two. A coding agent handed `UXL-EXT-001` will not find it in docs/12, and vice versa. This is a pre-existing structural choice, not introduced by this amendment pass.

Owner decision needed:

- Either add a docs/03 ↔ docs/12 cross-map, or formally designate docs/03 `UXL-*` as the canonical build/branch IDs and docs/12 as priority/release framing only. (Recommend the latter — the handover already sequences by `UXL-*`.)

### O008: Chrome Web Store Publisher Identity

Raised by docs/24 (WS7-001), unresolved.

Options:

- `KGLABS LTD` (existing legal entity).
- `UXCue` (product-named publisher).

Note:

- Affects the Web Store listing, privacy policy authorship, and trademark posture. Decide before WS7-001 registration.
