import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  FolderPlus,
  Layers,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import type {
  AppData,
  BrowserTabSnapshot,
  Collection,
  ColorLabel,
  Group,
  Organization,
  Space,
} from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getActiveTab,
  getCurrentWindowTabs,
  openExtensionTab,
  openWebDashboard,
} from "../lib/browserApi";
import {
  loadPreferences,
  addItemToNextQueue,
  loadWorkspaceData,
  quickCreateCollection,
  quickCreateGroup,
  saveItemToDestination,
  saveSessionAsCollection,
  saveTabsToDestination,
} from "../lib/extensionStore";
import { filterSaveableTabs, isSaveableUrl } from "../lib/tabCapture";
import { DestinationPicker } from "../components/DestinationPicker";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { SaveAllTabsCard } from "../components/SaveAllTabsCard";
import { SaveCurrentTabCard } from "../components/SaveCurrentTabCard";
import { AuthDialog } from "@/components/auth/AuthDialog";

export function PopupApp() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTabSnapshot | null>(null);
  const [windowTabs, setWindowTabs] = useState<BrowserTabSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected destinations
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // States
  const [saveCurrentStatus, setSaveCurrentStatus] = useState<
    "idle" | "loading" | "saved" | "error" | "invalid"
  >("idle");
  const [saveCurrentError, setSaveCurrentError] = useState<string>("");
  const [saveAllStatus, setSaveAllStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");

  // Inline Quick Creation Dialogs
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState<ColorLabel>("pink");

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  // Ensure dark mode class is applied
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Load initial data & tab snapshots
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [workspaceData, currentTab, allTabs, prefs] = await Promise.all([
          loadWorkspaceData(),
          getActiveTab(),
          getCurrentWindowTabs(),
          loadPreferences(),
        ]);

        if (!isMounted) return;

        setData(workspaceData);
        setActiveTab(currentTab);
        setWindowTabs(allTabs);

        // Determine default destination
        const initialOrgId =
          prefs.defaultOrganizationId &&
          workspaceData.organizations.some((o) => o.id === prefs.defaultOrganizationId)
            ? prefs.defaultOrganizationId
            : workspaceData.organizations[0]?.id || "";

        const availableSpaces = workspaceData.spaces.filter(
          (s) => s.organizationId === initialOrgId
        );
        const initialSpaceId =
          prefs.defaultSpaceId && availableSpaces.some((s) => s.id === prefs.defaultSpaceId)
            ? prefs.defaultSpaceId
            : availableSpaces[0]?.id || "";

        const availableCollections = workspaceData.collections.filter(
          (c) => c.spaceId === initialSpaceId
        );
        const initialCollectionId =
          prefs.defaultCollectionId &&
          availableCollections.some((c) => c.id === prefs.defaultCollectionId)
            ? prefs.defaultCollectionId
            : availableCollections[0]?.id || "";

        const activeCol = availableCollections.find((c) => c.id === initialCollectionId);
        const initialGroupId =
          prefs.defaultGroupId && activeCol?.groups.some((g) => g.id === prefs.defaultGroupId)
            ? prefs.defaultGroupId
            : activeCol?.groups[0]?.id || "";

        setSelectedOrgId(initialOrgId);
        setSelectedSpaceId(initialSpaceId);
        setSelectedCollectionId(initialCollectionId);
        setSelectedGroupId(initialGroupId);
      } catch (err) {
        console.warn("Failed to initialize popup data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update space and collection when organization changes
  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    if (!data) return;

    const spaces = data.spaces.filter((s) => s.organizationId === orgId);
    const newSpaceId = spaces[0]?.id || "";
    setSelectedSpaceId(newSpaceId);

    const cols = data.collections.filter((c) => c.spaceId === newSpaceId);
    const newColId = cols[0]?.id || "";
    setSelectedCollectionId(newColId);

    const activeCol = cols.find((c) => c.id === newColId);
    setSelectedGroupId(activeCol?.groups[0]?.id || "");
  };

  // Update collection and group when space changes
  const handleSelectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    if (!data) return;

    const cols = data.collections.filter((c) => c.spaceId === spaceId);
    const newColId = cols[0]?.id || "";
    setSelectedCollectionId(newColId);

    const activeCol = cols.find((c) => c.id === newColId);
    setSelectedGroupId(activeCol?.groups[0]?.id || "");
  };

  // Update group when collection changes
  const handleSelectCollection = (colId: string) => {
    setSelectedCollectionId(colId);
    if (!data) return;

    const activeCol = data.collections.find((c) => c.id === colId);
    setSelectedGroupId(activeCol?.groups[0]?.id || "");
  };

  // Check if current tab is already saved in the chosen destination
  const isAlreadySaved = useMemo(() => {
    if (!data || !activeTab?.url || !selectedCollectionId) return false;
    const col = data.collections.find((c) => c.id === selectedCollectionId);
    if (!col) return false;

    return col.groups.some((group) =>
      group.items.some((item) => !item.isDeleted && item.url === activeTab.url)
    );
  }, [data, activeTab, selectedCollectionId]);

  // Save current active tab
  const handleAddToNext = async () => {
    if (!activeTab || !activeTab.url || !isSaveableUrl(activeTab.url)) return;
    try {
      const updated = await addItemToNextQueue(activeTab);
      setData(updated);
      toast.success("Added to Next queue");
    } catch {
      toast.error("Failed to add to Next queue");
    }
  };

  const handleSaveCurrentTab = async () => {
    if (!activeTab || !selectedCollectionId || !selectedGroupId) return;
    setSaveCurrentStatus("loading");
    setSaveCurrentError("");

    try {
      const prefs = await loadPreferences();
      const { nextData } = await saveItemToDestination({
        tab: activeTab,
        orgId: selectedOrgId,
        spaceId: selectedSpaceId,
        collectionId: selectedCollectionId,
        groupId: selectedGroupId,
      });

      setData(nextData);
      setSaveCurrentStatus("saved");

      // Preferences actions
      if (prefs.openFullTabAfterSave) {
        setTimeout(() => openExtensionTab(), 600);
      }

      // Revert saved button text back to idle after 2.5s
      setTimeout(() => {
        setSaveCurrentStatus("idle");
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save tab";
      setSaveCurrentStatus("error");
      setSaveCurrentError(message);
    }
  };

  // Save all tabs in window
  const handleSaveAllTabs = async () => {
    if (!selectedCollectionId || !selectedGroupId || windowTabs.length === 0) return;
    setSaveAllStatus("loading");

    try {
      const prefs = await loadPreferences();
      const { nextData } = await saveTabsToDestination({
        tabs: windowTabs,
        orgId: selectedOrgId,
        spaceId: selectedSpaceId,
        collectionId: selectedCollectionId,
        groupId: selectedGroupId,
        closeAfterSave: prefs.closeTabsAfterSave,
      });

      setData(nextData);
      setSaveAllStatus("saved");

      if (prefs.openFullTabAfterSave) {
        setTimeout(() => openExtensionTab(), 600);
      }

      setTimeout(() => setSaveAllStatus("idle"), 2500);
    } catch {
      setSaveAllStatus("error");
    }
  };

  // Save as new session
  const handleSaveSession = async () => {
    if (!selectedSpaceId || windowTabs.length === 0) return;
    setSaveAllStatus("loading");

    try {
      const prefs = await loadPreferences();
      const { nextData, newCollection } = await saveSessionAsCollection({
        tabs: windowTabs,
        spaceId: selectedSpaceId,
        closeAfterSave: prefs.closeTabsAfterSave,
      });

      setData(nextData);
      setSelectedCollectionId(newCollection.id);
      setSelectedGroupId(newCollection.groups[0]?.id || "");
      setSaveAllStatus("saved");

      if (prefs.openFullTabAfterSave) {
        setTimeout(() => openExtensionTab(), 600);
      }

      setTimeout(() => setSaveAllStatus("idle"), 2500);
    } catch {
      setSaveAllStatus("error");
    }
  };

  // Handle Quick Create Collection
  const handleQuickCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !selectedSpaceId) return;

    try {
      const { nextData, newCollection } = await quickCreateCollection({
        name: newCollectionName.trim(),
        spaceId: selectedSpaceId,
        color: newCollectionColor,
      });

      setData(nextData);
      setSelectedCollectionId(newCollection.id);
      setSelectedGroupId(newCollection.groups[0]?.id || "");
      setNewCollectionName("");
      setIsCreatingCollection(false);
    } catch (err) {
      console.warn("Failed to quick create collection:", err);
    }
  };

  // Handle Quick Create Group
  const handleQuickCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !selectedCollectionId) return;

    try {
      const { nextData, newGroup } = await quickCreateGroup({
        name: newGroupName.trim(),
        collectionId: selectedCollectionId,
      });

      setData(nextData);
      setSelectedGroupId(newGroup.id);
      setNewGroupName("");
      setIsCreatingGroup(false);
    } catch (err) {
      console.warn("Failed to quick create group:", err);
    }
  };


  // Global keyboard shortcut to save current tab (Enter) or all tabs (Shift+Enter)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAllTabs();
        } else {
          handleSaveCurrentTab();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveCurrentTab, handleSaveAllTabs]);

  if (isLoading || !data) {
    return (
      <div className="flex h-[580px] w-[440px] items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">Loading LetsMarkNow...</span>
        </div>
      </div>
    );
  }

  const saveableTabs = filterSaveableTabs(windowTabs);
  const collectionsInSpace = data.collections.filter((c) => c.spaceId === selectedSpaceId);

  return (
    <div
      data-testid="extension-popup-app"
      className="flex flex-col w-[440px] min-h-[580px] max-w-[440px] bg-background text-foreground antialiased selection:bg-primary/20 mx-auto overflow-hidden border border-white/10 rounded-2xl shadow-obsidian shadow-2xl"
    >
      {/* Header */}
      <ExtensionHeader
        organizations={data.organizations}
        activeOrganizationId={selectedOrgId}
        onSelectOrganization={handleSelectOrg}
        onOpenFullTab={() => openExtensionTab()}
        onOpenMindmap={() => openExtensionTab("app.html#mindmap")}
        onOpenSettings={() => openExtensionTab("settings")}
        onOpenAuth={() => setIsAuthDialogOpen(true)}
      />

      {/* Main Body */}
      <div className="p-2.5 space-y-2 flex-1 overflow-y-auto">
        {/* Onboarding hint if no collections exist */}
        {collectionsInSpace.length === 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Welcome to LetsMarkNow</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              You don&apos;t have any collections in this space yet. Quick-create one below to start
              saving links!
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreatingCollection(true)}
              className="h-7 text-xs w-full"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1" />
              Create First Collection
            </Button>
          </div>
        )}

        {/* Current Active Tab Card */}
        <SaveCurrentTabCard
          tab={activeTab}
          status={saveCurrentStatus}
          errorMessage={saveCurrentError}
          alreadySaved={isAlreadySaved}
          onSave={handleSaveCurrentTab}
          onAddToNext={handleAddToNext}
        />

        {/* Destination Picker */}
        <DestinationPicker
          organizations={data.organizations}
          spaces={data.spaces}
          collections={data.collections}
          selectedOrganizationId={selectedOrgId}
          selectedSpaceId={selectedSpaceId}
          selectedCollectionId={selectedCollectionId}
          selectedGroupId={selectedGroupId}
          onSelectOrganization={handleSelectOrg}
          onSelectSpace={handleSelectSpace}
          onSelectCollection={handleSelectCollection}
          onSelectGroup={setSelectedGroupId}
          onCreateCollection={() => setIsCreatingCollection(true)}
          onCreateGroup={() => setIsCreatingGroup(true)}
        />

        {/* Inline Quick Create Collection Form */}
        {isCreatingCollection && (
          <form
            onSubmit={handleQuickCreateCollection}
            className="rounded-lg border border-primary/40 bg-card p-3 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <FolderPlus className="h-3.5 w-3.5 text-primary" />
                Quick Create Collection
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingCollection(false)}
                className="text-muted-foreground hover:text-foreground text-[11px]"
              >
                Cancel
              </button>
            </div>
            <Input
              autoFocus
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. Design Inspiration, Research"
              className="h-8 text-xs"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsCreatingCollection(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newCollectionName.trim()}
                className="h-7 text-xs"
              >
                Create
              </Button>
            </div>
          </form>
        )}

        {/* Inline Quick Create Group Form */}
        {isCreatingGroup && (
          <form
            onSubmit={handleQuickCreateGroup}
            className="rounded-lg border border-primary/40 bg-card p-3 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Plus className="h-3.5 w-3.5 text-primary" />
                Quick Create Group
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="text-muted-foreground hover:text-foreground text-[11px]"
              >
                Cancel
              </button>
            </div>
            <Input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Must Read, Tools, References"
              className="h-8 text-xs"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsCreatingGroup(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newGroupName.trim()}
                className="h-7 text-xs"
              >
                Create Group
              </Button>
            </div>
          </form>
        )}

        {/* Open Tabs Summary Card */}
        <SaveAllTabsCard
          tabCount={windowTabs.length}
          validTabCount={saveableTabs.length}
          tabs={windowTabs}
          status={saveAllStatus}
          onSaveAll={handleSaveAllTabs}
          onSaveSession={handleSaveSession}
        />
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-border/80 bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground mt-auto shrink-0">
        <button
          type="button"
          onClick={() => openExtensionTab()}
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
        >
          <LayoutDashboard className="h-3 w-3 text-primary" />
          <span>Full Tab</span>
        </button>

        <button
          type="button"
          onClick={() => openWebDashboard()}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Web App</span>
        </button>

        <button
          type="button"
          onClick={() => openExtensionTab("settings")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Settings className="h-3 w-3" />
          <span>Settings</span>
        </button>
      </footer>

      {/* In-Extension Auth & Cloud Sync Modal */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
      />
    </div>
  );
}
