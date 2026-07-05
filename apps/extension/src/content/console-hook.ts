/**
 * MAIN-world console hook (content_scripts world: "MAIN", run_at: document_start).
 * Wraps the page's console + error events and forwards entries to the isolated
 * context-capture script via window.postMessage. Runs in the page world so it
 * sees the page's own console calls; injected by Chrome (not inline), so it is
 * CSP-safe and does not violate the "no inline script injection" constraint.
 * No chrome.* here — this world has no extension APIs.
 */
type Level = "log" | "info" | "warn" | "error" | "debug";

(function installConsoleHook() {
  const stringify = (v: unknown): string => {
    if (typeof v === "string") return v;
    try {
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    } catch {
      return String(v);
    }
  };

  const post = (level: Level, args: unknown[]) => {
    try {
      const text = args.map(stringify).join(" ").slice(0, 2000);
      window.postMessage({ __uxcueLog: { level, text, at: new Date().toISOString() } }, "*");
    } catch {
      /* never disrupt the page */
    }
  };

  const c = console as unknown as Record<Level, (...a: unknown[]) => void>;
  (["log", "info", "warn", "error", "debug"] as const).forEach((level) => {
    const original = c[level];
    c[level] = function (this: unknown, ...args: unknown[]) {
      post(level, args);
      return original.apply(this, args);
    };
  });

  window.addEventListener("error", (e) => post("error", [e.message]));
  window.addEventListener("unhandledrejection", (e) =>
    post("error", ["Unhandled rejection: " + stringify((e as PromiseRejectionEvent).reason)]),
  );
})();
