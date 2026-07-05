/**
 * Platform adapter (D015) — the ONLY module tree allowed to touch `chrome.*`.
 * Everything else imports this interface. A lint rule forbids `chrome.*`
 * elsewhere under apps/extension/src, so the extension stays portable
 * (Release 6) and mockable in e2e.
 */

import type { ElementContext, PageContext, CaptureContext } from "@uxcue/schema";

export type PlatformName = "chrome" | "edge" | "firefox" | "mock";

/** Messages passed between the overlay, service worker, and side panel. */
export type RuntimeMessage =
  | { type: "PING" }
  | { type: "CONTENT_READY"; url: string }
  | { type: "ARM_CAPTURE" }
  | { type: "CAPTURE_CANCELLED" }
  | {
      type: "CAPTURE_SELECTED";
      element: ElementContext;
      page: PageContext;
      capture: CaptureContext;
    }
  | { type: "DRAFT_READY" };

export type RuntimeResponse = { ok: true; [k: string]: unknown };

export interface PlatformAdapter {
  readonly platform: PlatformName;

  runtime: {
    /** Send a message to the service worker and await its response. */
    send(message: RuntimeMessage): Promise<RuntimeResponse>;
    /** Register a handler; its (possibly async) return value is the response. */
    onMessage(
      handler: (
        message: RuntimeMessage,
        sender: { url?: string; tabId?: number },
      ) => Promise<RuntimeResponse> | RuntimeResponse | void,
    ): void;
    id(): string;
  };

  sidePanel: {
    /** Open the side panel when the toolbar action is clicked. */
    openOnActionClick(open: boolean): Promise<void>;
  };

  commands: {
    onCommand(handler: (command: string) => void): void;
  };

  /** Run code in the ACTIVE tab under activeTab (no host perms, D013). */
  activeTab: {
    injectScript(files: string[]): Promise<void>;
    /** Inject a self-contained function into the active tab (the overlay). */
    injectFunction(fn: () => void): Promise<void>;
  };

  capture: {
    /** ONE captureVisibleTab per issue (D011); returns the viewport PNG. */
    captureViewport(): Promise<Blob>;
  };

  storage: {
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<void>;
    remove(key: string): Promise<void>;
    onChange(handler: (key: string, newValue: unknown) => void): void;
  };
}

export { getPlatform } from "./chrome";
