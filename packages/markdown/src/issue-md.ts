import type { Issue, ScreenshotRef } from "@uxcue/schema";

const round = (n: number) => Math.round(n);

/** Options for the markdown generators. */
export interface RenderOptions {
  /**
   * When provided (filename -> data: URL), screenshots embed inline as base64
   * images instead of file-path links, producing a single self-contained
   * markdown (#7). Default: file links.
   */
  images?: Record<string, string>;
}

function screenshotEntry(
  displayId: string,
  label: string,
  ref: ScreenshotRef | undefined,
  images: Record<string, string> | undefined,
): string | null {
  if (!ref) return null;
  const dataUrl = images?.[ref.filename];
  return dataUrl
    ? `![${displayId} ${label.toLowerCase()}](${dataUrl})`
    : `- ${label}: \`screenshots/${ref.filename}\``;
}

/**
 * The issue block used both inside review.md (page sections) and as a
 * standalone per-issue file. Neutral, agent-ready (D014) — role-based assignee,
 * no vendor names. Format follows docs/04.
 */
export function renderIssueBlock(issue: Issue, opts: RenderOptions = {}): string {
  const lines: string[] = [];
  lines.push(`### ${issue.displayId}: ${issue.title}`, "");
  lines.push(`Status: ${issue.status}`);
  lines.push(`Type: ${issue.type}`);
  lines.push(`Severity: ${issue.severity}`);
  lines.push(`Assignee hint: ${issue.assigneeHint}`, "");

  lines.push("#### Feedback", "", issue.feedback, "");
  if (issue.expected) lines.push("#### Expected", "", issue.expected, "");
  if (issue.suggestedFix) lines.push("#### Suggested Fix", "", issue.suggestedFix, "");

  const t = issue.target;
  lines.push("#### Target", "");
  lines.push(`- URL: ${issue.page.url}`);
  if (t) {
    lines.push(`- Selector: \`${t.selector}\``);
    lines.push(`- Selector status: ${t.selectorStatus}`);
    lines.push(`- DOM path: \`${t.domPath}\``);
    if (t.component?.name) lines.push(`- Component: \`${t.component.name}\``);
    const b = t.bbox.viewport;
    lines.push(`- BBox: ${round(b.width)}x${round(b.height)} at ${round(b.x)},${round(b.y)}`);
  } else {
    lines.push(`- Page-level note (no element selected)`);
  }
  const vp = issue.capture.viewport;
  lines.push(
    `- Viewport: ${round(vp.width)}x${round(vp.height)} @${vp.devicePixelRatio}x, ${vp.colorScheme ?? "unknown"}`,
    "",
  );

  const styles = t?.styles.computed;
  if (styles && Object.keys(styles).length) {
    lines.push("#### Relevant Styles", "", "| Property | Value |", "| --- | --- |");
    for (const [k, v] of Object.entries(styles)) lines.push(`| ${k} | ${v} |`);
    lines.push("");
  }

  const shots = [
    screenshotEntry(issue.displayId, "Element", issue.screenshots.element, opts.images),
    screenshotEntry(issue.displayId, "Viewport", issue.screenshots.viewport, opts.images),
  ].filter((x): x is string => x !== null);
  if (shots.length) lines.push("#### Screenshots", "", ...shots, "");

  const logs = issue.diagnostics?.console;
  if (logs?.length) {
    lines.push("#### Console", "", "```text");
    for (const entry of logs) lines.push(`[${entry.level}] ${entry.text}`);
    lines.push("```", "");
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Standalone per-issue markdown file (issues/UX-001.md). */
export function renderIssueMarkdown(issue: Issue, opts: RenderOptions = {}): string {
  return renderIssueBlock(issue, opts);
}
