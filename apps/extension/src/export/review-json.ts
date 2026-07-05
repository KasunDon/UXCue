import { SCHEMA_VERSION, type Issue, type Project, type Session } from "@uxcue/schema";

/** review.json — portable, self-contained, validates against uxlens/1.0 (D006). */
export interface ReviewJson {
  schema: typeof SCHEMA_VERSION;
  generatedAt: string;
  project: Project;
  session: Session;
  issues: Issue[];
  /** Manifest mapping issues to their screenshot asset filenames. */
  screenshots: {
    issueId: string;
    displayId: string;
    kind: "element" | "viewport";
    filename: string;
  }[];
}

export interface ReviewJsonInput {
  project: Project;
  session: Session;
  issues: Issue[];
  generatedAt?: string;
}

export function buildReviewJson({
  project,
  session,
  issues,
  generatedAt,
}: ReviewJsonInput): ReviewJson {
  const screenshots: ReviewJson["screenshots"] = [];
  for (const issue of issues) {
    for (const kind of ["element", "viewport"] as const) {
      const ref = issue.screenshots[kind];
      if (ref) {
        screenshots.push({
          issueId: issue.id,
          displayId: issue.displayId,
          kind,
          filename: ref.filename,
        });
      }
    }
  }
  return {
    schema: SCHEMA_VERSION,
    generatedAt: generatedAt ?? new Date().toISOString(),
    project,
    session,
    issues,
    screenshots,
  };
}
