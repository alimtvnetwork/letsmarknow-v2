import type { BrowserTabSnapshot } from "@/types/lmn";

/**
 * Fallback tabs used when running in standalone browser dev mode / preview.
 */
export const MOCK_DEV_TABS: BrowserTabSnapshot[] = [
  {
    id: 101,
    title: "LetsMarkNow - Browser Productivity & Tab Organization",
    url: "https://letsmarknow.dev/docs/getting-started",
    favIconUrl: "https://letsmarknow.dev/favicon.ico",
    active: true,
    pinned: false,
    windowId: 1,
  },
  {
    id: 102,
    title: "GitHub - letsmarknow/letsmarknow-v2: Browser tab manager",
    url: "https://github.com/letsmarknow/letsmarknow-v2",
    favIconUrl: "https://github.githubassets.com/favicons/favicon.png",
    active: false,
    pinned: true,
    windowId: 1,
  },
  {
    id: 103,
    title: "Tailwind CSS - Rapidly build modern websites without ever leaving your HTML",
    url: "https://tailwindcss.com/docs/installation",
    favIconUrl: "https://tailwindcss.com/favicons/favicon.ico",
    active: false,
    pinned: false,
    windowId: 1,
  },
  {
    id: 104,
    title: "Radix Primitives - Unstyled, accessible components for React",
    url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
    favIconUrl: "https://www.radix-ui.com/favicon.ico",
    active: false,
    pinned: false,
    windowId: 1,
  },
  {
    id: 105,
    title: "Chrome Extensions - Manifest V3 Developer Guide",
    url: "https://developer.chrome.com/docs/extensions/mv3/intro/",
    favIconUrl: "https://developer.chrome.com/favicon.ico",
    active: false,
    pinned: false,
    windowId: 1,
  },
];

/**
 * Checks if the execution environment is a genuine Chrome/Edge extension.
 */
export function isChromeExtensionEnvironment(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.runtime !== "undefined" &&
    typeof chrome.storage?.local !== "undefined"
  );
}

/**
 * Retrieves the currently active tab in the current window.
 */
export async function getActiveTab(): Promise<BrowserTabSnapshot | null> {
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.tabs.query === "function"
  ) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        return {
          id: tab.id,
          title: tab.title ?? "Untitled Tab",
          url: tab.url ?? "",
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId,
          active: tab.active,
          pinned: tab.pinned,
        };
      }
    } catch (err) {
      console.warn("Failed to query active chrome tab:", err);
    }
  }

  // Dev fallback: return mock active tab or current window location
  if (typeof window !== "undefined" && window.location) {
    const isLocalApp =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalApp && MOCK_DEV_TABS[0]) {
      return MOCK_DEV_TABS[0];
    }
    return {
      id: 999,
      title: document.title || "Current Page",
      url: window.location.href,
      favIconUrl: "/favicon.ico",
      active: true,
      pinned: false,
      windowId: 1,
    };
  }

  return null;
}

/**
 * Retrieves all tabs in the current browser window.
 */
export async function getCurrentWindowTabs(): Promise<BrowserTabSnapshot[]> {
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.tabs.query === "function"
  ) {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs.map((t) => ({
        id: t.id,
        title: t.title ?? "Untitled Tab",
        url: t.url ?? "",
        favIconUrl: t.favIconUrl,
        windowId: t.windowId,
        active: t.active,
        pinned: t.pinned,
      }));
    } catch (err) {
      console.warn("Failed to query current window chrome tabs:", err);
    }
  }

  // Dev fallback: return simulated open tabs
  return MOCK_DEV_TABS;
}

/**
 * Closes one or more browser tabs by ID.
 */
export async function closeTabs(tabIds: number | number[]): Promise<void> {
  if (Array.isArray(tabIds) && tabIds.length === 0) return;

  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.tabs.remove === "function"
  ) {
    try {
      await chrome.tabs.remove(tabIds);
      return;
    } catch (err) {
      console.warn("Failed to close chrome tabs:", err);
    }
  }
}

/**
 * Closes a single browser tab by its tab ID (alias for closeTabs).
 */
export async function closeTab(tabId: number): Promise<void> {
  return closeTabs(tabId);
}

/**
 * Opens any URL in a new browser tab.
 */
export async function openUrl(url: string): Promise<void> {
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.tabs.create === "function"
  ) {
    try {
      await chrome.tabs.create({ url });
      return;
    } catch (err) {
      console.warn("Failed to open URL via chrome.tabs:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Opens multiple URLs in new browser tabs.
 */
export async function openUrls(urls: string[]): Promise<void> {
  const valid = urls.filter((u) => u && !u.startsWith("chrome://") && !u.startsWith("edge://"));
  for (const url of valid) {
    await openUrl(url);
  }
}

/**
 * Opens multiple URLs in a new browser window.
 */
export async function openUrlsInNewWindow(urls: string[]): Promise<void> {
  const valid = urls.filter((u) => u && !u.startsWith("chrome://") && !u.startsWith("edge://"));
  if (!valid.length) return;

  if (
    typeof chrome !== "undefined" &&
    typeof chrome.windows !== "undefined" &&
    typeof chrome.windows.create === "function"
  ) {
    try {
      await chrome.windows.create({ url: valid });
      return;
    } catch (err) {
      console.warn("Failed to open URLs in new window via chrome.windows:", err);
    }
  }

  // Dev fallback
  if (typeof window !== "undefined") {
    valid.forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
  }
}

/**
 * Replaces current window tabs with specified URLs.
 */
export async function replaceCurrentWindowWithUrls(urls: string[]): Promise<void> {
  const valid = urls.filter((u) => u && !u.startsWith("chrome://") && !u.startsWith("edge://"));
  if (!valid.length) return;

  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.tabs.create === "function"
  ) {
    try {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      for (const url of valid) {
        await chrome.tabs.create({ url });
      }
      const toClose = currentTabs
        .filter((t) => t.id && !t.url?.includes("app.html"))
        .map((t) => t.id as number);
      if (toClose.length) {
        await closeTabs(toClose);
      }
      return;
    } catch (err) {
      console.warn("Failed to replace window tabs:", err);
    }
  }

  // Dev fallback
  await openUrls(valid);
}

/**
 * Opens the full extension tab in a new browser tab.
 */
export async function openExtensionTab(page: string = "app.html"): Promise<void> {
  const cleanPath = page.startsWith("/") ? page.slice(1) : page;

  if (
    typeof chrome !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.runtime?.getURL === "function"
  ) {
    try {
      const url = chrome.runtime.getURL(cleanPath);
      await chrome.tabs.create({ url });
      return;
    } catch (err) {
      console.warn("Failed to open extension tab via chrome.tabs:", err);
    }
  }

  // Dev fallback
  if (typeof window !== "undefined") {
    const targetUrl = cleanPath.startsWith("http")
      ? cleanPath
      : `${window.location.origin}/${cleanPath}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}

/**
 * Section 9 adapter alias: Opens the main extension page.
 */
export async function openExtensionMain(page: string = "app.html"): Promise<void> {
  return openExtensionTab(page);
}

/**
 * Opens the web dashboard URL in a browser tab.
 */
export async function openWebDashboard(url: string = "http://localhost:5173/web"): Promise<void> {
  return openUrl(url);
}

/**
 * Section 9 adapter: Opens web account/portal page in a browser tab.
 */
export async function openWebAccount(path: string = "/web/account"): Promise<void> {
  const baseUrl = typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:5173";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const targetPath = normalized.startsWith("/web") ? normalized : `/web${normalized}`;
  return openUrl(`${baseUrl}${targetPath}`);
}

/**
 * Retrieves a value from extension storage or localStorage fallback.
 */
export async function getStorage<T>(key: string): Promise<T | null> {
  if (isChromeExtensionEnvironment()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.warn("chrome.storage.local.get error:", chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve((result?.[key] as T) ?? null);
        }
      });
    });
  }

  // LocalStorage fallback
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Failed to parse localStorage key '${key}':`, err);
      return null;
    }
  }

  return null;
}

/**
 * Sets a value in extension storage or localStorage fallback.
 */
export async function setStorage<T>(key: string, value: T): Promise<void> {
  if (isChromeExtensionEnvironment()) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // LocalStorage fallback
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Failed to set localStorage key '${key}':`, err);
    }
  }
}

/**
 * Removes a key from extension storage or localStorage fallback.
 */
export async function removeStorage(key: string): Promise<void> {
  if (isChromeExtensionEnvironment()) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Failed to remove localStorage key '${key}':`, err);
    }
  }
}

/**
 * Section 9 adapter alias: loads a value from storage.
 */
export async function loadFromStorage<T>(key: string): Promise<T | null> {
  return getStorage<T>(key);
}

/**
 * Section 9 adapter alias: saves a value to storage.
 */
export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  return setStorage<T>(key, value);
}
