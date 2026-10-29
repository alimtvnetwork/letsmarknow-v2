import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Chrome, Sparkles } from "lucide-react";

import {
  MobileSidebarDrawer,
  SpaceSidebar,
  WorkspaceRail,
} from "@/components/dashboard/AppShell";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { DashboardBoard, TrashPage } from "@/components/dashboard/DashboardBoard";
import { NextQueueView } from "@/components/dashboard/NextQueueView";
import {
  CollectionDialog,
  ConfirmDialog,
  GroupDialog,
  ItemDialog,
  MoveItemDialog,
  SpaceDialog,
  WorkspaceDialog,
} from "@/components/dashboard/ManageDialogs";
import { ActivityPage, PublicSharePage } from "@/components/dashboard/SecondaryPages";
import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { ShareDialog } from "@/components/dashboard/ShareDialog";
import { TopBar } from "@/components/dashboard/TopBar";
import { useWorkspaceDashboard } from "@/hooks/useWorkspaceDashboard";
import { fetchNextQueue, subscribeNextQueueSSE } from "@/lib/workspaceApiClient";
import { spaceToMarkdown, copyMarkdownToClipboard } from "@/lib/markdownExport";
import { findDuplicateGroups, countRedundantDuplicates } from "@/lib/duplicateCleaner";
import { DuplicateCleanerDialog } from "@/components/dashboard/DuplicateCleanerDialog";
import type { AppPage } from "@/types/lmn";

const getPage = (pathname: string, search: string = ""): AppPage => {
  const query = new URLSearchParams(search).get("view");
  if (query === "settings" || pathname.startsWith("/settings")) return "settings";
  if (query === "trash" || pathname.startsWith("/trash")) return "trash";
  if (query === "activity" || pathname.startsWith("/activity")) return "activity";
  if (query === "share" || pathname.startsWith("/share")) return "share";
  if (query === "next" || pathname.startsWith("/next")) return "next";
  return "dashboard";
};

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeTargetType =
    params.targetType ??
    (pathParts[0] === "share" && pathParts.length >= 3 ? pathParts[1] : undefined);
  const routeSlug =
    params.slug ??
    (pathParts[0] === "share" && pathParts.length >= 3 ? pathParts[2] : undefined);
  const routeShareId =
    params.shareId ??
    (pathParts[0] === "share" && pathParts.length === 2 ? pathParts[1] : undefined);

  const {
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
    updateItemNote,
    softDeleteItem,
    restoreItem,
    openMoveItem,
    submitMoveItem,
    handleDropItem,
    confirmDelete,
    jumpToCollection,
    handleResetData,
    handleExportWorkspaceJson,
    isShareDialogOpen,
    setIsShareDialogOpen,
    shareTarget,
    openShareWorkspace,
    openShareSpace,
    openShareCollection,
    openShareGroup,
    openShareItem,
    handleSaveShare,
    handleDisableShare,
    handleCopyItemLink,
    handleCopyItemShareLink,
    openShareDialog,
    cleanDuplicates,
  } = useWorkspaceDashboard();

  const [isDuplicateCleanerOpen, setIsDuplicateCleanerOpen] = useState(false);
  const duplicateGroups = useMemo(() => findDuplicateGroups(data?.collections ?? []), [data?.collections]);
  const duplicateCount = useMemo(() => countRedundantDuplicates(duplicateGroups), [duplicateGroups]);

  const activePage = getPage(location.pathname, location.search);
  const [nextCount, setNextCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const updateCount = () => {
      fetchNextQueue({ includeDone: false })
        .then((res) => {
          if (isMounted && res) setNextCount(res.open_count || 0);
        })
        .catch(() => {});
    };

    updateCount();
    const unsubscribe = subscribeNextQueueSSE(() => {
      updateCount();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen(true);
      }

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("[data-dashboard-search]")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsCommandOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Unified Obsidian Navigation Sidebar */}
        <div className="hidden md:flex shrink-0 border-r border-border/80 bg-card/40 backdrop-blur-md shadow-obsidian">
          <WorkspaceRail
            organizations={data.organizations}
            activeOrgId={activeOrganization.id}
            onSelect={(organizationId) => {
              setActiveOrganizationId(organizationId);
              navigate("/web/app");
            }}
            onCreateWorkspace={openCreateWorkspace}
            className="flex border-r border-border/40 bg-card/30"
          />

          <SpaceSidebar
            activePage={activePage}
            activeOrganization={activeOrganization}
            organizations={data.organizations}
            spaces={organizationSpaces}
            activeSpaceId={activeSpace.id}
            deletedCount={deletedItems.length}
            nextCount={nextCount}
            onSelectSpace={(spaceId) => {
              setActiveSpaceId(spaceId);
              navigate(`/web/app?spaceId=${spaceId}`);
            }}
            onSelectOrganization={(orgId) => {
              setActiveOrganizationId(orgId);
              navigate("/web/app");
            }}
            onCreateWorkspace={openCreateWorkspace}
            onEditWorkspace={openEditWorkspace}
            onDeleteWorkspace={requestDeleteWorkspace}
            onCreateSpace={openCreateSpace}
            onEditSpace={openEditSpace}
            onDeleteSpace={requestDeleteSpace}
            shareSettings={data.shareSettings}
            onShareWorkspace={() => openShareWorkspace(activeOrganization.id)}
            onShareSpace={(spaceId) => openShareSpace(spaceId)}
            className="hidden lg:flex border-r-0 bg-transparent"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar
            activeSpace={activeSpace}
            itemCount={activeSpaceItemCount}
            query={query}
            onQueryChange={setQuery}
            onCreateCollection={openCreateCollection}
            onCreateItem={openCreateItem}
            onOpenCommand={() => setIsCommandOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
            onExportMarkdown={() => {
              if (!activeSpace || !collectionsForActiveSpace) return;
              const md = spaceToMarkdown(activeSpace, collectionsForActiveSpace);
              copyMarkdownToClipboard(md, activeSpaceItemCount, "space links");
            }}
            duplicateCount={duplicateCount}
            onOpenDuplicateCleaner={() => setIsDuplicateCleanerOpen(true)}
          />

          {/* Web Fallback Notice */}
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between text-muted-foreground gap-2">
            <span className="flex items-center gap-1.5 text-foreground font-medium text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Web Fallback View &bull; The LetsMarkNow browser extension is the primary daily app.
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <Link to="/web/download" className="text-primary hover:underline font-semibold flex items-center gap-1">
                <Chrome className="h-3 w-3" /> Add to Chrome
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <Link to="/" className="text-foreground hover:underline">
                Open Extension Workspace
              </Link>
            </div>
          </div>

          {activePage === "settings" ? (
            <SettingsPage
              activeOrganization={activeOrganization}
              organizations={data.organizations}
              spaces={organizationSpaces}
              collections={collectionsForActiveSpace}
              shareSettings={data.shareSettings}
              allActiveItems={allActiveItems}
              activeItems={activeItems}
              onUpdateWorkspace={(name, initials, plan) => {
                setWorkspaceForm({ name, initials, plan });
                // Also update directly
                openEditWorkspace(activeOrganization.id);
              }}
              onDeleteWorkspace={requestDeleteWorkspace}
              onResetData={handleResetData}
              onExportData={handleExportWorkspaceJson}
              onDisableShare={handleDisableShare}
              onOpenShareDialog={openShareDialog}
            />
          ) : activePage === "next" ? (
            <NextQueueView />
          ) : activePage === "trash" ? (
            <TrashPage items={deletedItems} onRestore={restoreItem} />
          ) : activePage === "activity" ? (
            <ActivityPage collections={data.collections} />
          ) : activePage === "share" ? (
            <PublicSharePage
              organization={activeOrganization}
              collections={collectionsForActiveSpace}
              data={data}
              targetType={routeTargetType}
              slug={routeSlug}
              shareId={routeShareId}
              onNavigateDashboard={() => navigate("/web/app")}
            />
          ) : (
            <DashboardBoard
              activeSpace={activeSpace}
              collections={spaceCollections}
              viewMode={viewMode}
              activeFilter={activeFilter}
              hasSearchQuery={query.trim().length > 0}
              shareSettings={data.shareSettings}
              onClearFilters={() => {
                setActiveFilter("all");
                setQuery("");
              }}
              onViewModeChange={setViewMode}
              onFilterChange={setActiveFilter}
              onToggleStar={toggleStar}
              onDuplicateCollection={duplicateCollection}
              onEditCollection={openEditCollection}
              onDeleteCollection={requestDeleteCollection}
              onShareCollection={openShareCollection}
              onAddGroup={openCreateGroup}
              onEditGroup={openEditGroup}
              onDeleteGroup={requestDeleteGroup}
              onShareGroup={openShareGroup}
              onEditItem={openEditItem}
              onUpdateItemNote={updateItemNote}
              onDuplicateItem={duplicateItem}
              onDeleteItem={softDeleteItem}
              onMoveItem={openMoveItem}
              onShareItem={openShareItem}
              onCopyItemLink={handleCopyItemLink}
              onCopyItemShareLink={handleCopyItemShareLink}
              onDropItem={handleDropItem}
              onCreateCollection={openCreateCollection}
              onCreateItem={openCreateItem}
              onRestoreDemoData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileSidebarDrawer
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        organizations={data.organizations}
        activeOrganization={activeOrganization}
        spaces={organizationSpaces}
        activeSpaceId={activeSpace.id}
        deletedCount={deletedItems.length}
        nextCount={nextCount}
        activePage={activePage}
        onSelectOrganization={(orgId) => {
          setActiveOrganizationId(orgId);
          navigate("/web/app");
        }}
        onCreateWorkspace={openCreateWorkspace}
        onEditWorkspace={openEditWorkspace}
        onDeleteWorkspace={requestDeleteWorkspace}
        onSelectSpace={(spaceId) => {
          setActiveSpaceId(spaceId);
          navigate(`/web/app?spaceId=${spaceId}`);
        }}
        onCreateSpace={openCreateSpace}
        onEditSpace={openEditSpace}
        onDeleteSpace={requestDeleteSpace}
        shareSettings={data.shareSettings}
        onShareWorkspace={() => openShareWorkspace(activeOrganization.id)}
        onShareSpace={(spaceId) => openShareSpace(spaceId)}
      />

      {/* Dialogs */}
      <WorkspaceDialog
        isOpen={workspaceMode !== null}
        mode={workspaceMode ?? "create"}
        value={workspaceForm}
        onValueChange={setWorkspaceForm}
        onOpenChange={(isOpen) => !isOpen && setWorkspaceMode(null)}
        onSubmit={saveWorkspace}
      />

      <SpaceDialog
        isOpen={spaceMode !== null}
        mode={spaceMode ?? "create"}
        value={spaceForm}
        onValueChange={setSpaceForm}
        onOpenChange={(isOpen) => !isOpen && setSpaceMode(null)}
        onSubmit={saveSpace}
      />

      <CollectionDialog
        isOpen={collectionMode !== null}
        mode={collectionMode ?? "create"}
        value={collectionForm}
        onValueChange={setCollectionForm}
        onOpenChange={(isOpen) => !isOpen && setCollectionMode(null)}
        onSubmit={saveCollection}
      />

      <GroupDialog
        isOpen={groupMode !== null}
        mode={groupMode ?? "create"}
        value={groupForm}
        onValueChange={setGroupForm}
        onOpenChange={(isOpen) => !isOpen && setGroupMode(null)}
        onSubmit={saveGroup}
      />

      <ItemDialog
        isOpen={itemMode !== null}
        mode={itemMode ?? "create"}
        value={itemForm}
        collections={collectionsForActiveSpace}
        isDisabled={itemMode === "create" && !collectionsForActiveSpace.length}
        onValueChange={setItemForm}
        onOpenChange={(isOpen) => !isOpen && setItemMode(null)}
        onSubmit={saveItem}
      />

      <MoveItemDialog
        isOpen={moveTarget !== null}
        collections={collectionsForActiveSpace}
        selectedTarget={selectedMoveDestination}
        onTargetChange={setSelectedMoveDestination}
        onOpenChange={(isOpen) => !isOpen && setMoveTarget(null)}
        onSubmit={submitMoveItem}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete ${deleteTarget?.type ?? "item"}?`}
        description={
          deleteTarget?.name
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action removes the selected record from local state.`
            : "This action removes the selected record from local state."
        }
        actionLabel="Delete"
        onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        spaces={organizationSpaces}
        collections={collectionsForActiveSpace}
        latestDeletedItem={deletedItems[0]}
        onOpenChange={setIsCommandOpen}
        onCreateWorkspace={openCreateWorkspace}
        onCreateSpace={openCreateSpace}
        onCreateCollection={openCreateCollection}
        onCreateItem={openCreateItem}
        onRestoreLatestItem={() => deletedItems[0] && restoreItem(deletedItems[0].id)}
        onJumpSpace={(spaceId) => {
          setActiveSpaceId(spaceId);
          navigate(`/spaces/${spaceId}`);
        }}
        onJumpCollection={jumpToCollection}
        onOpenItem={(url) => window.open(url, "_blank", "noopener,noreferrer")}
        onNavigate={navigate}
        onShareWorkspace={() => openShareWorkspace(activeOrganization.id)}
        onShareSpace={() => openShareSpace(activeSpace.id)}
        onClearFilters={() => {
          setActiveFilter("all");
          setQuery("");
        }}
        onExportMarkdown={() => {
          if (!activeSpace || !collectionsForActiveSpace) return;
          const md = spaceToMarkdown(activeSpace, collectionsForActiveSpace);
          copyMarkdownToClipboard(md, activeSpaceItemCount, "space links");
        }}
        duplicateCount={duplicateCount}
        onOpenDuplicateCleaner={() => setIsDuplicateCleanerOpen(true)}
      />

      <DuplicateCleanerDialog
        isOpen={isDuplicateCleanerOpen}
        onOpenChange={setIsDuplicateCleanerOpen}
        duplicateGroups={duplicateGroups}
        onCleanDuplicates={() => {
          cleanDuplicates(duplicateGroups);
          setIsDuplicateCleanerOpen(false);
        }}
      />

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
    </div>
  );
}
