import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { Issue, Project, Session } from "@uxcue/schema";
import type { Tokens } from "@uxcue/ui";
import { getPlatform } from "../platform/index";
import { DRAFT_KEY, type CaptureDraft } from "../capture/draft";
import { repo } from "./repo";
import { exportSession } from "./download";
import { Composer } from "./Composer";
import { IssueDetail } from "./IssueDetail";
import { useTheme } from "./theme";

const platform = getPlatform();

const severityColor = (t: Tokens): Record<Issue["severity"], string> => ({
  blocker: t.color.danger,
  major: t.color.attention,
  minor: t.color.textMuted,
  polish: t.color.textMuted,
});

/**
 * Side panel queue (UXL-EXT-003): project/session pickers, issue list with
 * status/type/severity/text filters, and export. Local-first, theme-aware.
 */
export function App() {
  const { t, mode, toggle } = useTheme();
  const S = makeStyles(t);
  const sev = severityColor(t);

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projectId, setProjectId] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string>();

  const project = projects.find((p) => p.id === projectId);
  const session = sessions.find((s) => s.id === sessionId);
  const selected = issues.find((i) => i.id === selectedId);

  useEffect(() => {
    void platform.storage.get<CaptureDraft>(DRAFT_KEY).then((d) => d && setDraft(d));
    platform.storage.onChange((key, value) => {
      if (key === DRAFT_KEY) setDraft((value as CaptureDraft | undefined) ?? null);
    });
  }, []);

  const clearDraft = useCallback(() => {
    void platform.storage.remove(DRAFT_KEY);
    setDraft(null);
  }, []);

  useEffect(() => {
    void repo.listProjects().then(setProjects);
  }, []);
  useEffect(() => {
    if (projectId) void repo.listSessions(projectId).then(setSessions);
    else setSessions([]);
  }, [projectId]);

  const refreshIssues = useCallback(() => {
    if (sessionId) void repo.listIssues(sessionId).then(setIssues);
    else setIssues([]);
  }, [sessionId]);
  useEffect(refreshIssues, [refreshIssues]);

  async function createProject() {
    const name = prompt("Project name")?.trim();
    if (!name) return;
    const p = await repo.createProject({ name });
    setProjects(await repo.listProjects());
    setProjectId(p.id);
    setSessionId(undefined);
  }

  async function createSession() {
    if (!projectId) return;
    const name = prompt("Review session name")?.trim();
    if (!name) return;
    const s = await repo.createSession({ projectId, name });
    setSessions(await repo.listSessions(projectId));
    setSessionId(s.id);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter(
      (i) =>
        (status === "all" || i.status === status) &&
        (!q || i.title.toLowerCase().includes(q) || i.feedback.toLowerCase().includes(q)),
    );
  }, [issues, status, query]);

  async function onExport() {
    if (!project || !session) return;
    setBusy(true);
    try {
      const { warnings } = await exportSession(repo, project, session);
      const notes: string[] = [];
      if (warnings.missingScreenshots.length)
        notes.push(`${warnings.missingScreenshots.length} missing screenshot(s)`);
      if (warnings.staleSelectors.length)
        notes.push(`${warnings.staleSelectors.length} non-unique selector(s)`);
      if (notes.length) alert(`Review exported with warnings: ${notes.join(", ")}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.root}>
      <header data-testid="uxcue-header" style={S.header}>
        <span>UXCue</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={S.count} data-testid="issue-count">
            {filtered.length} shown
          </span>
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            title={mode === "dark" ? "Switch to light" : "Switch to dark"}
            style={S.themeToggle}
          >
            {mode === "dark" ? "☀" : "☾"}
          </button>
        </span>
      </header>

      <div style={S.pickers}>
        <Row>
          <select
            data-testid="project-select"
            value={projectId ?? ""}
            onChange={(e) => {
              setProjectId(e.target.value || undefined);
              setSessionId(undefined);
            }}
            style={S.select}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button data-testid="new-project" onClick={createProject} style={S.iconBtn}>
            +
          </button>
        </Row>
        <Row>
          <select
            data-testid="session-select"
            value={sessionId ?? ""}
            onChange={(e) => setSessionId(e.target.value || undefined)}
            disabled={!projectId}
            style={S.select}
          >
            <option value="">Select session…</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            data-testid="new-session"
            onClick={createSession}
            disabled={!projectId}
            style={S.iconBtn}
          >
            +
          </button>
        </Row>
      </div>

      {session && (
        <div style={S.filters}>
          <input
            data-testid="search"
            placeholder="Search issues…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={S.search}
          />
          <select
            data-testid="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={S.select}
          >
            {["all", "open", "reviewing", "ready-for-agent", "exported", "fixed", "ignored"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      <main style={S.list}>
        {!project && (
          <Empty
            t={t}
            testid="empty-state"
            title="No project selected"
            hint="Create a project to start capturing UI review issues."
          />
        )}
        {project && !session && (
          <Empty t={t} title="No session selected" hint="Start a review session for this app." />
        )}
        {session && filtered.length === 0 && (
          <Empty
            t={t}
            title="No issues captured"
            hint="Right-click a page → UXCue → Give feedback, or press Alt+Shift+U."
          />
        )}
        {filtered.map((issue) => (
          <article
            key={issue.id}
            data-testid="issue-card"
            onClick={() => setSelectedId(issue.id)}
            style={{ ...S.card, cursor: "pointer" }}
          >
            <div style={S.cardTop}>
              <strong style={S.id}>{issue.displayId}</strong>
              <span style={{ ...S.pill, color: sev[issue.severity] }}>{issue.severity}</span>
              <span style={S.type}>{issue.type}</span>
            </div>
            <div style={S.title}>{issue.title}</div>
            <div style={S.meta}>
              {issue.status} · {issue.assigneeHint}
            </div>
          </article>
        ))}
      </main>

      {session && (
        <footer style={S.footer}>
          <button
            data-testid="export"
            onClick={onExport}
            disabled={busy || filtered.length === 0}
            style={S.primary}
          >
            {busy ? "Exporting…" : "Export review"}
          </button>
        </footer>
      )}

      {draft && !session && (
        <div data-testid="draft-needs-session" style={S.banner}>
          Capture ready — select a session to save it.
        </div>
      )}
      {draft && project && session && (
        <Composer
          draft={draft}
          projectId={project.id}
          sessionId={session.id}
          onSaved={() => {
            clearDraft();
            refreshIssues();
          }}
          onDiscard={clearDraft}
        />
      )}

      {selected && (
        <div style={S.detailOverlay}>
          <IssueDetail
            issue={selected}
            onBack={() => setSelectedId(undefined)}
            onChanged={refreshIssues}
            onDeleted={() => {
              setSelectedId(undefined);
              refreshIssues();
            }}
          />
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 6 }}>{children}</div>;
}

function Empty({
  t,
  title,
  hint,
  testid,
}: {
  t: Tokens;
  title: string;
  hint: string;
  testid?: string;
}) {
  return (
    <div
      data-testid={testid}
      style={{
        border: `1px solid ${t.color.border}`,
        borderRadius: t.radius,
        padding: 16,
        background: t.color.surface,
      }}
    >
      <p style={{ fontWeight: 650, margin: "0 0 4px" }}>{title}</p>
      <p style={{ color: t.color.textMuted, margin: 0, fontSize: 13 }}>{hint}</p>
    </div>
  );
}

function makeStyles(t: Tokens): Record<string, CSSProperties> {
  return {
    root: {
      fontFamily: t.fontUi,
      color: t.color.text,
      background: t.color.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      background: t.color.headerBg,
      color: t.color.headerText,
      padding: "12px 16px",
      fontWeight: 700,
      fontSize: 16,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    count: { fontSize: 12, fontWeight: 500, opacity: 0.8 },
    themeToggle: {
      border: "none",
      background: "transparent",
      color: t.color.headerText,
      cursor: "pointer",
      fontSize: 15,
      lineHeight: 1,
      padding: 2,
    },
    pickers: {
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      borderBottom: `1px solid ${t.color.border}`,
    },
    filters: {
      padding: "8px 12px",
      display: "flex",
      gap: 8,
      borderBottom: `1px solid ${t.color.border}`,
    },
    select: {
      flex: 1,
      font: "inherit",
      fontSize: 13,
      padding: "6px 8px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
    },
    search: {
      flex: 2,
      font: "inherit",
      fontSize: 13,
      padding: "6px 8px",
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
    },
    iconBtn: {
      width: 32,
      font: "inherit",
      fontSize: 16,
      borderRadius: t.radius,
      border: `1px solid ${t.color.border}`,
      background: t.color.surface,
      color: t.color.text,
      cursor: "pointer",
    },
    list: {
      flex: 1,
      overflowY: "auto",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    card: {
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius,
      padding: 12,
      background: t.color.surface,
    },
    cardTop: { display: "flex", gap: 8, alignItems: "center", fontSize: 12 },
    id: { fontFamily: t.fontMono, fontSize: 13 },
    pill: { fontWeight: 650, textTransform: "uppercase", fontSize: 11 },
    type: { color: t.color.textMuted },
    title: { fontWeight: 650, fontSize: 15, margin: "4px 0 2px" },
    meta: { color: t.color.textMuted, fontSize: 12 },
    footer: { padding: 12, borderTop: `1px solid ${t.color.border}` },
    banner: {
      padding: "10px 12px",
      background: t.color.attention,
      color: "#fff",
      fontSize: 13,
      textAlign: "center",
    },
    detailOverlay: {
      position: "fixed",
      inset: 0,
      background: t.color.bg,
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
    },
    primary: {
      width: "100%",
      font: "inherit",
      fontSize: 14,
      fontWeight: 650,
      padding: "8px 12px",
      borderRadius: t.radius,
      border: "none",
      background: t.color.primary,
      color: "#fff",
      cursor: "pointer",
    },
  };
}
