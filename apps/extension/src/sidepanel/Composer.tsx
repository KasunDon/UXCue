import { useState, type CSSProperties } from "react";
import type { IssueType, Severity, AssigneeHint } from "@uxcue/schema";
import type { Tokens } from "@uxcue/ui";
import { repo } from "./repo";
import { createIssueFromDraft, type CaptureDraft, type ComposerForm } from "../capture/draft";
import { useTokens } from "./theme";

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
const ASSIGNEES: AssigneeHint[] = ["code-agent", "design-agent", "human", "unassigned"];

/** Feedback composer (UXL-EXT-008). Turns a capture draft into a tracked issue. */
export function Composer({
  draft,
  projectId,
  sessionId,
  onSaved,
  onDiscard,
}: {
  draft: CaptureDraft;
  projectId: string;
  sessionId: string;
  onSaved: () => void;
  onDiscard: () => void;
}) {
  const [form, setForm] = useState<ComposerForm>({
    title: draft.element?.textSnippet?.slice(0, 60) ?? "",
    feedback: "",
    type: "visual-defect",
    severity: "minor",
    status: "open",
    assigneeHint: "code-agent",
  });
  const [saving, setSaving] = useState(false);
  const t = useTokens();
  const S = makeStyles(t);
  const set = <K extends keyof ComposerForm>(k: K, v: ComposerForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.feedback.trim()) return;
    setSaving(true);
    try {
      await createIssueFromDraft(repo, { projectId, sessionId }, draft, form);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.backdrop} data-testid="composer">
      <div style={S.sheet}>
        <div style={S.head}>
          <strong>New issue</strong>
          <button data-testid="composer-discard" onClick={onDiscard} style={S.x}>
            ✕
          </button>
        </div>

        <div style={S.target}>
          {draft.element ? (
            <code style={{ fontFamily: t.fontMono, fontSize: 12 }}>
              {draft.element.selector} · {draft.element.selectorStatus}
            </code>
          ) : (
            <span style={{ fontSize: 12 }}>Page-level capture · {draft.page.pathname}</span>
          )}
          <div
            data-testid="composer-attachments"
            style={{ color: t.color.textMuted, fontSize: 12, marginTop: 4 }}
          >
            {[
              draft.shots.element && "cropped shot",
              draft.shots.viewport && "viewport shot",
              draft.console?.length ? `${draft.console.length} console line(s)` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "no attachments"}
          </div>
        </div>

        <label style={S.label}>Title</label>
        <input
          data-testid="composer-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          style={S.input}
        />

        <label style={S.label}>Feedback (required)</label>
        <textarea
          data-testid="composer-feedback"
          value={form.feedback}
          onChange={(e) => set("feedback", e.target.value)}
          rows={3}
          style={{ ...S.input, resize: "vertical" }}
        />

        <label style={S.label}>Expected</label>
        <textarea
          value={form.expected ?? ""}
          onChange={(e) => set("expected", e.target.value)}
          rows={2}
          style={{ ...S.input, resize: "vertical" }}
        />

        <div style={S.row}>
          <Select
            label="Type"
            testid="composer-type"
            value={form.type}
            opts={TYPES}
            onChange={(v) => set("type", v as IssueType)}
            s={S}
          />
          <Select
            label="Severity"
            testid="composer-severity"
            value={form.severity}
            opts={SEVERITIES}
            onChange={(v) => set("severity", v as Severity)}
            s={S}
          />
        </div>
        <div style={S.row}>
          <Select
            label="Assignee"
            testid="composer-assignee"
            value={form.assigneeHint}
            opts={ASSIGNEES}
            onChange={(v) => set("assigneeHint", v as AssigneeHint)}
            s={S}
          />
        </div>

        <div style={S.actions}>
          <button
            data-testid="composer-save"
            onClick={save}
            disabled={saving || !form.feedback.trim()}
            style={S.save}
          >
            {saving ? "Saving…" : "Save issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({
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
  testid: string;
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
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(11,15,20,.45)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 10,
    },
    sheet: {
      background: t.color.surface,
      color: t.color.text,
      width: "100%",
      maxHeight: "92vh",
      overflowY: "auto",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 16,
      boxShadow: "0 -8px 24px rgba(0,0,0,.35)",
    },
    head: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    x: { border: "none", background: "none", fontSize: 16, cursor: "pointer", color: t.color.text },
    target: {
      background: t.color.surfaceMuted,
      borderRadius: t.radius,
      padding: "6px 8px",
      marginBottom: 12,
      overflowX: "auto",
      whiteSpace: "nowrap",
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
      background: t.color.surface,
      color: t.color.text,
    },
    row: { display: "flex", gap: 8 },
    actions: { marginTop: 14 },
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
    },
  };
}
