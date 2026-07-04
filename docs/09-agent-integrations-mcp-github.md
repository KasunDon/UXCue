# Agent Integrations: GitHub And MCP

## Integration Philosophy

UXLens issues are the source of truth. Integrations move or expose those issues, but they do not replace them.

Priority order:

1. Portable markdown/JSON.
2. Optional GitHub issue creation.
3. Optional MCP access for agents.
4. Later two-way sync and automation.

## GitHub Integration

### MVP GitHub Flow

1. User captures UXLens issue.
2. User opens issue detail.
3. User clicks `Create GitHub issue`.
4. UXLens generates title/body/labels.
5. User previews and edits.
6. User confirms.
7. UXLens creates issue through GitHub API.
8. UXLens stores URL, repo, issue number, and sync state.

### Auth Options

#### Option A: Fine-Grained PAT

Best for dogfood/MVP.

Pros:

- Fast to implement.
- No backend required if local-only.
- Easy for owner testing.

Cons:

- Poor production UX.
- Token storage in extension is sensitive.
- Harder for org permissions.

Use only for local dogfood or hidden advanced setting.

#### Option B: GitHub OAuth App

Good for early public beta.

Pros:

- Familiar OAuth connection.
- Works with UXLens Cloud account.

Cons:

- Broader permissions than GitHub App in some cases.
- Needs backend token exchange and secret storage.

#### Option C: GitHub App

Best production model.

Pros:

- Repo-scoped installation.
- Better org control.
- Fine-grained permissions.
- Cleaner for teams.

Cons:

- More setup.
- Installation flow is more complex.

Recommendation:

- MVP dogfood: PAT or simple OAuth.
- Public beta: GitHub App if time allows; otherwise OAuth with minimal scopes.
- Public launch: GitHub App preferred.

### GitHub API

Use GitHub REST create issue endpoint:

```http
POST /repos/{owner}/{repo}/issues
```

Payload:

```json
{
  "title": "[UI] Billing button wraps awkwardly",
  "body": "Generated UXLens markdown body",
  "labels": ["uxlens", "ui-defect", "severity:major"]
}
```

Notes:

- Label/assignee permissions can fail or be ignored depending on token permissions.
- UXLens should create the issue even if optional labels fail, then record a warning.
- Screenshots should be linked from UXLens Cloud signed/share URLs, uploaded to repo later, or omitted with local export fallback.

### Screenshot Strategy For GitHub

Resolved by D012 (per docs/19 F4): the GitHub API does not support issue attachments (upload endpoint is browser-session-only; rejects PAT/OAuth/App) and this is confirmed unchanged as of 2026. Use signed/hotlinked URLs or a repo commit; never browser-automation upload. The strategy below stands.

MVP:

- Include UXLens Cloud screenshot links when cloud sync is enabled.
- If local-only, include a note: `Screenshots are available in the UXLens export bundle.`

Post-MVP:

- Add GitHub issue comment with images hosted by UXLens Cloud.
- Optional repo upload under `.uxcue/screenshots/` through GitHub Contents API.
- Optional release asset or gist only if there is a clear reason.

### GitHub Sync Fields

```ts
type GitHubIssueLink = {
  provider: "github";
  owner: string;
  repo: string;
  issueNumber: number;
  url: string;
  state?: "open" | "closed";
  labels?: string[];
  createdAt: string;
  syncedAt?: string;
  lastError?: {
    code: string;
    message: string;
  };
};
```

### GitHub Acceptance Criteria

- GitHub never required for capture/export.
- User can disconnect GitHub.
- Disconnect does not delete UXLens issues.
- Create issue action is manual in MVP.
- Linked issue URL is visible in extension and console.
- GitHub API errors are understandable.

## MCP Integration

### Why MCP Later

GitHub issue creation does not require MCP. Direct API is simpler.

MCP becomes valuable when an AI coding agent needs to ask UXLens for:

- Current unresolved issues.
- Full issue metadata.
- Screenshot paths/URLs.
- Session export.
- Resolution updates.

### MCP Modes

#### Local MCP Server

Command:

```bash
npx uxcue-mcp --source .uxcue/review.json
```

or:

```bash
npx uxcue-mcp --cloud
```

Pros:

- Works with local exports.
- Good for WSL/dev workflow.
- Does not require extension to talk to agent directly.

Cons:

- User must run a local process.
- Cloud token handling must be careful.

#### Cloud MCP

Agent connects to UXLens Cloud MCP endpoint.

Pros:

- No local daemon.
- Can support teams.

Cons:

- More security and auth complexity.
- Needs public MCP deployment and token management.

Recommendation:

- Start with local MCP over exported files.
- Add cloud MCP only after product-market validation.

### MCP Tool Surface

Initial tools:

```txt
list_projects()
list_sessions(projectId?)
list_issues(sessionId, status?, severity?, type?)
get_issue(issueId)
get_issue_markdown(issueId)
get_session_export(sessionId)
get_screenshot(issueId, kind)
mark_issue_status(issueId, status, note?)
link_pull_request(issueId, url)
```

Optional later:

```txt
create_github_issue(issueId)
resolve_issue(issueId, evidence)
request_clarification(issueId, question)
get_design_brief(sessionId)
```

### MCP Security

Local file mode:

- Read-only by default.
- Mutating tools require `--allow-write`.
- Write operations update local `.uxcue/status.json` or call cloud API.

Cloud mode:

- OAuth/device auth or API token.
- Scope tokens to project/session where possible.
- Log agent writes in issue activity.

### Agent Workflow Examples

#### Batch Fix From Export

User:

```txt
Address the UXLens issues in .uxcue/review.json. Fix major issues first.
```

Agent:

1. Calls `list_issues(status=open,severity=major)`.
2. Calls `get_issue_markdown` for each issue.
3. Makes code changes.
4. Runs tests.
5. Calls `mark_issue_status(issueId, fixed, note)`.

#### Fix One GitHub-Linked Issue

User:

```txt
Fix UXLens UX-004 and update the linked GitHub issue.
```

Agent:

1. Calls `get_issue("UX-004")`.
2. Reads screenshot/metadata.
3. Fixes code.
4. Adds PR/commit link through `link_pull_request`.

## Agent-Ready Issue Quality Checklist

Every issue intended for agents should include:

- Stable ID.
- Short title.
- Actual feedback.
- Expected behavior.
- Page URL/path.
- Selector and selector confidence.
- Screenshot reference.
- Viewport.
- Relevant styles.
- Suggested fix if known.
- Constraints: preserve design tokens, existing behavior, tests where available.

## Integration Roadmap

### v0.1

- Markdown/JSON export.
- No GitHub.
- No MCP.

### v0.2

- Cloud sync.
- GitHub manual create/link.

### v0.3

- GitHub OAuth/App.
- GitHub status refresh.
- MCP design finalized.

### v0.4

- Local MCP server over export bundle.
- Agent status updates.

### v1.0+

- Cloud MCP.
- Team workflows.
- PR/commit status sync.
- Before/after screenshot evidence.
