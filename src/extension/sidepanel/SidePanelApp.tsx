import React, { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronRight,
  ExternalLink,
  Folder,
  FolderPlus,
  Globe,
  Layers,
  LayoutDashboard,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  getActiveTab,
  getCurrentWindowTabs,
  openExtensionMain,
  openUrl,
  openWebAccount,
} from "../lib/browserApi";
import {
  loadPreferences,
  loadWorkspaceData,
  quickCreateCollection,
  quickCreateGroup,
  saveItemToDestination,
  saveSessionAsCollection,
  saveTabsToDestination,
} from "../lib/extensionStore";
import { filterSaveableTabs, getDomainFromUrl, isSaveableUrl } from "../lib/tabCapture";
import { DestinationPicker } from "../components/DestinationPicker";
import { SaveCurrentTabCard } from "../components/SaveCurrentTabCard";
import { OpenTabsList } from "../components/OpenTabsList";

export function SidePanelApp() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTabSnapshot | null>(null);
  const [windowTabs, setWindowTabs] = useState<BrowserTabSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab: "capture" | "tabs" | "collections"
  const [panelTab, setPanelTab] = useState<"capture" | "tabs" | "collections">("capture");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected destinations
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Open tabs selection
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);

  // Statuses
  const [saveCurrentStatus, setSaveCurrentStatus] = useState<
    "idle" | "loading" | "saved" | "error" | "invalid"
  >("idle");
  const [saveCurrentError, setSaveCurrentError] = useState("");
  const [saveSelectedStatus, setSaveSelectedStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");

  // Inline Creation
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const refreshAll = async () => {
    try {
      const [workspaceData, currentTab, allTabs, prefs] = await Promise.all([
        loadWorkspaceData(),
        getActiveTab(),
        getCurrentWindowTabs(),
        loadPreferences(),
      ]);

      setData(workspaceData);
      setActiveTab(currentTab);
      setWindowTabs(allTabs);

      const initialOrgId =
        prefs.defaultOrganizationId &&
        workspaceData.organizations.some((o) => o.id === prefs.defaultOrganizationId)
          ? prefs.defaultOrganizationId
          : workspaceData.organizations[0]?.id || "";

      const spacesInOrg = workspaceData.spaces.filter((s) => s.organizationId === initialOrgId);
      const initialSpaceId =
        prefs.defaultSpaceId && spacesInOrg.some((s) => s.id === prefs.defaultSpaceId)
          ? prefs.defaultSpaceId
          : spacesInOrg[0]?.id || "";

      const collectionsInSpace = workspaceData.collections.filter(
        (c) => c.spaceId === initialSpaceId
      );
      const initialColId =
        prefs.defaultCollectionId &&
        collectionsInSpace.some((c) => c.id === prefs.defaultCollectionId)
          ? prefs.defaultCollectionId
          : collectionsInSpace[0]?.id || "";

      const initialCol = collectionsInSpace.find((c) => c.id === initialColId);
      const initialGroupId =
        prefs.defaultGroupId && initialCol?.groups.some((g) => g.id === prefs.defaultGroupId)
          ? prefs.defaultGroupId
          : initialCol?.groups[0]?.id || "";

      setSelectedOrgId(initialOrgId);
      setSelectedSpaceId(initialSpaceId);
      setSelectedCollectionId(initialColId);
      setSelectedGroupId(initialGroupId);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const activeOrg = useMemo(() => {
    if (!data) return null;
    return data.organizations.find((o) => o.id === selectedOrgId) ?? data.organizations[0] ?? null;
  }, [data, selectedOrgId]);

  const activeSpace = useMemo(() => {
    if (!data) return null;
    return data.spaces.find((s) => s.id === selectedSpaceId) ?? data.spaces[0] ?? null;
  }, [data, selectedSpaceId]);

  const collectionsInSpace = useMemo(() => {
    if (!data || !selectedSpaceId) return [];
    return data.collections.filter((c) => c.spaceId === selectedSpaceId);
  }, [data, selectedSpaceId]);

  const isAlreadySaved = useMemo(() => {
    if (!activeTab || !selectedCollectionId) return false;
    const targetCol = collectionsInSpace.find((c) => c.id === selectedCollectionId);
    if (!targetCol) return false;
    return targetCol.groups.some((g) =>
      g.items.some((i) => !i.isDeleted && i.url.toLowerCase() === activeTab.url.toLowerCase())
    );
  }, [activeTab, collectionsInSpace, selectedCollectionId]);

  const handleSaveCurrentTab = async () => {
    if (!activeTab || !isSaveableUrl(activeTab.url)) return;
    if (!selectedCollectionId || !selectedGroupId) return;

    setSaveCurrentStatus("loading");
    setSaveCurrentError("");

    try {
      const { nextData } = await saveItemToDestination({
        tab: activeTab,
        orgId: selectedOrgId,
        spaceId: selectedSpaceId,
        collectionId: selectedCollectionId,
        groupId: selectedGroupId,
      });

      setData(nextData);
      setSaveCurrentStatus("saved");
      setTimeout(() => setSaveCurrentStatus("idle"), 2500);
    } catch (err) {
      setSaveCurrentStatus("error");
      setSaveCurrentError(err instanceof Error ? err.message : "Failed to save tab");
    }
  };

  const handleSaveSelectedTabs = async () => {
    const selected = windowTabs.filter((t) => t.id && selectedTabIds.includes(t.id));
    if (!selected.length || !selectedCollectionId || !selectedGroupId) return;

    setSaveSelectedStatus("loading");
    try {
      const prefs = await loadPreferences();
      const { nextData } = await saveTabsToDestination({
        tabs: selected,
        orgId: selectedOrgId,
        spaceId: selectedSpaceId,
        collectionId: selectedCollectionId,
        groupId: selectedGroupId,
        closeAfterSave: prefs.closeTabsAfterSave,
      });

      setData(nextData);
      setSaveSelectedStatus("saved");
      setSelectedTabIds([]);
      setTimeout(() => setSaveSelectedStatus("idle"), 2500);
    } catch {
      setSaveSelectedStatus("error");
    }
  };

  const handleSaveSession = async () => {
    if (!selectedSpaceId || !windowTabs.length) return;
    setSaveSelectedStatus("loading");
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
      setSaveSelectedStatus("saved");
      setTimeout(() => setSaveSelectedStatus("idle"), 2500);
    } catch {
      setSaveSelectedStatus("error");
    }
  };

  const handleQuickCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !selectedSpaceId) return;

    const { nextData, newCollection } = await quickCreateCollection({
      name: newCollectionName.trim(),
      spaceId: selectedSpaceId,
      color: "pink",
    });

    setData(nextData);
    setSelectedCollectionId(newCollection.id);
    setSelectedGroupId(newCollection.groups[0]?.id || "");
    setNewCollectionName("");
    setIsCreatingCollection(false);
  };

  const handleQuickCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !selectedCollectionId) return;

    const { nextData, newGroup } = await quickCreateGroup({
      name: newGroupName.trim(),
      collectionId: selectedCollectionId,
    });

    setData(nextData);
    setSelectedGroupId(newGroup.id);
    setNewGroupName("");
    setIsCreatingGroup(false);
  };

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return collectionsInSpace;
    return collectionsInSpace.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.groups.some((g) =>
        g.name.toLowerCase().includes(q) ||
        g.items.some((i) => i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q))
      )
    );
  }, [collectionsInSpace, searchQuery]);

  if (isLoading || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Loading Side Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="extension-side-panel-app"
      className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground text-xs"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground text-xs">
            L
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-xs truncate leading-tight">LetsMarkNow</h1>
            <p className="text-[10px] text-muted-foreground truncate">{activeOrg?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={refreshAll}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openExtensionMain()}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Open Main Workspace Tab"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Surface Navigation Tabs - Obsidian Segmented Control */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <nav className="flex rounded-xl border border-border/80 border-t-white/12 bg-card/60 p-1 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setPanelTab("capture")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all",
              panelTab === "capture"
                ? "bg-card text-foreground font-semibold shadow-obsidian border border-border/70"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
            )}
          >
            <Bookmark className="h-3.5 w-3.5 text-primary" />
            <span>Capture</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("tabs")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all",
              panelTab === "tabs"
                ? "bg-card text-foreground font-semibold shadow-obsidian border border-border/70"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
            )}
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Tabs ({windowTabs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("collections")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all",
              panelTab === "collections"
                ? "bg-card text-foreground font-semibold shadow-obsidian border border-border/70"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
            )}
          >
            <Folder className="h-3.5 w-3.5 text-amber-400" />
            <span>Collections</span>
          </button>
        </nav>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {panelTab === "capture" && (
          <>
            {/* Active Tab Card */}
            <SaveCurrentTabCard
              tab={activeTab}
              status={saveCurrentStatus}
              errorMessage={saveCurrentError}
              alreadySaved={isAlreadySaved}
              onSave={handleSaveCurrentTab}
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
              onSelectOrganization={setSelectedOrgId}
              onSelectSpace={setSelectedSpaceId}
              onSelectCollection={setSelectedCollectionId}
              onSelectGroup={setSelectedGroupId}
              onCreateCollection={() => setIsCreatingCollection(true)}
              onCreateGroup={() => setIsCreatingGroup(true)}
            />

            {/* Quick Creation Form inline */}
            {isCreatingCollection && (
              <form onSubmit={handleQuickCreateCollection} className="rounded-lg border border-primary/40 bg-card p-2.5 space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Quick Create Collection</span>
                  <button type="button" onClick={() => setIsCreatingCollection(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>
                <Input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="h-7 text-xs"
                />
                <Button type="submit" size="sm" disabled={!newCollectionName.trim()} className="w-full h-7 text-xs">
                  Create Collection
                </Button>
              </form>
            )}

            {isCreatingGroup && (
              <form onSubmit={handleQuickCreateGroup} className="rounded-lg border border-primary/40 bg-card p-2.5 space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Quick Create Group</span>
                  <button type="button" onClick={() => setIsCreatingGroup(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>
                <Input
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="h-7 text-xs"
                />
                <Button type="submit" size="sm" disabled={!newGroupName.trim()} className="w-full h-7 text-xs">
                  Create Group
                </Button>
              </form>
            )}

            {/* Quick session snapshot button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSession}
                className="w-full h-8 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Save Window as Session ({filterSaveableTabs(windowTabs).length} tabs)
              </Button>
            </div>
          </>
        )}

        {panelTab === "tabs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Current Window Tabs
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (selectedTabIds.length === windowTabs.length) {
                    setSelectedTabIds([]);
                  } else {
                    setSelectedTabIds(windowTabs.map((t) => t.id).filter((id): id is number => typeof id === "number"));
                  }
                }}
                className="h-6 text-[10px] px-2 text-muted-foreground"
              >
                {selectedTabIds.length === windowTabs.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Destination Bar */}
            <div className="rounded-lg border border-border bg-card/60 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">Selected: {selectedTabIds.length} tabs</span>
                <Button
                  size="sm"
                  disabled={selectedTabIds.length === 0 || saveSelectedStatus === "loading"}
                  onClick={handleSaveSelectedTabs}
                  className="h-7 text-xs"
                >
                  {saveSelectedStatus === "saved" ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Saved!
                    </>
                  ) : (
                    "Save Selected"
                  )}
                </Button>
              </div>
            </div>

            <OpenTabsList
              tabs={windowTabs}
              selectedTabIds={selectedTabIds}
              onToggleTab={(id) => {
                setSelectedTabIds((prev) =>
                  prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
                );
              }}
              onSaveTab={async (tab) => {
                if (!selectedCollectionId || !selectedGroupId) return;
                await saveItemToDestination({
                  tab,
                  orgId: selectedOrgId,
                  spaceId: selectedSpaceId,
                  collectionId: selectedCollectionId,
                  groupId: selectedGroupId,
                });
                await refreshAll();
              }}
            />
          </div>
        )}

        {panelTab === "collections" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections & links..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              {filteredCollections.map((col) => (
                <div key={col.id} className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 font-semibold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!activeTab || !isSaveableUrl(activeTab.url)) return;
                        const firstGrp = col.groups[0]?.id;
                        if (!firstGrp) return;
                        await saveItemToDestination({
                          tab: activeTab,
                          orgId: selectedOrgId,
                          spaceId: selectedSpaceId,
                          collectionId: col.id,
                          groupId: firstGrp,
                        });
                        await refreshAll();
                      }}
                      className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10"
                      title="File current tab into this collection"
                    >
                      + Save Active Tab
                    </Button>
                  </div>

                  <div className="pl-4 space-y-1">
                    {col.groups.map((grp) => (
                      <div key={grp.id} className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>{grp.name} ({grp.items.filter((i) => !i.isDeleted).length})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-border/80 bg-card/60 px-3 py-2 text-[11px] text-muted-foreground shrink-0">
        <button
          type="button"
          onClick={() => openExtensionMain()}
          className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
        >
          <LayoutDashboard className="h-3 w-3 text-primary" />
          <span>Extension Main</span>
        </button>
        <button
          type="button"
          onClick={() => openWebAccount()}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Web Account</span>
        </button>
      </footer>
    </div>
  );
}
