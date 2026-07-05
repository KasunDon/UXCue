// This file is the sanctioned chrome.* boundary (D015); the lint rule that
// forbids chrome.* elsewhere excludes src/platform/**.
import type { PlatformAdapter, RuntimeMessage, RuntimeResponse } from "./index";

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
    id() {
      return chrome.runtime.id;
    },
  },

  sidePanel: {
    async openOnActionClick(open: boolean) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: open });
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
          chrome.contextMenus.create({ id: item.id, title: item.title, contexts: ["all"] });
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
  },

  activeTab: {
    async injectScript(files: string[]) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id == null) return;
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files });
    },
    async injectFunction(fn: () => void) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
