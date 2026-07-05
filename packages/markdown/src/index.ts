/**
 * Pure markdown generators (review.md + per-issue md). Deterministic, dependency-
 * light, exhaustively unit-tested against the docs/04 formats. Agent-agnostic:
 * no vendor names, role-based assignee (D014).
 *
 * The GitHub issue-body generator is deferred with the GitHub epic (D016).
 */

export const MARKDOWN_PACKAGE = "@uxcue/markdown" as const;

export { renderReviewMarkdown, type ReviewInput } from "./review-md";
export { renderIssueMarkdown, renderIssueBlock } from "./issue-md";
