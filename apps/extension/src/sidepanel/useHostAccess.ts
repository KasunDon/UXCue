import { useCallback, useEffect, useRef, useState } from "react";
import { getPlatform } from "../platform/index";

const platform = getPlatform();

/** All-sites fallback when we can't resolve the active tab's specific origin. */
const BROAD = ["http://*/*", "https://*/*"];
const patternsFor = (origin: string | null): string[] => (origin ? [`${origin}/*`] : BROAD);

/**
 * Per-site capture access. Screenshots (captureVisibleTab) need host access for
 * the reviewed page, which a side-panel click can't grant via activeTab. We
 * pre-read the active tab's origin so `ensureAccess` can call requestHostAccess
 * as the FIRST await inside a click handler — preserving the user gesture Chrome
 * requires. If the origin can't be resolved we request the broad set so a prompt
 * still appears. Requesting an already-granted scope resolves without a prompt.
 */
export function useHostAccess() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string>();
  const originRef = useRef<string | null>(null);

  useEffect(() => {
    void platform.permissions.activeTabOrigin().then(async (o) => {
      originRef.current = o;
      setOrigin(o);
      setHasAccess(await platform.permissions.hasHostAccess(patternsFor(o)));
    });
  }, []);

  /** Gesture-preserving: call FIRST in a click handler (no await before it). */
  const ensureAccess = useCallback(async (): Promise<boolean> => {
    setError(undefined);
    try {
      const granted = await platform.permissions.requestHostAccess(patternsFor(originRef.current));
      setHasAccess(granted);
      return granted;
    } catch (e) {
      // Throws if the pattern isn't in optional_host_permissions (stale build).
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);

  return { origin, hasAccess, error, ensureAccess };
}
