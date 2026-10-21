
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  countActiveItems,
  getCollectionSearchText,
  getHost,
} from "@/components/dashboard/helpers";
import type {
  CollectionFormValue,
  GroupFormValue,
  ItemFormValue,
  SpaceFormValue,
  WorkspaceFormValue,
} from "@/components/dashboard/ManageDialogs";
import {
  clearWorkspaceState,
  loadWorkspaceState,
  saveWorkspaceState,
  type ActiveFilter,
} from "@/lib/localWorkspaceStore";
import { getStoredAuth } from "@/lib/authStore";
import { updateBackendAccountPreferences } from "@/lib/workspaceApiClient";
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
  isValidUrl,
  moveItemMutation,
  restoreItemMutation,
  softDeleteItemMutation,
  updateCollectionMutation,
  updateGroupMutation,
  updateItemMutation,
  updateSpaceMutation,
  updateWorkspaceMutation,
} from "@/lib/workspaceMutations";
import { cleanWorkspace, mockWorkspace } from "@/data/mockWorkspace";

const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
const defaultWorkspace = isTestEnv ? mockWorkspace : cleanWorkspace;
import {
  findShareSettings,
  generateShareSlug,
  getShareUrl,
} from "@/lib/shareLinks";
import type {
  AppData,
  Collection,
  SavedItem,
  ShareSettings,
  ShareTargetType,
  ViewMode,
} from "@/types/lmn";

export type DialogTarget = {
  collectionId?: string;
  groupId?: string;
  itemId?: string;
  spaceId?: string;
  orgId?: string;
};

export type DeleteTarget = DialogTarget & {
  type: "workspace" | "space" | "collection" | "group";
  name?: string;
};

export const emptyWorkspaceForm: WorkspaceFormValue = { name: "", initials: "", plan: "Free" };
export const emptySpaceForm: SpaceFormValue = {
  name: "",
  description: "",
  accentClass: "bg-primary",
};
export const emptyCollectionForm: CollectionFormValue = { name: "", note: "", color: "pink" };
export const emptyGroupForm: GroupFormValue = { name: "" };
export const emptyItemForm: ItemFormValue = {
  title: "",
  url: "",
  description: "",
  tags: "",
  color: "pink",
  collectionId: "",
  groupId: "",
};

export const getDeletedItems = (collections: Collection[]) =>
  collections.flatMap((collection) =>
    collection.groups.flatMap((group) =>
      group.items
        .filter((item) => item.isDeleted)
        .map((item) => ({
          ...item,
          collectionName: collection.name,
          groupName: group.name,
        }))
    )
  );

export const getActiveItems = (collections: Collection[]) =>
  collections.flatMap((collection) =>
    collection.groups.flatMap((group) => group.items.filter((item) => !item.isDeleted))
  );

export function useWorkspaceDashboard() {
  const navigate = useNavigate();
  const params = useParams();

  // Load initial state defensively from localStorage
  const initialState = useMemo(() => loadWorkspaceState(), []);

  const [data, setData] = useState<AppData>(initialState.data);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    initialState.activeOrganizationId ?? initialState.data.organizations[0]?.id
  );
  const [activeSpaceId, setActiveSpaceId] = useState(
    params.spaceId ??
      initialState.activeSpaceId ??
      initialState.data.spaces[0]?.id
  );
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialState.viewMode ?? "grid");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    initialState.activeFilter ?? "all"
  );

  // Modals & Dialogs
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Save to localStorage and backend on state changes
  useEffect(() => {
    saveWorkspaceState({
      data,
      activeOrganizationId,
      activeSpaceId,
      viewMode,
      activeFilter,
    });
    const auth = getStoredAuth();
    if (auth?.access_token && ["list", "compact", "grid", "mindmap"].includes(viewMode)) {
      updateBackendAccountPreferences({ default_view: viewMode }).catch(() => {
        // Non-blocking sync
      });
    }
  }, [data, activeOrganizationId, activeSpaceId, viewMode, activeFilter]);

  // Derived current models
  const activeOrganization = useMemo(
    () =>
      data.organizations.find((org) => org.id === activeOrganizationId) ??
      data.organizations[0] ??
      defaultWorkspace.organizations[0],
    [data.organizations, activeOrganizationId]
  );

  const organizationSpaces = useMemo(
    () => data.spaces.filter((space) => space.organizationId === activeOrganization.id),
    [data.spaces, activeOrganization.id]
  );

  const activeSpace = useMemo(
    () =>
      organizationSpaces.find((space) => space.id === activeSpaceId) ??
      organizationSpaces[0] ??
      data.spaces[0] ??
      defaultWorkspace.spaces[0],
    [organizationSpaces, activeSpaceId, data.spaces]
  );

  const collectionsForActiveSpace = useMemo(
    () => data.collections.filter((col) => col.spaceId === activeSpace.id),
    [activeSpace.id, data.collections]
  );

  const spaceCollections = useMemo(() => {
    const currentQuery = query.trim().toLowerCase();
    let collections = collectionsForActiveSpace;

    if (activeFilter === "starred") {
      collections = collections.filter((collection) => collection.isStarred);
    }

    if (currentQuery) {
      collections = collections.filter((collection) =>
        getCollectionSearchText(collection).includes(currentQuery)
      );
    }

    return [...collections].sort((a, b) => {
      if (activeFilter === "recent") {
        return b.id.localeCompare(a.id);
      }
      return Number(b.isStarred) - Number(a.isStarred);
    });
  }, [activeFilter, collectionsForActiveSpace, query]);

  const deletedItems = useMemo(() => getDeletedItems(data.collections), [data.collections]);
  const activeItems = useMemo(() => getActiveItems(data.collections), [data.collections]);
  const allActiveItems = useMemo(() => countActiveItems(data.collections), [data.collections]);
  const activeSpaceItemCount = useMemo(
    () => countActiveItems(collectionsForActiveSpace),
    [collectionsForActiveSpace]
  );

  // Sync params with activeSpaceId
  useEffect(() => {
    if (params.spaceId && params.spaceId !== activeSpaceId) {
      setActiveSpaceId(params.spaceId);
    }
  }, [activeSpaceId, params.spaceId]);

  // Fallback to first space if activeSpaceId is outside active organization
  useEffect(() => {
    if (!organizationSpaces.some((space) => space.id === activeSpaceId) && organizationSpaces[0]) {
      setActiveSpaceId(organizationSpaces[0].id);
    }
  }, [activeOrganizationId, activeSpaceId, organizationSpaces]);

  // ================= Workspace Handlers =================
  const openCreateWorkspace = () => {
    setWorkspaceForm({ name: "", initials: "", plan: "Free" });
    setWorkspaceMode("create");
  };

  const openEditWorkspace = (orgId: string) => {
    const org = data.organizations.find((o) => o.id === orgId);
    if (!org) return;
    setWorkspaceForm({ name: org.name, initials: org.initials, plan: org.plan });
    setDialogTarget({ orgId });
    setWorkspaceMode("edit");
  };

  const saveWorkspace = (event: FormEvent) => {
    event.preventDefault();
    const name = workspaceForm.name.trim();
    if (!name) return;

    if (workspaceMode === "create") {
      const { nextData, newOrg, newSpace } = createWorkspaceMutation(
        data,
        name,
        workspaceForm.initials,
        workspaceForm.plan
      );
      setData(nextData);
      setActiveOrganizationId(newOrg.id);
      setActiveSpaceId(newSpace.id);
      setWorkspaceMode(null);
      navigate(`/web/app?spaceId=${newSpace.id}`);
      toast.success("Workspace created");
    } else if (dialogTarget.orgId) {
      const nextData = updateWorkspaceMutation(
        data,
        dialogTarget.orgId,
        name,
        workspaceForm.initials,
        workspaceForm.plan
      );
      setData(nextData);
      setWorkspaceMode(null);
      toast.success("Workspace updated");
    }
  };

  const requestDeleteWorkspace = (orgId: string) => {
    if (data.organizations.length <= 1) {
      toast.error("Cannot delete the only remaining workspace.");
      return;
    }
    const org = data.organizations.find((o) => o.id === orgId);
    setDeleteTarget({
      type: "workspace",
      orgId,
      name: org?.name ?? "workspace",
    });
  };

  // ================= Space Handlers =================
  const openCreateSpace = () => {
    setSpaceForm({ name: "", description: "", accentClass: "bg-primary" });
    setDialogTarget({});
    setSpaceMode("create");
  };

  const openEditSpace = (spaceId: string) => {
    const space = data.spaces.find((s) => s.id === spaceId);
    if (!space) return;
    setSpaceForm({
      name: space.name,
      description: space.description,
      accentClass: space.accentClass,
    });
    setDialogTarget({ spaceId });
    setSpaceMode("edit");
  };

  const saveSpace = (event: FormEvent) => {
    event.preventDefault();
    const name = spaceForm.name.trim();
    if (!name) return;

    if (spaceMode === "create") {
      const { nextData, newSpace } = createSpaceMutation(
        data,
        activeOrganization.id,
        name,
        spaceForm.description,
        spaceForm.accentClass
      );
      setData(nextData);
      setActiveSpaceId(newSpace.id);
      navigate(`/web/app?spaceId=${newSpace.id}`);
      toast.success("Space created");
    } else if (dialogTarget.spaceId) {
      const nextData = updateSpaceMutation(
        data,
        dialogTarget.spaceId,
        name,
        spaceForm.description,
        spaceForm.accentClass
      );
      setData(nextData);
      toast.success("Space updated");
    }

    setSpaceMode(null);
  };

  const requestDeleteSpace = (spaceId: string) => {
    if (organizationSpaces.length <= 1) {
      toast.error("Cannot delete the only space in this workspace.");
      return;
    }
    const space = data.spaces.find((s) => s.id === spaceId);
    setDeleteTarget({
      type: "space",
      spaceId,
      name: space?.name ?? "space",
    });
  };

  // ================= Collection Handlers =================
  const openCreateCollection = () => {
    setCollectionForm({ name: "", note: "", color: "pink" });
    setDialogTarget({});
    setCollectionMode("create");
  };

  const openEditCollection = (collectionId: string) => {
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) return;
    setCollectionForm({ name: col.name, note: col.note, color: col.color });
    setDialogTarget({ collectionId });
    setCollectionMode("edit");
  };

  const saveCollection = (event: FormEvent) => {
    event.preventDefault();
    const name = collectionForm.name.trim();
    if (!name) return;

    if (collectionMode === "create") {
      const { nextData } = createCollectionMutation(
        data,
        activeSpace.id,
        name,
        collectionForm.note,
        collectionForm.color
      );
      setData(nextData);
      toast.success("Collection created");
    } else if (dialogTarget.collectionId) {
      const nextData = updateCollectionMutation(data, dialogTarget.collectionId, (col) => ({
        ...col,
        name,
        note: collectionForm.note.trim() || col.note,
        color: collectionForm.color,
      }));
      setData(nextData);
      toast.success("Collection updated");
    }

    setCollectionMode(null);
  };

  const toggleStar = (collectionId: string) => {
    setData((current) =>
      updateCollectionMutation(current, collectionId, (col) => ({
        ...col,
        isStarred: !col.isStarred,
      }))
    );
  };

  const duplicateCollection = (collectionId: string) => {
    setData((current) => duplicateCollectionMutation(current, collectionId));
    toast.success("Collection duplicated");
  };

  const requestDeleteCollection = (collectionId: string) => {
    const col = data.collections.find((c) => c.id === collectionId);
    setDeleteTarget({
      type: "collection",
      collectionId,
      name: col?.name ?? "collection",
    });
  };

  // ================= Group Handlers =================
  const openCreateGroup = (collectionId: string) => {
    setGroupForm({ name: "" });
    setDialogTarget({ collectionId });
    setGroupMode("create");
  };

  const openEditGroup = (collectionId: string, groupId: string) => {
    const group = data.collections
      .find((c) => c.id === collectionId)
      ?.groups.find((g) => g.id === groupId);
    if (!group) return;
    setGroupForm({ name: group.name });
    setDialogTarget({ collectionId, groupId });
    setGroupMode("edit");
  };

  const saveGroup = (event: FormEvent) => {
    event.preventDefault();
    const name = groupForm.name.trim();
    if (!name || !dialogTarget.collectionId) return;

    if (groupMode === "create") {
      const nextData = createGroupMutation(data, dialogTarget.collectionId, name);
      setData(nextData);
      toast.success("Group created");
    } else if (dialogTarget.groupId) {
      const nextData = updateGroupMutation(
        data,
        dialogTarget.collectionId,
        dialogTarget.groupId,
        name
      );
      setData(nextData);
      toast.success("Group updated");
    }

    setGroupMode(null);
  };

  const requestDeleteGroup = (collectionId: string, groupId: string) => {
    const collection = data.collections.find((c) => c.id === collectionId);
    if (collection && collection.groups.length <= 1) {
      toast.error("Cannot delete the last group in a collection.");
      return;
    }
    const group = collection?.groups.find((g) => g.id === groupId);
    setDeleteTarget({
      type: "group",
      collectionId,
      groupId,
      name: group?.name ?? "group",
    });
  };

  // ================= Item Handlers =================
  const openCreateItem = (collectionId?: string, groupId?: string) => {
    const targetCollection = collectionId
      ? collectionsForActiveSpace.find((c) => c.id === collectionId) ?? collectionsForActiveSpace[0]
      : collectionsForActiveSpace[0];
    const targetGroup = groupId
      ? targetCollection?.groups.find((g) => g.id === groupId) ?? targetCollection?.groups[0]
      : targetCollection?.groups[0];

    setItemForm({
      title: "",
      url: "",
      description: "",
      tags: "",
      color: "pink",
      collectionId: targetCollection?.id ?? "",
      groupId: targetGroup?.id ?? "",
    });
    setDialogTarget({
      collectionId: targetCollection?.id,
      groupId: targetGroup?.id,
    });
    setItemMode("create");
  };

  const openEditItem = (collectionId: string, groupId: string, itemId: string) => {
    const item = data.collections
      .find((c) => c.id === collectionId)
      ?.groups.find((g) => g.id === groupId)
      ?.items.find((i) => i.id === itemId);
    if (!item) return;

    setItemForm({
      title: item.title,
      url: item.url,
      description: item.description,
      tags: item.tags.join(", "),
      color: item.color,
      collectionId,
      groupId,
    });
    setDialogTarget({ collectionId, groupId, itemId });
    setItemMode("edit");
  };

  const saveItem = (event: FormEvent) => {
    event.preventDefault();
    const title = itemForm.title.trim();
    const url = itemForm.url.trim();

    const chosenCollectionId =
      itemForm.collectionId || dialogTarget.collectionId || collectionsForActiveSpace[0]?.id;
    const targetCollection =
      collectionsForActiveSpace.find((c) => c.id === chosenCollectionId) ||
      collectionsForActiveSpace[0];

    const chosenGroupId =
      itemForm.groupId || dialogTarget.groupId || targetCollection?.groups[0]?.id;
    const targetGroup =
      targetCollection?.groups.find((g) => g.id === chosenGroupId) ||
      targetCollection?.groups[0];

    if (!title || !url || !isValidUrl(url)) return;

    const payload = {
      title,
      url,
      description: itemForm.description.trim() || `Saved from ${getHost(url)}.`,
      tags: itemForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      color: itemForm.color,
    };

    if (itemMode === "create" && targetCollection && targetGroup) {
      const nextData = createItemMutation(data, targetCollection.id, targetGroup.id, payload);
      setData(nextData);
      toast.success(`Item added to ${targetGroup.name}`);
    } else if (dialogTarget.collectionId && dialogTarget.groupId && dialogTarget.itemId) {
      if (
        (itemForm.collectionId && itemForm.collectionId !== dialogTarget.collectionId) ||
        (itemForm.groupId && itemForm.groupId !== dialogTarget.groupId)
      ) {
        const movedData = moveItemMutation(
          data,
          dialogTarget.collectionId,
          dialogTarget.groupId,
          dialogTarget.itemId,
          targetCollection.id,
          targetGroup.id
        );
        const nextData = updateItemMutation(
          movedData,
          targetCollection.id,
          targetGroup.id,
          dialogTarget.itemId,
          payload
        );
        setData(nextData);
        toast.success("Item updated");
      } else {
        const nextData = updateItemMutation(
          data,
          dialogTarget.collectionId,
          dialogTarget.groupId,
          dialogTarget.itemId,
          payload
        );
        setData(nextData);
        toast.success("Item updated");
      }
    }

    setItemMode(null);
  };

  const duplicateItem = (collectionId: string, groupId: string, itemId: string) => {
    setData((current) => duplicateItemMutation(current, collectionId, groupId, itemId));
    toast.success("Item duplicated");
  };

  const softDeleteItem = (collectionId: string, groupId: string, itemId: string) => {
    setData((current) => softDeleteItemMutation(current, collectionId, groupId, itemId));
    toast("Moved to trash", {
      action: {
        label: "Undo",
        onClick: () => restoreItem(itemId),
      },
    });
  };

  const restoreItem = (itemId: string) => {
    setData((current) => restoreItemMutation(current, itemId));
    toast.success("Item restored");
  };

  const openMoveItem = (collectionId: string, groupId: string, itemId: string) => {
    const fallback = collectionsForActiveSpace.flatMap((col) =>
      col.groups.map((group) => `${col.id}:${group.id}`)
    )[0];
    setMoveTarget({ collectionId, groupId, itemId });
    setSelectedMoveDestination(fallback ?? "");
  };

  const moveItem = (
    sourceCollectionId: string,
    sourceGroupId: string,
    itemId: string,
    targetCollectionId: string,
    targetGroupId: string
  ) => {
    const nextData = moveItemMutation(
      data,
      sourceCollectionId,
      sourceGroupId,
      itemId,
      targetCollectionId,
      targetGroupId
    );
    if (!nextData) return;
    setData(nextData);
    toast.success("Item moved");
  };

  const submitMoveItem = (event: FormEvent) => {
    event.preventDefault();
    if (
      !moveTarget?.collectionId ||
      !moveTarget.groupId ||
      !moveTarget.itemId ||
      !selectedMoveDestination
    )
      return;
    const [targetCollectionId, targetGroupId] = selectedMoveDestination.split(":");
    moveItem(
      moveTarget.collectionId,
      moveTarget.groupId,
      moveTarget.itemId,
      targetCollectionId,
      targetGroupId
    );
    setMoveTarget(null);
  };

  const handleDropItem = (payload: string, targetCollectionId: string, targetGroupId: string) => {
    // 1. JSON payload
    if (payload.startsWith("{")) {
      try {
        const parsed = JSON.parse(payload);
        if ((parsed.type === "saved-item" || parsed.type === "desk-item") && parsed.itemId) {
          const originCol = parsed.collectionId;
          const originGrp = parsed.groupId;
          if (originCol && originGrp) {
            moveItem(originCol, originGrp, parsed.itemId, targetCollectionId, targetGroupId);
            return;
          }
          for (const col of data.collections) {
            for (const grp of col.groups) {
              if (grp.items.some((i) => i.id === parsed.itemId && !i.isDeleted)) {
                moveItem(col.id, grp.id, parsed.itemId, targetCollectionId, targetGroupId);
                return;
              }
            }
          }
        }
      } catch {}
    }

    // 2. Desk item prefix: "desk:itemId"
    if (payload.startsWith("desk:")) {
      const rawId = payload.replace("desk:", "");
      for (const col of data.collections) {
        for (const grp of col.groups) {
          if (grp.items.some((i) => i.id === rawId && !i.isDeleted)) {
            moveItem(col.id, grp.id, rawId, targetCollectionId, targetGroupId);
            return;
          }
        }
      }
      return;
    }

    // 3. Colon-separated format: "colId:grpId:itemId"
    const parts = payload.split(":");
    if (parts.length === 3) {
      const [sourceCollectionId, sourceGroupId, itemId] = parts;
      if (!sourceCollectionId || !sourceGroupId || !itemId) return;
      moveItem(sourceCollectionId, sourceGroupId, itemId, targetCollectionId, targetGroupId);
      return;
    }

    // 4. Raw item ID
    for (const col of data.collections) {
      for (const grp of col.groups) {
        if (grp.items.some((i) => i.id === payload && !i.isDeleted)) {
          moveItem(col.id, grp.id, payload, targetCollectionId, targetGroupId);
          return;
        }
      }
    }
  };

  // ================= Deletion Confirmation =================
  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "workspace" && deleteTarget.orgId) {
      const result = deleteWorkspaceMutation(data, deleteTarget.orgId);
      if (result) {
        setData(result.nextData);
        setActiveOrganizationId(result.nextOrgId);
        setActiveSpaceId(result.nextSpaceId);
        navigate("/web/app");
        toast.success("Workspace deleted");
      }
    }

    if (deleteTarget.type === "space" && deleteTarget.spaceId) {
      const result = deleteSpaceMutation(data, deleteTarget.spaceId, activeOrganization.id);
      if (result) {
        setData(result.nextData);
        setActiveSpaceId(result.nextSpaceId);
        navigate(`/web/app?spaceId=${result.nextSpaceId}`);
        toast.success("Space deleted");
      }
    }

    if (deleteTarget.type === "collection" && deleteTarget.collectionId) {
      const nextData = deleteCollectionMutation(data, deleteTarget.collectionId);
      setData(nextData);
      toast.success("Collection deleted");
    }

    if (deleteTarget.type === "group" && deleteTarget.collectionId && deleteTarget.groupId) {
      const nextData = deleteGroupMutation(data, deleteTarget.collectionId, deleteTarget.groupId);
      if (nextData) {
        setData(nextData);
        toast.success("Group deleted");
      }
    }

    setDeleteTarget(null);
  };

  const jumpToCollection = (spaceId: string, collectionId: string) => {
    setActiveSpaceId(spaceId);
    setQuery(data.collections.find((col) => col.id === collectionId)?.name ?? "");
    navigate(`/web/app?spaceId=${spaceId}`);
  };

  const handleResetData = () => {
    clearWorkspaceState();
    const resetTarget = isTestEnv ? mockWorkspace : cleanWorkspace;
    setData(resetTarget);
    setActiveOrganizationId(resetTarget.organizations[0].id);
    setActiveSpaceId(resetTarget.spaces[0].id);
    setViewMode("grid");
    setActiveFilter("all");
    navigate("/web/app");
    toast.success(isTestEnv ? "Demo data restored" : "Workspace reset to clean state");
  };

  const handleExportWorkspaceJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      organization: activeOrganization,
      spaces: organizationSpaces,
      collections: collectionsForActiveSpace,
      allCollections: data.collections,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `letsmarknow-${activeOrganization.name.toLowerCase().replace(/\s+/g, "-")}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Workspace exported to JSON");
  };

  const openShareDialog = (
    targetType: ShareTargetType,
    targetId: string,
    targetName: string
  ) => {
    const existing = findShareSettings(data.shareSettings, targetType, targetId);
    setShareTarget({
      targetType,
      targetId,
      targetName,
      initialSettings: existing,
    });
    setIsShareDialogOpen(true);
  };

  const openShareWorkspace = (orgId?: string) => {
    const org = orgId
      ? data.organizations.find((o) => o.id === orgId) ?? activeOrganization
      : activeOrganization;
    openShareDialog("workspace", org.id, org.name);
  };

  const openShareSpace = (spaceId?: string) => {
    const space = spaceId
      ? data.spaces.find((s) => s.id === spaceId) ?? activeSpace
      : activeSpace;
    openShareDialog("space", space.id, space.name);
  };

  const openShareCollection = (collectionId: string) => {
    const col = data.collections.find((c) => c.id === collectionId);
    if (col) {
      openShareDialog("collection", col.id, col.name);
    }
  };

  const openShareGroup = (collectionId: string, groupId: string) => {
    const col = data.collections.find((c) => c.id === collectionId);
    const grp = col?.groups.find((g) => g.id === groupId);
    if (grp) {
      openShareDialog("group", grp.id, grp.name);
    }
  };

  const openShareItem = (_collectionId: string, _groupId: string, itemId: string) => {
    for (const c of data.collections) {
      for (const g of c.groups) {
        const item = g.items.find((i) => i.id === itemId);
        if (item) {
          openShareDialog("item", item.id, item.title);
          return;
        }
      }
    }
  };

  const handleSaveShare = (settings: ShareSettings) => {
    setData((prev) => {
      const existingSettings = prev.shareSettings || [];
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

      return {
        ...prev,
        shareSettings: nextSettings,
      };
    });
    setIsShareDialogOpen(false);
    toast.success("Share settings saved");
  };

  const handleDisableShare = (targetType: ShareTargetType, targetId: string) => {
    setData((prev) => ({
      ...prev,
      shareSettings: (prev.shareSettings || []).filter(
        (s) => !(s.targetType === targetType && s.targetId === targetId)
      ),
    }));
    setIsShareDialogOpen(false);
    toast.success("Public sharing link disabled");
  };

  const handleCopyShareLink = (targetType: ShareTargetType, targetId: string) => {
    const existing = findShareSettings(data.shareSettings, targetType, targetId);
    let slug = existing?.publicSlug;

    if (!slug) {
      let name = targetId;
      if (targetType === "workspace") {
        name = data.organizations.find((o) => o.id === targetId)?.name || targetId;
      } else if (targetType === "space") {
        name = data.spaces.find((s) => s.id === targetId)?.name || targetId;
      } else if (targetType === "collection") {
        name = data.collections.find((c) => c.id === targetId)?.name || targetId;
      } else if (targetType === "item") {
        for (const c of data.collections) {
          for (const g of c.groups) {
            const it = g.items.find((i) => i.id === targetId);
            if (it) {
              name = it.title;
              break;
            }
          }
        }
      }
      slug = generateShareSlug(name, targetId);

      const newShare: ShareSettings = {
        id: `share-${Date.now()}`,
        targetType,
        targetId,
        visibility: "public",
        permission: "view",
        publicSlug: slug,
        allowCopy: true,
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        shareSettings: [...(prev.shareSettings || []), newShare],
      }));
    }

    const shareUrl = getShareUrl(targetType, slug);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    toast.success("Share link copied to clipboard");
  };

  const handleCopyItemLink = (url: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    toast.success("URL copied to clipboard");
  };

  const handleCopyItemShareLink = (itemId: string) => {
    handleCopyShareLink("item", itemId);
  };

  return {
    data,
    activeOrganization,
    organizationSpaces,
    activeSpace,
    collectionsForActiveSpace,
    spaceCollections,
    deletedItems,
    activeItems,
    allActiveItems,
    activeSpaceItemCount,
    query,
    setQuery,
    viewMode,
    setViewMode,
    activeFilter,
    setActiveFilter,
    isCommandOpen,
    setIsCommandOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isShareDialogOpen,
    setIsShareDialogOpen,
    shareTarget,
    workspaceMode,
    setWorkspaceMode,
    spaceMode,
    setSpaceMode,
    collectionMode,
    setCollectionMode,
    groupMode,
    setGroupMode,
    itemMode,
    setItemMode,
    deleteTarget,
    setDeleteTarget,
    moveTarget,
    setMoveTarget,
    selectedMoveDestination,
    setSelectedMoveDestination,
    workspaceForm,
    setWorkspaceForm,
    spaceForm,
    setSpaceForm,
    collectionForm,
    setCollectionForm,
    groupForm,
    setGroupForm,
    itemForm,
    setItemForm,
    setActiveOrganizationId,
    setActiveSpaceId,
    openCreateWorkspace,
    openEditWorkspace,
    saveWorkspace,
    requestDeleteWorkspace,
    openCreateSpace,
    openEditSpace,
    saveSpace,
    requestDeleteSpace,
    openCreateCollection,
    openEditCollection,
    saveCollection,
    toggleStar,
    duplicateCollection,
    requestDeleteCollection,
    openCreateGroup,
    openEditGroup,
    saveGroup,
    requestDeleteGroup,
    openCreateItem,
    openEditItem,
    saveItem,
    duplicateItem,
    softDeleteItem,
    restoreItem,
    openMoveItem,
    submitMoveItem,
    handleDropItem,
    confirmDelete,
    jumpToCollection,
    handleResetData,
    handleExportWorkspaceJson,
    openShareDialog,
    openShareWorkspace,
    openShareSpace,
    openShareCollection,
    openShareGroup,
    openShareItem,
    handleSaveShare,
    handleDisableShare,
    handleCopyShareLink,
    handleCopyItemLink,
    handleCopyItemShareLink,
  };
}
