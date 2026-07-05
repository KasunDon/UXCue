// This file is the sanctioned chrome.* boundary (D015); the lint rule that
// forbids chrome.* elsewhere excludes src/platform/**.
import type { PlatformAdapter, RuntimeMessage, RuntimeResponse } from "./index";

/** Inject the declared content scripts (isolated + MAIN world) into one tab. */
async function injectDeclared(tabId: number): Promise<void> {
  const scripts = chrome.runtime.getManifest().content_scripts ?? [];
  for (const cs of scripts) {
    if (!cs.js?.length) continue;
    const world = (cs as { world?: "MAIN" | "ISOLATED" }).world === "MAIN" ? "MAIN" : "ISOLATED";
    await chrome.scripting
      .executeScript({ target: { tabId }, files: cs.js, world })
      .catch(() => {});
  }
}

/**
 * Concrete Chrome (MV3) implementation of the platform adapter. This is the one
 * place in the extension that is allowed to reference `chrome.*` (D015).
 */
const chromeAdapter: PlatformAdapter = {
  platform: "chrome",

  runtime: {
    send(message: RuntimeMessage): Promise<RuntimeResponse> {
      return chrome.runtime.sendMessage(message);
    },
    onMessage(handler) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const result = handler(message as RuntimeMessage, {
          url: sender.url,
          tabId: sender.tab?.id,
        });
        if (result instanceof Promise) {
          result.then((r) => sendResponse(r ?? { ok: true }));
          return true; // async response
        }
        sendResponse(result ?? { ok: true });
        return false;
      });
    },
    onLifecycle(handler) {
      chrome.runtime.onInstalled.addListener(() => handler());
      chrome.runtime.onStartup.addListener(() => handler());
    },
    id() {
      return chrome.runtime.id;
    },
  },

  sidePanel: {
    async openOnActionClick(open: boolean) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: open });
    },
    async open(tabId: number) {
      await chrome.sidePanel.open({ tabId });
    },
  },

  commands: {
    onCommand(handler) {
      chrome.commands.onCommand.addListener(handler);
    },
  },

  contextMenus: {
    register(items) {
      chrome.contextMenus.removeAll(() => {
        for (const item of items) {
          chrome.contextMenus.create({
            id: item.id,
            title: item.title,
            contexts: ["all"],
            ...(item.parentId ? { parentId: item.parentId } : {}),
          });
        }
      });
    },
    onClicked(handler) {
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        handler(String(info.menuItemId), tab?.id);
      });
    },
  },

  tabs: {
    async sendMessage(tabId, message) {
      await chrome.tabs.sendMessage(tabId, message);
    },
    injectContentScripts(tabId) {
      return injectDeclared(tabId);
    },
    async injectContentScriptsEverywhere() {
      const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
      for (const tab of tabs) if (tab.id != null) await injectDeclared(tab.id);
    },
    async activeTabId() {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab?.id ?? null;
    },
  },

  activeTab: {
    async injectScript(files: string[]) {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id == null) return;
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files });
    },
    async injectFunction(fn: () => void) {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id == null) return;
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: fn });
    },
  },

  capture: {
    async captureViewport(): Promise<Blob> {
      const dataUrl = await chrome.tabs.captureVisibleTab({ format: "png" });
      const res = await fetch(dataUrl);
      return res.blob();
    },
  },

  permissions: {
    async activeTabOrigin(): Promise<string | null> {
      // The side panel's focus can make lastFocusedWindow miss, so fall back to
      // currentWindow, then any window with an active http(s) tab.
      const queries: chrome.tabs.QueryInfo[] = [
        { active: true, lastFocusedWindow: true },
        { active: true, currentWindow: true },
        { active: true },
      ];
      for (const q of queries) {
        const tabs = await chrome.tabs.query(q);
        for (const tab of tabs) {
          if (!tab.url) continue;
          try {
            const { protocol, origin } = new URL(tab.url);
            if (protocol === "http:" || protocol === "https:") return origin;
          } catch {
            /* not a URL we can request */
          }
        }
      }
      return null;
    },
    hasHostAccess(patterns: string[]): Promise<boolean> {
      return chrome.permissions.contains({ origins: patterns });
    },
    requestHostAccess(patterns: string[]): Promise<boolean> {
      return chrome.permissions.request({ origins: patterns });
    },
  },

  storage: {
    async get<T>(key: string): Promise<T | undefined> {
      const out = await chrome.storage.local.get(key);
      return out[key] as T | undefined;
    },
    async set(key: string, value: unknown) {
      await chrome.storage.local.set({ [key]: value });
    },
    async remove(key: string) {
      await chrome.storage.local.remove(key);
    },
    onChange(handler: (key: string, newValue: unknown) => void) {
      chrome.storage.local.onChanged.addListener((changes) => {
        for (const [key, change] of Object.entries(changes)) handler(key, change.newValue);
      });
    },
  },
};

export function getPlatform(): PlatformAdapter {
  return chromeAdapter;
}
