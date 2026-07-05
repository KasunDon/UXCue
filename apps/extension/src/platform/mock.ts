/**
 * In-memory mock PlatformAdapter (D015) for unit tests — no chrome.* required.
 * Records what the code under test asks the browser to do (messages sent,
 * scripts injected, screenshots taken) so tests can assert the capture routing.
 */
import type { PlatformAdapter, RuntimeMessage, RuntimeResponse } from "./index";

export interface MockPlatform extends PlatformAdapter {
  readonly platform: "mock";
  /** Messages sent to content scripts: [tabId, message]. */
  readonly tabMessages: Array<{ tabId: number; message: RuntimeMessage }>;
  /** Functions injected into the active tab (overlay). */
  readonly injectedFns: Array<() => void>;
  /** Tabs the declared content scripts were (re)injected into. */
  readonly injectedTabs: number[];
  /** Viewport captures requested. */
  captureCount: number;
  /** Configure the active tab id returned by activeTabId(). */
  activeTab_id: number | null;
  /** When set, tabs.sendMessage rejects (simulates no content script present). */
  sendMessageRejects: boolean;
  /** When set, capture.captureViewport rejects (simulates missing activeTab). */
  captureRejects: boolean;
  /** Origin returned by permissions.activeTabOrigin(). */
  activeOrigin: string | null;
  /** Origins the user has granted host access to. */
  readonly grantedOrigins: Set<string>;
  /** Whether requestHostAccess() grants (simulates the user approving). */
  grantAccess: boolean;
  /** Deliver a message to the registered onMessage handler and return its response. */
  emit(
    message: RuntimeMessage,
    sender?: { url?: string; tabId?: number },
  ): Promise<RuntimeResponse>;
  /** Fire a command (e.g. "arm-capture"). */
  fireCommand(command: string): void;
  /** Click a context-menu item. */
  clickMenu(menuItemId: string, tabId?: number): void;
  /** The in-memory storage map (assertable). */
  readonly store: Map<string, unknown>;
}

export function createMockPlatform(overrides?: Partial<MockPlatform>): MockPlatform {
  const store = new Map<string, unknown>();
  const storageHandlers: Array<(key: string, v: unknown) => void> = [];
  let messageHandler:
    | ((
        m: RuntimeMessage,
        s: { url?: string; tabId?: number },
      ) => Promise<RuntimeResponse> | RuntimeResponse | void)
    | undefined;
  let commandHandler: ((command: string) => void) | undefined;
  let menuHandler: ((id: string, tabId: number | undefined) => void) | undefined;

  const p: MockPlatform = {
    platform: "mock",
    tabMessages: [],
    injectedFns: [],
    injectedTabs: [],
    captureCount: 0,
    activeTab_id: 1,
    sendMessageRejects: false,
    captureRejects: false,
    activeOrigin: "https://x.test",
    grantedOrigins: new Set<string>(),
    grantAccess: true,
    store,

    runtime: {
      async send(message) {
        return (await p.emit(message)) ?? { ok: true };
      },
      onMessage(handler) {
        messageHandler = handler;
      },
      onLifecycle() {},
      id() {
        return "mock-extension-id";
      },
    },
    sidePanel: {
      async openOnActionClick() {},
      async open() {},
    },
    commands: {
      onCommand(handler) {
        commandHandler = handler;
      },
    },
    contextMenus: {
      register() {},
      onClicked(handler) {
        menuHandler = handler;
      },
    },
    tabs: {
      async sendMessage(tabId, message) {
        if (p.sendMessageRejects) throw new Error("no content script");
        p.tabMessages.push({ tabId, message });
      },
      async injectContentScripts(tabId) {
        p.injectedTabs.push(tabId);
      },
      async injectContentScriptsEverywhere() {},
      async activeTabId() {
        return p.activeTab_id;
      },
    },
    activeTab: {
      async injectScript() {},
      async injectFunction(fn) {
        p.injectedFns.push(fn);
      },
    },
    capture: {
      async captureViewport() {
        if (p.captureRejects) throw new Error("activeTab not in effect");
        p.captureCount += 1;
        return new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
      },
    },
    permissions: {
      async activeTabOrigin() {
        return p.activeOrigin;
      },
      async hasHostAccess(patterns) {
        return patterns.every((pat) => p.grantedOrigins.has(pat));
      },
      async requestHostAccess(patterns) {
        if (!p.grantAccess) return false;
        for (const pat of patterns) p.grantedOrigins.add(pat);
        return true;
      },
    },
    storage: {
      async get(key) {
        return store.get(key) as never;
      },
      async set(key, value) {
        store.set(key, value);
        for (const h of storageHandlers) h(key, value);
      },
      async remove(key) {
        store.delete(key);
        for (const h of storageHandlers) h(key, undefined);
      },
      onChange(handler) {
        storageHandlers.push(handler);
      },
    },

    async emit(message, sender = {}) {
      const r = messageHandler?.(message, sender);
      return ((r instanceof Promise ? await r : r) as RuntimeResponse) ?? { ok: true };
    },
    fireCommand(command) {
      commandHandler?.(command);
    },
    clickMenu(menuItemId, tabId) {
      menuHandler?.(menuItemId, tabId);
    },
  };

  return Object.assign(p, overrides);
}
