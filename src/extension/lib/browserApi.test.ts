import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeTab,
  closeTabs,
  getActiveTab,
  getCurrentWindowTabs,
  getStorage,
  isChromeExtensionEnvironment,
  loadFromStorage,
  MOCK_DEV_TABS,
  openExtensionMain,
  openUrl,
  openWebAccount,
  removeStorage,
  saveToStorage,
  setStorage,
} from "./browserApi";

describe("browserApi adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-expect-error remove chrome mock between tests
    delete globalThis.chrome;
  });

  describe("in fallback dev mode (no chrome API)", () => {
    it("reports isChromeExtensionEnvironment as false", () => {
      expect(isChromeExtensionEnvironment()).toBe(false);
    });

    it("getActiveTab returns fallback mock tab", async () => {
      const tab = await getActiveTab();
      expect(tab).not.toBeNull();
      expect(tab?.url).toBeDefined();
    });

    it("getCurrentWindowTabs returns simulated tabs", async () => {
      const tabs = await getCurrentWindowTabs();
      expect(tabs.length).toBeGreaterThan(0);
      expect(tabs[0].url).toBe(MOCK_DEV_TABS[0].url);
    });

    it("getStorage and setStorage persist using localStorage", async () => {
      await setStorage("test_key", { hello: "world" });
      const loaded = await getStorage<{ hello: string }>("test_key");
      expect(loaded).toEqual({ hello: "world" });

      await removeStorage("test_key");
      const afterRemove = await getStorage("test_key");
      expect(afterRemove).toBeNull();
    });

    it("loadFromStorage and saveToStorage Section 9 adapters persist properly", async () => {
      await saveToStorage("adapter_key", { test: true });
      const loaded = await loadFromStorage<{ test: boolean }>("adapter_key");
      expect(loaded).toEqual({ test: true });
    });

    it("closeTabs and closeTab execute safely without errors", async () => {
      await expect(closeTab(101)).resolves.not.toThrow();
      await expect(closeTabs([101, 102])).resolves.not.toThrow();
    });

    it("openExtensionMain, openWebAccount, and openUrl execute safely without errors", async () => {
      vi.spyOn(window, "open").mockImplementation(() => null);
      await expect(openExtensionMain("app.html")).resolves.not.toThrow();
      await expect(openWebAccount("/account")).resolves.not.toThrow();
      await expect(openUrl("https://example.com")).resolves.not.toThrow();
    });
  });

  describe("in chrome extension mode (mocked chrome API)", () => {
    it("delegates to chrome.tabs and chrome.storage.local", async () => {
      const mockStorageData: Record<string, unknown> = {};

      // Mock chrome extension environment
      (globalThis as unknown as { chrome: unknown }).chrome = {
        runtime: {
          lastError: null,
          getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
        },
        tabs: {
          query: vi.fn(async (queryInfo: { active?: boolean }) => {
            if (queryInfo.active) {
              return [
                {
                  id: 777,
                  title: "Chrome Tab",
                  url: "https://example.com/chrome",
                  favIconUrl: "https://example.com/fav.png",
                  windowId: 1,
                  active: true,
                  pinned: false,
                },
              ];
            }
            return [
              { id: 777, title: "Chrome Tab", url: "https://example.com/chrome" },
              { id: 888, title: "Second Tab", url: "https://example.com/two" },
            ];
          }),
          remove: vi.fn(async (_id: number) => {}),
          create: vi.fn(async (_opts: { url: string }) => {}),
        },
        storage: {
          local: {
            get: vi.fn((keys: string[], cb: (res: Record<string, unknown>) => void) => {
              const res: Record<string, unknown> = {};
              for (const k of keys) res[k] = mockStorageData[k];
              cb(res);
            }),
            set: vi.fn((obj: Record<string, unknown>, cb: () => void) => {
              Object.assign(mockStorageData, obj);
              cb();
            }),
            remove: vi.fn((keys: string[], cb: () => void) => {
              for (const k of keys) delete mockStorageData[k];
              cb();
            }),
          },
        },
      };

      expect(isChromeExtensionEnvironment()).toBe(true);

      const active = await getActiveTab();
      expect(active?.id).toBe(777);
      expect(active?.title).toBe("Chrome Tab");

      const windowTabs = await getCurrentWindowTabs();
      expect(windowTabs).toHaveLength(2);

      await setStorage("custom_pref", "dark_mode");
      const readVal = await getStorage<string>("custom_pref");
      expect(readVal).toBe("dark_mode");

      await closeTab(777);
      const chromeMock = (globalThis as unknown as { chrome: { tabs: { remove: (id: number) => void } } }).chrome;
      expect(chromeMock.tabs.remove).toHaveBeenCalledWith(777);
    });
  });
});
