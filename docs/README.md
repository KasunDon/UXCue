# UXLens Planning Pack

Date: 2026-07-04

UXLens is a browser-based design QA helper for AI-assisted frontend work. It lets a reviewer click broken UI, capture rich browser context, create and track UXLens issues locally or in UXLens Cloud, and optionally sync selected issues to GitHub.

The important product decision is that UXLens owns the review workflow. GitHub is an integration, not the required system of record.

## Product Thesis

UXLens turns visual QA into agent-ready work.

Reviewer workflow:

1. Open any local, staging, or production web app.
2. Toggle capture mode in the Chrome extension.
3. Click an element or create a page-level note.
4. Write rough feedback.
5. UXLens captures screenshot, URL, selector, DOM, styles, viewport, and environment.
6. UXLens creates a tracked issue with an agent-ready markdown brief.
7. The user keeps issues local, syncs them to UXLens Cloud, exports markdown/JSON, or creates GitHub issues.

## Planning Docs

- [01-product-strategy.md](01-product-strategy.md): positioning, users, product principles, success metrics.
- [02-mvp-breakdown.md](02-mvp-breakdown.md): MVP scope, milestones, acceptance criteria, exclusions.
- [03-agent-stories.md](03-agent-stories.md): implementation-ready stories and work packages for coding agents.
- [04-data-model-and-exports.md](04-data-model-and-exports.md): local issue format, JSON schema, markdown export shape, GitHub issue body.
- [05-cloud-console-and-infra.md](05-cloud-console-and-infra.md): AWS architecture, Terraform layout, API, auth, storage, cost guardrails.
- [06-ux-ui-design.md](06-ux-ui-design.md): simplified UX, screens, states, layout, visual design direction.
- [07-testing-release-and-smoke.md](07-testing-release-and-smoke.md): Playwright e2e, smoke tests, CI gates, Chrome Web Store readiness.
- [08-public-launch-backlog.md](08-public-launch-backlog.md): backlog from MVP to public world-ready release.
- [09-agent-integrations-mcp-github.md](09-agent-integrations-mcp-github.md): GitHub, MCP, and AI coding agent integration plan.
- [10-research-landscape.md](10-research-landscape.md): competitive and technical research notes.
- [11-refined-prd.md](11-refined-prd.md): refined product requirements for extension, local issues, cloud console, GitHub, and MCP.
- [12-prioritized-backlog.md](12-prioritized-backlog.md): backlog organized by release, priority, dependencies, and acceptance.
- [13-validation-plan.md](13-validation-plan.md): dogfood, user research, metrics, and validation loops.
- [14-decision-log.md](14-decision-log.md): architectural/product decisions and open questions.
- [15-cloud-product-model.md](15-cloud-product-model.md): cloud account model, plans, quotas, sync policy, and cost guardrails.
- [16-competitor-references.md](16-competitor-references.md): competitor reference catalog with links, overlap, gaps, and refinement prompts.
- [17-naming-and-monetization.md](17-naming-and-monetization.md): naming shortlist, domain checks, recommendation, and free-now/paid-later product packaging.
- [18-brand-guidelines.md](18-brand-guidelines.md): research-backed brand, typography, color, theme, and visual-design guidance for a bold but low-noise developer product.
- [19-research-round-2.md](19-research-round-2.md): round-2 technical validation — capture quota, Playwright decision, GitHub image-upload block, activeTab semantics (source of D011–D013).
- [20-claude-code-handover.md](20-claude-code-handover.md): implementation handover precursor — repo layout, CLAUDE.md draft, session strategy (superseded in sequencing by docs/21).
- [21-build-handover.md](21-build-handover.md): authoritative work order — sequences the pack, agent-agnostic prime directive (D014), phase plan, definition of done.
- [22-cross-browser-backlog.md](22-cross-browser-backlog.md): Chrome-first + platform adapter rule (D015) and the gated Release 6 cross-browser track.
- [23-competitor-update-vscode-browser.md](23-competitor-update-vscode-browser.md): VS Code integrated-browser "Add to Chat" competitor analysis; merged into 16/10/01/13.
- [24-launch-backlog-landing-webstore.md](24-launch-backlog-landing-webstore.md): Release 7 — landing page + Chrome Web Store publishing; Phase 7 in docs/21.

## Build Handover

The pack is now in **build mode** (D009 flipped). The authoritative work order is [21-build-handover.md](21-build-handover.md); [14-decision-log.md](14-decision-log.md) is the tiebreaker — never contradict a decision, add to Open Decisions instead.

## Core Decisions

- Extension: Chrome Manifest V3, TypeScript, React side panel, content scripts, service worker.
- Local data: IndexedDB for issues/screenshots, `chrome.storage.local` for preferences, `chrome.storage.sync` only for small non-sensitive preferences if needed.
- Cloud: optional UXLens account with Google SSO through Cognito or a compatible OIDC auth layer.
- Infra: Terraform-managed AWS serverless stack using free-tier-friendly services and budget alarms.
- Console: web console for projects, sessions, issue review, exports, GitHub integration, account management.
- GitHub: separate optional integration; create/link/sync GitHub issues from UXLens issues.
- MCP: later bridge for agents to list/read/resolve UXLens issues; not required for the MVP capture loop.
- Agent-agnostic output (D014): no vendor agent names in code, schema, or exports; role-based `assigneeHint`; `.uxcue/` repo drop-in.
- Tests: Playwright e2e and smoke tests (D007 revised), with Chrome for Testing or Chromium for extension-loaded runs.

## External References Checked

- Chrome side panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome identity API: https://developer.chrome.com/docs/extensions/reference/api/identity
- Chrome storage API: https://developer.chrome.com/docs/extensions/reference/api/storage
- Chrome tabs API, including screenshots and permissions: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome Web Store publishing: https://developer.chrome.com/docs/webstore/publish
- Playwright docs: https://playwright.dev/docs/intro
- Playwright Chrome extensions testing guide: https://playwright.dev/docs/chrome-extensions
- Playwright test runner / fixtures: https://playwright.dev/docs/test-fixtures
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Lambda pricing/free tier: https://aws.amazon.com/lambda/pricing/
- Amazon API Gateway pricing/free tier: https://aws.amazon.com/api-gateway/pricing/
- Amazon DynamoDB pricing/free tier: https://aws.amazon.com/dynamodb/pricing/
- Amazon Cognito pricing/free tier: https://aws.amazon.com/cognito/pricing/
- Amazon Cognito social identity providers: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html
- GitHub create issue API: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#create-an-issue
- GitHub Apps overview: https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps
- GitHub OAuth Apps authorization: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub MCP server: https://github.com/github/github-mcp-server
- Terraform language docs: https://developer.hashicorp.com/terraform/language

## Free-Tier Note

AWS free-tier terms changed over time and should be rechecked before deployment. As of the research date, AWS advertises a credit-based Free plan for new accounts and several service-level free tiers. The infra plan uses low-traffic serverless components, explicit budget alarms, lifecycle policies, and conservative defaults so a prototype can stay close to zero cost, but public launch should be treated as a paid production system with limits.
