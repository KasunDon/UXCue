import type { Issue } from "@uxcue/schema";

const round = (n: number) => Math.round(n);

export interface GitHubBodyOptions {
  /** Raw image URLs (e.g. committed to the repo) to embed as evidence. */
  imageUrls?: { element?: string; viewport?: string };
}

const TYPE_LABEL: Record<Issue["type"], string> = {
  "visual-defect": "ui-defect",
  "ux-issue": "ux",
  a11y: "accessibility",
  copy: "copy",
  responsive: "responsive",
  performance: "performance",
  enhancement: "enhancement",
  bug: "bug",
};

/** Default GitHub labels for an issue (docs/04 mapping). */
export function labelsFor(issue: Issue): string[] {
  return ["uxcue", TYPE_LABEL[issue.type], `severity:${issue.severity}`];
}

/** A concise, agent-ready GitHub issue body (docs/04). Neutral (D014). */
export function renderGitHubBody(issue: Issue, opts: GitHubBodyOptions = {}): string {
  const lines: string[] = [];
  lines.push("## UI Defect", "", issue.feedback, "");
  if (issue.expected) lines.push("## Expected", "", issue.expected, "");

  const t = issue.target;
  lines.push("## Target", "");
  lines.push(`- Page: \`${issue.page.pathname}\``);
  lines.push(`- URL: ${issue.page.url}`);
  if (t) {
    lines.push(`- Selector: \`${t.selector}\` (${t.selectorStatus})`);
    if (t.component?.name) lines.push(`- Component: \`${t.component.name}\``);
  }
  const vp = issue.capture.viewport;
  lines.push(`- Viewport: ${round(vp.width)}x${round(vp.height)} @${vp.devicePixelRatio}x`, "");

  const imgs: string[] = [];
  if (opts.imageUrls?.element) imgs.push(`![element](${opts.imageUrls.element})`);
  if (opts.imageUrls?.viewport) imgs.push(`![viewport](${opts.imageUrls.viewport})`);
  lines.push(
    "## Evidence",
    "",
    ...(imgs.length ? imgs : ["_Screenshots are available in the UXCue export bundle._"]),
    "",
  );

  const styles = t?.styles.computed;
  if (styles && Object.keys(styles).length) {
    lines.push("## Relevant Styles", "", "```text");
    for (const [k, v] of Object.entries(styles)) lines.push(`${k}: ${v}`);
    lines.push("```", "");
  }

  const logs = issue.diagnostics?.console;
  if (logs?.length) {
    lines.push("<details><summary>Console logs</summary>", "", "```text");
    for (const e of logs) lines.push(`[${e.level}] ${e.text}`);
    lines.push("```", "", "</details>", "");
  }

  if (issue.suggestedFix) lines.push("## Suggested Fix", "", issue.suggestedFix, "");

  lines.push(
    "## Agent Instructions",
    "",
    "Fix this UI/UX issue using existing design-system patterns and tokens. Preserve " +
      "behavior unless the issue explicitly asks for a UX change. Add or update tests " +
      "where the project already has coverage for this component or page.",
    "",
    "---",
    `Created from UXCue issue \`${issue.displayId}\`.`,
  );

  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}

/** A short, neutral GitHub issue title. */
export function gitHubTitle(issue: Issue): string {
  return `[${issue.type}] ${issue.title}`;
}
