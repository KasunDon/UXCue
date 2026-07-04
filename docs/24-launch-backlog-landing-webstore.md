# Launch Backlog: Landing Page + Chrome Web Store Publishing

Date: 2026-07-04
Status: accepted but **DEFERRED (D016, 2026-07-04)**. This entire release (landing page Track A + Chrome Web Store Track B) is postponed until the local-first MVP works end-to-end (docs/21 Phases 0–4) and the two-agent-family dogfood passes. Chrome Web Store publishing is tracked in **GitHub issue #1**. Content below is preserved for when Phase 7 resumes. Decision D009 is flipped: build mode is active (local-first scope).

## Release 7: Public Launch Assets

Gate: MVP definition-of-done (handover §10) passed, including the two-agent-family dogfood result.

### Track A: Landing Page (uxcue.com)

Stack: reuse the kdon.dev pattern — static site on S3 + CloudFront, Terraform module `terraform/uxcue/modules/landing/`, Route 53 once the domain is purchased. No backend needed for v1 (a mailing-list form can POST to a tiny Lambda later).

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| LP7-001 | P1 | Buy domains (uxcue.com/.dev/.app per docs/17) | Registered; DNS delegated; recorded in docs/14 O001 |
| LP7-002 | P1 | Landing page v1 | Static site live on uxcue.com; Lighthouse ≥95 perf/a11y; follows docs/18 brand system (dark command header, light surface, teal accent, bold type, product-first hero) |
| LP7-003 | P1 | Web Store CTA | Primary button "Add to Chrome" links to the Web Store listing; shown only when listing is live, else "Get notified" fallback |
| LP7-004 | P1 | Legal pages | /privacy and /support live (required by Web Store); privacy policy covers local-first default, optional cloud sync, screenshot handling, GitHub integration |
| LP7-005 | P2 | Demo asset | 30–45s capture-to-fix screen recording or animated hero: click element → issue → export → agent fixes it |
| LP7-006 | P2 | Docs section | Quickstart, permission explanations, export format reference, "works with any AI coding agent" integration guide (Claude Code, Codex, Cursor, Copilot examples — equal billing per D014) |
| LP7-007 | P3 | Mailing list + changelog page | Signup stored; changelog auto-published from repo CHANGELOG.md |

Landing page content skeleton (per docs/18 brand guidelines):

```txt
H1:   Capture UX cues your coding agent can fix.
Sub:  Click broken UI in your real browser. UXCue captures the screenshot,
      selector, styles, and viewport — and turns it into a tracked issue
      any AI coding agent can fix. Local-first. No account required.
CTA:  [Add to Chrome]   [See how it works]
Rows: 1) Product screenshot hero (capture overlay on a real app)
      2) The loop: Capture → Review → Export → Fixed (with UX-001 ID motif)
      3) Works with any agent (neutral logos/names row)
      4) Local-first privacy (no widget, no account, your data)
      5) Optional cloud + GitHub (clearly optional)
      6) FAQ + permissions explanation
```

### Track B: Chrome Web Store Publishing

| ID | Priority | Item | Acceptance |
| --- | --- | --- | --- |
| WS7-001 | P0 | Developer account | Chrome Web Store developer account registered ($5 one-time), 2FA on, publisher name decided (KGLABS LTD vs UXCue) |
| WS7-002 | P0 | Store-compliant package | Reproducible zip from clean build; manifest version bumped; icons 16/32/48/128; no remote code; CSP reviewed |
| WS7-003 | P0 | Permission justifications | Written justification for each permission (activeTab, commands, sidePanel, storage, downloads) in listing + docs; no host_permissions to justify (D013 pays off here) |
| WS7-004 | P0 | Data disclosure | Web Store data-usage form accurate: local by default; what uploads when cloud sync is opted into; links to privacy policy (LP7-004 is a dependency) |
| WS7-005 | P0 | Listing content | Title, short + full description (from docs/17 copy), 3–5 screenshots at 1280×800, category, support URL/email |
| WS7-006 | P1 | Unlisted beta release | Publish as UNLISTED first; dogfood install from the store build (store-signed build can behave differently from unpacked); run full smoke suite against store install |
| WS7-007 | P1 | Public release | Flip to public after unlisted soak with no P0/P1; review turnaround noted (expect days, longer if flagged); rollback plan documented |
| WS7-008 | P2 | Post-launch ops | Review-response process; crash/error triage path; version cadence; store listing A/B of screenshots later |

Sequencing notes:

- WS7-001 can happen **today** (account + name reservation cost nothing meaningful and avoid a last-minute block).
- LP7-004 (privacy/support pages) blocks WS7-004/005 — the store requires live URLs. Do legal pages before store assets.
- Publish **unlisted first** (WS7-006): it satisfies the "real store build" test without public exposure, and converts the dogfood group to store-installed users.
- The minimal-permission model (D013) is the single biggest de-risker for store review — protect it against scope creep during implementation.

## Handover Amendment (docs/21 §5)

Append:

> **Phase 7 — Launch (post definition-of-done)**
> Track A (landing) and Track B (store) run in parallel; WS7-001 and LP7-001 start immediately regardless of phase. Landing page is a separate session/worktree from extension work — it is a Terraform + static-site task, not an extension task. Store listing copy is generated from docs/17 + docs/18 and reviewed by the owner before submission.

## Build Kickoff Checklist (do now)

1. Create/confirm repo `KasunDon/UXCue`; copy the planning pack into `docs/` (now docs 01–24).
2. Add CLAUDE.md + AGENTS.md from handover §7.
3. Register npm `uxcue` and `uxcue-mcp` (F1); buy uxcue.com (LP7-001); register Web Store dev account (WS7-001).
4. Open Claude Code in the repo; paste the kickoff prompt from handover §9.
5. First commit = docs-only amendments (handover §8 + this doc + docs 22/23); owner reviews.
6. Session 0: UXL-ARCH-001/002. Session 1: the four spikes. Human gate on SPIKE.md files.
