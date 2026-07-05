import { useState, type CSSProperties, type ReactNode } from "react";
import type { IssueType, Severity } from "@uxcue/schema";
import type { Tokens } from "@uxcue/ui";
import { getPlatform } from "../platform/index";
import { repo } from "./repo";
import { createIssueFromDraft, type CaptureDraft, type ComposerForm } from "../capture/draft";
import { useTokens } from "./theme";

const platform = getPlatform();

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

/**
 * Feedback composer (UXL-EXT-008). Turns a capture draft into a tracked issue.
 * Simplified: one required "what's wrong" field; assignee is set by whoever
 * picks the ticket, not here. Attachments can be added from the buttons.
 */
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
    assigneeHint: "unassigned",
  });
  const [saving, setSaving] = useState(false);
  const t = useTokens();
  const S = makeStyles(t);
  const set = <K extends keyof ComposerForm>(k: K, v: ComposerForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const add = (action: "viewport" | "area" | "console") =>
    void platform.runtime.send({ type: "TRIGGER_ACTIVE", action });

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

  const attachments =
    [
      draft.shots.element && "cropped shot",
      draft.shots.viewport && "page shot",
      draft.console?.length ? `${draft.console.length} console line(s)` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "no attachments yet";

  return (
    <div style={S.backdrop} data-testid="composer">
      <div style={S.sheet}>
        <div style={S.head}>
          <strong style={{ fontSize: 16 }}>New issue</strong>
          <button data-testid="composer-discard" onClick={onDiscard} style={S.x} title="Discard">
            ✕
          </button>
        </div>

        <div style={S.target}>
          {draft.element ? (
            <code style={{ fontFamily: t.fontMono, fontSize: 13 }}>
              {draft.element.selector} · {draft.element.selectorStatus}
            </code>
          ) : (
            <span style={{ fontSize: 13 }}>Page-level capture · {draft.page.pathname}</span>
          )}
          <div data-testid="composer-attachments" style={S.attach}>
            {attachments}
          </div>
        </div>

        <label style={S.label}>Title</label>
        <input
          data-testid="composer-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Short summary"
          style={S.input}
        />

        <label style={S.label}>What's wrong? (required)</label>
        <textarea
          data-testid="composer-feedback"
          value={form.feedback}
          onChange={(e) => set("feedback", e.target.value)}
          placeholder="Describe the problem and, if useful, what it should do instead."
          rows={4}
          style={{ ...S.input, fontSize: 15, resize: "vertical" }}
          autoFocus
        />

        <div style={S.row}>
          <Field label="Type" s={S}>
            <select
              data-testid="composer-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as IssueType)}
              style={S.input}
            >
              {TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Severity" s={S}>
            <select
              data-testid="composer-severity"
              value={form.severity}
              onChange={(e) => set("severity", e.target.value as Severity)}
              style={S.input}
            >
              {SEVERITIES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label style={S.label}>Add to this issue</label>
        <div style={S.addRow}>
          <button data-testid="add-page-shot" onClick={() => add("viewport")} style={S.addBtn}>
            📷 Page shot
          </button>
          <button data-testid="add-area-shot" onClick={() => add("area")} style={S.addBtn}>
            ▭ Area shot
          </button>
          <button data-testid="add-console" onClick={() => add("console")} style={S.addBtn}>
            ⌘ Console
          </button>
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

function Field({
  label,
  s,
  children,
}: {
  label: string;
  s: Record<string, CSSProperties>;
  children: ReactNode;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={s.label}>{label}</label>
      {children}
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
      maxHeight: "94vh",
      overflowY: "auto",
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      padding: 18,
      boxShadow: "0 -8px 24px rgba(0,0,0,.35)",
    },
    head: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    x: { border: "none", background: "none", fontSize: 18, cursor: "pointer", color: t.color.text },
    target: {
      background: t.color.surfaceMuted,
      borderRadius: t.radius,
      padding: "8px 10px",
      marginBottom: 14,
      overflowX: "auto",
      whiteSpace: "nowrap",
    },
    attach: { color: t.color.textMuted, fontSize: 13, marginTop: 4 },
    label: { display: "block", fontSize: 13, fontWeight: 650, margin: "10px 0 4px" },
    input: {
      width: "100%",
      boxSizing: "border-box",
      font: "inherit",
      fontSize: 14,
      padding: "8px 10px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
    },
    row: { display: "flex", gap: 10 },
    addRow: { display: "flex", gap: 8 },
    addBtn: {
      flex: 1,
      font: "inherit",
      fontSize: 13,
      padding: "8px 6px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
      cursor: "pointer",
    },
    actions: { marginTop: 16 },
    save: {
      width: "100%",
      font: "inherit",
      fontSize: 15,
      fontWeight: 650,
      padding: "11px 12px",
      borderRadius: t.radius,
      border: "none",
      background: t.color.primary,
      color: "#fff",
      cursor: "pointer",
    },
  };
}
