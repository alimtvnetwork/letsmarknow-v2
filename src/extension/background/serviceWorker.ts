import { cleanWorkspace } from "@/data/mockWorkspace";
import { DEFAULT_EXTENSION_PREFERENCES, EXTENSION_PREFERENCES_KEY, EXTENSION_STORAGE_KEY } from "../lib/extensionStore";

/**
 * Service Worker Lifecycle for LetsMarkNow Extension (Manifest V3).
 */

/**
 * Ensures the primary LetsMarkNow dashboard (app.html) is always opened or focused.
 * If an initial start tab is blank/newtab, it replaces it so no blank tabs linger.
 */
export async function ensureAppTabOpen(): Promise<void> {
  try {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    const appUrl = chrome.runtime.getURL("app.html");
    const tabs = await chrome.tabs.query({});
    const existingAppTab = tabs.find(t => t.url && t.url.startsWith(appUrl));

    if (existingAppTab) {
      if (existingAppTab.id && !existingAppTab.active) {
        await chrome.tabs.update(existingAppTab.id, { active: true });
      }
      return;
    }

    // Look for a blank / initial start page tab to convert
    const placeholderTab = tabs.find(
      t =>
        !t.url ||
        t.url === "about:blank" ||
        t.url.startsWith("edge://newtab") ||
        t.url.startsWith("chrome://newtab")
    );

    if (placeholderTab && placeholderTab.id) {
      await chrome.tabs.update(placeholderTab.id, { url: appUrl, active: true });
    } else {
      await chrome.tabs.create({ url: appUrl, active: true });
    }
  } catch (err) {
    console.warn("Failed to ensure LetsMarkNow app tab open:", err);
  }
}

// 1. Ensure tab is opened immediately when Service Worker boots
ensureAppTabOpen();

// 2. Lifecycle: On Extension Installation / Update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("LetsMarkNow Extension installed/updated:", details.reason);

  try {
    // Check if workspace data already exists in storage
    const currentStorage = await chrome.storage.local.get([
      EXTENSION_STORAGE_KEY,
      EXTENSION_PREFERENCES_KEY,
    ]);

    const storedData = currentStorage[EXTENSION_STORAGE_KEY]?.data;
    const isLegacyDemo =
      !storedData ||
      storedData.organizations?.length > 1 ||
      storedData.collections?.some((c: { id: string }) => c.id === "collection-design");

    if (isLegacyDemo) {
      await chrome.storage.local.set({
        [EXTENSION_STORAGE_KEY]: { data: cleanWorkspace },
      });
      console.log("Initialized clean single PE workspace in chrome.storage.local");
    }

    if (!currentStorage[EXTENSION_PREFERENCES_KEY]) {
      await chrome.storage.local.set({
        [EXTENSION_PREFERENCES_KEY]: DEFAULT_EXTENSION_PREFERENCES,
      });
      console.log("Initialized default extension preferences in chrome.storage.local");
    }

    // Setup Context Menus
    if (chrome.contextMenus) {
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: "lmn_open_dashboard",
          title: "Open LetsMarkNow Dashboard",
          contexts: ["action", "page"],
        });
        chrome.contextMenus.create({
          id: "lmn_add_to_next",
          title: "Add to Next",
          contexts: ["page", "link"],
        });
      });
    }

    await ensureAppTabOpen();
  } catch (err) {
    console.warn("Failed to initialize storage onInstalled:", err);
  }
});

// 3. Lifecycle: On Browser Startup
if (typeof chrome !== "undefined" && chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    ensureAppTabOpen();
  });
}

// 4. Lifecycle: On New Window Creation (e.g. desktop icon clicked while browser in background)
if (typeof chrome !== "undefined" && chrome.windows?.onCreated) {
  chrome.windows.onCreated.addListener(() => {
    setTimeout(ensureAppTabOpen, 100);
  });
}

// 5. Lifecycle: On New Tab Creation (converts initial blank/newtab to app.html)
if (typeof chrome !== "undefined" && chrome.tabs?.onCreated) {
  chrome.tabs.onCreated.addListener((tab) => {
    if (
      !tab.url ||
      tab.url === "about:blank" ||
      tab.url.startsWith("edge://newtab") ||
      tab.url.startsWith("chrome://newtab")
    ) {
      setTimeout(ensureAppTabOpen, 100);
    }
  });
}

// Context Menu click handler
if (typeof chrome !== "undefined" && chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "lmn_open_dashboard") {
      chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
    } else if (info.menuItemId === "lmn_add_to_next") {
      const url = info.linkUrl || info.pageUrl || tab?.url;
      const title = tab?.title || url;
      if (url) {
        try {
          chrome.runtime.sendMessage({
            type: "NEXT_ADD",
            payload: {
              url,
              title,
              favicon_url: tab?.favIconUrl,
              source_kind: "browser_tab",
            },
          });
        } catch {
          // Handled by active listeners
        }
      }
    }
  });
}

// Listener for runtime messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_EXTENSION_STATUS") {
    sendResponse({ status: "active", version: "0.1.0" });
    return true;
  }

  if (message?.type === "NEXT_ADD") {
    // Broadcast to open surfaces
    chrome.runtime.sendMessage({
      type: "NEXT_ITEM_ADDED",
      payload: message.payload,
    }).catch(() => {});
    sendResponse({ ok: true, data: message.payload });
    return true;
  }

  if (message?.type === "NEXT_UPDATE") {
    chrome.runtime.sendMessage({
      type: "NEXT_ITEM_UPDATED",
      payload: message.payload,
    }).catch(() => {});
    sendResponse({ ok: true, data: message.payload });
    return true;
  }

  if (message?.type === "NEXT_REMOVE") {
    chrome.runtime.sendMessage({
      type: "NEXT_ITEM_REMOVED",
      payload: message.payload,
    }).catch(() => {});
    sendResponse({ ok: true, data: message.payload });
    return true;
  }

  return false;
});

// Listener for external web page messages (auto-login bridge)
if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GET_EXTENSION_AUTH") {
      chrome.storage.local.get(["lmn_auth_session_v1"], (res) => {
        sendResponse({ session: res?.lmn_auth_session_v1 || null });
      });
      return true;
    }
    return false;
  });
}
