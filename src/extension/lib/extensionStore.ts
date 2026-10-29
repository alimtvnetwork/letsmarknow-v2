import { cleanWorkspace, mockWorkspace } from "@/data/mockWorkspace";
import {
  isValidAppData,
  LOCAL_STORAGE_KEY,
  VIEW_MODE_STORAGE_KEY,
  type StoredWorkspaceState,
} from "@/lib/localWorkspaceStore";
import {
  createCollectionMutation,
  createGroupMutation,
  createItemMutation,
  isValidUrl,
  purgeExpiredTrashMutation,
} from "@/lib/workspaceMutations";
import type {
  AppData,
  BrowserTabSnapshot,
  Collection,
  ColorLabel,
  ExtensionPreferences,
  Group,
  SavedItem,
  ViewMode,
} from "@/types/lmn";
import { closeTab, getStorage, removeStorage, setStorage } from "./browserApi";
import { filterSaveableTabs, generateSessionName, tabToSavedItem } from "./tabCapture";
import { getStoredAuth } from "@/lib/authStore";
import {
  createBackendItem,
  saveSessionToBackend,
  addToNextQueue,
  updateBackendAccountPreferences,
} from "@/lib/workspaceApiClient";

export const EXTENSION_STORAGE_KEY = LOCAL_STORAGE_KEY;
export const EXTENSION_PREFERENCES_KEY = "lmn_extension_prefs_v1";
export const EXTENSION_VIEW_MODE_KEY = VIEW_MODE_STORAGE_KEY;

export const DEFAULT_EXTENSION_PREFERENCES: ExtensionPreferences = {
  defaultViewMode: "grid",
  openFullTabAfterSave: false,
  openMainAfterSave: false,
  closeTabsAfterSave: false,
  preferredQuickSurface: "popup",
  showSuccessNotification: true,
  theme: "dark",
  webDashboardUrl: "http://localhost:5173",
};

/**
 * Loads the current AppData workspace models from extension or local storage.
 * Defaults to clean single "PE" workspace with no collections/items in production/browser.
 */
export async function loadWorkspaceData(): Promise<AppData> {
  const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

  try {
    const rawState = await getStorage<StoredWorkspaceState | AppData>(EXTENSION_STORAGE_KEY);
    if (!rawState) {
      const defaultData = isTestEnv ? mockWorkspace : cleanWorkspace;
      await saveWorkspaceData(defaultData);
      return defaultData;
    }

    let loaded: AppData | null = null;
    if ("data" in rawState && isValidAppData(rawState.data)) {
      loaded = rawState.data;
    } else if (isValidAppData(rawState)) {
      loaded = rawState;
    }

    if (loaded) {
      if (!isTestEnv) {
        // Auto-migrate if stored data in browser is the old multi-org demo data
        const isLegacyDemo =
          loaded.organizations.length > 1 ||
          loaded.collections.some((c) => c.id === "collection-design");
        if (isLegacyDemo) {
          await saveWorkspaceData(cleanWorkspace);
          return cleanWorkspace;
        }

        // Migrate any remnant "Inbox" group or space names
        let modified = false;
        const nextSpaces = loaded.spaces.map((s) => {
          if (s.name.trim().toLowerCase() === "inbox") {
            modified = true;
            return { ...s, name: "My Collections" };
          }
          return s;
        });
        const nextCollections = loaded.collections.map((c) => {
          const nextGroups = c.groups.map((g) => {
            if (g.name.trim().toLowerCase() === "inbox") {
              modified = true;
              return { ...g, name: "General" };
            }
            return g;
          });
          return { ...c, groups: nextGroups };
        });
        if (modified) {
          loaded = { ...loaded, spaces: nextSpaces, collections: nextCollections };
          await saveWorkspaceData(loaded);
        }

        // Auto-purge any items in Trash for more than 15 days
        const purged = purgeExpiredTrashMutation(loaded);
        if (purged !== loaded) {
          loaded = purged;
          await saveWorkspaceData(loaded);
        }
      }
      return loaded;
    }
  } catch (err) {
    console.warn("Failed to load workspace data for extension:", err);
  }

  return isTestEnv ? mockWorkspace : cleanWorkspace;
}

/**
 * Persists the AppData models to storage.
 */
export async function saveWorkspaceData(data: AppData): Promise<void> {
  if (!data || !isValidAppData(data)) return;
  const existing = await getStorage<StoredWorkspaceState>(EXTENSION_STORAGE_KEY);
  const nextState: StoredWorkspaceState = {
    ...(existing ?? {}),
    data,
  };
  await setStorage(EXTENSION_STORAGE_KEY, nextState);
}

/**
 * Loads extension preferences.
 */
export async function loadPreferences(): Promise<ExtensionPreferences> {
  try {
    const prefs = await getStorage<ExtensionPreferences>(EXTENSION_PREFERENCES_KEY);
    const merged: ExtensionPreferences = {
      ...DEFAULT_EXTENSION_PREFERENCES,
      ...(prefs ?? {}),
    };
    if (merged.defaultWorkspaceId && !merged.defaultOrganizationId) {
      merged.defaultOrganizationId = merged.defaultWorkspaceId;
    } else if (merged.defaultOrganizationId && !merged.defaultWorkspaceId) {
      merged.defaultWorkspaceId = merged.defaultOrganizationId;
    }
    if (merged.openMainAfterSave !== undefined && merged.openFullTabAfterSave === undefined) {
      merged.openFullTabAfterSave = merged.openMainAfterSave;
    } else if (merged.openFullTabAfterSave !== undefined && merged.openMainAfterSave === undefined) {
      merged.openMainAfterSave = merged.openFullTabAfterSave;
    }
    return merged;
  } catch {
    return DEFAULT_EXTENSION_PREFERENCES;
  }
}

/**
 * Saves extension preferences.
 */
export async function savePreferences(prefs: ExtensionPreferences): Promise<void> {
  const normalized = { ...prefs };
  if (normalized.defaultWorkspaceId && !normalized.defaultOrganizationId) {
    normalized.defaultOrganizationId = normalized.defaultWorkspaceId;
  } else if (normalized.defaultOrganizationId && !normalized.defaultWorkspaceId) {
    normalized.defaultWorkspaceId = normalized.defaultOrganizationId;
  }
  if (normalized.openMainAfterSave !== undefined && normalized.openFullTabAfterSave === undefined) {
    normalized.openFullTabAfterSave = normalized.openMainAfterSave;
  } else if (normalized.openFullTabAfterSave !== undefined && normalized.openMainAfterSave === undefined) {
    normalized.openMainAfterSave = normalized.openFullTabAfterSave;
  }
  await setStorage(EXTENSION_PREFERENCES_KEY, normalized);
}

/**
 * Loads the user-selected view mode (grid, list, compact, mindmap) with fallback checks.
 */
export async function loadSelectedViewMode(): Promise<ViewMode> {
  const validModes: ViewMode[] = ["list", "compact", "grid", "mindmap"];

  try {
    // 1. Dedicated storage key
    const directStored = await getStorage<string | ViewMode>(EXTENSION_VIEW_MODE_KEY);
    if (directStored) {
      const clean = String(directStored).replace(/"/g, "").trim() as ViewMode;
      if (validModes.includes(clean)) {
        return clean;
      }
    }

    // 2. Extension preferences
    const prefs = await loadPreferences();
    if (prefs.defaultViewMode && validModes.includes(prefs.defaultViewMode)) {
      return prefs.defaultViewMode;
    }

    // 3. Stored workspace state
    const rawState = await getStorage<StoredWorkspaceState>(EXTENSION_STORAGE_KEY);
    if (rawState?.viewMode && validModes.includes(rawState.viewMode)) {
      return rawState.viewMode;
    }

    // 4. Synchronous localStorage fallback
    if (typeof window !== "undefined" && window.localStorage) {
      const lsVal = window.localStorage.getItem(EXTENSION_VIEW_MODE_KEY);
      if (lsVal) {
        const clean = lsVal.replace(/"/g, "").trim() as ViewMode;
        if (validModes.includes(clean)) {
          return clean;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to load selected view mode:", err);
  }

  return "grid";
}

/**
 * Persists the user-selected view mode across extension storage, localStorage,
 * preferences, and backend account settings.
 */
export async function saveSelectedViewMode(mode: ViewMode): Promise<void> {
  const validModes: ViewMode[] = ["list", "compact", "grid", "mindmap"];
  if (!validModes.includes(mode)) return;

  try {
    // 1. Direct synchronous localStorage write for instant surviving across immediate reload
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(EXTENSION_VIEW_MODE_KEY, JSON.stringify(mode));
    }

    // 2. Write to extension storage (chrome.storage.local or async fallback)
    await setStorage(EXTENSION_VIEW_MODE_KEY, mode);

    // 3. Keep StoredWorkspaceState in sync
    const existing = await getStorage<StoredWorkspaceState>(EXTENSION_STORAGE_KEY);
    if (existing && typeof existing === "object") {
      await setStorage(EXTENSION_STORAGE_KEY, {
        ...existing,
        viewMode: mode,
      });
    }

    // 4. Keep ExtensionPreferences in sync
    const prefs = await loadPreferences();
    if (prefs.defaultViewMode !== mode) {
      await savePreferences({
        ...prefs,
        defaultViewMode: mode,
      });
    }

    // 5. Opportunistically sync to backend account preferences if authenticated
    const auth = getStoredAuth();
    if (auth?.access_token) {
      updateBackendAccountPreferences({ default_view: mode }).catch(() => {
        // Non-blocking sync
      });
    }
  } catch (err) {
    console.warn("Failed to save selected view mode:", err);
  }
}

/**
 * Saves an active or snapshot tab into the chosen destination collection & group.
 */
export async function saveItemToDestination(input: {
  tab: BrowserTabSnapshot;
  orgId: string;
  spaceId: string;
  collectionId: string;
  groupId: string;
  tags?: string[];
  description?: string;
  color?: ColorLabel;
}): Promise<{ nextData: AppData; savedItem: SavedItem }> {
  const currentData = await loadWorkspaceData();
  const { tab, collectionId, groupId, tags, description, color } = input;

  if (!tab.url || !isValidUrl(tab.url)) {
    throw new Error(`Cannot save invalid URL: ${tab.url}`);
  }

  const payload = tabToSavedItem(tab, {
    source: "current-tab",
    tags,
    description,
    color,
  });

  const nextData = createItemMutation(currentData, collectionId, groupId, payload);
  await saveWorkspaceData(nextData);

  // Sync item to backend if authenticated
  try {
    const auth = getStoredAuth();
    if (auth?.access_token) {
      await createBackendItem({
        collectionId,
        groupId,
        url: tab.url,
        title: tab.title,
        description,
        color,
        source: "extension",
      });
    }
  } catch (backendErr) {
    console.warn("Backend item sync skipped (offline or fallback):", backendErr);
  }

  // Retrieve newly created item from top of destination group
  const targetCollection = nextData.collections.find((c) => c.id === collectionId);
  const targetGroup = targetCollection?.groups.find((g) => g.id === groupId);
  const savedItem = targetGroup?.items[0];

  if (!savedItem) {
    throw new Error("Item could not be found in collection after creation");
  }

  return { nextData, savedItem };
}

/**
 * Saves multiple tabs into a chosen collection & group.
 */
export async function saveTabsToDestination(input: {
  tabs: BrowserTabSnapshot[];
  orgId: string;
  spaceId: string;
  collectionId: string;
  groupId: string;
  closeAfterSave?: boolean;
}): Promise<{ nextData: AppData; savedCount: number }> {
  let currentData = await loadWorkspaceData();
  const validTabs = filterSaveableTabs(input.tabs);

  if (validTabs.length === 0) {
    return { nextData: currentData, savedCount: 0 };
  }

  for (const tab of validTabs) {
    const payload = tabToSavedItem(tab, { source: "current-tab" });
    currentData = createItemMutation(currentData, input.collectionId, input.groupId, payload);
  }

  await saveWorkspaceData(currentData);

  // Sync to backend if authenticated
  try {
    const auth = getStoredAuth();
    if (auth?.access_token) {
      await saveSessionToBackend({
        destination: {
          kind: "existing_group",
          collection_id: input.collectionId,
          group_id: input.groupId,
        },
        tabs: validTabs.map((t, idx) => ({
          url: t.url,
          title: t.title,
          favicon_data_url: t.favIconUrl,
          pinned: t.pinned,
          active: t.active,
          window_position: idx,
        })),
        options: {
          close_tabs_after_save: input.closeAfterSave,
          exclude_chrome_internal: true,
          dedupe_within_session: true,
        },
      });
    }
  } catch (backendErr) {
    console.warn("Backend tabs save skipped (offline or fallback):", backendErr);
  }

  if (input.closeAfterSave) {
    for (const tab of validTabs) {
      if (tab.id !== undefined) {
        await closeTab(tab.id);
      }
    }
  }

  return { nextData: currentData, savedCount: validTabs.length };
}

/**
 * Saves all specified tabs as a brand new collection / session.
 */
export async function saveSessionAsCollection(input: {
  sessionName?: string;
  tabs: BrowserTabSnapshot[];
  spaceId: string;
  closeAfterSave?: boolean;
}): Promise<{ nextData: AppData; newCollection: Collection }> {
  const currentData = await loadWorkspaceData();
  const validTabs = filterSaveableTabs(input.tabs);
  const name = input.sessionName?.trim() || generateSessionName();

  const { nextData: dataWithCollection, newCollection } = createCollectionMutation(
    currentData,
    input.spaceId,
    name,
    `Saved browser session with ${validTabs.length} tabs`,
    "pink"
  );

  let finalData = dataWithCollection;
  const targetGroupId = newCollection.groups[0]?.id;

  if (targetGroupId) {
    for (const tab of validTabs) {
      const payload = tabToSavedItem(tab, { source: "session" });
      finalData = createItemMutation(finalData, newCollection.id, targetGroupId, payload);
    }
  }

  await saveWorkspaceData(finalData);

  // Sync to backend session saver if authenticated
  try {
    const auth = getStoredAuth();
    if (auth?.access_token) {
      await saveSessionToBackend({
        destination: {
          kind: "new_collection",
          space_id: input.spaceId,
          name,
          color: "pink",
        },
        tabs: validTabs.map((t, idx) => ({
          url: t.url,
          title: t.title,
          favicon_data_url: t.favIconUrl,
          pinned: t.pinned,
          active: t.active,
          window_position: idx,
        })),
        options: {
          close_tabs_after_save: input.closeAfterSave,
          exclude_chrome_internal: true,
          dedupe_within_session: true,
        },
      });
    }
  } catch (backendErr) {
    console.warn("Backend session collection save skipped (offline or fallback):", backendErr);
  }

  if (input.closeAfterSave) {
    for (const tab of validTabs) {
      if (tab.id !== undefined) {
        await closeTab(tab.id);
      }
    }
  }

  const updatedCollection =
    finalData.collections.find((c) => c.id === newCollection.id) ?? newCollection;

  return { nextData: finalData, newCollection: updatedCollection };
}

/**
 * Quick-creates a collection in a space.
 */
export async function quickCreateCollection(input: {
  name: string;
  spaceId: string;
  color?: ColorLabel;
}): Promise<{ nextData: AppData; newCollection: Collection }> {
  const currentData = await loadWorkspaceData();
  const { nextData, newCollection } = createCollectionMutation(
    currentData,
    input.spaceId,
    input.name,
    "Quick collection created from browser extension",
    input.color || "pink"
  );
  await saveWorkspaceData(nextData);
  return { nextData, newCollection };
}

/**
 * Quick-creates a group in a collection.
 */
export async function quickCreateGroup(input: {
  name: string;
  collectionId: string;
}): Promise<{ nextData: AppData; newGroup: Group }> {
  const currentData = await loadWorkspaceData();
  const nextData = createGroupMutation(currentData, input.collectionId, input.name);
  await saveWorkspaceData(nextData);

  const updatedCol = nextData.collections.find((c) => c.id === input.collectionId);
  const newGroup = updatedCol?.groups[updatedCol.groups.length - 1];
  if (!newGroup) {
    throw new Error("Failed to find newly created group");
  }
  return { nextData, newGroup };
}

/**
 * Resets extension data back to clean single PE workspace (or mockWorkspace in test mode).
 */
export async function resetExtensionData(): Promise<AppData> {
  const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  const target = isTestEnv ? mockWorkspace : cleanWorkspace;
  await removeStorage(EXTENSION_STORAGE_KEY);
  await setStorage(EXTENSION_STORAGE_KEY, { data: target });
  return target;
}

/**
 * Exports current workspace data as a JSON string.
 */
export async function exportExtensionData(): Promise<string> {
  const data = await loadWorkspaceData();
  return JSON.stringify(data, null, 2);
}

/**
 * Imports workspace data from a JSON string.
 */
export async function importExtensionData(jsonString: string): Promise<AppData> {
  const parsed = JSON.parse(jsonString);
  const data = "data" in parsed && isValidAppData(parsed.data) ? parsed.data : parsed;
  if (!isValidAppData(data)) {
    throw new Error("Invalid workspace JSON structure. Required organizations, spaces, collections.");
  }
  await saveWorkspaceData(data);
  return data;
}

/**
 * Adds an open tab snapshot directly to the user's Next queue singleton collection.
 */
export async function addItemToNextQueue(tab: BrowserTabSnapshot): Promise<AppData> {
  const currentData = await loadWorkspaceData();
  let col = currentData.collections.find((c) => c.kind === "next" || c.name.toLowerCase() === "next");
  let nextData = currentData;

  if (!col) {
    const newCol: Collection = {
      id: "next-queue-" + Date.now(),
      spaceId: currentData.spaces[0]?.id || "",
      name: "Next",
      note: "Per-Account focused to-do queue",
      color: "teal",
      isStarred: true,
      kind: "next",
      groups: [{ id: "next-group-default", name: "To-Do", items: [] }],
    };
    nextData = {
      ...currentData,
      collections: [...currentData.collections, newCol],
    };
    col = newCol;
  }

  const newItem: SavedItem = {
    id: "next-item-" + Date.now(),
    title: tab.title || tab.url,
    url: tab.url,
    description: "",
    tags: ["next"],
    color: "teal",
    addedAt: new Date().toISOString(),
    faviconUrl: tab.favIconUrl,
    source: "current-tab",
    done: false,
  };

  nextData = {
    ...nextData,
    collections: nextData.collections.map((c) => {
      if (c.id !== col!.id) return c;
      return {
        ...c,
        groups: c.groups.map((g, idx) => {
          if (idx === 0) return { ...g, items: [newItem, ...g.items] };
          return g;
        }),
      };
    }),
  };

  await saveWorkspaceData(nextData);

  try {
    const auth = getStoredAuth();
    if (auth?.token) {
      await addToNextQueue({
        url: tab.url,
        title: tab.title || tab.url,
        favicon_url: tab.favIconUrl,
        source_kind: "browser_tab",
      });
    }
  } catch (err) {
    console.warn("Failed to sync item to backend Next queue, saved locally:", err);
  }

  return nextData;
}
