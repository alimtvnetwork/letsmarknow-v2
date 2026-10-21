import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  Check,
  ChevronDown,
  ExternalLink,
  FolderPlus,
  Globe,
  Inbox,
  Layers,
  LayoutDashboard,
  Network,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";

function getSpaceEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("work") || lower.includes("office") || lower.includes("job") || lower.includes("corp")) return "💼";
  if (lower.includes("dev") || lower.includes("engineer") || lower.includes("code") || lower.includes("tech") || lower.includes("system")) return "💻";
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("creative") || lower.includes("art")) return "🎨";
  if (lower.includes("market") || lower.includes("sales") || lower.includes("growth") || lower.includes("brand")) return "📣";
  if (lower.includes("operation") || lower.includes("ops") || lower.includes("infra") || lower.includes("admin")) return "⚙️";
  if (lower.includes("person") || lower.includes("home") || lower.includes("private") || lower.includes("me")) return "👤";
  if (lower.includes("star") || lower.includes("fav") || lower.includes("priority")) return "⭐";
  if (lower.includes("read") || lower.includes("book") || lower.includes("article") || lower.includes("learn")) return "📚";
  if (lower.includes("research") || lower.includes("study") || lower.includes("lab") || lower.includes("science")) return "🔬";
  return "🌐";
}
import type {
  AppData,
  BrowserTabSnapshot,
  Collection,
  ColorLabel,
  Group,
  Organization,
  SavedItem,
  ShareSettings,
  ShareTargetType,
  Space,
  ViewMode,
} from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isValidAppData } from "@/lib/localWorkspaceStore";
import {
  createCollectionMutation,
  createGroupMutation,
  createItemMutation,
  createSpaceMutation,
  createWorkspaceMutation,
  deleteCollectionMutation,
  deleteGroupMutation,
  deleteSpaceMutation,
  deleteWorkspaceMutation,
  duplicateCollectionMutation,
  duplicateItemMutation,
  moveItemMutation,
  restoreItemMutation,
  softDeleteItemMutation,
  updateCollectionMutation,
  updateGroupMutation,
  updateItemMutation,
  updateSpaceMutation,
  updateWorkspaceMutation,
} from "@/lib/workspaceMutations";
import {
  countActiveItems,
  getCollectionSearchText,
} from "@/components/dashboard/helpers";
import { DashboardBoard, TrashPage } from "@/components/dashboard/DashboardBoard";
import {
  CollectionDialog,
  ConfirmDialog,
  GroupDialog,
  ItemDialog,
  MoveItemDialog,
  SpaceDialog,
  WorkspaceDialog,
  type CollectionFormValue,
  type DeleteTarget,
  type DialogTarget,
  type GroupFormValue,
  type ItemFormValue,
  type SpaceFormValue,
  type WorkspaceFormValue,
} from "@/components/dashboard/ManageDialogs";
import {
  emptyCollectionForm,
  emptyGroupForm,
  emptyItemForm,
  emptySpaceForm,
  emptyWorkspaceForm,
} from "@/hooks/useWorkspaceDashboard";
import { ShareDialog } from "@/components/dashboard/ShareDialog";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { getStoredAuth, useAuth } from "@/lib/authStore";
import {
  publishBackendShare,
  addToNextQueue,
  updateNextQueueItem,
  removeNextQueueItem,
  subscribeNextQueueSSE,
} from "@/lib/workspaceApiClient";
import { findShareSettings, generateShareSlug, getShareUrl } from "@/lib/shareLinks";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  closeTab,
  closeTabs,
  getCurrentWindowTabs,
  openUrls,
  openUrlsInNewWindow,
  openWebDashboard,
  replaceCurrentWindowWithUrls,
} from "../lib/browserApi";
import {
  EXTENSION_VIEW_MODE_KEY,
  loadPreferences,
  loadSelectedViewMode,
  loadWorkspaceData,
  savePreferences,
  saveSelectedViewMode,
  saveSessionAsCollection,
  saveTabsToDestination,
  saveWorkspaceData,
} from "../lib/extensionStore";
import { loadWorkspaceState } from "@/lib/localWorkspaceStore";
import { toast } from "sonner";
import {
  extractOpenUrlSet,
  extractWorkspaceUrlStats,
  generateSessionName,
  getDomainFromUrl,
  isSaveableUrl,
  normalizeUrl,
  tabToSavedItem,
} from "../lib/tabCapture";
import { parseExtensionTabRoute, type ExtensionTabRoute } from "../lib/extensionRoutes";
import { ExtensionSettingsView } from "../components/ExtensionSettingsView";
import { WorkspaceSettingsView } from "../components/WorkspaceSettingsView";
import { OpenTabsList } from "../components/OpenTabsList";
import { SaveSessionBar } from "../components/SaveSessionBar";

export function ExtensionTabApp() {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation
  const [activePage, setActivePage] = useState<ExtensionTabRoute>(() => {
    if (typeof window !== "undefined") {
      return parseExtensionTabRoute(window.location.search);
    }
    return "dashboard";
  });

  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [activeSpaceId, setActiveSpaceId] = useState<string>("");
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash.includes("mindmap")) {
        return "mindmap";
      }
      try {
        const directSaved = window.localStorage.getItem(EXTENSION_VIEW_MODE_KEY);
        if (directSaved) {
          const clean = directSaved.replace(/"/g, "").trim();
          if (["list", "compact", "grid", "mindmap"].includes(clean)) {
            return clean as ViewMode;
          }
        }
        const wsState = loadWorkspaceState();
        if (wsState?.viewMode && ["list", "compact", "grid", "mindmap"].includes(wsState.viewMode)) {
          return wsState.viewMode;
        }
      } catch {
        // ignore
      }
    }
    return "grid";
  });

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      if (mode !== "mindmap" && window.location.hash.includes("mindmap")) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    void saveSelectedViewMode(mode);
  }, []);

  const [activeFilter, setActiveFilter] = useState<"all" | "starred" | "recent">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Open Browser Tabs state
  const [openTabs, setOpenTabs] = useState<BrowserTabSnapshot[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [isSavingTabs, setIsSavingTabs] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState(() => generateSessionName());
  const [isOpenTabsPanelOpen, setIsOpenTabsPanelOpen] = useState(false);
  const [sessionSaveScope, setSessionSaveScope] = useState<"all" | "selected">("all");

  // Destination for saving open tabs
  const [tabDestCollectionId, setTabDestCollectionId] = useState<string>("");
  const [tabDestGroupId, setTabDestGroupId] = useState<string>("");

  // Dialogs & Modals
  const [workspaceMode, setWorkspaceMode] = useState<"create" | "edit" | null>(null);
  const [spaceMode, setSpaceMode] = useState<"create" | "edit" | null>(null);
  const [collectionMode, setCollectionMode] = useState<"create" | "edit" | null>(null);
  const [groupMode, setGroupMode] = useState<"create" | "edit" | null>(null);
  const [itemMode, setItemMode] = useState<"create" | "edit" | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [moveTarget, setMoveTarget] = useState<DialogTarget | null>(null);
  const [selectedMoveDestination, setSelectedMoveDestination] = useState("");
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>({});

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{
    targetType: ShareTargetType;
    targetId: string;
    targetName: string;
    initialSettings?: ShareSettings;
  } | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const { session } = useAuth();

  // Forms
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormValue>(emptyWorkspaceForm);
  const [spaceForm, setSpaceForm] = useState<SpaceFormValue>(emptySpaceForm);
  const [collectionForm, setCollectionForm] = useState<CollectionFormValue>(emptyCollectionForm);
  const [groupForm, setGroupForm] = useState<GroupFormValue>(emptyGroupForm);
  const [itemForm, setItemForm] = useState<ItemFormValue>(emptyItemForm);

  // Hash navigation support (e.g. #mindmap)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== "undefined" && window.location.hash.includes("mindmap")) {
        handleViewModeChange("mindmap");
        setActivePage("dashboard");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleViewModeChange]);

  // Ensure dark mode class is applied
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [wsData, tabs, prefs, storedViewMode] = await Promise.all([
          loadWorkspaceData(),
          getCurrentWindowTabs(),
          loadPreferences(),
          loadSelectedViewMode(),
        ]);

        setData(wsData);
        setOpenTabs(tabs);
        if (
          storedViewMode &&
          (typeof window === "undefined" || !window.location.hash.includes("mindmap"))
        ) {
          setViewMode(storedViewMode);
        }

        const initialOrg =
          prefs.defaultOrganizationId &&
          wsData.organizations.some((o) => o.id === prefs.defaultOrganizationId)
            ? prefs.defaultOrganizationId
            : wsData.organizations[0]?.id || "";

        const availableSpaces = wsData.spaces.filter((s) => s.organizationId === initialOrg);
        const initialSpace =
          prefs.defaultSpaceId && availableSpaces.some((s) => s.id === prefs.defaultSpaceId)
            ? prefs.defaultSpaceId
            : availableSpaces[0]?.id || "";

        const cols = wsData.collections.filter((c) => c.spaceId === initialSpace);
        const initialCol = cols[0]?.id || "";
        const initialGrp = cols[0]?.groups[0]?.id || "";

        setActiveOrgId(initialOrg);
        setActiveSpaceId(initialSpace);
        setTabDestCollectionId(initialCol);
        setTabDestGroupId(initialGrp);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Realtime Next Queue Sync (07-features/17-next-queue.md)
  useEffect(() => {
    const handleNextEvent = () => {
      loadWorkspaceData().then((wsData) => {
        if (wsData) setData(wsData);
      });
    };

    const unsubscribeSSE = subscribeNextQueueSSE(() => {
      handleNextEvent();
    });

    const handleMessage = (msg: any) => {
      if (
        msg?.type === "NEXT_ITEM_ADDED" ||
        msg?.type === "NEXT_ITEM_UPDATED" ||
        msg?.type === "NEXT_ITEM_REMOVED"
      ) {
        handleNextEvent();
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      unsubscribeSSE();
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  // Refresh tabs periodically or on request
  const refreshTabs = async () => {
    const tabs = await getCurrentWindowTabs();
    setOpenTabs(tabs);
  };

  // Helper to persist data changes
  const updateData = async (nextData: AppData | null | undefined) => {
    if (!nextData || !isValidAppData(nextData)) return;
    setData(nextData);
    await saveWorkspaceData(nextData);
  };

  // Derived models
  const activeOrg = useMemo(() => {
    if (!data) return null;
    return data.organizations.find((o) => o.id === activeOrgId) ?? data.organizations[0] ?? null;
  }, [data, activeOrgId]);

  const organizationSpaces = useMemo(() => {
    if (!data || !activeOrg) return [];
    return data.spaces.filter((s) => s.organizationId === activeOrg.id);
  }, [data, activeOrg]);

  const activeSpace = useMemo(() => {
    if (!organizationSpaces.length) return null;
    return organizationSpaces.find((s) => s.id === activeSpaceId) ?? organizationSpaces[0] ?? null;
  }, [organizationSpaces, activeSpaceId]);

  const collectionsForActiveSpace = useMemo(() => {
    if (!data || !activeSpace) return [];
    return data.collections.filter((c) => c.spaceId === activeSpace.id);
  }, [data, activeSpace]);

  const filteredCollections = useMemo(() => {
    const currentQuery = query.trim().toLowerCase();
    let cols = collectionsForActiveSpace;

    if (activeFilter === "starred") {
      cols = cols.filter((c) => c.isStarred);
    }

    if (currentQuery) {
      cols = cols.filter((c) => getCollectionSearchText(c).includes(currentQuery));
    }

    return [...cols].sort((a, b) => {
      if (activeFilter === "recent") return b.id.localeCompare(a.id);
      return Number(b.isStarred) - Number(a.isStarred);
    });
  }, [activeFilter, collectionsForActiveSpace, query]);

  const deletedItems = useMemo(() => {
    if (!data) return [];
    return data.collections.flatMap((col) =>
      col.groups.flatMap((grp) =>
        grp.items
          .filter((i) => i.isDeleted)
          .map((i) => ({
            ...i,
            collectionName: col.name,
            groupName: grp.name,
          }))
      )
    );
  }, [data]);

  const activeItemCount = useMemo(() => {
    return countActiveItems(collectionsForActiveSpace);
  }, [collectionsForActiveSpace]);

  // Open tabs destination options
  const activeSpaceCols = useMemo(() => {
    if (!data || !activeSpaceId) return [];
    return data.collections.filter((c) => c.spaceId === activeSpaceId);
  }, [data, activeSpaceId]);

  const activeDestCol = activeSpaceCols.find((c) => c.id === tabDestCollectionId);
  const activeDestGroups = activeDestCol ? activeDestCol.groups : [];

  // ================= Open Tabs Actions =================
  const handleToggleSelectTab = (tabId: number) => {
    setSelectedTabIds((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  const handleSelectAllTabs = () => {
    const saveable = openTabs
      .filter((t) => isSaveableUrl(t.url) && t.id !== undefined)
      .map((t) => t.id as number);
    setSelectedTabIds(saveable);
  };

  const handleDeselectAllTabs = () => {
    setSelectedTabIds([]);
  };

  const handleSaveSelectedTabs = async () => {
    if (!data || !tabDestCollectionId || !tabDestGroupId || selectedTabIds.length === 0) return;
    setIsSavingTabs(true);

    try {
      const tabsToSave = openTabs.filter(
        (t) => t.id !== undefined && selectedTabIds.includes(t.id)
      );
      const prefs = await loadPreferences();
      const { nextData } = await saveTabsToDestination({
        tabs: tabsToSave,
        orgId: activeOrgId,
        spaceId: activeSpaceId,
        collectionId: tabDestCollectionId,
        groupId: tabDestGroupId,
        closeAfterSave: prefs.closeTabsAfterSave,
      });

      await updateData(nextData);
      setSelectedTabIds([]);
      await refreshTabs();
    } finally {
      setIsSavingTabs(false);
    }
  };

  const handleSaveAllTabsSession = async () => {
    if (!data || !activeSpaceId || openTabs.length === 0) return;
    setIsSavingTabs(true);

    try {
      const prefs = await loadPreferences();
      const targetTabs =
        sessionSaveScope === "selected" && selectedTabIds.length > 0
          ? openTabs.filter((t) => t.id && selectedTabIds.includes(t.id))
          : openTabs;

      const { nextData, newCollection } = await saveSessionAsCollection({
        sessionName: sessionNameInput,
        tabs: targetTabs,
        spaceId: activeSpaceId,
        closeAfterSave: prefs.closeTabsAfterSave,
      });

      await updateData(nextData);
      setIsSessionDialogOpen(false);
      setSelectedTabIds([]);
      setTabDestCollectionId(newCollection.id);
      setTabDestGroupId(newCollection.groups[0]?.id || "");
      await refreshTabs();
      setActivePage("dashboard");
    } finally {
      setIsSavingTabs(false);
    }
  };

  const handleCloseTab = async (tabId: number) => {
    await closeTab(tabId);
    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
    setSelectedTabIds((prev) => prev.filter((id) => id !== tabId));
  };

  // Global shortcut: press '/' to focus search, 'Escape' to blur, and 'A'/'S' for quick tab triage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isEditable =
        document.activeElement?.getAttribute("contenteditable") === "true";
      const isInInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        isEditable;

      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isInInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        } else if (isOpenTabsPanelOpen) {
          setIsOpenTabsPanelOpen(false);
        }
      } else if (isOpenTabsPanelOpen && !isInInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // One-key triage: 'A' to archive/close tab, 'S' to save
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          if (selectedTabIds.length > 0) {
            closeTabs(selectedTabIds).then(() => {
              toast.success(`Archived ${selectedTabIds.length} tabs`);
              refreshTabs();
              setSelectedTabIds([]);
            });
          } else if (openTabs.length > 0 && typeof openTabs[0].id === "number") {
            const firstTab = openTabs[0];
            handleCloseTab(firstTab.id!);
            toast.success(`Archived: ${firstTab.title || firstTab.url}`);
          }
        } else if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          if (selectedTabIds.length > 0) {
            handleSaveSelectedTabs();
          } else {
            setSessionNameInput(generateSessionName());
            setSessionSaveScope("all");
            setIsSessionDialogOpen(true);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpenTabsPanelOpen, openTabs, selectedTabIds, handleCloseTab, handleSaveSelectedTabs, refreshTabs]);

  // ================= Next Queue Singleton =================
  const nextCollection = useMemo(() => {
    if (!data) return null;
    return (
      data.collections.find((c) => c.kind === "next" || c.name.toLowerCase() === "next") || null
    );
  }, [data]);

  const nextItems = useMemo(() => {
    if (!nextCollection) return [];
    return nextCollection.groups.flatMap((g) => g.items).filter((i) => !i.isDeleted);
  }, [nextCollection]);

  const nextUncompletedCount = useMemo(() => {
    return nextItems.filter((i) => !i.done).length;
  }, [nextItems]);

  const handleToggleNextItemDone = async (itemId: string) => {
    if (!data || !nextCollection) return;
    const nextData: AppData = {
      ...data,
      collections: data.collections.map((c) => {
        if (c.id !== nextCollection.id) return c;
        return {
          ...c,
          groups: c.groups.map((g) => ({
            ...g,
            items: g.items.map((i) => {
              if (i.id !== itemId) return i;
              const isDone = !i.done;
              return {
                ...i,
                done: isDone,
                completedAt: isDone ? new Date().toISOString() : undefined,
              };
            }),
          })),
        };
      }),
    };
    await updateData(nextData);
  };

  const handleRemoveNextItem = async (itemId: string) => {
    if (!data || !nextCollection) return;
    const nextData: AppData = {
      ...data,
      collections: data.collections.map((c) => {
        if (c.id !== nextCollection.id) return c;
        return {
          ...c,
          groups: c.groups.map((g) => ({
            ...g,
            items: g.items.filter((i) => i.id !== itemId),
          })),
        };
      }),
    };
    await updateData(nextData);
    toast.success("Removed from Next queue");
  };

  const handleClearCompletedNext = async () => {
    if (!data || !nextCollection) return;
    const nextData: AppData = {
      ...data,
      collections: data.collections.map((c) => {
        if (c.id !== nextCollection.id) return c;
        return {
          ...c,
          groups: c.groups.map((g) => ({
            ...g,
            items: g.items.filter((i) => !i.done),
          })),
        };
      }),
    };
    await updateData(nextData);
    toast.success("Cleared completed items");
  };

  const handleAddActiveTabToNext = async () => {
    if (!data) return;
    const currentTab = openTabs[0];
    if (!currentTab || !currentTab.url) {
      toast.error("No active tab available to add");
      return;
    }

    let col = nextCollection;
    let nextData = data;

    if (!col) {
      const newCol: Collection = {
        id: "next-queue-" + Date.now(),
        spaceId: activeSpaceId || data.spaces[0]?.id || "",
        name: "Next",
        note: "Per-Account focused to-do queue",
        color: "teal",
        isStarred: true,
        kind: "next",
        groups: [{ id: "next-group-default", name: "To-Do", items: [] }],
      };
      nextData = {
        ...data,
        collections: [...data.collections, newCol],
      };
      col = newCol;
    }

    const newItem: SavedItem = {
      id: "next-item-" + Date.now(),
      title: currentTab.title || currentTab.url,
      url: currentTab.url,
      description: "",
      tags: ["next"],
      color: "teal",
      addedAt: new Date().toISOString(),
      faviconUrl: currentTab.favIconUrl,
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

    await updateData(nextData);
    toast.success("Added to Next queue");

    // Realtime backend sync if signed in
    try {
      const auth = getStoredAuth();
      if (auth?.token) {
        await addToNextQueue({
          url: currentTab.url,
          title: currentTab.title || currentTab.url,
          favicon_url: currentTab.favIconUrl,
          source_kind: "browser_tab",
        });
      }
    } catch {
      // Offline fallback already persisted locally
    }
  };

  // URL statistics for duplicate badges and "already saved" tracking
  const workspaceUrlStats = useMemo(() => {
    return extractWorkspaceUrlStats(data?.collections ?? []);
  }, [data?.collections]);

  const openUrlSet = useMemo(() => {
    return extractOpenUrlSet(openTabs);
  }, [openTabs]);

  // Find latest session collection in the workspace
  const latestSession = useMemo(() => {
    if (!data) return null;
    const sessionCols = data.collections.filter(
      (c) =>
        c.name.toLowerCase().includes("session") ||
        c.groups.some((g) => g.items.some((i) => i.source === "session"))
    );
    return sessionCols[sessionCols.length - 1] ?? null;
  }, [data]);

  // Close tabs that are already saved in the current workspace
  const handleCloseSavedTabs = async () => {
    const tabsToClose = openTabs.filter((tab) => {
      if (!tab.url || tab.id === undefined) return false;
      const norm = normalizeUrl(tab.url);
      return norm && workspaceUrlStats.urlSet.has(norm);
    });

    if (tabsToClose.length === 0) {
      toast.info("No already-saved tabs to close");
      return;
    }

    const tabIds = tabsToClose.map((t) => t.id as number);
    await closeTabs(tabIds);
    setOpenTabs((prev) => prev.filter((t) => t.id !== undefined && !tabIds.includes(t.id)));
    setSelectedTabIds((prev) => prev.filter((id) => !tabIds.includes(id)));
    toast.success(`Closed ${tabIds.length} already-saved tab${tabIds.length > 1 ? "s" : ""}`);
  };

  // Restore tabs from the latest saved session collection
  const handleRestoreLastSession = async () => {
    if (!latestSession) {
      toast.error("No saved session found in this workspace");
      return;
    }

    const urls = latestSession.groups
      .flatMap((g) => g.items.filter((i) => !i.isDeleted && i.url).map((i) => i.url));

    if (urls.length === 0) {
      toast.error(`Session "${latestSession.name}" has no saved links to restore`);
      return;
    }

    await openUrls(urls);
    toast.success(`Restored ${urls.length} tabs from "${latestSession.name}"`);
    await refreshTabs();
  };

  // Open multiple URLs with specified mode (tabs, new window, replace window)
  const handleOpenAllUrls = async (urls: string[], mode: "tabs" | "window" | "replace") => {
    if (!urls.length) return;
    try {
      if (mode === "tabs") {
        await openUrls(urls);
        toast.success(`Opened ${urls.length} tab${urls.length > 1 ? "s" : ""}`);
      } else if (mode === "window") {
        await openUrlsInNewWindow(urls);
        toast.success(`Opened ${urls.length} tab${urls.length > 1 ? "s" : ""} in a new window`);
      } else if (mode === "replace") {
        await replaceCurrentWindowWithUrls(urls);
        toast.success(`Replaced window with ${urls.length} tab${urls.length > 1 ? "s" : ""}`);
      }
      await refreshTabs();
    } catch {
      toast.error("Failed to open URLs");
    }
  };

  // Handle dropped items (open tabs, existing items, desk items, or raw URLs)
  const handleDropItem = async (
    payload: string,
    targetCollectionId: string,
    targetGroupId: string
  ) => {
    if (!data) return;

    try {
      // Helper: safely move an item by ID from its current location to target collection/group
      const moveItemById = async (itemId: string, sourceColId?: string, sourceGrpId?: string) => {
        let resolvedSrcCol = sourceColId;
        let resolvedSrcGrp = sourceGrpId;

        if (!resolvedSrcCol || !resolvedSrcGrp) {
          for (const col of data.collections) {
            for (const grp of col.groups) {
              if (grp.items.some((i) => i.id === itemId && !i.isDeleted)) {
                resolvedSrcCol = col.id;
                resolvedSrcGrp = grp.id;
                break;
              }
            }
            if (resolvedSrcCol) break;
          }
        }

        if (!resolvedSrcCol || !resolvedSrcGrp) return;
        if (resolvedSrcCol === targetCollectionId && resolvedSrcGrp === targetGroupId) {
          return; // Dropped in the same group, no-op safely
        }

        const nextData = moveItemMutation(
          data,
          resolvedSrcCol,
          resolvedSrcGrp,
          itemId,
          targetCollectionId,
          targetGroupId
        );
        if (nextData) {
          await updateData(nextData);
          toast.success("Item moved");
        }
      };

      // 1. JSON payload handling
      if (payload.startsWith("{")) {
        try {
          const parsed = JSON.parse(payload);
          // Open tab drop
          if (parsed.type === "open-tab" && parsed.tab) {
            const tab: BrowserTabSnapshot = parsed.tab;
            const itemPayload = tabToSavedItem(tab, { source: "current-tab" });
            const nextData = createItemMutation(
              data,
              targetCollectionId,
              targetGroupId,
              itemPayload
            );
            if (nextData) {
              await updateData(nextData);
              toast.success(`Saved "${itemPayload.title}" to collection`);
            }
            return;
          }

          // Saved item or desk item
          if ((parsed.type === "saved-item" || parsed.type === "desk-item") && parsed.itemId) {
            await moveItemById(parsed.itemId, parsed.collectionId, parsed.groupId);
            return;
          }
        } catch {
          // not valid JSON, proceed to other formats
        }
      }

      // 2. Desk item prefix: "desk:itemId"
      if (payload.startsWith("desk:")) {
        const deskItemId = payload.replace("desk:", "");
        await moveItemById(deskItemId);
        return;
      }

      // 3. Existing bookmark format: "srcColId:srcGrpId:itemId"
      const parts = payload.split(":");
      if (parts.length === 3) {
        const [srcColId, srcGrpId, itemId] = parts;
        await moveItemById(itemId, srcColId, srcGrpId);
        return;
      }

      // 4. Raw item ID (if plain itemId was passed)
      const matchedItem = data.collections
        .flatMap((c) => c.groups.flatMap((g) => g.items))
        .find((i) => i.id === payload && !i.isDeleted);
      if (matchedItem) {
        await moveItemById(matchedItem.id);
        return;
      }

      // 5. Raw URL drop
      if (isSaveableUrl(payload)) {
        const domain = getDomainFromUrl(payload);
        const nextData = createItemMutation(data, targetCollectionId, targetGroupId, {
          title: domain || payload,
          url: payload,
          description: `Saved from browser tab`,
          tags: [],
          color: "pink",
          source: "current-tab",
        });
        if (nextData) {
          await updateData(nextData);
          toast.success("Saved tab link to collection");
        }
      }
    } catch (err) {
      console.warn("handleDropItem error:", err);
    }
  };

  // ================= Workspace Handlers =================
  const openCreateWorkspace = () => {
    setWorkspaceForm({ name: "", initials: "", plan: "Free" });
    setWorkspaceMode("create");
  };

  const openEditWorkspace = (orgId: string) => {
    if (!data) return;
    const org = data.organizations.find((o) => o.id === orgId);
    if (!org) return;
    setDialogTarget({ orgId });
    setWorkspaceForm({ name: org.name, initials: org.initials, plan: org.plan });
    setWorkspaceMode("edit");
  };

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (workspaceMode === "create") {
      const { nextData, newOrg, newSpace } = createWorkspaceMutation(
        data,
        workspaceForm.name,
        workspaceForm.initials,
        workspaceForm.plan
      );
      await updateData(nextData);
      setActiveOrgId(newOrg.id);
      setActiveSpaceId(newSpace.id);
    } else if (workspaceMode === "edit" && dialogTarget.orgId) {
      const nextData = updateWorkspaceMutation(
        data,
        dialogTarget.orgId,
        workspaceForm.name,
        workspaceForm.initials,
        workspaceForm.plan
      );
      await updateData(nextData);
    }
    setWorkspaceMode(null);
  };

  // ================= Space Handlers =================
  const openCreateSpace = () => {
    setSpaceForm(emptySpaceForm);
    setSpaceMode("create");
  };

  const openEditSpace = (spaceId: string) => {
    if (!data) return;
    const sp = data.spaces.find((s) => s.id === spaceId);
    if (!sp) return;
    setDialogTarget({ spaceId });
    setSpaceForm({
      name: sp.name,
      description: sp.description,
      accentClass: sp.accentClass,
    });
    setSpaceMode("edit");
  };

  const handleSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !activeOrgId) return;

    if (spaceMode === "create") {
      const { nextData, newSpace } = createSpaceMutation(
        data,
        activeOrgId,
        spaceForm.name,
        spaceForm.description,
        spaceForm.accentClass
      );
      await updateData(nextData);
      setActiveSpaceId(newSpace.id);
    } else if (spaceMode === "edit" && dialogTarget.spaceId) {
      const nextData = updateSpaceMutation(
        data,
        dialogTarget.spaceId,
        spaceForm.name,
        spaceForm.description,
        spaceForm.accentClass
      );
      await updateData(nextData);
    }
    setSpaceMode(null);
  };

  // ================= Collection Handlers =================
  const openCreateCollection = () => {
    setCollectionForm(emptyCollectionForm);
    setCollectionMode("create");
  };

  const openEditCollection = (collectionId: string) => {
    if (!data) return;
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) return;
    setDialogTarget({ collectionId });
    setCollectionForm({ name: col.name, note: col.note, color: col.color });
    setCollectionMode("edit");
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !activeSpaceId) return;

    if (collectionMode === "create") {
      const { nextData, newCollection } = createCollectionMutation(
        data,
        activeSpaceId,
        collectionForm.name,
        collectionForm.note,
        collectionForm.color
      );
      await updateData(nextData);
      setTabDestCollectionId(newCollection.id);
      setTabDestGroupId(newCollection.groups[0]?.id || "");
    } else if (collectionMode === "edit" && dialogTarget.collectionId) {
      const nextData = updateCollectionMutation(data, dialogTarget.collectionId, (col) => ({
        ...col,
        name: collectionForm.name.trim() || col.name,
        note: collectionForm.note.trim() || col.note,
        color: collectionForm.color || col.color,
      }));
      await updateData(nextData);
    }
    setCollectionMode(null);
  };

  const handleToggleStar = async (collectionId: string) => {
    if (!data) return;
    const nextData = updateCollectionMutation(data, collectionId, (col) => ({
      ...col,
      isStarred: !col.isStarred,
    }));
    await updateData(nextData);
  };

  const handleDuplicateCollection = async (collectionId: string) => {
    if (!data) return;
    const nextData = duplicateCollectionMutation(data, collectionId);
    await updateData(nextData);
  };

  // ================= Share Handlers =================
  const openShareCollection = (collectionId: string) => {
    if (!data) return;
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) return;
    const existing = findShareSettings(data.shareSettings, "collection", collectionId);
    setShareTarget({
      targetType: "collection",
      targetId: col.id,
      targetName: col.name,
      initialSettings: existing,
    });
    setIsShareDialogOpen(true);
  };

  const openShareGroup = (collectionId: string, groupId: string) => {
    if (!data) return;
    const col = data.collections.find((c) => c.id === collectionId);
    const grp = col?.groups.find((g) => g.id === groupId);
    if (!grp) return;
    const existing = findShareSettings(data.shareSettings, "group", groupId);
    setShareTarget({
      targetType: "group",
      targetId: grp.id,
      targetName: grp.name,
      initialSettings: existing,
    });
    setIsShareDialogOpen(true);
  };

  const openShareItem = (collectionId: string, groupId: string, itemId: string) => {
    if (!data) return;
    for (const c of data.collections) {
      for (const g of c.groups) {
        const item = g.items.find((i) => i.id === itemId);
        if (item) {
          const existing = findShareSettings(data.shareSettings, "item", itemId);
          setShareTarget({
            targetType: "item",
            targetId: item.id,
            targetName: item.title,
            initialSettings: existing,
          });
          setIsShareDialogOpen(true);
          return;
        }
      }
    }
  };

  const handleCopyItemShareLink = (itemId: string, itemTitle?: string) => {
    if (!data) return;
    const existing = findShareSettings(data.shareSettings, "item", itemId);
    const slug = existing?.publicSlug || generateShareSlug(itemTitle || "item", itemId);
    const url = getShareUrl("item", slug);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    toast.success("Link copied to clipboard");
  };

  const handleSaveShare = async (settings: ShareSettings) => {
    if (!data) return;
    const existingSettings = data.shareSettings || [];
    const index = existingSettings.findIndex(
      (s) => s.targetType === settings.targetType && s.targetId === settings.targetId
    );
    const nextSettings =
      index >= 0
        ? [
            ...existingSettings.slice(0, index),
            settings,
            ...existingSettings.slice(index + 1),
          ]
        : [...existingSettings, settings];

    const nextData: AppData = {
      ...data,
      shareSettings: nextSettings,
    };
    await updateData(nextData);

    // If making public or password-protected, publish to cloud backend
    if (settings.visibility === "public" || settings.passwordEnabled) {
      const auth = getStoredAuth();
      if (!auth?.access_token) {
        setAuthPromptMessage("Sign in or create a free account to publish your public share link to the web.");
        setIsAuthDialogOpen(true);
        toast.info("Sign in to make this share accessible to others on the web.");
        return;
      }

      if (settings.targetType === "collection") {
        const targetCol = data.collections.find((c) => c.id === settings.targetId);
        if (targetCol) {
          try {
            await publishBackendShare({
              name: targetCol.name,
              description: targetCol.note || undefined,
              slug: settings.publicSlug,
              mode: settings.passwordEnabled ? "password" : "public",
              password: settings.password,
              groups: targetCol.groups.map((g) => ({
                name: g.name,
                color: g.color,
                items: g.items.map((i) => ({
                  title: i.title,
                  url: i.url,
                  description: i.description,
                  favicon_url: i.faviconUrl,
                  tags: i.tags,
                })),
              })),
            });
            toast.success("Collection published live to the web!");
          } catch (err) {
            console.warn("Cloud share sync error:", err);
            toast.warning("Saved locally. Cloud link sync will retry.");
          }
        }
      }
    } else {
      toast.success("Share settings saved");
    }
  };

  const handleDisableShare = async (targetType: ShareTargetType, targetId: string) => {
    if (!data) return;
    const nextData: AppData = {
      ...data,
      shareSettings: (data.shareSettings || []).filter(
        (s) => !(s.targetType === targetType && s.targetId === targetId)
      ),
    };
    await updateData(nextData);
    toast.success("Share link disabled");
  };

  // ================= Group Handlers =================
  const openCreateGroup = (collectionId: string) => {
    setDialogTarget({ collectionId });
    setGroupForm(emptyGroupForm);
    setGroupMode("create");
  };

  const openEditGroup = (collectionId: string, groupId: string) => {
    if (!data) return;
    const col = data.collections.find((c) => c.id === collectionId);
    const grp = col?.groups.find((g) => g.id === groupId);
    if (!grp) return;
    setDialogTarget({ collectionId, groupId });
    setGroupForm({ name: grp.name });
    setGroupMode("edit");
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !dialogTarget.collectionId) return;

    if (groupMode === "create") {
      const nextData = createGroupMutation(
        data,
        dialogTarget.collectionId,
        groupForm.name
      );
      await updateData(nextData);
      const updatedCol = nextData.collections.find((c) => c.id === dialogTarget.collectionId);
      const newGroup = updatedCol?.groups[updatedCol.groups.length - 1];
      if (newGroup) setTabDestGroupId(newGroup.id);
    } else if (groupMode === "edit" && dialogTarget.groupId) {
      const nextData = updateGroupMutation(
        data,
        dialogTarget.collectionId,
        dialogTarget.groupId,
        groupForm.name
      );
      await updateData(nextData);
    }
    setGroupMode(null);
  };

  // ================= Item Handlers =================
  const openCreateItem = (collectionId?: string, groupId?: string) => {
    const targetCol = collectionId || collectionsForActiveSpace[0]?.id;
    const foundCol = data?.collections.find((c) => c.id === targetCol);
    const targetGrp = groupId || foundCol?.groups[0]?.id;

    setDialogTarget({ collectionId: targetCol, groupId: targetGrp });
    setItemForm({
      title: "",
      url: "",
      description: "",
      tags: "",
      color: "pink",
      collectionId: targetCol,
      groupId: targetGrp,
    });
    setItemMode("create");
  };

  const openEditItem = (collectionId: string, groupId: string, itemId: string) => {
    if (!data) return;
    const col = data.collections.find((c) => c.id === collectionId);
    const grp = col?.groups.find((g) => g.id === groupId);
    const it = grp?.items.find((i) => i.id === itemId);
    if (!it) return;

    setDialogTarget({ collectionId, groupId, itemId });
    setItemForm({
      title: it.title,
      url: it.url,
      description: it.description,
      tags: it.tags.join(", "),
      color: it.color,
      collectionId,
      groupId,
    });
    setItemMode("edit");
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const colId = itemForm.collectionId || dialogTarget.collectionId;
    const grpId = itemForm.groupId || dialogTarget.groupId;
    if (!colId || !grpId) return;

    const tagsArray = itemForm.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (itemMode === "create") {
      const nextData = createItemMutation(data, colId, grpId, {
        title: itemForm.title.trim() || itemForm.url,
        url: itemForm.url.trim(),
        description: itemForm.description.trim(),
        tags: tagsArray,
        color: itemForm.color,
        source: "manual",
      });
      await updateData(nextData);
    } else if (itemMode === "edit" && dialogTarget.itemId) {
      const nextData = updateItemMutation(data, colId, grpId, dialogTarget.itemId, {
        title: itemForm.title.trim(),
        url: itemForm.url.trim(),
        description: itemForm.description.trim(),
        tags: tagsArray,
        color: itemForm.color,
      });
      await updateData(nextData);
    }
    setItemMode(null);
  };

  const handleDuplicateItem = async (colId: string, grpId: string, itemId: string) => {
    if (!data) return;
    const nextData = duplicateItemMutation(data, colId, grpId, itemId);
    await updateData(nextData);
  };

  const handleSoftDeleteItem = async (colId: string, grpId: string, itemId: string) => {
    if (!data) return;
    const nextData = softDeleteItemMutation(data, colId, grpId, itemId);
    await updateData(nextData);
  };

  const handleRestoreItem = async (itemId: string) => {
    if (!data) return;
    const nextData = restoreItemMutation(data, itemId);
    await updateData(nextData);
  };

  const openMoveItem = (colId: string, grpId: string, itemId: string) => {
    setMoveTarget({ collectionId: colId, groupId: grpId, itemId });
    setSelectedMoveDestination("");
  };

  const handleConfirmMove = async () => {
    if (!data || !moveTarget || !selectedMoveDestination) return;
    const [targetColId, targetGrpId] = selectedMoveDestination.split(":");
    if (!targetColId || !targetGrpId || !moveTarget.collectionId || !moveTarget.groupId || !moveTarget.itemId) return;

    const nextData = moveItemMutation(
      data,
      moveTarget.collectionId,
      moveTarget.groupId,
      moveTarget.itemId,
      targetColId,
      targetGrpId
    );
    if (nextData) {
      await updateData(nextData);
      toast.success("Item moved");
    }
    setMoveTarget(null);
  };

  // ================= Deletions =================
  const openDeleteConfirm = (target: DeleteTarget) => {
    setDeleteTarget(target);
  };

  const handleConfirmDelete = async () => {
    if (!data || !deleteTarget) return;

    if (deleteTarget.type === "workspace" && deleteTarget.orgId) {
      const result = deleteWorkspaceMutation(data, deleteTarget.orgId);
      if (result) {
        await updateData(result.nextData);
        setActiveOrgId(result.nextOrgId);
        setActiveSpaceId(result.nextSpaceId);
      }
    } else if (deleteTarget.type === "space" && deleteTarget.spaceId) {
      const result = deleteSpaceMutation(data, deleteTarget.spaceId);
      if (result) {
        await updateData(result.nextData);
        setActiveSpaceId(result.nextSpaceId);
      }
    } else if (deleteTarget.type === "collection" && deleteTarget.collectionId) {
      const nextData = deleteCollectionMutation(data, deleteTarget.collectionId);
      await updateData(nextData);
    } else if (deleteTarget.type === "group" && deleteTarget.collectionId && deleteTarget.groupId) {
      const nextData = deleteGroupMutation(data, deleteTarget.collectionId, deleteTarget.groupId);
      if (nextData) await updateData(nextData);
    }
    setDeleteTarget(null);
  };

  if (isLoading || !data || !activeOrg || !activeSpace) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground font-medium">Loading LetsMarkNow Tab...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="extension-tab-app"
      className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20 font-sans"
    >
      {/* 1. Unified Obsidian Navigation Sidebar */}
      <aside
        data-testid="extension-sidebar"
        className={cn(
          "flex flex-col border-r border-border/80 bg-card/50 backdrop-blur-md z-20 select-none transition-all duration-200 overflow-hidden shrink-0 shadow-obsidian",
          isSidebarOpen ? "w-64" : "w-0 border-r-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Workspace Switcher Header - Option 1: Linear / Raycast Popover */}
        <div className="flex items-center justify-between border-b border-border/80 px-2.5 py-2 bg-card/60 shrink-0 gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 min-w-0 flex-1 rounded-xl p-1 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary group"
                title="Workspace switcher"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary/30 to-violet-500/20 border border-primary/30 font-bold text-xs text-primary shadow-2xs group-hover:border-primary/50 transition-colors">
                  {activeOrg.initials || "LM"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h2 className="truncate text-xs font-semibold text-foreground tracking-tight">{activeOrg.name}</h2>
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">{activeOrg.plan || "Pro"} Workspace</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5 shadow-obsidian border-border/80 bg-card/95 backdrop-blur-md">
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Workspaces
              </DropdownMenuLabel>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {data.organizations.map((org) => {
                  const isSelected = org.id === activeOrgId;
                  return (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => {
                        setActiveOrgId(org.id);
                        const orgSpaces = data.spaces.filter((s) => s.organizationId === org.id);
                        if (orgSpaces[0]) setActiveSpaceId(orgSpaces[0].id);
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-[10px] font-bold text-foreground">
                          {org.initials}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="truncate text-xs font-medium leading-none">{org.name}</p>
                          <p className="text-[10px] text-muted-foreground font-normal leading-tight mt-0.5 capitalize">{org.plan || "Free"}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </div>
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem
                onClick={openCreateWorkspace}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Create Workspace</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openEditWorkspace(activeOrg.id)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Edit Workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              data-testid="rail-toggle-sidebar-button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Toggle sidebar"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="collapse-sidebar-button"
              onClick={() => setIsSidebarOpen(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Close sidebar"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Sidebar Search Bar with / Shortcut */}
        <div className="p-3 pb-1 border-b border-border/40">
          <div className="relative flex items-center rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all shadow-2xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              data-dashboard-search
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (activePage !== "dashboard") setActivePage("dashboard");
              }}
              placeholder="Search links, spaces..."
              className="h-5 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            <kbd className="pointer-events-none inline-flex h-4 items-center justify-center rounded border border-border/70 bg-muted/70 px-1 font-mono text-[9px] font-semibold text-muted-foreground shrink-0">
              /
            </kbd>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Focus Queues: Next & Quick Inbox */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Quick Focus
            </div>

            {/* Next queue */}
            <button
              type="button"
              onClick={() => {
                setActiveFilter(activeFilter === "starred" ? "all" : "starred");
                if (activePage !== "dashboard") setActivePage("dashboard");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeFilter === "starred" && activePage === "dashboard"
                  ? "bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              title="Focus priority items (Starred)"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Next</span>
              </span>
              <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[10px] font-semibold">
                {data?.collections ? data.collections.filter((c) => c.isStarred).length : 0}
              </span>
            </button>

            {/* Quick Inbox */}
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setQuery("");
                if (activePage !== "dashboard") setActivePage("dashboard");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeFilter === "all" && activePage === "dashboard" && query === ""
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              title="Quick Inbox & Unsorted Links"
            >
              <span className="flex items-center gap-2">
                <Inbox className="h-3.5 w-3.5 text-primary" />
                <span>Quick Inbox</span>
              </span>
              <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                {openTabs.length}
              </span>
            </button>
          </div>

          {/* Main Extension Views */}
          <div className="space-y-1 pt-2 border-t border-border/40">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </div>

            <button
              type="button"
              data-testid="nav-collections-button"
              onClick={() => {
                setActivePage("dashboard");
                setActiveFilter("all");
                if (viewMode === "mindmap") {
                  handleViewModeChange("grid");
                }
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "dashboard" && activeFilter !== "starred" && viewMode !== "mindmap"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                Collections
              </span>
              <span className="text-[10px] font-semibold opacity-80">{activeItemCount}</span>
            </button>

            <button
              type="button"
              data-testid="nav-mindmap-button"
              onClick={() => {
                setActivePage("dashboard");
                handleViewModeChange("mindmap");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "dashboard" && viewMode === "mindmap"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Network className="h-3.5 w-3.5 text-indigo-400" />
                Mindmap Canvas
              </span>
              <span className="text-[10px] font-semibold text-indigo-400/80 uppercase">Graph</span>
            </button>

            {/* Next Queue Singleton */}
            <button
              type="button"
              data-testid="nav-next-queue-button"
              onClick={() => {
                setActivePage("next");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "next"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
                Next Queue
              </span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold">
                {nextUncompletedCount}
              </span>
            </button>


            <button
              type="button"
              onClick={() => {
                setActivePage("open-tabs");
                refreshTabs();
              }}
              data-testid="nav-open-tabs-button"
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "open-tabs"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-sky-400" />
                Open Browser Tabs
              </span>
              <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                {openTabs.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-workspace-button"
              onClick={() => setActivePage("workspace")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "workspace"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                Workspace & Members
              </span>
              <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                {(data?.members?.filter((m) => !m.organizationId || m.organizationId === activeOrgId) || []).length || 1}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-trash-button"
              onClick={() => setActivePage("trash")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "trash"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                Trash
              </span>
              {deletedItems.length > 0 && (
                <span className="rounded-full bg-rose-500/20 text-rose-400 px-1.5 py-0.2 text-[10px] font-semibold">
                  {deletedItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="nav-settings-button"
              onClick={() => setActivePage("settings")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "settings"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Extension Settings
              </span>
            </button>
          </div>

          {/* Spaces Section with Rich Icons/Emojis */}
          <div className="pt-2 border-t border-border/40">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Spaces ({organizationSpaces.length})
              </span>
              <button
                type="button"
                onClick={openCreateSpace}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                title="Create Space"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {organizationSpaces.map((space) => {
                const isSelected = space.id === activeSpaceId;
                const spaceItems = countActiveItems(
                  data.collections.filter((c) => c.spaceId === space.id)
                );
                const emoji = getSpaceEmoji(space.name);

                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => {
                      setActiveSpaceId(space.id);
                      if (activePage !== "dashboard") setActivePage("dashboard");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all",
                      isSelected && activePage === "dashboard"
                        ? "bg-card font-semibold text-foreground border border-border shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted/60 border border-border/40 text-xs shadow-2xs">
                        {emoji}
                      </span>
                      <span className="truncate">{space.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{spaceItems}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-border/80 p-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              data-testid="sidebar-auth-button"
              onClick={() => {
                setAuthPromptMessage(undefined);
                setIsAuthDialogOpen(true);
              }}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity group cursor-pointer"
              title={session ? "Manage account & cloud sync" : "Sign in to LetsMarkNow"}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-violet-500 font-semibold text-xs text-white shadow-xs group-hover:ring-2 ring-primary/40 transition">
                {session?.avatar_url ? (
                  <img
                    src={session.avatar_url}
                    alt={session.name || session.email}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : session?.name ? (
                  session.name.slice(0, 2).toUpperCase()
                ) : session?.email ? (
                  session.email[0].toUpperCase()
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground leading-tight">
                  {session?.name || "LetsMarkNow"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground font-medium">
                  {session?.email ? (
                    <span className="text-emerald-500 font-medium">Google Synced</span>
                  ) : (
                    <span>Click to Sign In</span>
                  )}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setAuthPromptMessage(undefined);
                  setIsAuthDialogOpen(true);
                }}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={session ? "Account & Cloud Sync" : "Sign In"}
              >
                <User className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                data-testid="topbar-settings-button"
                onClick={() => setActivePage("settings")}
                className={cn(
                  "h-7 w-7 text-muted-foreground hover:text-foreground",
                  activePage === "settings" && "bg-primary/10 text-primary"
                )}
                title="Extension Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden bg-background">
        {/* VIEW: DASHBOARD */}
        {activePage === "dashboard" && (
          <>
            <TopBar
              activeSpace={activeSpace}
              itemCount={activeItemCount}
              query={query}
              onQueryChange={setQuery}
              onCreateCollection={openCreateCollection}
              onCreateItem={() => openCreateItem()}
              onOpenCommand={() => {}}
              onToggleMobileMenu={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSessionNameInput(generateSessionName());
                  setSessionSaveScope("all");
                  setIsSessionDialogOpen(true);
                }}
                data-testid="topbar-save-session-button"
                className="h-8 text-xs font-medium"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary" />
                Save Session
              </Button>

              {selectedTabIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleSaveSelectedTabs}
                  data-testid="topbar-save-selected-button"
                  className="h-8 text-xs font-semibold"
                >
                  Save Selected ({selectedTabIds.length})
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpenTabsPanelOpen(!isOpenTabsPanelOpen)}
                data-testid="toggle-docked-tabs-button"
                className={cn(
                  "h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground",
                  isOpenTabsPanelOpen && "bg-muted text-foreground"
                )}
                title="Toggle open tabs panel"
              >
                <Layers className="h-3.5 w-3.5" />
                Tabs ({openTabs.length})
              </Button>
            </TopBar>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Center Saved Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0 space-y-4">
                {/* 2. Persistent Save Session Bar */}
                <SaveSessionBar
                  openTabs={openTabs}
                  savedUrlStats={workspaceUrlStats}
                  latestSessionName={latestSession?.name}
                  onSaveSession={() => {
                    setSessionNameInput(generateSessionName());
                    setSessionSaveScope("all");
                    setIsSessionDialogOpen(true);
                  }}
                  onCloseSavedTabs={handleCloseSavedTabs}
                  onRestoreLastSession={handleRestoreLastSession}
                  isSaving={isSavingTabs}
                />

                <DashboardBoard
                  activeSpace={activeSpace}
                  collections={filteredCollections}
                  viewMode={viewMode}
                  activeFilter={activeFilter}
                  hasSearchQuery={!!query}
                  shareSettings={data.shareSettings}
                  openUrlSet={openUrlSet}
                  duplicateUrlCounts={workspaceUrlStats.urlCounts}
                  onClearFilters={() => {
                    setQuery("");
                    setActiveFilter("all");
                  }}
                  onViewModeChange={handleViewModeChange}
                  onFilterChange={setActiveFilter}
                  onToggleStar={handleToggleStar}
                  onDuplicateCollection={handleDuplicateCollection}
                  onEditCollection={openEditCollection}
                  onDeleteCollection={(id) =>
                    openDeleteConfirm({
                      type: "collection",
                      collectionId: id,
                      name: data.collections.find((c) => c.id === id)?.name,
                    })
                  }
                  onShareCollection={openShareCollection}
                  onAddGroup={openCreateGroup}
                  onEditGroup={openEditGroup}
                  onDeleteGroup={(cId, gId) =>
                    openDeleteConfirm({
                      type: "group",
                      collectionId: cId,
                      groupId: gId,
                      name: data.collections.find((c) => c.id === cId)?.groups.find((g) => g.id === gId)?.name,
                    })
                  }
                  onShareGroup={openShareGroup}
                  onEditItem={openEditItem}
                  onDuplicateItem={handleDuplicateItem}
                  onMoveItem={openMoveItem}
                  onDeleteItem={handleSoftDeleteItem}
                  onShareItem={openShareItem}
                  onCopyItemShareLink={handleCopyItemShareLink}
                  onDropItem={handleDropItem}
                  onOpenAllUrls={handleOpenAllUrls}
                  onCreateCollection={openCreateCollection}
                  onCreateItem={openCreateItem}
                />
              </div>

              {/* Floating Vertical Open Tabs Staging Panel on Right */}
              {isOpenTabsPanelOpen && (
                <aside
                  data-testid="docked-open-tabs-panel"
                  className="fixed top-3 bottom-3 right-3 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/10 bg-card/95 backdrop-blur-2xl shadow-obsidian shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2.5 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-2xs">
                        <Layers className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-foreground truncate">
                            Open Browser Tabs
                          </span>
                          <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                            {openTabs.length}
                          </span>
                        </div>
                        {selectedTabIds.length > 0 && (
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {selectedTabIds.length} tab{selectedTabIds.length > 1 ? "s" : ""} selected
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={refreshTabs}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Refresh tabs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsOpenTabsPanelOpen(false)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Close panel"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  {/* Actions & Triage Shortcuts */}
                  <div className="px-3 py-2 border-b border-border/50 bg-card/60 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSessionNameInput(generateSessionName());
                          setSessionSaveScope("all");
                          setIsSessionDialogOpen(true);
                        }}
                        data-testid="docked-save-session-button"
                        className="h-7 text-xs font-medium flex-1 shadow-2xs"
                      >
                        <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary" />
                        Save Session
                      </Button>

                      {selectedTabIds.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleSaveSelectedTabs}
                          data-testid="docked-save-selected-button"
                          className="h-7 text-xs font-semibold flex-1 shadow-2xs"
                        >
                          Save ({selectedTabIds.length})
                        </Button>
                      )}
                    </div>

                    {/* Keyboard Shortcuts Hint */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-semibold text-foreground shadow-2xs">A</kbd>
                        <span>Archive</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-semibold text-foreground shadow-2xs">S</kbd>
                        <span>Save</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-semibold text-foreground shadow-2xs">⌘K</kbd>
                        <span>Search</span>
                      </span>
                    </div>
                  </div>

                  {/* Vertical Tab List Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <OpenTabsList
                      tabs={openTabs}
                      selectedTabIds={selectedTabIds}
                      savedUrlStats={workspaceUrlStats}
                      onToggleSelectTab={(id) => {
                        setSelectedTabIds((prev) =>
                          prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
                        );
                      }}
                      onSelectAll={() => {
                        setSelectedTabIds(
                          openTabs.map((t) => t.id).filter((id): id is number => typeof id === "number")
                        );
                      }}
                      onDeselectAll={() => setSelectedTabIds([])}
                      onSaveSelected={handleSaveSelectedTabs}
                      onSaveAll={handleSaveAllTabsSession}
                      onSaveAsSession={() => {
                        setSessionNameInput(generateSessionName());
                        setIsSessionDialogOpen(true);
                      }}
                      onCloseTab={handleCloseTab}
                      isSaving={isSavingTabs}
                    />
                  </div>
                </aside>
              )}
            </div>
          </>
        )}

        {/* VIEW: OPEN TABS */}
        {activePage === "open-tabs" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Currently Open Browser Tabs
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Inspect tabs open in your active browser window, select links to save into
                  collections, or snapshot them as a new session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshTabs}
                  className="h-8 text-xs"
                  title="Refresh open tabs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh Tabs
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSessionNameInput(generateSessionName());
                    setIsSessionDialogOpen(true);
                  }}
                  data-testid="save-all-session-button"
                  className="h-8 text-xs font-medium"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Save Window as Session
                </Button>
              </div>
            </div>

            {/* Save Session Bar */}
            <SaveSessionBar
              openTabs={openTabs}
              savedUrlStats={workspaceUrlStats}
              latestSessionName={latestSession?.name}
              onSaveSession={() => {
                setSessionNameInput(generateSessionName());
                setSessionSaveScope("all");
                setIsSessionDialogOpen(true);
              }}
              onCloseSavedTabs={handleCloseSavedTabs}
              onRestoreLastSession={handleRestoreLastSession}
              isSaving={isSavingTabs}
            />

            {/* Destination Selection Bar for saving selected tabs */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 p-4 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Save Selected Tabs Destination:
              </span>

              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                {/* Collection select */}
                <select
                  value={tabDestCollectionId}
                  onChange={(e) => {
                    setTabDestCollectionId(e.target.value);
                    const col = activeSpaceCols.find((c) => c.id === e.target.value);
                    if (col?.groups[0]) setTabDestGroupId(col.groups[0].id);
                  }}
                  aria-label="Target collection"
                  className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs flex-1"
                >
                  {activeSpaceCols.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.groups.reduce((a, b) => a + b.items.filter((i) => !i.isDeleted).length, 0)} items)
                    </option>
                  ))}
                </select>

                {/* Group select */}
                <select
                  value={tabDestGroupId}
                  onChange={(e) => setTabDestGroupId(e.target.value)}
                  aria-label="Target group"
                  className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs flex-1"
                >
                  {activeDestGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Open Tabs List */}
            <OpenTabsList
              tabs={openTabs}
              selectedTabIds={selectedTabIds}
              savedUrlStats={workspaceUrlStats}
              onToggleSelectTab={handleToggleSelectTab}
              onSelectAll={handleSelectAllTabs}
              onDeselectAll={handleDeselectAllTabs}
              onSaveSelected={handleSaveSelectedTabs}
              onSaveAll={() => {
                handleSelectAllTabs();
                handleSaveSelectedTabs();
              }}
              onSaveAsSession={() => {
                setSessionNameInput(generateSessionName());
                setIsSessionDialogOpen(true);
              }}
              onCloseTab={handleCloseTab}
              isSaving={isSavingTabs}
            />
          </div>
        )}

        {/* VIEW: TRASH */}
        {activePage === "trash" && (
          <TrashPage items={deletedItems} onRestore={handleRestoreItem} />
        )}

        {/* VIEW: WORKSPACE SETTINGS & MEMBERS */}
        {activePage === "workspace" && (
          <WorkspaceSettingsView
            data={data}
            activeOrgId={activeOrgId}
            onUpdateWorkspace={async (name, initials, plan) => {
              const nextData = updateWorkspaceMutation(data, activeOrgId, name, initials, plan);
              await updateData(nextData);
            }}
            onDeleteWorkspace={async (orgId) => {
              const res = deleteWorkspaceMutation(data, orgId);
              if (res) {
                await updateData(res.nextData);
                setActiveOrgId(res.nextOrgId);
                setActiveSpaceId(res.nextSpaceId);
                setActivePage("dashboard");
                toast.success("Workspace deleted");
              } else {
                toast.error("Cannot delete your only workspace");
              }
            }}
            onSwitchWorkspace={(orgId) => {
              setActiveOrgId(orgId);
              const spaces = data.spaces.filter((s) => s.organizationId === orgId);
              if (spaces[0]) setActiveSpaceId(spaces[0].id);
            }}
            onDataUpdated={updateData}
            onNavigateToTab={(p) => setActivePage(p as ExtensionTabRoute)}
          />
        )}

        {/* VIEW: NEXT QUEUE (07-features/17-next-queue.md) */}
        {activePage === "next" && (
          <div data-testid="next-queue-view" className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-2xs">
                    <BookmarkCheck className="h-4 w-4" />
                  </div>
                  <span>Next (Focused To-Do Queue)</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Toby Next helps you move forward by turning open tabs into a clear, focused to-do list. Check off items as you complete them.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {nextItems.some((i) => i.done) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearCompletedNext}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Completed
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAddActiveTabToNext}
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Active Tab
                </Button>
              </div>
            </div>

            {/* Next Queue Items List */}
            {nextItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto shadow-obsidian">
                  <BookmarkCheck className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Your Next queue is clear</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Add tabs from your browser or collections to build a distraction-free queue of what to work on next.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleAddActiveTabToNext}
                    className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Current Tab to Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
                  <span>{nextUncompletedCount} open &bull; {nextItems.length - nextUncompletedCount} completed</span>
                  <span className="font-mono text-[11px]">Click ↗ to launch tab</span>
                </div>

                <div className="rounded-xl border border-border/80 border-t-white/10 bg-card/60 backdrop-blur-md divide-y divide-border/60 overflow-hidden shadow-obsidian">
                  {nextItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 gap-3 transition-colors hover:bg-muted/30 group",
                        item.done && "opacity-50 bg-muted/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleNextItemDone(item.id)}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer",
                            item.done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border/80 hover:border-emerald-500/60 bg-background/80"
                          )}
                          title={item.done ? "Mark incomplete" : "Mark completed"}
                        >
                          {item.done && <Check className="h-3.5 w-3.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-xs font-medium text-foreground truncate",
                              item.done && "line-through text-muted-foreground"
                            )}
                          >
                            {item.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                            {item.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(item.url, "_blank")}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                          title="Open tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveNextItem(item.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                          title="Remove from Next"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {activePage === "settings" && (
          <div className="flex-1 overflow-y-auto">
            <ExtensionSettingsView
              onDataUpdated={setData}
              onOpenWorkspaceSettings={() => setActivePage("workspace")}
            />
          </div>
        )}
      </main>

      {/* Save Session Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-primary" />
              Save Tabs as Session Collection
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Snapshot tabs from your active window into a new collection with organized groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Collection / Session Name</Label>
              <Input
                value={sessionNameInput}
                onChange={(e) => setSessionNameInput(e.target.value)}
                placeholder="e.g. Session - Oct 13"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destination Space</Label>
              <select
                value={activeSpaceId}
                onChange={(e) => setActiveSpaceId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
              >
                {organizationSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs">Tabs to Include</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSessionSaveScope("all")}
                  className={`rounded-md border p-2 text-left text-xs transition-colors ${
                    sessionSaveScope === "all"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  All Window Tabs ({openTabs.length})
                </button>
                <button
                  type="button"
                  disabled={selectedTabIds.length === 0}
                  onClick={() => setSessionSaveScope("selected")}
                  className={`rounded-md border p-2 text-left text-xs transition-colors ${
                    sessionSaveScope === "selected"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : selectedTabIds.length === 0
                      ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  Selected Tabs ({selectedTabIds.length})
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSessionDialogOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAllTabsSession}
              disabled={!sessionNameInput.trim() || isSavingTabs}
              className="h-8 text-xs"
            >
              Save Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Dialogs */}
      <WorkspaceDialog
        isOpen={workspaceMode !== null}
        mode={workspaceMode ?? "create"}
        value={workspaceForm}
        onValueChange={setWorkspaceForm}
        onOpenChange={(open) => !open && setWorkspaceMode(null)}
        onSubmit={handleWorkspaceSubmit}
      />

      <SpaceDialog
        isOpen={spaceMode !== null}
        mode={spaceMode ?? "create"}
        value={spaceForm}
        onValueChange={setSpaceForm}
        onOpenChange={(open) => !open && setSpaceMode(null)}
        onSubmit={handleSpaceSubmit}
      />

      <CollectionDialog
        isOpen={collectionMode !== null}
        mode={collectionMode ?? "create"}
        value={collectionForm}
        onValueChange={setCollectionForm}
        onOpenChange={(open) => !open && setCollectionMode(null)}
        onSubmit={handleCollectionSubmit}
      />

      <GroupDialog
        isOpen={groupMode !== null}
        mode={groupMode ?? "create"}
        value={groupForm}
        onValueChange={setGroupForm}
        onOpenChange={(open) => !open && setGroupMode(null)}
        onSubmit={handleGroupSubmit}
      />

      <ItemDialog
        isOpen={itemMode !== null}
        mode={itemMode ?? "create"}
        value={itemForm}
        collections={collectionsForActiveSpace}
        onValueChange={setItemForm}
        onOpenChange={(open) => !open && setItemMode(null)}
        onSubmit={handleItemSubmit}
      />

      <MoveItemDialog
        isOpen={moveTarget !== null}
        collections={collectionsForActiveSpace}
        selectedDestination={selectedMoveDestination}
        onDestinationChange={setSelectedMoveDestination}
        onOpenChange={(open) => !open && setMoveTarget(null)}
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmMove();
        }}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete ${deleteTarget?.type || "item"}?`}
        description={`Are you sure you want to delete ${deleteTarget?.name ? `"${deleteTarget.name}"` : "this"}?`}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Share Dialog */}
      {shareTarget && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          targetType={shareTarget.targetType}
          targetId={shareTarget.targetId}
          targetName={shareTarget.targetName}
          initialSettings={shareTarget.initialSettings}
          onOpenChange={setIsShareDialogOpen}
          onSave={handleSaveShare}
          onDisable={handleDisableShare}
        />
      )}

      {/* In-Extension Auth & Account Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        promptMessage={authPromptMessage}
        onSuccess={() => {
          // If we had a pending share, re-trigger save with current settings
          if (shareTarget && isShareDialogOpen) {
            const existing = findShareSettings(data?.shareSettings, shareTarget.targetType, shareTarget.targetId);
            if (existing) {
              handleSaveShare(existing);
            }
          }
        }}
      />
    </div>
  );
}
