# Competitor References

Research date: 2026-07-04

This file is a refinement aid. It lists direct, near, and adjacent competitors with links, product notes, overlap with UXCue, gaps, and lessons to borrow or avoid.

## How To Use This Doc

Use this when refining:

- Positioning.
- MVP scope.
- Feature priorities.
- Pricing.
- Extension permissions.
- Cloud account model.
- GitHub/MCP integration.
- Web Store copy.

The goal is not to clone competitors. The goal is to identify where the category already has mature expectations and where UXCue can be meaningfully different.

## Category Map

| Category | Tools | What Buyers Expect |
| --- | --- | --- |
| Visual website feedback | BugHerd, Marker.io, Ruttl, Usersnap, Userback | Point/click feedback, screenshots, annotations, task lists, integrations |
| Bug reporting with technical context | Jam, Marker.io, Userback, Usersnap | Browser/device metadata, console logs, network logs, repro steps, replay/video |
| AI-agent feedback bridges | BugHerd MCP, Userback MCP content, Jam MCP | AI can read feedback context and act/update tasks |
| Agentic coding/browser tools | Stagewise, Claude/Chrome-style tools, GitHub MCP/Agent workflows | Agents inspect apps/repos and perform fixes |
| Product feedback platforms | Userback, Usersnap | Feedback portals, surveys, voting, full feedback loop |

## Direct And Near Competitors

### BugHerd

Reference:

- https://bugherd.com/
- https://bugherd.com/feature/mcp

Positioning:

- Website feedback and task board for agencies and teams.
- Client feedback, visual annotations, technical context, Kanban/task workflow.
- MCP beta connects feedback queues to AI coding tools.

Notable claims/features from public pages:

- BugHerd MCP connects with major AI coding tools including Claude Code, Cursor, ChatGPT, VS Code/Copilot, Windsurf, Codex CLI, Gemini CLI, Zed, and others.
- AI can list/read/update tasks, add comments, create tasks/projects, and work from feedback context.
- AI task context includes comment, screenshot/recording, URL, CSS selector, browser/OS, severity, assignees, due date, tags, visibility, and comment history.
- BugHerd claims 10,000+ companies and 350,000+ users.

Overlap with UXCue:

- Visual website feedback.
- Screenshots.
- URL/browser context.
- Task status/severity.
- AI-agent handoff.
- MCP.

Gaps UXCue can target:

- Local-first capture with no SaaS account.
- Markdown/JSON portability as a first-class artifact.
- Developer-owned issue object instead of agency board.
- Richer DOM/style/component metadata aimed at code agents.
- GitHub optional sync, not project board lock-in.
- Better fit for solo AI-first frontend builders.

Borrow:

- "AI reads task context and acts" framing.
- Clear task states.
- Role-specific examples.
- MCP tool clarity.

Avoid:

- Becoming agency-board-first.
- Making cloud/account mandatory.
- Over-focusing on client approval workflow before developer-local workflow works.

Refinement prompt:

> Why would someone choose UXCue instead of BugHerd MCP for a localhost/staging design QA pass?

### Marker.io

Reference:

- https://marker.io/

Positioning:

- Website feedback, bug reporting, and UAT tool.
- Strong issue-tracker integrations.

Notable public-page signals:

- Integrates with issue trackers including Jira, GitHub, GitLab, Azure DevOps, Linear, and Bitbucket.
- Also lists integrations like LogRocket, FullStory, BrowserStack, Slack, Trello, Asana, ClickUp, and others.

Overlap with UXCue:

- Browser-based visual feedback.
- Bug report generation.
- Issue tracker integration.
- UAT/design review workflows.

Gaps UXCue can target:

- AI-agent-ready markdown and JSON.
- Local-first workflow.
- DOM/style/component capture for code agents.
- Direct design QA taxonomy.
- UXCue issue tracking before external issue creation.

Borrow:

- Integration expectations.
- UAT language.
- Clean bug report workflow.

Avoid:

- Generic integrations as the main differentiation.
- Becoming just another route-to-Jira/GitHub tool.

Refinement prompt:

> What extra context does an AI coding agent need that a normal Marker.io-style bug report does not provide?

### Jam

Reference:

- https://jam.dev/

Positioning:

- One-click bug reports developers love.
- Browser extension with technical debugging context.
- Strong around logs, repro, replay, and integrations.

Notable public-page signals:

- Claims 200k+ users and 17M+ Jams.
- Auto-captures device/browser, console logs, network logs, repro steps, backend tracing.
- Supports browser extension workflow.
- Integrations listed include GitHub, GitLab, Jira, Linear, Slack, Sentry, Figma, FullStory, Datadog, and others.
- Public page references Jam MCP.

Overlap with UXCue:

- Browser extension.
- Screenshot/recording/technical context.
- Bug reports developers can act on.
- AI/MCP direction.

Gaps UXCue can target:

- Design QA issue tracking rather than general bug reproduction.
- Element selector, DOM path, computed styles, parent layout, and design context.
- Local-first markdown/JSON review bundles.
- Reviewer-curated multi-issue design pass.

Borrow:

- "Never explain another bug" clarity.
- Developer-loved bug report framing.
- Automatic context capture.
- Integrations list as category expectation.

Avoid:

- Competing directly on deep replay/logging in MVP.
- Overweighting backend tracing, which is not central to visual design QA.

Refinement prompt:

> Should UXCue say "Never explain another UI defect" and focus the promise around visual/design bugs rather than all bugs?

### Userback

Reference:

- https://userback.io/

Positioning:

- User feedback software covering feedback widgets, bug reporting, surveys, session replays, feature portals, automation, and integrations.

Notable public-page signals:

- Bug reporting copy emphasizes annotated screenshots, video recordings, and console logs.
- Userback content references connecting AI tools to user feedback with Userback MCP.
- It positions itself as a broader full feedback loop with feature portal, surveys, session replays, and automation.
- Public page says modern customer feedback platforms attach screenshots, session replay, and customer attributes.

Overlap with UXCue:

- Visual feedback.
- Bug reporting.
- Screenshots/recordings/logs.
- AI/MCP direction.
- Feedback workflow tracking.

Gaps UXCue can target:

- Narrow design QA for AI code fixing.
- Local-first and export-first.
- No broad customer feedback/survey/product portal complexity.
- Rich element metadata.

Borrow:

- "Complete loop" concept, but narrow it to design QA issue lifecycle.
- Session replay/logs as later roadmap.
- Feedback automation as future cloud feature.

Avoid:

- Building feature portals/surveys before UI defect capture is excellent.
- Becoming a general customer feedback platform.

Refinement prompt:

> Is UXCue a customer feedback platform? No. Keep it as design QA to agent work order.

### Usersnap

Reference:

- https://usersnap.com/

Positioning:

- Product feedback platform for product discovery/delivery lifecycle.
- User feedback, surveys, visual feedback capture, AI analysis, integrations.

Notable public-page signals:

- Public page mentions visual feedback capture with screenshots and metadata.
- Lists labeling/tagging, centralized dashboards, and integrations like Jira, Azure DevOps, Trello, Slack, GitHub, and many more.
- AI sidekick "Airis" is positioned for categorizing feedback and surfacing trends.

Overlap with UXCue:

- Visual feedback capture.
- Screenshots and metadata.
- Feedback analysis and categorization.
- Dashboards and integrations.

Gaps UXCue can target:

- Agent-ready issue bodies.
- Local-first/private workflow.
- Design QA taxonomy and code-fix context.
- Avoiding product discovery/survey sprawl.

Borrow:

- Evidence-driven language.
- Tagging/triage workflows.
- Dashboard and trend concepts for later cloud console.

Avoid:

- Broad product-discovery platform scope in MVP.

Refinement prompt:

> What if UXCue becomes "evidence for agents" rather than "evidence for product decisions"?

### Ruttl

Reference:

- https://www.ruttl.com/

Positioning:

- Design feedback tool for live websites, mobile apps, web apps, images, and PDFs.
- Strong design/client review flavor.

Notable public-page signals:

- "One tool for all types of website feedback."
- Supports website feedback, mobile app feedback, image/PDF feedback.
- Mentions pixel-level feedback, comments, task assignment, priorities, deadlines, and integrations such as Trello, Slack, Asana, Jira, Zapier, ClickUp.
- Ruttl AI claims analysis/suggestions/optimization, sentiment analysis, performance recommendations, and coming accessibility/SEO checks.

Overlap with UXCue:

- Design feedback.
- Pixel-level comments.
- Review workflow.
- AI suggestions.
- Accessibility/performance hints.

Gaps UXCue can target:

- AI coding agent work orders.
- Local-first extension.
- DOM/style/component metadata.
- GitHub/markdown/JSON portability.

Borrow:

- Pixel-perfect design QA language.
- Support for visual accessibility checks as roadmap.
- Simple client/reviewer comment workflow.

Avoid:

- Expanding into PDFs/images/mobile before web app UI defects work.

Refinement prompt:

> Should UXCue call itself "design QA for web apps" instead of generic "website feedback"?

### VS Code Integrated Browser / Copilot Chat Context

Research date: 2026-07-04 (see docs/23 for the full write-up)

Reference:

- VS Code integrated browser (View > Browser), "Add to Chat" split button; `chat.sendElementsToChat.*` settings; agent browser tools (`workbench.browser.enableChatTools`), GA and default-on since VS Code 1.110 (Feb 2026), full debugging in 1.112 (Mar 2026).

Positioning:

- An Electron-embedded browser inside the editor. "Add to Chat" attaches (a) an element with its CSS + screenshot, (b) a viewport screenshot, or (c) console logs — all into the **Copilot Chat** prompt. Agent browser tools let agents open/navigate/read/screenshot/click pages and run Playwright, no external MCP.

The catch (the differentiation seam):

- All three "Add to Chat" actions feed the Copilot-native pipeline. There is no documented path for that captured context to reach Claude Code, Codex CLI, Cursor, or any non-Copilot agent — the capture is welded to one vendor's chat surface, and it is ephemeral (no tracked issue survives the chat). This is exactly the failure mode D014 exists to avoid.

Overlap vs UXCue:

| Capability | VS Code integrated browser | UXCue |
| --- | --- | --- |
| Element + CSS + screenshot capture | Yes | Yes |
| Console logs | Yes (attach action) | Post-MVP (correlated per issue) |
| Works in the user's real Chrome (profile, extensions, real sessions) | No — Electron-embedded browser in the editor | Yes |
| Reviewer outside the editor (designer/PM/QA) | No — must run VS Code | Yes — browser-native |
| Persistent tracked issues (IDs, severity, type, status) | No — ephemeral chat context | Yes — core object |
| Multi-page review sessions, accumulate then hand over | No | Yes — core workflow |
| Portable artifact (markdown/JSON/zip) usable outside the tool | No | Yes — the API of the product |
| Agent-agnostic (any coding agent) | No — Copilot Chat only | Yes — D014 |
| GitHub issue generation | No | Yes (optional) |
| Local-first privacy story | Partial (local editor, context flows to Copilot backend) | Yes |

Strategic read:

- Validation, not invalidation — Microsoft building element→chat capture natively confirms the workflow is valuable and educates the market for free.
- The wedge sharpens to three words: **tracked, portable, agent-agnostic**. VS Code turns a visual observation into an ephemeral prompt for one vendor's agent; UXCue turns it into a durable, exportable issue any agent (or human) can work from, captured in the user's real browser without opening an editor.
- Positioning caution: do not claim "capture element context for AI" as novel — it no longer is. Claim the review workflow.
- Watch items (re-check quarterly): (a) VS Code adding "save captured elements as work items" or Copilot CLI gaining the browser capture surface would grow the overlap; (b) agent browser tools slightly shrink the solo-dev-on-localhost segment — UXCue's strongest segments remain staging/prod review, non-editor reviewers, multi-issue passes, and multi-agent teams.
- Borrow: the one-click "Add Console Logs" is good UX — reinforces the planned per-issue console correlation (P2 diagnostics), not a raw log dump.

Refinement prompt:

> Do you use VS Code's integrated browser Add-to-Chat? What happens to that captured context after the chat session ends?

## Adjacent Competitors And Ecosystem

### Stagewise

References:

- https://stagewise.io/
- https://github.com/stagewise-io/stagewise

Positioning:

- Open-source agentic IDE.
- Coding agent orchestration, app previews, git workflows, model/provider flexibility.

Overlap with UXCue:

- AI coding workflow.
- Browser/app inspection adjacency.
- Developer productivity.

Gaps UXCue can target:

- Reviewer-owned issue capture.
- Multi-issue design QA sessions.
- Exportable issue evidence.

Relationship:

- More likely future integration/consumer than direct replacement.

Refinement prompt:

> Could UXCue export a session that stagewise or another agentic IDE can consume?

### GitHub Issues / GitHub MCP

References:

- https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#create-an-issue
- https://github.com/github/github-mcp-server

Positioning:

- GitHub Issues is the engineering work tracker for many projects.
- GitHub MCP already exposes GitHub operations to agents.

Overlap with UXCue:

- Issue creation.
- Agent work assignment.
- Status and PR linkage.

Gaps UXCue can target:

- Better source issue context before GitHub issue creation.
- Screenshots, selector, computed style, DOM, viewport, design brief.
- Local/cloud UXCue issue state before external sync.

Relationship:

- GitHub is an optional destination, not a competitor to the core capture experience.

Refinement prompt:

> Is GitHub the source of truth or a publication target? Current decision: publication/sync target.

### AI Coding Agents (any vendor)

References:

- Any AI coding agent (e.g., Claude Code, Codex, Cursor, Windsurf, GitHub Copilot) is an expected consumer of UXCue output. No vendor is privileged — the export is the vendor-neutral API (D014).
- Public BugHerd MCP copy explicitly targets many of these tools.

Positioning:

- Agents execute code changes.

Overlap with UXCue:

- They may inspect browser/app context directly in some workflows.

Gaps UXCue can target:

- Reviewer-driven capture.
- Accumulated review session.
- Stable evidence artifact.
- Human-curated design QA backlog.

Relationship:

- UXCue should feed these agents, not compete with them.

Refinement prompt:

> What issue format gives a code agent the best chance to fix the right element on the first try?

## Feature Comparison Matrix

| Capability | BugHerd | Marker.io | Jam | Userback | Usersnap | Ruttl | UXCue Target |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browser/website visual feedback | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Screenshot capture | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Annotation/comment workflow | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Task/issue tracking | Yes | Via integrations/own workflow | Yes/link based | Yes | Yes | Yes | Yes |
| GitHub integration | Yes | Yes | Yes | Likely integrations | Yes | Via integrations | Optional |
| Local-only mode | No/limited | No/limited | No/limited | No/limited | No/limited | No/limited | Yes |
| Markdown/JSON as first-class export | Unclear | Unclear | Link/report oriented | Unclear | Unclear | Unclear | Yes |
| AI/MCP | Yes | Not primary from checked page | Yes/MCP referenced | MCP content referenced | AI analysis | AI suggestions | Later, UXCue-native |
| DOM selector | Yes in BugHerd MCP context | Unknown from homepage | Debug context, not primary design selector | Unknown | Metadata | Unknown | Yes |
| Computed style/design context | Unknown | Unknown | Not primary | Unknown | Unknown | Unknown | Yes |
| Component hints | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Best effort |
| Design QA taxonomy | Partial | Partial | Bug-oriented | Broad feedback | Broad feedback | Strong design feedback | Yes |
| Cloud account | Yes | Yes | Yes | Yes | Yes | Yes | Optional |
| No target-app install/widget | Browser extension likely/varies | Widget/extension | Browser extension | Widget | Widget/forms | Website/project setup | Yes, extension-first |

## Differentiation Tests

UXCue should be able to answer these better than competitors:

1. Can I review a localhost app without setting up a SaaS project first?
2. Can I export the entire review as markdown and JSON for an AI coding agent?
3. Does each issue include selector, DOM path, computed styles, parent layout, viewport, and screenshot?
4. Can I keep all review data local unless I opt into cloud sync?
5. Can I create GitHub issues only after triage?
6. Can the agent fix the issue without asking which element or route?

## Positioning Options To Test

### Option A: Agent-Ready UI Defect Reports

> Click broken UI, get an agent-ready issue.

Pros:

- Clear and short.
- Strong AI-agent angle.

Cons:

- May undersell tracking/cloud console.

### Option B: Local-First Design QA Tracker

> A local-first design QA tracker for AI-assisted frontend work.

Pros:

- Strong differentiation from SaaS feedback boards.

Cons:

- Less obvious to non-technical buyers.

### Option C: Visual QA To GitHub Issues

> Turn visual QA into GitHub issues that coding agents can fix.

Pros:

- Concrete output.

Cons:

- Makes GitHub sound required, which is not the product decision.

Recommended:

> UXCue turns visual QA into agent-ready issues. Capture UI defects locally, sync when needed, and export to markdown, JSON, GitHub, or MCP.

## Competitor-Driven Backlog Refinements

Add or keep:

- P0 local-only capture/export because competitors are mostly SaaS/account-first.
- P0 markdown/JSON because competitors are mostly board/link/integration-first.
- P0 rich DOM/style metadata because normal bug reports already cover screenshots/logs.
- P1 GitHub create/link because issue tracker integrations are table stakes.
- P1 selector re-verification because BugHerd MCP already mentions CSS selectors.
- P2 console/network logs because Jam/Userback set expectations around debug context.
- P2 a11y/contrast checks because Ruttl AI points toward design-quality checks.
- P2 share links because most cloud feedback tools support easy sharing.
- P3 session replay because Jam/Userback have strong replay/logging expectations.

Deprioritize:

- Surveys.
- Feature portals.
- Client approval flows.
- PDFs/images/mobile feedback.
- Broad project management.
- Backend tracing.

## Research To Refresh Later

Before public beta, re-check:

- BugHerd MCP pricing and public availability.
- Jam MCP capabilities and whether agent task update is available.
- Marker.io AI/agent roadmap.
- Userback MCP details.
- Chrome Web Store competitor listings for exact extension permissions and reviews.
- Whether GitHub issue image attachment APIs or workflow changed.
- Whether a competitor added markdown/JSON export or local-first mode.

## Source Links

- BugHerd MCP: https://bugherd.com/feature/mcp
- BugHerd: https://bugherd.com/
- Marker.io: https://marker.io/
- Jam: https://jam.dev/
- Userback: https://userback.io/
- Usersnap: https://usersnap.com/
- Ruttl: https://www.ruttl.com/
- Stagewise: https://stagewise.io/
- Stagewise GitHub: https://github.com/stagewise-io/stagewise
- GitHub create issue API: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#create-an-issue
- GitHub MCP server: https://github.com/github/github-mcp-server
