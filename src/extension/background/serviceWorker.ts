import { mockWorkspace } from "@/data/mockWorkspace";
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

    if (!currentStorage[EXTENSION_STORAGE_KEY]) {
      await chrome.storage.local.set({
        [EXTENSION_STORAGE_KEY]: { data: mockWorkspace },
      });
      console.log("Initialized default workspace data in chrome.storage.local");
    }

    if (!currentStorage[EXTENSION_PREFERENCES_KEY]) {
      await chrome.storage.local.set({
        [EXTENSION_PREFERENCES_KEY]: DEFAULT_EXTENSION_PREFERENCES,
      });
      console.log("Initialized default extension preferences in chrome.storage.local");
    }
  } catch (err) {
    console.warn("Failed to initialize storage onInstalled:", err);
  }
});

// Listener for runtime messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_EXTENSION_STATUS") {
    sendResponse({ status: "active", version: "0.1.0" });
    return true;
  }
  return false;
});
