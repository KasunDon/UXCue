import type { Issue } from "@uxcue/schema";
import { renderGitHubBody, gitHubTitle, labelsFor } from "@uxcue/markdown";
import type { Repository } from "../storage/repository";
import type { GitHubClient, GitHubRepoRef, CreatedIssue } from "./client";

/** Blob -> raw base64 (no data: prefix), for the GitHub Contents API. */
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Publish a UXCue issue to GitHub (#9): commit its screenshots to
 * .uxcue/screenshots/ (Contents API), create the issue with an agent-ready
 * body embedding the raw image URLs, and store the link back on the issue.
 * Labels/permission failures don't block issue creation.
 */
export async function publishIssue(
  client: GitHubClient,
  repoRef: GitHubRepoRef,
  issue: Issue,
  storage: Repository,
): Promise<CreatedIssue> {
  const imageUrls: { element?: string; viewport?: string } = {};
  for (const kind of ["element", "viewport"] as const) {
    const ref = issue.screenshots[kind];
    if (!ref?.localBlobKey) continue;
    const blob = await storage.getScreenshot(ref.localBlobKey);
    if (!blob) continue;
    try {
      imageUrls[kind] = await client.putFile(
        repoRef,
        `.uxcue/screenshots/${ref.filename}`,
        await blobToBase64(blob),
        `Add UXCue screenshot ${ref.filename}`,
      );
    } catch {
      /* asset commit failed — fall back to the bundle note in the body */
    }
  }

  const created = await client.createIssue(repoRef, {
    title: gitHubTitle(issue),
    body: renderGitHubBody(issue, { imageUrls }),
    labels: labelsFor(issue),
  });

  await storage.setGitHubLink(issue.id, {
    provider: "github",
    owner: repoRef.owner,
    repo: repoRef.repo,
    issueNumber: created.number,
    url: created.url,
    createdAt: new Date().toISOString(),
  });

  return created;
}
