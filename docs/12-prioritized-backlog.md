# Prioritized Backlog

This backlog is documentation-only. It is meant to be handed to coding agents later as implementation direction.

## Priority Definitions

- P0: required to prove the core workflow.
- P1: required for usable alpha/beta.
- P2: required for public launch quality.
- P3: later expansion.

## Release 0: Research And Design

Goal: get decision clarity before implementation.

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| R0-001 | P0 | Competitive research | BugHerd, Marker.io, stagewise, GitHub, Chrome, AWS notes captured with links |
| R0-002 | P0 | Refined PRD | Local/cloud/GitHub/MCP modes clearly separated |
| R0-003 | P0 | MVP scope | In/out of scope and acceptance test defined |
| R0-004 | P0 | UX wireframes | Side panel, composer, issue detail, export, settings, cloud console sketched |
| R0-005 | P0 | Data model | Issue/session/project/export schema defined |
| R0-006 | P0 | Cloud architecture | AWS/Terraform plan with cost guardrails |
| R0-007 | P0 | Test strategy | Playwright smoke/e2e test plan defined (D007 revised) |
| R0-008 | P1 | Naming research | Check Chrome Web Store, npm, GitHub, trademark-ish collisions |
| R0-009 | P1 | Pricing hypothesis | Define free/local/cloud/pro plan assumptions |
| R0-010 | P1 | Permission strategy | Decide initial Chrome permissions and copy |

## Release 1: Local-Only Extension MVP

Goal: capture issues locally and export agent-ready review bundles.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| L1-001 | P0 | MV3 extension shell | R0 docs | Side panel opens and shows active project/session shell |
| L1-002 | P0 | Local data store | L1-001 | Projects, sessions, issues, screenshots persist locally |
| L1-003 | P0 | Element picker overlay | L1-001 | Hover highlight, label, click select, Escape cancel |
| L1-004 | P0 | Metadata capture | L1-003 | Selector, DOM path, URL, bbox, viewport, styles captured |
| L1-005 | P0 | Screenshot capture | L1-003 | Viewport and element crop stored locally |
| L1-006 | P0 | Feedback composer | L1-003 | User can save issue with feedback/type/severity |
| L1-007 | P0 | Issue list/detail | L1-002 | View, edit, filter, delete/archive issues |
| L1-008 | P0 | Markdown export | L1-007 | Session markdown and per-issue markdown generated |
| L1-009 | P0 | JSON export | L1-007 | `uxlens/1.0` JSON validates |
| L1-010 | P0 | Zip export | L1-008/L1-009 | Bundle includes markdown, JSON, screenshots |
| L1-011 | P0 | Playwright smoke | L1-001..010 | Startup, capture, persistence, export smoke pass |
| L1-012 | P1 | Page-level note | L1-006 | User can create issue without selected element |
| L1-013 | P1 | Keyboard shortcut | L1-003 | User toggles capture via configured shortcut |
| L1-014 | P1 | Export warning report | L1-008 | Missing/stale selector/assets shown before export |

## Release 2: Cloud Alpha

Goal: optional account and cloud sync. **DEFERRED (D016)** — not started until the local-first MVP (Release 1) works end-to-end and dogfood passes.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| C2-001 | P0 | Terraform dev plan | R0-006 | AWS stack plan documented and validated |
| C2-002 | P0 | Google SSO design | C2-001 | Cognito/Google callback model documented |
| C2-003 | P0 | Project/session/issue API | C2-001 | CRUD API shape documented and implemented later |
| C2-004 | P0 | Screenshot storage | C2-001 | Private S3 signed URL flow designed |
| C2-005 | P0 | Extension sign-in | C2-002 | User can sign in/out; local data remains |
| C2-006 | P0 | Sync queue | C2-003 | Offline local changes upload later |
| C2-007 | P0 | Cloud console shell | C2-003 | Projects/sessions/issues visible in browser |
| C2-008 | P0 | Cloud issue detail | C2-004 | Screenshots and markdown preview visible |
| C2-009 | P0 | Cloud smoke tests | C2-003 | API health and mocked sync smoke pass |
| C2-010 | P1 | Conflict resolution | C2-006 | User can choose local/cloud version |
| C2-011 | P1 | Account export | C2-003 | User downloads all cloud data |
| C2-012 | P1 | Account deletion | C2-003 | User can request/delete cloud data |

## Release 3: GitHub Alpha

Goal: GitHub is an optional output/sync target.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| G3-001 | P0 | GitHub auth decision | R0-010 | PAT/OAuth/App path chosen for alpha |
| G3-002 | P0 | Repo settings | G3-001 | User chooses default owner/repo per project |
| G3-003 | P0 | Issue body template | L1-008 | GitHub markdown preview generated |
| G3-004 | P0 | Create GitHub issue | G3-001/G3-003 | Issue URL stored on UXCue issue |
| G3-005 | P0 | Error handling | G3-004 | Auth/permission/rate/repo errors shown |
| G3-006 | P1 | Link existing issue | G3-002 | User links GitHub URL manually |
| G3-007 | P1 | Status refresh | G3-006 | Closed/open state read from GitHub |
| G3-008 | P1 | Label mapping settings | G3-003 | User can customize labels |
| G3-009 | P2 | GitHub App production | G3-001 | Repo-scoped installation flow |

## Release 4: Public Beta

Goal: publishable beta with clear privacy/account story.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| B4-001 | P0 | Privacy policy | Cloud/GitHub | Describes local/cloud/screenshot/GitHub data |
| B4-002 | P0 | Permission explanations | Extension | Web Store-ready permission copy |
| B4-003 | P0 | Web Store assets | UX | Listing text and screenshots drafted |
| B4-004 | P0 | Data export/delete | Cloud | User can export/delete cloud data |
| B4-005 | P0 | Cost guardrails | Infra | Budgets, quotas, lifecycle, alarms |
| B4-006 | P0 | Full Playwright suite | L1/C2/G3 | CI e2e and smoke pass |
| B4-007 | P1 | Onboarding | UX | User understands local/cloud/GitHub choices |
| B4-008 | P1 | Share link alpha | Cloud | User shares read-only session link |
| B4-009 | P1 | Better selector confidence | L1 | Confidence shown and reverified |
| B4-010 | P1 | Contrast/a11y hints | Metadata | Basic design QA hints attached |

## Release 5: Agent/MCP Beta

Goal: agents can read and update UXCue issues directly.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| M5-001 | P0 | MCP spec | Export/schema | Tool names, schemas, auth model documented |
| M5-002 | P1 | Local MCP over export | M5-001 | Agent reads exported sessions |
| M5-003 | P1 | Mark resolved file/cloud write | M5-002 | Agent updates status with explicit write permission |
| M5-004 | P2 | Cloud MCP | Cloud auth | Agent reads cloud projects/sessions securely |
| M5-005 | P2 | PR/commit link tool | GitHub | Agent attaches fix evidence |

## Release 6: Cross-Browser (post-Chrome-launch gate)

Goal: port beyond Chrome once the Chrome launch is proven. Gated (D015); does not change MVP scope. Full rationale in docs/22.

Gate: Chrome Web Store listing stable ≥ 1 cycle; ≥ 20 external review sessions; H2 ≥ 70% in the wild; no open P0/P1 data-loss/capture bugs.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| X6-001 | P0* | Platform adapter layer | L1-001 | No `chrome.*` outside adapter; lint rule blocks violations; e2e mocks use the adapter seam |
| X6-002 | P2 | Edge port + Edge Add-ons listing | X6-001, Release 4 | Full smoke green on Edge; listing live; permission copy reviewed |
| X6-003 | P2 | Firefox spike | X6-001 | SPIKE.md: `sidebar_action` mapping, capture/crop parity, polyfill, MV3 background, AMO |
| X6-004 | P3 | Firefox port + AMO listing | X6-003 | Smoke green on Firefox; AMO approved |
| X6-005 | P3 | Safari feasibility spike | X6-001 | Effort/demand assessment only |
| X6-006 | P3 | Cross-browser CI matrix | X6-002 | e2e on Chrome for Testing + Edge (+ Firefox once ported) |

*X6-001 is P0 **now** and lands in L1-001 / `UXL-EXT-001`, not in Release 6.

## Release 7: Public Launch Assets (landing page + Web Store)

Goal: ship the public-facing landing page and Chrome Web Store listing. **DEFERRED (D016)**; Chrome Web Store publishing tracked in GitHub issue #1. Full backlog in docs/08 and docs/24.

Gate: MVP definition-of-done (docs/21 §10), including two-agent-family dogfood. LP7-001 and WS7-001 can start immediately.

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| LP7-001 | P1 | Buy domains (uxcue.com/.dev/.app) | — | Registered; DNS delegated; recorded in docs/14 O001 |
| LP7-002 | P1 | Landing page v1 | LP7-001, docs/18 | Live on uxcue.com; Lighthouse ≥95 perf/a11y |
| LP7-004 | P1 | Legal pages (/privacy, /support) | LP7-002 | Live; required by Web Store |
| WS7-001 | P0 | Web Store developer account | — | Registered, 2FA, publisher name decided |
| WS7-002 | P0 | Store-compliant package | Release 4 | Reproducible zip; icons; no remote code; CSP reviewed |
| WS7-003 | P0 | Permission justifications | WS7-002 | Per-permission text; no host_permissions (D013) |
| WS7-004 | P0 | Data disclosure | LP7-004 | Data-usage form accurate; links to privacy |
| WS7-005 | P0 | Listing content | docs/17 | Title, descriptions, 3–5 screenshots, category, support |
| WS7-006 | P1 | Unlisted beta release | WS7-002..005 | Store-signed build passes full smoke |
| WS7-007 | P1 | Public release | WS7-006 | Flip public after clean unlisted soak; rollback plan |

## Test & Automation Tooling (P2/P3)

| ID | Priority | Item | Dependencies | Acceptance |
| --- | --- | --- | --- | --- |
| QA-REC-001 | P2 | Interaction recorder in extension | L1-003, X6-001 | Opt-in/local-only recorder emits a portable JSON step list with stable selectors; redacts secret-looking values |
| QA-REC-002 | P3 | Recorded-flow → Playwright spec generator | QA-REC-001, L1-011 | Generates a runnable spec/replay input; replaying against the fixture app reproduces the same `UX-nnn` issues deterministically |

Scheduled after the capture/export core (D016). Tracked in GitHub issue #2. Reuses selector generation (L1-004/`UXL-EXT-005`) and the Playwright harness (`UXL-QA-001`).

## Dependency Graph

```txt
Research docs
  -> local extension MVP
    -> markdown/JSON export
      -> GitHub issue creation
      -> local MCP
  -> cloud architecture
    -> cloud sync
      -> cloud console
      -> GitHub OAuth/App
      -> cloud MCP
```

## Cut Lines

If time is tight, cut in this order:

1. MCP.
2. GitHub status sync.
3. Cloud console bulk actions.
4. Page-level notes.
5. React component deep owner chain.
6. Console/network diagnostics.
7. Team sharing.

Do not cut:

- Local issue capture.
- Screenshots.
- Markdown export.
- JSON export.
- Selector/DOM/style metadata.
- Local-only mode.

## Agent Handoff Rule

Every implementation story must include:

- Goal.
- User-visible behavior.
- Data fields touched.
- Edge cases.
- Tests.
- Acceptance criteria.

The implementer should not need to decide product scope.
