import { useCallback, useEffect, useRef, useState } from "react";
import { getPlatform } from "../platform/index";

const platform = getPlatform();

/**
 * chrome.tabs.captureVisibleTab needs broad host access (activeTab or all-sites);
 * a single-origin grant isn't sufficient. So we request the whole optional set
 * once. It's an opt-in runtime grant (never a static all-sites permission), and
 * only the screenshot features need it — capture/track/export work without it.
 */
const CAPTURE_HOSTS = ["http://*/*", "https://*/*"];

/**
 * Per-review capture access. Screenshots need host access for the reviewed page,
 * which a side-panel click can't grant via activeTab. We keep the active origin
 * only for display; `ensureAccess` requests CAPTURE_HOSTS as the FIRST await in a
 * click handler, preserving the user gesture Chrome requires. Requesting an
 * already-granted scope resolves without a prompt.
 */
export function useHostAccess() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string>();
  const checked = useRef(false);

  useEffect(() => {
    void platform.permissions.activeTabOrigin().then(setOrigin);
    void platform.permissions.hasHostAccess(CAPTURE_HOSTS).then((h) => {
      checked.current = true;
      setHasAccess(h);
    });
  }, []);

  /** Gesture-preserving: call FIRST in a click handler (no await before it). */
  const ensureAccess = useCallback(async (): Promise<boolean> => {
    setError(undefined);
    try {
      const granted = await platform.permissions.requestHostAccess(CAPTURE_HOSTS);
      setHasAccess(granted);
      return granted;
    } catch (e) {
      // Throws if CAPTURE_HOSTS isn't in optional_host_permissions (stale build).
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);

  return { origin, hasAccess, error, ensureAccess };
}
