import { useState } from "react";
import {
  ArchiveRestore,
  Boxes,
  Check,
  Circle,
  Clock3,
  Columns3,
  Copy,
  ExternalLink,
  FilterX,
  Grid3X3,
  GripVertical,
  Layers,
  Link2,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Collection, Group, SavedItem, ShareSettings, Space, ViewMode } from "@/types/lmn";
import { colorDotClasses, colorLabelClasses, getHost } from "./helpers";
import { Favicon } from "./Favicon";
import { normalizeUrl } from "@/extension/lib/tabCapture";

interface DashboardBoardProps {
  activeSpace: Space;
  collections: Collection[];
  viewMode: ViewMode;
  activeFilter: "all" | "starred" | "recent";
  hasSearchQuery?: boolean;
  shareSettings?: ShareSettings[];
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  onClearFilters?: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterChange: (filter: "all" | "starred" | "recent") => void;
  onToggleStar: (collectionId: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onEditCollection: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onShareCollection?: (collectionId: string) => void;
  onAddGroup: (collectionId: string) => void;
  onEditGroup: (collectionId: string, groupId: string) => void;
  onDeleteGroup: (collectionId: string, groupId: string) => void;
  onShareGroup?: (collectionId: string, groupId: string) => void;
  onEditItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDuplicateItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDeleteItem: (collectionId: string, groupId: string, itemId: string) => void;
  onMoveItem: (collectionId: string, groupId: string, itemId: string) => void;
  onShareItem?: (collectionId: string, groupId: string, itemId: string) => void;
  onCopyItemLink?: (url: string) => void;
  onCopyItemShareLink?: (itemId: string) => void;
  onDropItem: (payload: string, targetCollectionId: string, targetGroupId: string) => void;
  onOpenAllUrls?: (urls: string[], mode: "tabs" | "window" | "replace") => void;
  onCreateCollection: () => void;
  onCreateItem: (collectionId?: string, groupId?: string) => void;
  onRestoreDemoData?: () => void;
}

export function DashboardBoard({
  activeSpace,
  collections,
  viewMode,
  activeFilter,
  hasSearchQuery,
  shareSettings,
  openUrlSet,
  duplicateUrlCounts,
  onClearFilters,
  onViewModeChange,
  onFilterChange,
  onToggleStar,
  onDuplicateCollection,
  onEditCollection,
  onDeleteCollection,
  onShareCollection,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onShareGroup,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onMoveItem,
  onShareItem,
  onCopyItemLink,
  onCopyItemShareLink,
  onDropItem,
  onOpenAllUrls,
  onCreateCollection,
  onCreateItem,
  onRestoreDemoData,
}: DashboardBoardProps) {
  const isFiltered = activeFilter !== "all" || hasSearchQuery;

  return (
    <section className="min-h-0 flex-1 overflow-auto">
      <div className="border-b border-border bg-card/30 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              Space dashboard
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{activeSpace.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {activeSpace.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-border/70 bg-card/60 p-0.5 shadow-2xs">
              <FilterButton
                label="All"
                isActive={activeFilter === "all"}
                onClick={() => onFilterChange("all")}
              />
              <FilterButton
                label="Starred"
                icon={Star}
                isActive={activeFilter === "starred"}
                onClick={() => onFilterChange("starred")}
              />
              <FilterButton
                label="Recent"
                icon={Clock3}
                isActive={activeFilter === "recent"}
                onClick={() => onFilterChange("recent")}
              />
            </div>
            <div className="flex rounded-lg border border-border/70 bg-card/60 p-0.5 shadow-2xs">
              <ViewButton icon={List} mode="list" activeMode={viewMode} onClick={onViewModeChange} />
              <ViewButton
                icon={Columns3}
                mode="compact"
                activeMode={viewMode}
                onClick={onViewModeChange}
              />
              <ViewButton icon={Grid3X3} mode="grid" activeMode={viewMode} onClick={onViewModeChange} />
            </div>
          </div>
        </div>
      </div>

      {collections.length ? (
        <div
          className={cn(
            "grid gap-5 p-6",
            viewMode === "grid" ? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"
          )}
        >
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              viewMode={viewMode}
              shareSettings={shareSettings}
              openUrlSet={openUrlSet}
              duplicateUrlCounts={duplicateUrlCounts}
              onToggleStar={onToggleStar}
              onDuplicateCollection={onDuplicateCollection}
              onEditCollection={onEditCollection}
              onDeleteCollection={onDeleteCollection}
              onShareCollection={onShareCollection}
              onAddGroup={onAddGroup}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              onShareGroup={onShareGroup}
              onEditItem={onEditItem}
              onDuplicateItem={onDuplicateItem}
              onDeleteItem={onDeleteItem}
              onMoveItem={onMoveItem}
              onShareItem={onShareItem}
              onCopyItemLink={onCopyItemLink}
              onCopyItemShareLink={onCopyItemShareLink}
              onDropItem={onDropItem}
              onOpenAllUrls={onOpenAllUrls}
              onCreateItem={onCreateItem}
            />
          ))}
        </div>
      ) : isFiltered ? (
        <EmptyFilteredDashboard onClear={onClearFilters} />
      ) : (
        <EmptyDashboard
          onCreateCollection={onCreateCollection}
          onCreateItem={onCreateItem}
          onRestoreDemoData={onRestoreDemoData}
        />
      )}
    </section>
  );
}

function FilterButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: typeof Star;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
        isActive
          ? "bg-background text-foreground shadow-2xs font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function ViewButton({
  icon: Icon,
  mode,
  activeMode,
  onClick,
}: {
  icon: typeof List;
  mode: ViewMode;
  activeMode: ViewMode;
  onClick: (mode: ViewMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition",
        activeMode === mode
          ? "bg-primary text-primary-foreground shadow-xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      title={`${mode} view`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function CollectionCard({
  collection,
  viewMode,
  shareSettings,
  openUrlSet,
  duplicateUrlCounts,
  onToggleStar,
  onDuplicateCollection,
  onEditCollection,
  onDeleteCollection,
  onShareCollection,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onShareGroup,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onMoveItem,
  onShareItem,
  onCopyItemLink,
  onCopyItemShareLink,
  onDropItem,
  onOpenAllUrls,
  onCreateItem,
}: {
  collection: Collection;
  viewMode: ViewMode;
  shareSettings?: ShareSettings[];
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  onToggleStar: (collectionId: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onEditCollection: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onShareCollection?: (collectionId: string) => void;
  onAddGroup: (collectionId: string) => void;
  onEditGroup: (collectionId: string, groupId: string) => void;
  onDeleteGroup: (collectionId: string, groupId: string) => void;
  onShareGroup?: (collectionId: string, groupId: string) => void;
  onEditItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDuplicateItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDeleteItem: (collectionId: string, groupId: string, itemId: string) => void;
  onMoveItem: (collectionId: string, groupId: string, itemId: string) => void;
  onShareItem?: (collectionId: string, groupId: string, itemId: string) => void;
  onCopyItemLink?: (url: string) => void;
  onCopyItemShareLink?: (itemId: string, itemTitle: string) => void;
  onDropItem: (payload: string, targetCollectionId: string, targetGroupId: string) => void;
  onOpenAllUrls?: (urls: string[], mode: "tabs" | "window" | "replace") => void;
  onCreateItem: (collectionId?: string, groupId?: string) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCardDragOver, setIsCardDragOver] = useState(false);

  const collectionShare = shareSettings?.find(
    (s) => s.targetType === "collection" && s.targetId === collection.id
  );

  const visibleGroups = collection.groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.isDeleted),
  }));
  const itemCount = visibleGroups.reduce((total, group) => total + group.items.length, 0);
  const allCollectionUrls = visibleGroups.flatMap((g) =>
    g.items.map((i) => i.url).filter(Boolean)
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-border/70 bg-card/40 backdrop-blur-xs transition",
        isCardDragOver && "ring-2 ring-primary/40 border-primary/60 bg-primary/5"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsCardDragOver(true);
      }}
      onDragLeave={() => setIsCardDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsCardDragOver(false);
        const json = event.dataTransfer.getData("application/json");
        const payload = json || event.dataTransfer.getData("text/plain");
        const firstGroup = collection.groups[0];
        if (payload && firstGroup) {
          onDropItem(payload, collection.id, firstGroup.id);
        }
      }}
    >
      <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", colorDotClasses[collection.color])} />
              <span className="capitalize">{collection.color !== "none" ? collection.color : "Default"}</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">{itemCount} items</span>
            {collectionShare && collectionShare.visibility !== "private" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  collectionShare.visibility === "public"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-sky-500/15 text-sky-400"
                )}
                title={`Collection is ${collectionShare.visibility}`}
              >
                <Share2 className="h-2.5 w-2.5" />
                {collectionShare.visibility}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold">{collection.name}</h3>
          {collection.note && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {collection.note}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
          <Button
            variant={collection.isStarred ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleStar(collection.id)}
            title="Star collection"
          >
            <Star className={cn("h-4 w-4", collection.isStarred && "fill-current")} />
          </Button>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Collection actions"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onOpenAllUrls && allCollectionUrls.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(allCollectionUrls, "tabs");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Open all items in new tabs"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open all in new tabs ({allCollectionUrls.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(allCollectionUrls, "window");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Open all items in new window"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Open in new window
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(allCollectionUrls, "replace");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Replace current window with items"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Replace current window
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={() => {
                  onAddGroup(collection.id);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
                title="Add group"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add group
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onEditCollection(collection.id);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
                title="Edit collection"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit collection
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onDuplicateCollection(collection.id);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
                title="Duplicate collection"
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate collection
              </DropdownMenuItem>
              {onShareCollection && (
                <DropdownMenuItem
                  onClick={() => {
                    onShareCollection(collection.id);
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Share collection"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share collection
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDeleteCollection(collection.id);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
                title="Delete collection"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-5 p-4",
          viewMode === "grid" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
        )}
      >
        {visibleGroups.map((group) => (
          <GroupPanel
            key={group.id}
            collectionId={collection.id}
            group={group}
            viewMode={viewMode}
            isOnlyGroup={visibleGroups.length <= 1}
            shareSettings={shareSettings}
            openUrlSet={openUrlSet}
            duplicateUrlCounts={duplicateUrlCounts}
            onEditGroup={onEditGroup}
            onDeleteGroup={onDeleteGroup}
            onShareGroup={onShareGroup}
            onEditItem={onEditItem}
            onDuplicateItem={onDuplicateItem}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            onShareItem={onShareItem}
            onCopyItemLink={onCopyItemLink}
            onCopyItemShareLink={onCopyItemShareLink}
            onDropItem={onDropItem}
            onOpenAllUrls={onOpenAllUrls}
            onCreateItem={onCreateItem}
          />
        ))}
      </div>
    </article>
  );
}

function GroupPanel({
  collectionId,
  group,
  viewMode,
  isOnlyGroup,
  shareSettings,
  openUrlSet,
  duplicateUrlCounts,
  onEditGroup,
  onDeleteGroup,
  onShareGroup,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onMoveItem,
  onShareItem,
  onCopyItemLink,
  onCopyItemShareLink,
  onDropItem,
  onOpenAllUrls,
  onCreateItem,
}: {
  collectionId: string;
  group: Group;
  viewMode: ViewMode;
  isOnlyGroup: boolean;
  shareSettings?: ShareSettings[];
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  onEditGroup: (collectionId: string, groupId: string) => void;
  onDeleteGroup: (collectionId: string, groupId: string) => void;
  onShareGroup?: (collectionId: string, groupId: string) => void;
  onEditItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDuplicateItem: (collectionId: string, groupId: string, itemId: string) => void;
  onDeleteItem: (collectionId: string, groupId: string, itemId: string) => void;
  onMoveItem: (collectionId: string, groupId: string, itemId: string) => void;
  onShareItem?: (collectionId: string, groupId: string, itemId: string) => void;
  onCopyItemLink?: (url: string) => void;
  onCopyItemShareLink?: (itemId: string, itemTitle: string) => void;
  onDropItem: (payload: string, targetCollectionId: string, targetGroupId: string) => void;
  onOpenAllUrls?: (urls: string[], mode: "tabs" | "window" | "replace") => void;
  onCreateItem: (collectionId?: string, groupId?: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const groupShare = shareSettings?.find(
    (s) => s.targetType === "group" && s.targetId === group.id
  );

  const validGroupUrls = group.items
    .filter((item) => !item.isDeleted && item.url)
    .map((item) => item.url);

  return (
    <section
      className={cn(
        "rounded-xl transition-all",
        isDragOver
          ? "border-2 border-dashed border-primary/60 bg-primary/5 p-2 ring-2 ring-primary/20"
          : "bg-transparent"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        const json = event.dataTransfer.getData("application/json");
        const payload = json || event.dataTransfer.getData("text/plain");
        if (payload) {
          onDropItem(payload, collectionId, group.id);
        }
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
          <h4 className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.name}
          </h4>
          <span className="text-[11px] font-mono text-muted-foreground/60">
            ({group.items.length})
          </span>
          {groupShare && groupShare.visibility !== "private" && (
            <span
              className={cn(
                "rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase",
                groupShare.visibility === "public"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-sky-500/15 text-sky-400"
              )}
              title={`Group is ${groupShare.visibility}`}
            >
              {groupShare.visibility}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title={`Add item to ${group.name}`}
            onClick={() => onCreateItem(collectionId, group.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Group actions"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onOpenAllUrls && validGroupUrls.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(validGroupUrls, "tabs");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Open all items in new tabs"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open all in tabs ({validGroupUrls.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(validGroupUrls, "window");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Open in new window"
                  >
                    <Layers className="mr-2 h-3.5 w-3.5" />
                    Open in new window
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onOpenAllUrls(validGroupUrls, "replace");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Replace current window"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Replace current window
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={() => {
                  onEditGroup(collectionId, group.id);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
                title="Edit group"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit group
              </DropdownMenuItem>
              {onShareGroup && (
                <DropdownMenuItem
                  onClick={() => {
                    onShareGroup(collectionId, group.id);
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Share group"
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  Share group
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDeleteGroup(collectionId, group.id);
                  setIsMenuOpen(false);
                }}
                disabled={isOnlyGroup}
                className="cursor-pointer text-destructive focus:text-destructive"
                title="Delete group"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {group.items.length ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                openUrlSet={openUrlSet}
                duplicateUrlCounts={duplicateUrlCounts}
                onEdit={() => onEditItem(collectionId, group.id, item.id)}
                onDuplicate={() => onDuplicateItem(collectionId, group.id, item.id)}
                onDelete={() => onDeleteItem(collectionId, group.id, item.id)}
                onMove={() => onMoveItem(collectionId, group.id, item.id)}
                onShare={
                  onShareItem ? () => onShareItem(collectionId, group.id, item.id) : undefined
                }
                onCopyItemLink={onCopyItemLink}
                onCopyItemShareLink={onCopyItemShareLink}
                onDragStart={(payload) => `${collectionId}:${group.id}:${payload}`}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/50 bg-background/50 overflow-hidden shadow-2xs">
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                openUrlSet={openUrlSet}
                duplicateUrlCounts={duplicateUrlCounts}
                onEdit={() => onEditItem(collectionId, group.id, item.id)}
                onDuplicate={() => onDuplicateItem(collectionId, group.id, item.id)}
                onDelete={() => onDeleteItem(collectionId, group.id, item.id)}
                onMove={() => onMoveItem(collectionId, group.id, item.id)}
                onShare={
                  onShareItem ? () => onShareItem(collectionId, group.id, item.id) : undefined
                }
                onCopyItemLink={onCopyItemLink}
                onCopyItemShareLink={onCopyItemShareLink}
                onDragStart={(payload) => `${collectionId}:${group.id}:${payload}`}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-6 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <Link2 className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-foreground">No saved links in {group.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Drop items here or save a link.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-7 text-xs"
            onClick={() => onCreateItem(collectionId, group.id)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add item
          </Button>
        </div>
      )}
    </section>
  );
}

function ItemRow({
  item,
  viewMode,
  openUrlSet,
  duplicateUrlCounts,
  onEdit,
  onDuplicate,
  onDelete,
  onMove,
  onShare,
  onCopyItemLink,
  onCopyItemShareLink,
  onDragStart,
}: {
  item: SavedItem;
  viewMode: ViewMode;
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: () => void;
  onShare?: () => void;
  onCopyItemLink?: (url: string) => void;
  onCopyItemShareLink?: (itemId: string) => void;
  onDragStart: (itemId: string) => string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isCompact = viewMode === "compact";
  const isGrid = viewMode === "grid";

  const normUrl = normalizeUrl(item.url);
  const isOpenNow = Boolean(openUrlSet && normUrl && openUrlSet.has(normUrl));
  const isDuplicate = Boolean(
    duplicateUrlCounts && normUrl && (duplicateUrlCounts.get(normUrl) ?? 0) > 1
  );

  if (isGrid) {
    return (
      <div
        className="group relative flex flex-col justify-between rounded-lg border border-border/60 bg-card/60 p-3.5 transition hover:border-primary/50 hover:bg-card hover:shadow-xs"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", onDragStart(item.id));
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className="mt-0.5 flex h-4 w-4 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center text-muted-foreground/40 transition hover:text-foreground opacity-40 group-hover:opacity-100"
                title="Drag to reorder or move"
              >
                <GripVertical className="h-3 w-3" />
              </div>
              <Favicon url={item.url} size="md" className="mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="truncate text-sm font-semibold text-foreground">{item.title}</h5>
                  {isOpenNow && (
                    <span
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 shrink-0"
                      title="This tab is currently open in your browser"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Open now
                    </span>
                  )}
                  {isDuplicate && (
                    <span
                      className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 shrink-0"
                      title={`This link is saved ${duplicateUrlCounts?.get(normUrl)} times across your workspace`}
                    >
                      Duplicate
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{getHost(item.url)}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                title="Open item"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Item actions"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      window.open(item.url, "_blank", "noopener,noreferrer");
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Open original URL"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open original URL
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (onCopyItemLink) {
                        onCopyItemLink(item.url);
                      } else {
                        navigator.clipboard?.writeText(item.url);
                      }
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Copy URL"
                  >
                    <Link2 className="mr-2 h-3.5 w-3.5" />
                    Copy URL
                  </DropdownMenuItem>
                  {onCopyItemShareLink && (
                    <DropdownMenuItem
                      onClick={() => {
                        onCopyItemShareLink(item.id);
                        setIsMenuOpen(false);
                      }}
                      className="cursor-pointer"
                      title="Copy share link"
                    >
                      <Share2 className="mr-2 h-3.5 w-3.5" />
                      Copy share link
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem
                      onClick={() => {
                        onShare();
                        setIsMenuOpen(false);
                      }}
                      className="cursor-pointer"
                      title="Share item"
                    >
                      <Share2 className="mr-2 h-3.5 w-3.5" />
                      Share item
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit();
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Edit item"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit item
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onDuplicate();
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Duplicate item"
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate item
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onMove();
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Move item"
                  >
                    <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                    Move item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onDelete();
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    title="Move to trash"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Move to trash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {item.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/30 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", colorDotClasses[item.color])} />
            <span className="capitalize">{item.color}</span>
          </span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
            >
              #{tag}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground/70">{item.addedAt}</span>
        </div>
      </div>
    );
  }

  // List or Compact view inside divided list container:
  return (
    <div
      className={cn(
        "group relative flex items-start gap-2.5 transition-colors hover:bg-muted/40",
        isCompact ? "p-2.5 items-center" : "p-3.5"
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", onDragStart(item.id));
      }}
    >
      <div
        className={cn(
          "flex shrink-0 cursor-grab active:cursor-grabbing items-center justify-center text-muted-foreground/30 transition hover:text-foreground opacity-30 group-hover:opacity-100",
          isCompact ? "h-4 w-4" : "mt-0.5 h-5 w-4"
        )}
        title="Drag to reorder or move"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Favicon
              url={item.url}
              size={isCompact ? "sm" : "md"}
              className={isCompact ? "" : "mt-0.5"}
            />
            <div className="min-w-0 flex-1">
              <div className={cn("flex items-baseline gap-2 flex-wrap")}>
                <h5 className="truncate text-sm font-medium text-foreground">{item.title}</h5>
                {isOpenNow && (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 shrink-0"
                    title="This tab is currently open in your browser"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Open now
                  </span>
                )}
                {isDuplicate && (
                  <span
                    className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 shrink-0"
                    title={`This link is saved ${duplicateUrlCounts?.get(normUrl)} times across your workspace`}
                  >
                    Duplicate
                  </span>
                )}
                <p className="truncate text-xs text-muted-foreground/80 font-mono">{getHost(item.url)}</p>
              </div>
              {!isCompact && item.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100 transition">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
              title="Open item"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Item actions"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    window.open(item.url, "_blank", "noopener,noreferrer");
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Open original URL"
                >
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Open original URL
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (onCopyItemLink) {
                      onCopyItemLink(item.url);
                    } else {
                      navigator.clipboard?.writeText(item.url);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Copy URL"
                >
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Copy URL
                </DropdownMenuItem>
                {onCopyItemShareLink && (
                  <DropdownMenuItem
                    onClick={() => {
                      onCopyItemShareLink(item.id);
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Copy share link"
                  >
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    Copy share link
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem
                    onClick={() => {
                      onShare();
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer"
                    title="Share item"
                  >
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    Share item
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onEdit();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Edit item"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Duplicate item"
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Duplicate item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onMove();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title="Move item"
                >
                  <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                  Move item
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onDelete();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  title="Move to trash"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(!isCompact || item.tags.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", colorDotClasses[item.color])} />
              <span className="capitalize">{item.color}</span>
            </span>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground/70">{item.addedAt}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDashboard({
  onCreateCollection,
  onCreateItem,
  onRestoreDemoData,
}: {
  onCreateCollection: () => void;
  onCreateItem: (collectionId?: string, groupId?: string) => void;
  onRestoreDemoData?: () => void;
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Start this Space</h2>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          Create your first collection, add links, or restore mock demo data to explore the full
          dashboard interactions.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={onCreateCollection}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create collection
          </Button>
          <Button variant="outline" onClick={onCreateItem}>
            <Link2 className="mr-1.5 h-4 w-4" />
            Add item
          </Button>
          {onRestoreDemoData && (
            <Button variant="ghost" onClick={onRestoreDemoData} title="Restore demo data">
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset demo data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyFilteredDashboard({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex min-h-[440px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FilterX className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">No matching collections or items</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          None of your collections or saved links match the current query or active filter.
        </p>
        {onClear && (
          <Button variant="outline" className="mt-5" onClick={onClear}>
            Clear search & filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function TrashPage({
  items,
  onRestore,
}: {
  items: Array<SavedItem & { collectionName: string; groupName: string }>;
  onRestore: (itemId: string) => void;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-auto p-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recoverable saved links
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Trash</h1>
      </div>
      {items.length ? (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Favicon url={item.url} size="md" />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.collectionName} / {item.groupName} &bull; {getHost(item.url)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onRestore(item.id)}>
                <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Check className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
          <h2 className="text-base font-semibold">Trash is empty</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Soft-deleted items will appear here and can be restored anytime.
          </p>
        </div>
      )}
    </section>
  );
}
