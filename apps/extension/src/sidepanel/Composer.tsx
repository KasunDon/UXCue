import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { IssueType, Severity } from "@uxcue/schema";
import type { Tokens } from "@uxcue/ui";
import { getPlatform } from "../platform/index";
import { repo } from "./repo";
import { createIssueFromDraft, type CaptureDraft, type ComposerForm } from "../capture/draft";
import { useTokens } from "./theme";
import { useHostAccess } from "./useHostAccess";

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
  const { ensureAccess } = useHostAccess();
  const t = useTokens();
  const S = makeStyles(t);
  const set = <K extends keyof ComposerForm>(k: K, v: ComposerForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const elKey = draft.shots.element?.blobKey;
  const vpKey = draft.shots.viewport?.blobKey;
  const consoleCount = draft.console?.length ?? 0;
  const [thumbs, setThumbs] = useState<{ element?: string; viewport?: string }>({});
  const [flash, setFlash] = useState<null | "shot" | "console">(null);
  const [pending, setPending] = useState<null | "viewport" | "area" | "console">(null);
  const [hint, setHint] = useState<string>();

  // Load thumbnails for whatever the draft currently holds (live-updates as
  // the service worker merges new captures into the draft in storage).
  useEffect(() => {
    let urls: string[] = [];
    void (async () => {
      const out: { element?: string; viewport?: string } = {};
      if (elKey) {
        const b = await repo.getScreenshot(elKey);
        if (b) out.element = URL.createObjectURL(b);
      }
      if (vpKey) {
        const b = await repo.getScreenshot(vpKey);
        if (b) out.viewport = URL.createObjectURL(b);
      }
      urls = [out.element, out.viewport].filter((x): x is string => !!x);
      setThumbs(out);
    })();
    return () => urls.forEach(URL.revokeObjectURL);
  }, [elKey, vpKey]);

  // Flash the newly-added attachment so a button click visibly registers.
  const seen = useRef({ shots: (elKey ? 1 : 0) + (vpKey ? 1 : 0), console: consoleCount });
  useEffect(() => {
    const shots = (elKey ? 1 : 0) + (vpKey ? 1 : 0);
    if (shots > seen.current.shots) setFlash("shot");
    else if (consoleCount > seen.current.console) setFlash("console");
    else return;
    seen.current = { shots, console: consoleCount };
    setPending(null);
    const id = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(id);
  }, [elKey, vpKey, consoleCount]);

  // Watchdog: never leave a button stuck on "Capturing…". If no new attachment
  // lands shortly after a trigger, stop the spinner and explain what to try.
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setPending((p) => {
        if (p)
          setHint(
            p === "console"
              ? "No recent console output was found on this page."
              : "Couldn't capture this page from the panel. Press Alt+Shift+U on the page (grants access), then retry.",
          );
        return null;
      });
    }, 4000);
    return () => clearTimeout(id);
  }, [pending]);

  const add = async (action: "viewport" | "area" | "console") => {
    setHint(undefined);
    setPending(action);
    // Screenshots need per-site host access; request it first (gesture-safe).
    // Console needs none, so don't prompt for it.
    if (action !== "console") await ensureAccess();
    const res = (await platform.runtime.send({ type: "TRIGGER_ACTIVE", action })) as {
      sent?: boolean;
    };
    if (res?.sent === false) {
      setPending(null);
      setHint("Couldn't reach this page. Reload it, or use the Alt+Shift+U shortcut.");
    }
  };

  const hasAny = !!elKey || !!vpKey || consoleCount > 0;

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
        </div>

        <label style={S.label}>Context added to this issue</label>
        <div data-testid="composer-attachments" style={S.previews}>
          {!hasAny && (
            <span style={S.attachEmpty}>
              No screenshots or logs yet — use the buttons below to add context.
            </span>
          )}
          {thumbs.element && (
            <Thumb
              testid="preview-element"
              src={thumbs.element}
              label="Cropped element"
              dim={draft.shots.element}
              flash={flash === "shot"}
              s={S}
            />
          )}
          {thumbs.viewport && (
            <Thumb
              testid="preview-viewport"
              src={thumbs.viewport}
              label="Full page"
              dim={draft.shots.viewport}
              flash={flash === "shot"}
              s={S}
            />
          )}
          {consoleCount > 0 && (
            <div
              data-testid="preview-console"
              style={{ ...S.consoleCard, ...(flash === "console" ? S.flash : {}) }}
            >
              <div style={S.consoleHead}>⌘ {consoleCount} console line(s) attached</div>
              <pre style={S.consolePre}>
                {draft
                  .console!.slice(-4)
                  .map((c) => `${c.level}: ${c.text}`)
                  .join("\n")}
              </pre>
            </div>
          )}
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

        <label style={S.label}>Add more context</label>
        <div style={S.addRow}>
          <button
            data-testid="add-page-shot"
            onClick={() => add("viewport")}
            disabled={pending === "viewport"}
            style={S.addBtn}
          >
            {pending === "viewport" ? "📷 Capturing…" : "📷 Page shot"}
          </button>
          <button
            data-testid="add-area-shot"
            onClick={() => add("area")}
            disabled={pending === "area"}
            style={S.addBtn}
          >
            {pending === "area" ? "▭ Select area…" : "▭ Area shot"}
          </button>
          <button
            data-testid="add-console"
            onClick={() => add("console")}
            disabled={pending === "console"}
            style={S.addBtn}
          >
            {pending === "console" ? "⌘ Grabbing…" : "⌘ Console"}
          </button>
        </div>
        {hint && (
          <p data-testid="composer-hint" style={S.hint}>
            {hint}
          </p>
        )}

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

function Thumb({
  src,
  label,
  dim,
  flash,
  testid,
  s,
}: {
  src: string;
  label: string;
  dim?: { width: number; height: number };
  flash: boolean;
  testid?: string;
  s: Record<string, CSSProperties>;
}) {
  return (
    <div data-testid={testid} style={{ ...s.thumbCard, ...(flash ? s.flash : {}) }}>
      <img src={src} alt={label} style={s.thumbImg} />
      <div style={s.thumbMeta}>
        <span>{label}</span>
        {dim && (
          <span style={s.thumbDim}>
            {dim.width}×{dim.height}
          </span>
        )}
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
    previews: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    attachEmpty: { color: t.color.textMuted, fontSize: 13 },
    thumbCard: {
      width: 96,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius,
      overflow: "hidden",
      background: t.color.surfaceMuted,
      transition: "box-shadow .2s, border-color .2s",
    },
    thumbImg: { width: "100%", height: 60, objectFit: "cover", display: "block" },
    thumbMeta: {
      display: "flex",
      justifyContent: "space-between",
      gap: 4,
      padding: "3px 6px",
      fontSize: 11,
      color: t.color.textMuted,
    },
    thumbDim: { fontFamily: t.fontMono },
    consoleCard: {
      flex: "1 1 100%",
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius,
      background: t.color.surfaceMuted,
      overflow: "hidden",
      transition: "box-shadow .2s, border-color .2s",
    },
    consoleHead: { fontSize: 12, fontWeight: 650, padding: "5px 8px" },
    consolePre: {
      margin: 0,
      padding: "6px 8px",
      fontSize: 11,
      fontFamily: t.fontMono,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      maxHeight: 84,
      overflowY: "auto",
      color: t.color.text,
      borderTop: `1px solid ${t.color.border}`,
    },
    flash: { borderColor: t.color.primary, boxShadow: `0 0 0 2px ${t.color.primary}55` },
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
    hint: {
      margin: "8px 0 0",
      fontSize: 12,
      color: t.color.attention,
      lineHeight: 1.5,
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
