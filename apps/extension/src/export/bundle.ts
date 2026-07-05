import { zipSync, strToU8 } from "fflate";
import type { Issue, Project, Session } from "@uxcue/schema";
import { renderReviewMarkdown, renderIssueMarkdown } from "@uxcue/markdown";
import { buildReviewJson } from "./review-json";

export interface ScreenshotAsset {
  filename: string;
  bytes: Uint8Array;
}

export interface BundleInput {
  project: Project;
  session: Session;
  issues: Issue[];
  screenshots: ScreenshotAsset[];
  version?: string;
  /** Zip root folder ("uxcue-review") or the repo drop-in dir (".uxcue"). */
  root?: string;
}

/** The list of files a review bundle contains (docs/04). */
export function bundleFiles(input: BundleInput): Record<string, Uint8Array> {
  const root = input.root ?? "uxcue-review";
  const files: Record<string, Uint8Array> = {};

  const reviewMd = renderReviewMarkdown({
    project: input.project,
    session: input.session,
    issues: input.issues,
    ...(input.version !== undefined ? { version: input.version } : {}),
  });
  const reviewJson = buildReviewJson({
    project: input.project,
    session: input.session,
    issues: input.issues,
  });

  files[`${root}/review.md`] = strToU8(reviewMd);
  files[`${root}/review.json`] = strToU8(JSON.stringify(reviewJson, null, 2));
  for (const issue of input.issues) {
    files[`${root}/issues/${issue.displayId}.md`] = strToU8(renderIssueMarkdown(issue));
  }
  for (const asset of input.screenshots) {
    files[`${root}/screenshots/${asset.filename}`] = asset.bytes;
  }
  return files;
}

/** Assemble a downloadable .zip (fflate) of the review bundle. */
export function buildBundleZip(input: BundleInput): Uint8Array {
  return zipSync(bundleFiles(input), { level: 6 });
}

/**
 * The `.uxcue/` repo drop-in layout (D014): same review.json/review.md/
 * screenshots, rooted at `.uxcue` so an agent finds it in the repo.
 */
export function dropInFiles(input: BundleInput): Record<string, Uint8Array> {
  return bundleFiles({ ...input, root: ".uxcue" });
}
