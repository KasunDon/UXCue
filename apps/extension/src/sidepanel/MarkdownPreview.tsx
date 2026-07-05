import { useState, type CSSProperties } from "react";
import type { Tokens } from "@uxcue/ui";
import { useTokens } from "./theme";
import { downloadText } from "./download";

/** Preview a rendered inline markdown with copy-to-clipboard + download. */
export function MarkdownPreview({
  title,
  md,
  filename,
  onClose,
}: {
  title: string;
  md: string;
  filename: string;
  onClose: () => void;
}) {
  const t = useTokens();
  const S = makeStyles(t);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div style={S.backdrop} data-testid="md-preview" onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <strong style={{ fontSize: 15 }}>{title}</strong>
          <div style={{ flex: 1 }} />
          <button data-testid="md-copy" onClick={copy} style={S.primary}>
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </button>
          <button
            data-testid="md-download"
            onClick={() => downloadText(md, filename)}
            style={S.btn}
          >
            Download .md
          </button>
          <button data-testid="md-close" onClick={onClose} style={S.x} title="Close">
            ✕
          </button>
        </div>
        <textarea data-testid="md-text" readOnly value={md} style={S.text} />
      </div>
    </div>
  );
}

function makeStyles(t: Tokens): Record<string, CSSProperties> {
  return {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(11,15,20,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      zIndex: 30,
    },
    sheet: {
      background: t.color.surface,
      color: t.color.text,
      width: "100%",
      maxWidth: 720,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      borderRadius: 12,
      padding: 14,
      boxShadow: "0 12px 40px rgba(0,0,0,.4)",
    },
    head: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
    x: { border: "none", background: "none", fontSize: 18, cursor: "pointer", color: t.color.text },
    primary: {
      font: "inherit",
      fontSize: 13,
      fontWeight: 650,
      padding: "6px 12px",
      borderRadius: t.radius,
      border: "none",
      background: t.color.primary,
      color: "#fff",
      cursor: "pointer",
    },
    btn: {
      font: "inherit",
      fontSize: 13,
      padding: "6px 12px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
      cursor: "pointer",
    },
    text: {
      flex: 1,
      minHeight: 320,
      width: "100%",
      boxSizing: "border-box",
      resize: "none",
      font: `12px/1.5 ${t.fontMono}`,
      padding: 12,
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surfaceMuted,
      color: t.color.text,
      whiteSpace: "pre",
      overflow: "auto",
    },
  };
}
