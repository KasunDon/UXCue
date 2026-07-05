import type { Issue, Project, Session } from "@uxcue/schema";
import { renderReviewMarkdown, renderIssueMarkdown } from "@uxcue/markdown";
import type { Repository } from "../storage/repository";
import { buildBundleZip, type ScreenshotAsset } from "../export/bundle";
import { validateReview, type ExportWarnings } from "../export/validate";

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download an already-rendered text file (e.g. from a preview). */
export function downloadText(text: string, filename: string): void {
  triggerDownload(new Blob([text], { type: "text/markdown" }), filename);
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

/** Filename for a session's inline markdown export. */
export const sessionInlineFilename = (session: Session): string =>
  `${slug(session.name)}-review.inline.md`;

/** Gather issues + screenshot blobs and trigger a .zip download of the review. */
export async function exportSession(
  repo: Repository,
  project: Project,
  session: Session,
): Promise<{ issueCount: number; bytes: number; warnings: ExportWarnings }> {
  const issues = await repo.listIssues(session.id);
  const warnings = await validateReview(repo, issues);

  const screenshots: ScreenshotAsset[] = [];
  for (const issue of issues) {
    for (const ref of [issue.screenshots.element, issue.screenshots.viewport]) {
      if (ref?.localBlobKey) {
        const blob = await repo.getScreenshot(ref.localBlobKey);
        if (blob) screenshots.push({ filename: ref.filename, bytes: await blobToBytes(blob) });
      }
    }
  }

  const zip = buildBundleZip({ project, session, issues, screenshots });
  triggerDownload(
    new Blob([new Uint8Array(zip)], { type: "application/zip" }),
    `${slug(session.name)}-review.zip`,
  );

  return { issueCount: issues.length, bytes: zip.byteLength, warnings };
}

/**
 * Inline export (#7): a single self-contained review.md with base64 PNG images
 * embedded as data URIs, so the whole review is one paste-able text file.
 */
export async function sessionInlineMarkdown(
  repo: Repository,
  project: Project,
  session: Session,
): Promise<{ md: string; issueCount: number; warnings: ExportWarnings }> {
  const issues = await repo.listIssues(session.id);
  const warnings = await validateReview(repo, issues);

  const images: Record<string, string> = {};
  for (const issue of issues) {
    for (const ref of [issue.screenshots.element, issue.screenshots.viewport]) {
      if (ref?.localBlobKey) {
        const blob = await repo.getScreenshot(ref.localBlobKey);
        if (blob) images[ref.filename] = await blobToDataUrl(blob);
      }
    }
  }

  const md = renderReviewMarkdown({ project, session, issues }, { images });
  return { md, issueCount: issues.length, warnings };
}

export async function exportSessionInline(
  repo: Repository,
  project: Project,
  session: Session,
): Promise<{ issueCount: number; bytes: number; warnings: ExportWarnings }> {
  const { md, issueCount, warnings } = await sessionInlineMarkdown(repo, project, session);
  downloadText(md, sessionInlineFilename(session));
  return { issueCount, bytes: md.length, warnings };
}

/** Gather one issue's screenshots as data URIs. */
async function issueImages(repo: Repository, issue: Issue): Promise<Record<string, string>> {
  const images: Record<string, string> = {};
  for (const ref of [issue.screenshots.element, issue.screenshots.viewport]) {
    if (ref?.localBlobKey) {
      const blob = await repo.getScreenshot(ref.localBlobKey);
      if (blob) images[ref.filename] = await blobToDataUrl(blob);
    }
  }
  return images;
}

/**
 * Render a single issue as a self-contained inline markdown (#7 per-issue):
 * base64 PNG screenshots embedded, so one issue is one paste-able text file.
 */
export async function issueInlineMarkdown(repo: Repository, issue: Issue): Promise<string> {
  return renderIssueMarkdown(issue, { images: await issueImages(repo, issue) });
}

/** Trigger a download of a single issue's self-contained inline markdown. */
export async function exportIssueInline(repo: Repository, issue: Issue): Promise<void> {
  const md = await issueInlineMarkdown(repo, issue);
  triggerDownload(new Blob([md], { type: "text/markdown" }), `${issue.displayId}.inline.md`);
}
