import { useEffect, useState, type CSSProperties } from "react";
import type { Tokens } from "@uxcue/ui";
import { GitHubClient, type RepoSummary } from "../github/client";
import * as gh from "../github/settings";
import { useTokens } from "./theme";

/** GitHub connect + per-project repo picker (#9). */
export function GitHubPanel({ projectId, onClose }: { projectId?: string; onClose: () => void }) {
  const t = useTokens();
  const S = makeStyles(t);
  const [login, setLogin] = useState<string>();
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void gh.getLogin().then(setLogin);
    if (projectId)
      void gh.getProjectRepo(projectId).then((r) => r && setSelected(`${r.owner}/${r.repo}`));
  }, [projectId]);

  useEffect(() => {
    if (!login) return;
    void (async () => {
      const tk = await gh.getToken();
      if (!tk) return;
      try {
        setRepos(await new GitHubClient(tk).listRepos());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to list repos");
      }
    })();
  }, [login]);

  async function connect() {
    setBusy(true);
    setError(undefined);
    try {
      const l = await new GitHubClient(token.trim()).getLogin();
      await gh.connect(token.trim(), l);
      setLogin(l);
      setToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await gh.disconnect();
    setLogin(undefined);
    setRepos([]);
    setSelected("");
  }

  async function pickRepo(full: string) {
    setSelected(full);
    if (projectId && full) {
      const [owner, repo] = full.split("/");
      if (owner && repo) await gh.setProjectRepo(projectId, { owner, repo });
    }
  }

  return (
    <div style={S.root} data-testid="github-panel">
      <div style={S.top}>
        <button data-testid="gh-back" onClick={onClose} style={S.link}>
          ← Back
        </button>
        <strong>GitHub</strong>
      </div>

      {!login ? (
        <>
          <p style={S.help}>
            Connect a{" "}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              style={{ color: t.color.link }}
            >
              fine-grained token
            </a>{" "}
            with <b>Issues: read/write</b> and <b>Contents: read/write</b> on the repos you review.
          </p>
          <input
            data-testid="gh-token"
            type="password"
            placeholder="github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={S.input}
          />
          <button
            data-testid="gh-connect"
            onClick={connect}
            disabled={busy || !token.trim()}
            style={S.primary}
          >
            {busy ? "Connecting…" : "Connect GitHub"}
          </button>
        </>
      ) : (
        <>
          <p style={S.help}>
            Connected as <b>{login}</b>.{" "}
            <button data-testid="gh-disconnect" onClick={disconnect} style={S.textBtn}>
              Disconnect
            </button>
          </p>
          <label style={S.label}>Default repo for this project</label>
          <select
            data-testid="gh-repo"
            value={selected}
            onChange={(e) => pickRepo(e.target.value)}
            disabled={!projectId}
            style={S.input}
          >
            <option value="">Select a repo…</option>
            {repos.map((r) => (
              <option key={r.fullName} value={`${r.owner}/${r.repo}`}>
                {r.fullName}
                {r.private ? " (private)" : ""}
              </option>
            ))}
          </select>
          {!projectId && <p style={S.help}>Select a project first to set its repo.</p>}
        </>
      )}

      {error && (
        <p data-testid="gh-error" style={{ color: t.color.danger, fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function makeStyles(t: Tokens): Record<string, CSSProperties> {
  return {
    root: {
      position: "fixed",
      inset: 0,
      background: t.color.bg,
      color: t.color.text,
      zIndex: 25,
      padding: 16,
      overflowY: "auto",
    },
    top: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
    link: {
      border: "none",
      background: "none",
      color: t.color.link,
      cursor: "pointer",
      font: "inherit",
      fontSize: 13,
    },
    textBtn: {
      border: "none",
      background: "none",
      color: t.color.link,
      cursor: "pointer",
      font: "inherit",
      fontSize: 13,
      padding: 0,
    },
    help: { fontSize: 13, color: t.color.textMuted, lineHeight: 1.5 },
    label: { display: "block", fontSize: 13, fontWeight: 650, margin: "12px 0 4px" },
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
      marginBottom: 10,
    },
    primary: {
      width: "100%",
      font: "inherit",
      fontSize: 14,
      fontWeight: 650,
      padding: "10px 12px",
      borderRadius: t.radius,
      border: "none",
      background: t.color.primary,
      color: "#fff",
      cursor: "pointer",
    },
  };
}
