/**
 * Platform adapter (D015) — the ONLY module tree allowed to touch `chrome.*`.
 * Everything else imports this interface. A lint rule forbids `chrome.*`
 * elsewhere under apps/extension/src, so the extension stays portable
 * (Release 6) and mockable in e2e.
 */

export type PlatformName = "chrome" | "edge" | "firefox" | "mock";

/** Messages the side panel / content script send to the service worker. */
export type RuntimeMessage =
  { type: "PING" } | { type: "CONTENT_READY"; url: string } | { type: "ARM_CAPTURE" };

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

  /** Inject a content script into the ACTIVE tab under activeTab (no host perms). */
  activeTab: {
    injectScript(files: string[]): Promise<void>;
  };

  capture: {
    /** ONE captureVisibleTab per issue (D011); returns the viewport PNG. */
    captureViewport(): Promise<Blob>;
  };

  storage: {
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<void>;
  };
}

export { getPlatform } from "./chrome";
