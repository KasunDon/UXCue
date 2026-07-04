# Validation Plan

## Purpose

UXCue should be validated around one central question:

> Does it help an AI coding agent fix UI/UX defects with less clarification?

Generic signups, exports, and issue counts are secondary. The first important proof is whether the generated issue artifact improves agent success.

## Core Hypotheses

### H1: Reviewers capture faster with point-and-comment

Claim:

- A reviewer can capture a useful UI defect in under 20 seconds after choosing the element.

Test:

- Dogfood on 3 apps.
- Measure time from capture toggle to saved issue.

Pass:

- Median under 20 seconds.
- No issue requires manual screenshot handling.

### H2: Agent-ready markdown reduces clarification

Claim:

- AI coding agents can fix most captured UI defects from UXCue markdown plus screenshots without follow-up.

Test:

- Capture 10 issues.
- Give review bundle to Claude Code/Codex/Cursor.
- Count issues fixed without "where is this?" or "which element?" follow-up.

Pass:

- At least 8/10 fixed without clarification.

### H3: Local-first is meaningful

Claim:

- Users value capture/export without creating an account.

Test:

- Ask dogfood users which mode they prefer for first run:
  - local-only.
  - cloud sign-in.
  - GitHub-first.

Pass:

- At least half prefer or appreciate local-only for first use.

### H4: GitHub is useful but should remain optional

Claim:

- Users want GitHub issue creation for selected issues, not necessarily every captured issue.

Test:

- Dogfood session with 10 issues.
- Ask user to choose which should become GitHub issues.

Pass:

- Users create GitHub issues for a subset, not all, supporting optional/manual workflow.

### H5: Cloud console is valuable after capture quality is proven

Claim:

- Cloud is mainly useful for cross-device, sharing, and persistent review history.

Test:

- Interview users after local export dogfood.
- Ask what they would sync/share and with whom.

Pass:

- Clear demand for at least one of:
  - cross-device continuation.
  - shareable review.
  - team handoff.
  - GitHub integration management.

## Dogfood Apps

Recommended test targets:

- `kdon.dev`.
- KtKAI console.
- Any internal tool with authenticated routes.
- A deliberately built fixture app for deterministic test issues.

## Dogfood Script

1. Install local extension build later.
2. Create project.
3. Create review session.
4. Capture 10 issues across at least 4 pages.
5. Export markdown/JSON/screenshots.
6. Feed markdown to one coding agent.
7. Create 2 GitHub issues from selected UXCue issues.
8. Track outcomes:
   - fixed without clarification.
   - fixed after clarification.
   - wrong element changed.
   - not fixed.
9. Record missing metadata or confusing issue fields.

## User Interview Script

Target users:

- Solo AI-first builder.
- Frontend engineer.
- Designer/product reviewer.
- Small agency developer.

Questions:

1. How do you currently report UI defects to coding agents?
2. What gets lost when describing UI problems in text?
3. Would you prefer local-only, cloud, or GitHub-first on first use?
4. What would make you trust screenshot/cloud sync?
5. Which fields are essential in a generated issue?
6. Would you create GitHub issues for every capture or only selected issues?
7. Would you pay for cloud sync/share/GitHub integration?
8. What would make this feel meaningfully better than BugHerd/Marker.io?
9. Do you use VS Code's integrated browser Add-to-Chat? What happens to that captured context after the chat session ends?

## Quantitative Metrics

Capture metrics:

- Time to save issue.
- Number of fields manually edited.
- Screenshot success rate.
- Selector uniqueness rate.
- Export success rate.

Agent outcome metrics:

- Fix success without clarification.
- Wrong-element fix rate.
- Number of follow-up questions.
- Time from issue handoff to patch.
- Number of issues agent skipped.

Product metrics:

- Local sessions created.
- Issues per session.
- Exports per session.
- Cloud sync opt-in rate.
- GitHub issue creation rate.
- Return sessions per user.

Reliability metrics:

- Local save failure rate.
- Screenshot failure rate.
- Sync failure rate.
- API error rate.
- GitHub API failure rate.

## Qualitative Signals

Good signs:

- "I can just hand this to Codex/Claude."
- "I do not need to explain where the issue is."
- "The markdown is useful by itself."
- "I like that I do not need an account first."
- "I only want GitHub after triage."

Bad signs:

- "This feels like BugHerd but less polished."
- "I still had to rewrite every issue."
- "The screenshots are not enough."
- "The selector/style data is too noisy."
- "I do not trust it with staging screenshots."

## Beta Acceptance Gates

Before public beta:

- 3 successful dogfood sessions.
- 30+ total captured issues.
- 20+ issues handed to AI agents.
- 70%+ agent fix success without clarification.
- 0 known local data-loss bugs.
- Cloud sync does not block local capture.
- GitHub is optional and manually controlled.

## Research Backlog

- Verify Chrome Web Store naming/collision.
- Check whether GitHub issue image upload through official APIs has improved.
- Validate Cognito Google SSO extension callback setup.
- Validate Chrome side panel UX on Windows/macOS/Linux.
- Compare issue body quality against BugHerd MCP output if accessible.
- Test whether AI agents prefer one big `review.md` or one issue file at a time.
- Test screenshot link versus local screenshot file references.
- Test style metadata noise threshold.

## Experiment Ideas

### Markdown A/B

Compare:

- Full metadata issue.
- Short issue plus screenshot.
- Structured actual/expected/target/fix brief.

Measure:

- Agent clarification rate.
- Wrong-element edits.
- Patch quality.

### GitHub Timing

Compare:

- Create GitHub issue immediately after capture.
- Keep in UXCue until reviewed, then create selected issues.

Measure:

- Number of junk GitHub issues.
- User satisfaction.
- Cleanup burden.

### Cloud Prompt

Compare:

- First-run local-only default.
- First-run sign-in prompt.

Measure:

- Completion of first capture.
- Sign-in abandonment.
- Trust comments.

## Decision Thresholds

Build more cloud when:

- Users complete local reviews and ask for sharing/sync.

Build more GitHub when:

- Users repeatedly export issues into GitHub manually.

Build MCP when:

- Markdown/JSON export works, and users want agents to pull issues automatically.

Do not build team billing until:

- At least 5 teams/users outside owner workflow complete real review sessions.
