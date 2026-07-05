import { useEffect, useState, type CSSProperties } from "react";
import type { Issue, IssueType, Severity, IssueStatus, AssigneeHint } from "@uxcue/schema";
import type { Tokens } from "@uxcue/ui";
import { repo } from "./repo";
import { useTokens } from "./theme";
import { issueInlineMarkdown } from "./download";
import { MarkdownPreview } from "./MarkdownPreview";
import { GitHubClient } from "../github/client";
import * as gh from "../github/settings";
import { publishIssue } from "../github/publish";

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
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [ghUrl, setGhUrl] = useState<string | undefined>(issue.github?.url);
  const [ghBusy, setGhBusy] = useState(false);
  const [ghMsg, setGhMsg] = useState<string>();
  const t = useTokens();
  const S = makeStyles(t);
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
  // The issue as currently edited (reflects unsaved form changes in exports).
  const merged = (): Issue => ({
    ...issue,
    ...form,
    expected: form.expected || undefined,
    suggestedFix: form.suggestedFix || undefined,
  });
  async function copyMd() {
    // Self-contained inline markdown (base64 screenshots) — paste-ready for an agent.
    await navigator.clipboard.writeText(await issueInlineMarkdown(repo, merged()));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  async function previewMd() {
    setPreview(await issueInlineMarkdown(repo, merged()));
  }
  async function createGitHubIssue() {
    setGhMsg(undefined);
    const token = await gh.getToken();
    const repoRef = await gh.getProjectRepo(issue.projectId);
    if (!token) return setGhMsg("Connect GitHub first (⎇ in the header).");
    if (!repoRef) return setGhMsg("Pick a default repo for this project (⎇ in the header).");
    setGhBusy(true);
    try {
      const created = await publishIssue(new GitHubClient(token), repoRef, issue, repo);
      setGhUrl(created.url);
      onChanged();
    } catch (e) {
      setGhMsg(e instanceof Error ? e.message : "Failed to create GitHub issue");
    } finally {
      setGhBusy(false);
    }
  }

  return (
    <div style={S.root} data-testid="issue-detail">
      <div style={S.top}>
        <button data-testid="detail-back" onClick={onBack} style={S.link}>
          ← Back
        </button>
        <strong style={{ fontFamily: t.fontMono }}>{issue.displayId}</strong>
        <div style={{ flex: 1 }} />
        <button data-testid="detail-copy" onClick={copyMd} style={S.link}>
          {copied ? "Copied ✓" : "Copy md"}
        </button>
        <button
          data-testid="detail-export"
          onClick={previewMd}
          style={S.link}
          title="Preview this issue as a self-contained .md (base64 screenshots), then copy or download"
        >
          Preview .md
        </button>
        <button
          data-testid="detail-delete"
          onClick={del}
          style={{ ...S.link, color: t.color.danger }}
        >
          Delete
        </button>
      </div>

      {(shots.el || shots.vp) && (
        <div style={S.shots}>
          {shots.el && (
            <img
              src={shots.el}
              alt={`${issue.displayId} element`}
              onClick={() => setZoom(shots.el!)}
              title="Click to enlarge"
              style={S.img}
            />
          )}
          {shots.vp && (
            <img
              src={shots.vp}
              alt={`${issue.displayId} viewport`}
              onClick={() => setZoom(shots.vp!)}
              title="Click to enlarge"
              style={S.img}
            />
          )}
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
          s={S}
        />
        <Sel
          label="Severity"
          value={form.severity}
          opts={SEVERITIES}
          onChange={(v) => set("severity", v as Severity)}
          s={S}
        />
      </div>
      <div style={S.row}>
        <Sel
          label="Status"
          testid="detail-status"
          value={form.status}
          opts={STATUSES}
          onChange={(v) => set("status", v as IssueStatus)}
          s={S}
        />
        <Sel
          label="Assignee"
          value={form.assigneeHint}
          opts={ASSIGNEES}
          onChange={(v) => set("assigneeHint", v as AssigneeHint)}
          s={S}
        />
      </div>

      {issue.target && (
        <div style={S.meta}>
          <div>
            <b>Selector</b> <code style={{ fontFamily: t.fontMono }}>{issue.target.selector}</code>{" "}
            · {issue.target.selectorStatus}
          </div>
          <div>
            <b>Page</b> {issue.page.pathname} · {issue.capture.viewport.width}×
            {issue.capture.viewport.height} @{issue.capture.viewport.devicePixelRatio}x
          </div>
        </div>
      )}

      <div style={S.ghSection}>
        {ghUrl ? (
          <a
            data-testid="gh-link"
            href={ghUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: t.color.link, fontSize: 13 }}
          >
            View on GitHub ↗
          </a>
        ) : (
          <button
            data-testid="create-gh"
            onClick={createGitHubIssue}
            disabled={ghBusy}
            style={S.ghBtn}
          >
            {ghBusy ? "Creating…" : "Create GitHub issue"}
          </button>
        )}
        {ghMsg && (
          <p style={{ color: t.color.textMuted, fontSize: 12, margin: "6px 0 0" }}>{ghMsg}</p>
        )}
      </div>

      <button data-testid="detail-save" onClick={save} style={S.save}>
        Save changes
      </button>

      {preview !== null && (
        <MarkdownPreview
          title={`${issue.displayId} · inline .md`}
          md={preview}
          filename={`${issue.displayId}.inline.md`}
          onClose={() => setPreview(null)}
        />
      )}

      {zoom && (
        <div
          data-testid="detail-zoom"
          style={S.zoomBackdrop}
          onClick={() => setZoom(null)}
          title="Click to close"
        >
          <img src={zoom} alt="Screenshot full size" style={S.zoomImg} />
        </div>
      )}
    </div>
  );
}

function Sel({
  label,
  value,
  opts,
  onChange,
  testid,
  s,
}: {
  label: string;
  value: string;
  opts: string[];
  onChange: (v: string) => void;
  testid?: string;
  s: Record<string, CSSProperties>;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={s.label}>{label}</label>
      <select
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={s.input}
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

function makeStyles(t: Tokens): Record<string, CSSProperties> {
  return {
    root: { flex: 1, overflowY: "auto", padding: 16, background: t.color.bg },
    top: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
    link: {
      border: "none",
      background: "none",
      color: t.color.link,
      cursor: "pointer",
      font: "inherit",
      fontSize: 13,
    },
    shots: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 },
    img: {
      maxWidth: "100%",
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius,
      cursor: "zoom-in",
    },
    zoomBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(11,15,20,.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      zIndex: 40,
      cursor: "zoom-out",
    },
    zoomImg: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      borderRadius: t.radius,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
    },
    label: { display: "block", fontSize: 12, fontWeight: 650, margin: "8px 0 3px" },
    input: {
      width: "100%",
      boxSizing: "border-box",
      font: "inherit",
      fontSize: 13,
      padding: "6px 8px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
    },
    row: { display: "flex", gap: 8 },
    meta: {
      fontSize: 12,
      color: t.color.textMuted,
      margin: "12px 0",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      overflowX: "auto",
    },
    ghSection: { margin: "10px 0", paddingTop: 10, borderTop: `1px solid ${t.color.border}` },
    ghBtn: {
      font: "inherit",
      fontSize: 13,
      fontWeight: 650,
      padding: "8px 12px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
      cursor: "pointer",
    },
    save: {
      width: "100%",
      font: "inherit",
      fontSize: 14,
      fontWeight: 650,
      padding: "9px 12px",
      borderRadius: t.radius,
      border: "none",
      background: t.color.primary,
      color: "#fff",
      cursor: "pointer",
      marginTop: 8,
    },
  };
}
