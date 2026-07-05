import type { Project, Session } from "@uxcue/schema";
import type { Repository } from "../storage/repository";
import { buildBundleZip, type ScreenshotAsset } from "../export/bundle";

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Gather issues + screenshot blobs and trigger a .zip download of the review. */
export async function exportSession(
  repo: Repository,
  project: Project,
  session: Session,
): Promise<{ issueCount: number; bytes: number }> {
  const issues = await repo.listIssues(session.id);

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
  const blob = new Blob([new Uint8Array(zip)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-review.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { issueCount: issues.length, bytes: zip.byteLength };
}
