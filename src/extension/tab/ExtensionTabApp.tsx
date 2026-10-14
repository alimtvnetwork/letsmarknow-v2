import React, { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  FolderPlus,
  Globe,
  Layers,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  loadPreferences,
  loadWorkspaceData,
  saveSessionAsCollection,
  saveTabsToDestination,
  saveWorkspaceData,
} from "../lib/extensionStore";
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilter, setActiveFilter] = useState<"all" | "starred" | "recent">("all");

  // Open Browser Tabs state
  const [openTabs, setOpenTabs] = useState<BrowserTabSnapshot[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [isSavingTabs, setIsSavingTabs] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState(() => generateSessionName());
  const [isOpenTabsPanelOpen, setIsOpenTabsPanelOpen] = useState(true);
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

  // Forms
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormValue>(emptyWorkspaceForm);
  const [spaceForm, setSpaceForm] = useState<SpaceFormValue>(emptySpaceForm);
  const [collectionForm, setCollectionForm] = useState<CollectionFormValue>(emptyCollectionForm);
  const [groupForm, setGroupForm] = useState<GroupFormValue>(emptyGroupForm);
  const [itemForm, setItemForm] = useState<ItemFormValue>(emptyItemForm);

  // Ensure dark mode class is applied
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [wsData, tabs, prefs] = await Promise.all([
          loadWorkspaceData(),
          getCurrentWindowTabs(),
          loadPreferences(),
        ]);

        setData(wsData);
        setOpenTabs(tabs);

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

  // Refresh tabs periodically or on request
  const refreshTabs = async () => {
    const tabs = await getCurrentWindowTabs();
    setOpenTabs(tabs);
  };

  // Helper to persist data changes
  const updateData = async (nextData: AppData) => {
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

  // Handle dropped items (open tabs, existing items, or raw URLs)
  const handleDropItem = async (
    payload: string,
    targetCollectionId: string,
    targetGroupId: string
  ) => {
    if (!data) return;

    // 1. Open tab JSON drop
    try {
      if (payload.startsWith("{") && payload.includes("open-tab")) {
        const parsed = JSON.parse(payload);
        if (parsed.type === "open-tab" && parsed.tab) {
          const tab: BrowserTabSnapshot = parsed.tab;
          const itemPayload = tabToSavedItem(tab, { source: "current-tab" });
          const nextData = createItemMutation(
            data,
            targetCollectionId,
            targetGroupId,
            itemPayload
          );
          await updateData(nextData);
          toast.success(`Saved "${itemPayload.title}" to collection`);
          return;
        }
      }
    } catch {
      // not JSON, proceed
    }

    // 2. Existing bookmark reorder / move
    const parts = payload.split(":");
    if (parts.length === 3) {
      const [srcColId, srcGrpId, itemId] = parts;
      const nextData = moveItemMutation(
        data,
        srcColId,
        srcGrpId,
        itemId,
        targetCollectionId,
        targetGroupId
      );
      await updateData(nextData);
      toast.success("Item moved");
      return;
    }

    // 3. Raw URL drop
    if (isSaveableUrl(payload)) {
      const domain = getDomainFromUrl(payload);
      const nextData = createItemMutation(data, targetCollectionId, targetGroupId, {
        title: domain || payload,
        url: payload,
        description: `Saved from browser tab`,
        tags: domain && domain !== "unknown" ? [domain] : [],
        color: "pink",
        source: "current-tab",
      });
      await updateData(nextData);
      toast.success("Saved tab link to collection");
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
    await updateData(nextData);
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
      {/* 1. Left Rail */}
      <aside className="flex w-[68px] shrink-0 flex-col items-center border-r border-border bg-card/80 py-4.5 gap-3.5 z-20">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md shadow-primary/20">
          L
        </div>

        <div className="h-px w-8 bg-border/60 my-0.5" />

        {/* Workspace Avatars */}
        <div className="flex flex-col items-center gap-2.5 flex-1 overflow-y-auto no-scrollbar w-full px-2">
          {data.organizations.map((org) => {
            const isSelected = org.id === activeOrgId;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => {
                  setActiveOrgId(org.id);
                  const orgSpaces = data.spaces.filter((s) => s.organizationId === org.id);
                  if (orgSpaces[0]) setActiveSpaceId(orgSpaces[0].id);
                }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
                title={org.name}
              >
                {org.initials}
                {isSelected && (
                  <span className="absolute -left-2.5 h-5 w-1 rounded-r-full bg-primary" />
                )}
              </button>
            );
          })}

          <Button
            size="icon"
            variant="ghost"
            onClick={openCreateWorkspace}
            className="h-9 w-9 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            title="Create Workspace"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Rail Footer */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/60 w-full">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openWebDashboard()}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Open Web Dashboard"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setActivePage("settings")}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:text-foreground",
              activePage === "settings" && "bg-primary/10 text-primary"
            )}
            title="Extension Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* 2. Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/40 z-10">
        {/* Workspace info header */}
        <div className="flex items-center justify-between border-b border-border/80 p-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{activeOrg.name}</h2>
            <p className="text-[11px] text-muted-foreground">{activeOrg.plan} Workspace</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditWorkspace(activeOrg.id)}
            className="h-7 text-xs px-2 text-muted-foreground"
          >
            Edit
          </Button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main Extension Views */}
          <div className="space-y-1">
            <button
              type="button"
              data-testid="nav-collections-button"
              onClick={() => setActivePage("dashboard")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Collections
              </span>
              <span className="text-[10px] opacity-80">{activeItemCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage("open-tabs");
                refreshTabs();
              }}
              data-testid="nav-open-tabs-button"
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "open-tabs"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                Open Browser Tabs
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-semibold">
                {openTabs.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-workspace-button"
              onClick={() => setActivePage("workspace")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "workspace"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Workspace & Members
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-semibold">
                {(data?.members?.filter((m) => !m.organizationId || m.organizationId === activeOrgId) || []).length || 1}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-trash-button"
              onClick={() => setActivePage("trash")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "trash"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Trash
              </span>
              {deletedItems.length > 0 && (
                <span className="text-[10px] opacity-80">{deletedItems.length}</span>
              )}
            </button>

            <button
              type="button"
              data-testid="nav-settings-button"
              onClick={() => setActivePage("settings")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activePage === "settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Extension Settings
              </span>
            </button>
          </div>

          {/* Spaces Section */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Spaces ({organizationSpaces.length})
              </span>
              <button
                type="button"
                onClick={openCreateSpace}
                className="text-muted-foreground hover:text-foreground text-[11px]"
                title="Create Space"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-0.5">
              {organizationSpaces.map((space) => {
                const isSelected = space.id === activeSpaceId;
                const spaceItems = countActiveItems(
                  data.collections.filter((c) => c.spaceId === space.id)
                );
                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => {
                      setActiveSpaceId(space.id);
                      if (activePage !== "dashboard") setActivePage("dashboard");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                      isSelected && activePage === "dashboard"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("h-2 w-2 rounded-full", space.accentClass || "bg-primary")} />
                      <span className="truncate">{space.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{spaceItems}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/80 p-3 bg-muted/20">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>LetsMarkNow Extension</span>
            <span>V1.0</span>
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
                  onViewModeChange={setViewMode}
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
                  onShareCollection={() => {}}
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
                  onShareGroup={() => {}}
                  onEditItem={openEditItem}
                  onDuplicateItem={handleDuplicateItem}
                  onMoveItem={openMoveItem}
                  onDeleteItem={handleSoftDeleteItem}
                  onShareItem={() => {}}
                  onDropItem={handleDropItem}
                  onOpenAllUrls={handleOpenAllUrls}
                  onCreateCollection={openCreateCollection}
                  onCreateItem={openCreateItem}
                />
              </div>

              {/* Right Open Tabs Panel (3-column layout) */}
              {isOpenTabsPanelOpen && (
                <aside
                  data-testid="docked-open-tabs-panel"
                  className="w-80 xl:w-96 border-l border-border bg-card/40 flex flex-col shrink-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-border/80 p-3 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-xs text-foreground truncate">
                        Open Tabs ({openTabs.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={refreshTabs}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Refresh tabs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsOpenTabsPanelOpen(false)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Close panel"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 border-b border-border/60 bg-card/60 flex items-center justify-between gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSessionNameInput(generateSessionName());
                        setSessionSaveScope("all");
                        setIsSessionDialogOpen(true);
                      }}
                      data-testid="docked-save-session-button"
                      className="h-7 text-xs flex-1 font-medium"
                    >
                      <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary" />
                      Save Session
                    </Button>

                    {selectedTabIds.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleSaveSelectedTabs}
                        data-testid="docked-save-selected-button"
                        className="h-7 text-xs flex-1 font-semibold"
                      >
                        Save ({selectedTabIds.length})
                      </Button>
                    )}
                  </div>

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
    </div>
  );
}
