/**
 * Pure markdown generators (review.md, per-issue md, GitHub body). These are
 * deterministic, dependency-light functions with exhaustive unit tests against
 * the exact formats in docs/04.
 *
 * Implemented in UXL-EXPORT-001 (Phase 3). Kept as a typed placeholder so the
 * workspace, typecheck, build, and test wiring exist from Session 0.
 */

export const MARKDOWN_PACKAGE = "@uxcue/markdown" as const;

export function renderReviewMarkdown(): never {
  throw new Error("renderReviewMarkdown is implemented in UXL-EXPORT-001");
}
