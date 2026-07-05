import type { Issue } from "@uxcue/schema";
import type { Repository } from "../storage/repository";

export interface ExportWarnings {
  /** Screenshot refs whose local blob is gone. */
  missingScreenshots: { displayId: string; kind: "element" | "viewport" }[];
  /** Selectors that were not unique at capture time (docs/04 "mark stale"). */
  staleSelectors: { displayId: string; status: string }[];
}

export function hasWarnings(w: ExportWarnings): boolean {
  return w.missingScreenshots.length > 0 || w.staleSelectors.length > 0;
}

/**
 * Export validation (docs/04). Confirms every screenshot ref resolves to a local
 * blob and flags non-unique selectors. Live selector re-query needs the reviewed
 * page (not available in the side panel), so we surface the captured status.
 */
export async function validateReview(repo: Repository, issues: Issue[]): Promise<ExportWarnings> {
  const warnings: ExportWarnings = { missingScreenshots: [], staleSelectors: [] };
  for (const issue of issues) {
    for (const kind of ["element", "viewport"] as const) {
      const ref = issue.screenshots[kind];
      if (ref?.localBlobKey && !(await repo.getScreenshot(ref.localBlobKey))) {
        warnings.missingScreenshots.push({ displayId: issue.displayId, kind });
      }
    }
    if (issue.target && issue.target.selectorStatus !== "unique") {
      warnings.staleSelectors.push({
        displayId: issue.displayId,
        status: issue.target.selectorStatus,
      });
    }
  }
  return warnings;
}
