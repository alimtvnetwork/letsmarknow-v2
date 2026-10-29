import { cleanWorkspace } from "@/data/mockWorkspace";
import { DEFAULT_EXTENSION_PREFERENCES, EXTENSION_PREFERENCES_KEY, EXTENSION_STORAGE_KEY } from "../lib/extensionStore";

/**
 * Service Worker Lifecycle for LetsMarkNow Extension (Manifest V3).
 */

let isEnsuringExtensionWindow = false;
let scheduledEnsureTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Ensures the primary LetsMarkNow extension workspace (app.html) is open as a tab
 * and focused. If a tab is already open (e.g. the desktop launcher opened it as tab 1
 * alongside the web dashboard tab), it is focused and nothing new is created.
 * Otherwise the app opens as a TAB in the current window — never a second window.
 */
export async function ensureExtensionWindow(): Promise<void> {
  if (isEnsuringExtensionWindow) return;
  isEnsuringExtensionWindow = true;

  try {
    if (typeof chrome === "undefined" || !chrome.windows || !chrome.tabs) return;

    const appUrl = chrome.runtime.getURL("app.html");
    const allWindows = await chrome.windows.getAll({ populate: true });

    for (const win of allWindows) {
      const foundTab = win.tabs?.find((t) => t.url && t.url.startsWith(appUrl));
      if (foundTab) {
        if (win.id) {
          await chrome.windows.update(win.id, { focused: true });
        }
        if (foundTab.id) {
          await chrome.tabs.update(foundTab.id, { active: true });
        }
        return;
      }
    }

    // No app tab yet: open it as a tab in the last-focused window.
    const targetWindow = [...allWindows].reverse().find((w) => typeof w.id === "number");
    if (targetWindow && typeof targetWindow.id === "number") {
      await chrome.tabs.create({ windowId: targetWindow.id, url: appUrl, active: true });
    } else {
      // No browser window exists at all (headless-ish edge case): create one.
      await chrome.windows.create({ url: appUrl, type: "normal", focused: true });
    }
  } catch (err) {
    console.warn("Failed to ensure LetsMarkNow extension tab:", err);
  } finally {
    setTimeout(() => {
      isEnsuringExtensionWindow = false;
    }, 800);
  }
}

/**
 * Boot-time triggers (worker start, install, browser startup) are delayed and coalesced:
 * the desktop launcher already opens the extension as tab 1, so the delayed scan finds
 * that tab and the worker creates nothing — no duplicate tab/window race.
 */
function scheduleEnsureExtensionWindow(delayMs = 1500): void {
  if (scheduledEnsureTimer) {
    clearTimeout(scheduledEnsureTimer);
  }
  scheduledEnsureTimer = setTimeout(() => {
    scheduledEnsureTimer = null;
    ensureExtensionWindow();
  }, delayMs);
}

// 1. Ensure extension tab is opened when Service Worker boots (delayed: launcher tabs win the race)
scheduleEnsureExtensionWindow();

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

    scheduleEnsureExtensionWindow();
  } catch (err) {
    console.warn("Failed to initialize storage onInstalled:", err);
  }
});

// 3. Lifecycle: On Browser Startup (delayed: launcher tabs win the race)
if (typeof chrome !== "undefined" && chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    scheduleEnsureExtensionWindow();
  });
}

// Context Menu click handler
if (typeof chrome !== "undefined" && chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "lmn_open_dashboard") {
      ensureExtensionWindow();
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

  if (message?.type === "ENSURE_EXTENSION_WINDOW" || message?.type === "OPEN_EXTENSION_WINDOW") {
    ensureExtensionWindow();
    sendResponse({ ok: true });
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

// Listener for external web page messages (auto-login bridge & window triggers)
if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GET_EXTENSION_AUTH") {
      chrome.storage.local.get(["lmn_auth_session_v1"], (res) => {
        sendResponse({ session: res?.lmn_auth_session_v1 || null });
      });
      return true;
    }

    if (message?.type === "ENSURE_EXTENSION_WINDOW" || message?.type === "OPEN_EXTENSION_WINDOW") {
      ensureExtensionWindow();
      sendResponse({ ok: true });
      return true;
    }

    return false;
  });
}
