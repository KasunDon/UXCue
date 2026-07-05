/**
 * Platform adapter (D015) — the ONLY module tree allowed to touch `chrome.*`.
 * Everything else imports this interface. A lint rule forbids `chrome.*`
 * elsewhere under apps/extension/src, so the extension stays portable
 * (Release 6) and mockable in e2e.
 */

import type { ElementContext, PageContext, CaptureContext, ConsoleEntry } from "@uxcue/schema";

export type PlatformName = "chrome" | "edge" | "firefox" | "mock";

export interface AreaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Messages passed between the overlay, service worker, and side panel. */
export type RuntimeMessage =
  | { type: "PING" }
  | { type: "CONTENT_READY"; url: string }
  | { type: "ARM_CAPTURE" }
  // SW -> content: show the element-picker overlay (no activeTab needed; the
  // declared content script is already present on the page).
  | { type: "SHOW_OVERLAY" }
  // side panel / composer -> SW: capture the active tab and merge into the draft
  | { type: "TRIGGER_ACTIVE"; action: "viewport" | "area" | "console" }
  | { type: "CAPTURE_CANCELLED" }
  // SW -> content triggers (from the right-click menu)
  | { type: "CAPTURE_CONTEXT" }
  | { type: "CAPTURE_VIEWPORT" }
  | { type: "CAPTURE_AREA" }
  | { type: "CAPTURE_CONSOLE" }
  // content -> SW results
  | {
      type: "CAPTURE_SELECTED";
      element: ElementContext;
      page: PageContext;
      capture: CaptureContext;
      console?: ConsoleEntry[];
    }
  | {
      type: "CAPTURE_PAGE";
      mode: "viewport" | "area" | "console";
      page: PageContext;
      capture: CaptureContext;
      areaRect?: AreaRect;
      console?: ConsoleEntry[];
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
    /** Fires on install/update and on browser startup. */
    onLifecycle(handler: () => void): void;
    id(): string;
  };

  sidePanel: {
    /** Open the side panel when the toolbar action is clicked. */
    openOnActionClick(open: boolean): Promise<void>;
    /** Open the side panel now (must be called from a user gesture). */
    open(tabId: number): Promise<void>;
  };

  commands: {
    onCommand(handler: (command: string) => void): void;
  };

  contextMenus: {
    /** (Re)register menu items (removes existing first to avoid dupes). */
    register(items: { id: string; title: string; parentId?: string }[]): void;
    onClicked(handler: (menuItemId: string, tabId: number | undefined) => void): void;
  };

  tabs: {
    /** Message a content script in a specific tab (right-click capture). */
    sendMessage(tabId: number, message: RuntimeMessage): Promise<void>;
    /** (Re)inject the declared content scripts into an already-open tab. */
    injectContentScripts(tabId: number): Promise<void>;
    /** Inject the declared content scripts into every already-open http/https tab. */
    injectContentScriptsEverywhere(): Promise<void>;
    /** The id of the active tab in the last-focused window (or null). */
    activeTabId(): Promise<number | null>;
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
