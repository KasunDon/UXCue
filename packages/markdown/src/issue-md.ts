import type { Issue } from "@uxcue/schema";

const round = (n: number) => Math.round(n);

function screenshotLine(label: string, filename: string | undefined): string | null {
  return filename ? `- ${label}: \`screenshots/${filename}\`` : null;
}

/**
 * The issue block used both inside review.md (page sections) and as a
 * standalone per-issue file. Neutral, agent-ready (D014) — role-based assignee,
 * no vendor names. Format follows docs/04.
 */
export function renderIssueBlock(issue: Issue): string {
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
    screenshotLine("Element", issue.screenshots.element?.filename),
    screenshotLine("Viewport", issue.screenshots.viewport?.filename),
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
export function renderIssueMarkdown(issue: Issue): string {
  return renderIssueBlock(issue);
}
