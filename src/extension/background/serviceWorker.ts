import { cleanWorkspace } from "@/data/mockWorkspace";
import { DEFAULT_EXTENSION_PREFERENCES, EXTENSION_PREFERENCES_KEY, EXTENSION_STORAGE_KEY } from "../lib/extensionStore";

/**
 * Service Worker Lifecycle for LetsMarkNow Extension (Manifest V3).
 */
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

    // Register Context Menu for quick access to Full Dashboard
    if (typeof chrome.contextMenus !== "undefined") {
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: "lmn_open_dashboard",
          title: "Open LetsMarkNow Dashboard",
          contexts: ["action", "page"],
        });
      });
    }
  } catch (err) {
    console.warn("Failed to initialize storage onInstalled:", err);
  }
});

// Context Menu click handler
if (typeof chrome !== "undefined" && chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "lmn_open_dashboard") {
      chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
    }
  });
}

// Listener for runtime messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_EXTENSION_STATUS") {
    sendResponse({ status: "active", version: "0.1.0" });
    return true;
  }
  return false;
});

