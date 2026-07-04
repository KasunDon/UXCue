# Research Landscape

Research date: 2026-07-04

Purpose: understand whether UXLens is late, where existing tools overlap, and which wedge is still worth building.

## Summary

The market already has strong tools for website visual feedback and increasingly has AI-agent integrations. BugHerd MCP is the most direct competitive threat because it connects visual feedback tasks to AI coding tools. Marker.io is close as a mature bug reporting/UAT tool, but it is more issue-tracker-integration oriented. Stagewise and agentic IDE/browser tools are adjacent: they help agents inspect and change apps, but they are not primarily reviewer-owned design QA issue trackers.

UXLens should not compete as "another visual feedback board." It should compete as:

> Local-first design QA capture that creates agent-ready UXLens issues, with optional cloud sync, GitHub sync, markdown/JSON export, and later MCP.

## Competitor Snapshot

| Tool | Category | Strong At | Gap UXLens Can Target |
| --- | --- | --- | --- |
| BugHerd | Visual feedback and task board | Client website feedback, Kanban, screenshots, metadata, integrations, MCP beta | Agency/project-board-first; not local-first; not focused on markdown/JSON portability or developer-owned issue objects |
| BugHerd MCP | AI-agent feedback bridge | Lets AI agents read tasks, screenshots, URL, selector, severity, comments, and update tasks | Tied to BugHerd account/workflow; UXLens can be lighter, local-first, GitHub/export-first |
| Marker.io | Bug reporting/UAT | Reporter widget/extension, screenshots, technical metadata, issue tracker integrations | Not agent-first; less focused on DOM/style/component metadata and markdown work orders |
| Stagewise | Agentic IDE/browser | Orchestrates coding agents, app previews, git workflows, model/provider choice | More execution environment than review capture; not a design QA issue tracker |
| Claude/Chrome/browser inspector tools | Agent debugging | Live DOM/console/browser context for an agent | Agent-driven and session-bound; weak for reviewer accumulating a structured review backlog |
| VS Code integrated browser "Add to Chat" | Agentic editor capture | Native element + CSS + screenshot + console capture into chat | **Copilot lock-in** — captured context flows only to Copilot Chat, not to any other agent; ephemeral (no tracked issue), editor-only (no non-editor reviewer). This vendor lock is the differentiation seam UXCue's D014 targets. See docs/16 and docs/23 |
| GitHub Issues + Copilot/Agents | Engineering issue execution | Issues become natural agent tasks | GitHub issues need high-quality context; UXLens can generate that context |

For a fuller competitor catalog with reference URLs, differentiation notes, and refinement prompts, see [16-competitor-references.md](16-competitor-references.md).

## BugHerd Research Notes

Source: https://bugherd.com/feature/mcp

Relevant findings:

- BugHerd MCP is positioned as "your AI agent just joined the team."
- It connects website feedback queues to major AI coding tools, including Claude Code, Cursor, ChatGPT, VS Code/Copilot, Windsurf, Codex CLI, Gemini CLI, Zed, and others.
- It says AI can list tasks, read task details, triage, update tasks, create tasks/projects, and add comments.
- Task context includes comments, screenshot/recording, URL, CSS selector, browser/OS, severity, assignees, due dates, tags, visibility, and comment history.
- BugHerd claims 10,000+ companies and 350,000+ users.

Implication:

- UXLens cannot pretend MCP plus screenshots is unique.
- UXLens needs sharper differentiation: local-first, issue portability, richer frontend context, design QA specialist UX, and optional integrations.

## Marker.io Research Notes

Source: https://marker.io/

Relevant findings:

- Marker.io positions around website feedback, bug reporting, and UAT.
- Its value is collecting visual bug reports and sending them to tools teams already use.
- The mature category expectation is screenshots, browser metadata, URL, console/network/session replay in some plans, and integrations with trackers.

Implication:

- UXLens should avoid competing on generic "send feedback to Jira/GitHub."
- UXLens should make the generated issue brief dramatically more useful to AI agents.

## Stagewise Research Notes

Sources:

- https://stagewise.io/
- https://github.com/stagewise-io/stagewise

Relevant findings:

- Stagewise describes itself as an open-source agentic IDE.
- It focuses on creating/orchestrating coding agents, app previews, git workflows, and using preferred models/providers.
- It is closer to an execution/orchestration environment than a standalone review-capture backlog.

Implication:

- UXLens should integrate with tools like Stagewise later, not try to become the IDE.
- UXLens owns capture, evidence, and issue quality.

## GitHub And Agent Research Notes

Sources:

- GitHub create issue API: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#create-an-issue
- GitHub MCP server: https://github.com/github/github-mcp-server

Relevant findings:

- GitHub issues can be created via API with title/body/labels/assignees when permissions allow.
- GitHub already has an official MCP server, so UXLens does not need to re-create generic GitHub operations.

Implication:

- UXLens GitHub integration should create excellent issues, not become a GitHub client.
- UXLens MCP should expose UXLens-native capture data, screenshots, and review sessions.

## Chrome Extension Research Notes

Sources:

- Side panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Identity API: https://developer.chrome.com/docs/extensions/reference/api/identity
- Storage API: https://developer.chrome.com/docs/extensions/reference/api/storage
- Tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome Web Store publishing: https://developer.chrome.com/docs/webstore/publish

Relevant findings:

- Side panel is a good fit for the persistent issue queue.
- `chrome.identity` and OAuth web flows can support extension login.
- `chrome.storage.local` and IndexedDB-style local data should hold local issues; `storage.sync` is not appropriate for screenshots or large issue data.
- `chrome.tabs.captureVisibleTab` is the practical screenshot foundation.
- Web Store publishing requires careful permission and privacy disclosure.

Implication:

- Local-first data and explicit cloud sync should be treated as a product feature and a privacy story.
- Permissions must be designed early, not after implementation.

## AWS And Cloud Research Notes

Sources:

- AWS Free Tier: https://aws.amazon.com/free/
- Lambda pricing: https://aws.amazon.com/lambda/pricing/
- API Gateway pricing: https://aws.amazon.com/api-gateway/pricing/
- DynamoDB pricing: https://aws.amazon.com/dynamodb/pricing/
- Cognito pricing: https://aws.amazon.com/cognito/pricing/
- Cognito social IdP docs: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html

Relevant findings:

- Serverless AWS can support a low-cost prototype.
- Free-tier details are not a product guarantee and can change.
- Cognito can support Google social sign-in.

Implication:

- Terraform should include budgets, quotas, and lifecycle policies from the first cloud stack.
- UXLens Cloud should start with conservative limits and be explicit about sync/storage.

## Opportunity Wedge

UXLens should focus on these advantages:

- No target-app widget required.
- Local-only mode from day one.
- UXLens issues are portable as markdown/JSON.
- Cloud is optional and attached to account, not required for capture.
- GitHub authorization is separate and optional.
- Agent output quality is the measurable product metric.
- Design QA categories are first-class, not generic task labels.

## Product Anti-Wedges

Avoid:

- Building a generic PM board.
- Building a SaaS-only client feedback widget.
- Making GitHub required.
- Making MCP required.
- Competing with Stagewise/Cursor/Codex as the code execution environment.
- Overbuilding team/billing features before issue quality is proven.

## Current Strategic Conclusion

It is not too late if UXLens is better in a narrower way.

The product should be:

- Smaller than BugHerd.
- More local/private than Marker.io.
- More review-focused than stagewise.
- More portable than any SaaS board.
- More useful to coding agents than a normal issue.
