import { useState } from "react";
import { tokens } from "@uxcue/ui";
import { getPlatform } from "../platform/index";

const platform = getPlatform();

/**
 * Side panel shell (UXL-EXT-001). Header + empty state only — the project/
 * session/issue-queue UI is UXL-EXT-003. The "Ping SW" control exercises the
 * side-panel <-> service-worker channel through the platform adapter (D015),
 * which the startup smoke asserts.
 */
export function App() {
  const [pings, setPings] = useState<number | null>(null);

  async function pingServiceWorker() {
    const res = await platform.runtime.send({ type: "PING" });
    setPings(typeof res.pings === "number" ? res.pings : null);
  }

  return (
    <div
      style={{
        fontFamily: tokens.fontUi,
        color: tokens.color.text,
        background: tokens.color.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        data-testid="uxcue-header"
        style={{
          background: "#0b0f14",
          color: "#fff",
          padding: "12px 16px",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        UXCue
      </header>

      <main style={{ padding: 16, flex: 1 }}>
        <div
          data-testid="empty-state"
          style={{
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius,
            padding: 16,
            background: tokens.color.surface,
          }}
        >
          <p style={{ fontWeight: 650, margin: "0 0 4px" }}>No project selected</p>
          <p style={{ color: tokens.color.textMuted, margin: 0, fontSize: 13 }}>
            Create a project to start capturing UI review issues.
          </p>
        </div>
      </main>

      <footer style={{ padding: 12, borderTop: `1px solid ${tokens.color.border}` }}>
        <button
          data-testid="ping-sw"
          onClick={pingServiceWorker}
          style={{
            font: "inherit",
            fontSize: 13,
            padding: "6px 10px",
            borderRadius: tokens.radius,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            cursor: "pointer",
          }}
        >
          Ping SW
        </button>
        {pings !== null && (
          <span data-testid="ping-count" style={{ marginLeft: 8, fontSize: 13 }}>
            {pings}
          </span>
        )}
      </footer>
    </div>
  );
}
