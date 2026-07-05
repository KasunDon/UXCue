import { useCallback, useEffect, useRef, useState } from "react";
import { getPlatform } from "../platform/index";

const platform = getPlatform();

/**
 * Per-site capture access. Screenshots (captureVisibleTab) need host access for
 * the reviewed page, which a side-panel click can't grant via activeTab. We
 * pre-read the active tab's origin so `ensureAccess` can call requestHostAccess
 * as the FIRST await inside a click handler — preserving the user gesture Chrome
 * requires. Requesting an already-granted origin resolves without a prompt.
 */
export function useHostAccess() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const originRef = useRef<string | null>(null);

  useEffect(() => {
    void platform.permissions.activeTabOrigin().then(async (o) => {
      originRef.current = o;
      setOrigin(o);
      if (o) setHasAccess(await platform.permissions.hasHostAccess(o));
    });
  }, []);

  /** Gesture-preserving: call FIRST in a click handler (no await before it). */
  const ensureAccess = useCallback(async (): Promise<boolean> => {
    const o = originRef.current;
    if (!o) return false;
    try {
      const granted = await platform.permissions.requestHostAccess(o);
      setHasAccess(granted);
      return granted;
    } catch {
      // request throws if optional_host_permissions is missing (stale build).
      return false;
    }
  }, []);

  return { origin, hasAccess, ensureAccess };
}
