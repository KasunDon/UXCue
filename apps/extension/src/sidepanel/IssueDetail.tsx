import { useEffect, useState, type CSSProperties } from "react";
import type { Issue, IssueType, Severity, IssueStatus, AssigneeHint } from "@uxcue/schema";
import { renderIssueMarkdown } from "@uxcue/markdown";
import { tokens } from "@uxcue/ui";
import { repo } from "./repo";

const TYPES: IssueType[] = [
  "visual-defect",
  "ux-issue",
  "a11y",
  "copy",
  "responsive",
  "performance",
  "enhancement",
  "bug",
];
const SEVERITIES: Severity[] = ["blocker", "major", "minor", "polish"];
const STATUSES: IssueStatus[] = [
  "open",
  "reviewing",
  "ready-for-agent",
  "exported",
  "synced",
  "fixed",
  "ignored",
];
const ASSIGNEES: AssigneeHint[] = ["code-agent", "design-agent", "human", "unassigned"];

/** Issue detail + edit (UXL-ISSUE-001): screenshots, metadata, edit, delete, copy markdown. */
export function IssueDetail({
  issue,
  onChanged,
  onDeleted,
  onBack,
}: {
  issue: Issue;
  onChanged: () => void;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    title: issue.title,
    feedback: issue.feedback,
    expected: issue.expected ?? "",
    suggestedFix: issue.suggestedFix ?? "",
    type: issue.type,
    severity: issue.severity,
    status: issue.status,
    assigneeHint: issue.assigneeHint,
  });
  const [shots, setShots] = useState<{ el?: string; vp?: string }>({});
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let urls: string[] = [];
    (async () => {
      const out: { el?: string; vp?: string } = {};
      const eKey = issue.screenshots.element?.localBlobKey;
      const vKey = issue.screenshots.viewport?.localBlobKey;
      if (eKey) {
        const b = await repo.getScreenshot(eKey);
        if (b) out.el = URL.createObjectURL(b);
      }
      if (vKey) {
        const b = await repo.getScreenshot(vKey);
        if (b) out.vp = URL.createObjectURL(b);
      }
      urls = [out.el, out.vp].filter((x): x is string => !!x);
      setShots(out);
    })();
    return () => urls.forEach(URL.revokeObjectURL);
  }, [issue.id]);

  async function save() {
    await repo.updateIssue(issue.id, {
      title: form.title,
      feedback: form.feedback,
      expected: form.expected || undefined,
      suggestedFix: form.suggestedFix || undefined,
      type: form.type,
      severity: form.severity,
      status: form.status,
      assigneeHint: form.assigneeHint,
    });
    onChanged();
  }
  async function del() {
    if (!confirm(`Delete ${issue.displayId}?`)) return;
    await repo.deleteIssue(issue.id);
    onDeleted();
  }
  async function copyMd() {
    await navigator.clipboard.writeText(
      renderIssueMarkdown({
        ...issue,
        ...form,
        expected: form.expected || undefined,
        suggestedFix: form.suggestedFix || undefined,
      }),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div style={S.root} data-testid="issue-detail">
      <div style={S.top}>
        <button data-testid="detail-back" onClick={onBack} style={S.link}>
          ← Back
        </button>
        <strong style={{ fontFamily: tokens.fontMono }}>{issue.displayId}</strong>
        <div style={{ flex: 1 }} />
        <button data-testid="detail-copy" onClick={copyMd} style={S.link}>
          {copied ? "Copied ✓" : "Copy md"}
        </button>
        <button
          data-testid="detail-delete"
          onClick={del}
          style={{ ...S.link, color: tokens.color.danger }}
        >
          Delete
        </button>
      </div>

      {(shots.el || shots.vp) && (
        <div style={S.shots}>
          {shots.el && <img src={shots.el} alt={`${issue.displayId} element`} style={S.img} />}
          {shots.vp && <img src={shots.vp} alt={`${issue.displayId} viewport`} style={S.img} />}
        </div>
      )}

      <label style={S.label}>Title</label>
      <input
        data-testid="detail-title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        style={S.input}
      />
      <label style={S.label}>Feedback</label>
      <textarea
        value={form.feedback}
        onChange={(e) => set("feedback", e.target.value)}
        rows={3}
        style={{ ...S.input, resize: "vertical" }}
      />
      <label style={S.label}>Expected</label>
      <textarea
        value={form.expected}
        onChange={(e) => set("expected", e.target.value)}
        rows={2}
        style={{ ...S.input, resize: "vertical" }}
      />
      <label style={S.label}>Suggested fix</label>
      <textarea
        value={form.suggestedFix}
        onChange={(e) => set("suggestedFix", e.target.value)}
        rows={2}
        style={{ ...S.input, resize: "vertical" }}
      />

      <div style={S.row}>
        <Sel
          label="Type"
          value={form.type}
          opts={TYPES}
          onChange={(v) => set("type", v as IssueType)}
        />
        <Sel
          label="Severity"
          value={form.severity}
          opts={SEVERITIES}
          onChange={(v) => set("severity", v as Severity)}
        />
      </div>
      <div style={S.row}>
        <Sel
          label="Status"
          testid="detail-status"
          value={form.status}
          opts={STATUSES}
          onChange={(v) => set("status", v as IssueStatus)}
        />
        <Sel
          label="Assignee"
          value={form.assigneeHint}
          opts={ASSIGNEES}
          onChange={(v) => set("assigneeHint", v as AssigneeHint)}
        />
      </div>

      {issue.target && (
        <div style={S.meta}>
          <div>
            <b>Selector</b>{" "}
            <code style={{ fontFamily: tokens.fontMono }}>{issue.target.selector}</code> ·{" "}
            {issue.target.selectorStatus}
          </div>
          <div>
            <b>Page</b> {issue.page.pathname} · {issue.capture.viewport.width}×
            {issue.capture.viewport.height} @{issue.capture.viewport.devicePixelRatio}x
          </div>
        </div>
      )}

      <button data-testid="detail-save" onClick={save} style={S.save}>
        Save changes
      </button>
    </div>
  );
}

function Sel({
  label,
  value,
  opts,
  onChange,
  testid,
}: {
  label: string;
  value: string;
  opts: string[];
  onChange: (v: string) => void;
  testid?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={S.label}>{label}</label>
      <select
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={S.input}
      >
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  root: { flex: 1, overflowY: "auto", padding: 16, background: tokens.color.bg },
  top: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  link: {
    border: "none",
    background: "none",
    color: tokens.color.link,
    cursor: "pointer",
    font: "inherit",
    fontSize: 13,
  },
  shots: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 },
  img: {
    maxWidth: "100%",
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius,
  },
  label: { display: "block", fontSize: 12, fontWeight: 650, margin: "8px 0 3px" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    font: "inherit",
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: tokens.radius,
    border: `1px solid ${tokens.color.border}`,
  },
  row: { display: "flex", gap: 8 },
  meta: {
    fontSize: 12,
    color: tokens.color.textMuted,
    margin: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    overflowX: "auto",
  },
  save: {
    width: "100%",
    font: "inherit",
    fontSize: 14,
    fontWeight: 650,
    padding: "9px 12px",
    borderRadius: tokens.radius,
    border: "none",
    background: tokens.color.primary,
    color: "#fff",
    cursor: "pointer",
    marginTop: 8,
  },
};
