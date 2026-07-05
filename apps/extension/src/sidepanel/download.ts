import type { Project, Session } from "@uxcue/schema";
import { renderReviewMarkdown } from "@uxcue/markdown";
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

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

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
export async function exportSessionInline(
  repo: Repository,
  project: Project,
  session: Session,
): Promise<{ issueCount: number; bytes: number; warnings: ExportWarnings }> {
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
  triggerDownload(
    new Blob([md], { type: "text/markdown" }),
    `${slug(session.name)}-review.inline.md`,
  );

  return { issueCount: issues.length, bytes: md.length, warnings };
}
