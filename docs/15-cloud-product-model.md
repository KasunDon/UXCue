# Cloud Product Model

## Product Principle

Cloud is a convenience layer, not a requirement.

UXLens should feel safe for localhost, staging, authenticated apps, and private projects. Local-only mode should be useful forever. Cloud should add sync, sharing, history, and integrations.

## Account Modes

### No Account

Capabilities:

- Capture issues.
- Store local projects/sessions/issues.
- Store local screenshots.
- Export markdown/JSON/zip.
- Possibly use manual GitHub token in advanced local mode.

Limitations:

- No cloud sync.
- No web console.
- No share links.
- No cloud-hosted screenshot links.

### UXLens Cloud Account

Login:

- Google SSO.

Capabilities:

- Sync projects/sessions/issues.
- Store screenshot assets.
- Use cloud console.
- Export from console.
- Configure GitHub integration.
- Later share review sessions.

### GitHub Connected

Login:

- Separate GitHub authorization.

Capabilities:

- Create GitHub issue from UXLens issue.
- Link GitHub issue.
- Refresh GitHub state.

Important:

- GitHub connection is not the UXLens identity.
- Disconnecting GitHub does not delete UXLens data.

## Suggested Plan Tiers

These are planning assumptions, not final pricing.

### Local Free

Price:

- Free.

Includes:

- Unlimited local projects/sessions/issues, bounded only by browser storage.
- Markdown/JSON/zip export.
- No cloud storage.

Purpose:

- Adoption.
- Trust.
- Dogfood.

### Cloud Free Alpha

Price:

- Free during alpha/beta.

Suggested limits:

- 3 cloud projects.
- 10 sessions.
- 250 cloud issues.
- 1 GB screenshot storage or lower if cost requires.
- 90-day screenshot retention for archived sessions.

Purpose:

- Validate sync and console.

### Solo Pro

Price hypothesis:

- Low monthly price later.

Includes:

- More projects/issues/storage.
- Longer screenshot retention.
- GitHub integration.
- Share links.
- MCP/local agent bridge.

### Team

Price hypothesis:

- Later.

Includes:

- Shared projects.
- Member roles.
- Comments.
- Audit history.
- Team GitHub integrations.
- Higher quotas.

Do not implement billing in MVP.

## Sync Policy

Default:

- Local-only.

Cloud sync activation:

- User signs in.
- User chooses project/session to sync.
- Extension shows what will upload:
  - issue text.
  - metadata.
  - screenshots.
  - GitHub links if present.

Sync states:

- `local-only`.
- `pending-upload`.
- `synced`.
- `conflict`.
- `error`.

Conflict default:

- Do not silently overwrite.
- Mark conflict and let user choose local/cloud.

## Screenshot Policy

Screenshots are sensitive.

Rules:

- Store locally unless user syncs to cloud.
- Cloud screenshots are private.
- Signed URLs expire quickly.
- Share links require explicit action.
- Deleted issues should eventually delete screenshot assets.
- Archived sessions can have lifecycle retention.

Redaction:

- MVP: manual warning and local-only recommendation for sensitive apps.
- Later: blur/redact selected areas.
- Later: detect likely secrets in text/attributes and exclude from metadata.

## Data Retention

Local:

- User controls deletion.
- Browser storage limitations apply.

Cloud alpha:

- Active sessions retained while account active.
- Archived screenshot assets expire after retention window unless user upgrades or exports.
- Deleted account removes DynamoDB records and S3 assets.

Production:

- Publish retention policy.
- Include account export/delete.

## Cost Guardrails

Required from first cloud environment:

- AWS Budget alarms.
- API rate limits.
- Per-user quotas.
- Screenshot max file size.
- S3 lifecycle rules.
- DynamoDB capacity/cost caps.
- CloudWatch log retention.
- Lambda timeout and reserved concurrency for dev.

Suggested alpha quotas:

- Max screenshot size: 3 MB.
- Max screenshots per issue: 2.
- Max issue metadata payload: 256 KB.
- Max issues per free cloud account: 250.
- Max API requests per user per minute: conservative default.

## Cloud Console Scope

MVP console:

- Sign in/out.
- Project list.
- Session list.
- Issue list.
- Issue detail.
- Screenshot preview.
- Markdown copy.
- Export.
- GitHub link visibility.
- Account settings.

Post-MVP:

- Share links.
- Comments.
- Bulk GitHub create.
- Team members.
- Billing.

## Privacy Copy Draft

Short version:

> UXLens stores review data locally by default. If you sign in and enable cloud sync, UXLens uploads issue text, page metadata, selected element metadata, and screenshots for the projects you choose. GitHub is a separate optional integration.

Permission copy:

> UXLens needs access to the active page only when you capture feedback, so it can identify the selected element and take a screenshot for your review issue.

GitHub copy:

> Connecting GitHub lets UXLens create or link issues in repositories you choose. It is separate from your UXLens account and can be disconnected anytime.

## Open Product Questions

- Should cloud alpha invite users only, or public behind sign-in?
- Should cloud screenshot links be shareable in GitHub issues by default?
- Should free cloud users get permanent issue metadata but expiring screenshots?
- Should local-only users be able to use GitHub with PAT, or should GitHub require cloud auth?
- Should team/workspace concepts appear in UI before team billing exists?
