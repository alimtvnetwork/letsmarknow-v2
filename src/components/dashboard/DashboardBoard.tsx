import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  Boxes,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  Columns3,
  Copy,
  ExternalLink,
  FilterX,
  Globe,
  Grid3X3,
  GripVertical,
  Info,
  Layers,
  Link2,
  List,
  Minus,
  MoreHorizontal,
  Network,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";

import { toast } from "sonner";
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
import { colorDotClasses, colorLabelClasses, getDomainBadgeStyle, getHost } from "./helpers";
import { Favicon } from "./Favicon";
import { normalizeUrl } from "@/extension/lib/tabCapture";
import { MindmapView } from "./MindmapView";

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
  const [cardDensity, setCardDensity] = useState<"compact" | "normal" | "comfortable">("normal");
  const [sortMode, setSortMode] = useState<"custom" | "name" | "items" | "recent">("custom");

  const totalItemCount = useMemo(() => {
    return collections.reduce((acc, col) => {
      return (
        acc +
        col.groups.reduce((gAcc, grp) => {
          return gAcc + grp.items.filter((i) => !i.isDeleted).length;
        }, 0)
      );
    }, 0);
  }, [collections]);

  const sortedCollections = useMemo(() => {
    const list = [...collections];
    if (sortMode === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === "items") {
      return list.sort((a, b) => {
        const aCount = a.groups.reduce((acc, g) => acc + g.items.filter((i) => !i.isDeleted).length, 0);
        const bCount = b.groups.reduce((acc, g) => acc + g.items.filter((i) => !i.isDeleted).length, 0);
        return bCount - aCount;
      });
    }
    return list;
  }, [collections, sortMode]);

  const handleZoomOut = () => {
    if (cardDensity === "comfortable") setCardDensity("normal");
    else if (cardDensity === "normal") setCardDensity("compact");
  };

  const handleZoomIn = () => {
    if (cardDensity === "compact") setCardDensity("normal");
    else if (cardDensity === "normal") setCardDensity("comfortable");
  };

  // Today's Desk State
  const TODAYS_DESK_STORAGE_KEY = "lmn_todays_desk_pinned_ids_v1";

  const allActiveItems = useMemo(() => {
    return collections.flatMap((c) =>
      c.groups.flatMap((g) => g.items.filter((i) => !i.isDeleted))
    );
  }, [collections]);

  const [pinnedDeskIds, setPinnedDeskIds] = useState<string[]>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(TODAYS_DESK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [isDeskCollapsed, setIsDeskCollapsed] = useState(false);
  const [isDeskDragOver, setIsDeskDragOver] = useState(false);
  const [dragOverDeskItemId, setDragOverDeskItemId] = useState<string | null>(null);
  const [isDraggingDeskCard, setIsDraggingDeskCard] = useState(false);

  const deskItems = useMemo(() => {
    if (pinnedDeskIds.length > 0) {
      const itemMap = new Map(allActiveItems.map((i) => [i.id, i]));
      return pinnedDeskIds
        .map((id) => itemMap.get(id))
        .filter((i): i is SavedItem => Boolean(i));
    }
    return [];
  }, [allActiveItems, pinnedDeskIds]);

  const handleTogglePinDesk = (itemId: string) => {
    const isCurrentlyPinned = pinnedDeskIds.includes(itemId);
    let nextIds: string[];
    if (isCurrentlyPinned) {
      nextIds = pinnedDeskIds.filter((id) => id !== itemId);
      toast.info("Unpinned from Today's Desk");
    } else {
      nextIds = [itemId, ...pinnedDeskIds.filter((id) => id !== itemId)].slice(0, 8);
      toast.success("Pinned to Today's Desk");
    }
    setPinnedDeskIds(nextIds);
    try {
      localStorage.setItem(TODAYS_DESK_STORAGE_KEY, JSON.stringify(nextIds));
    } catch {}
  };

  const handleDeskDrop = (event: React.DragEvent, targetItemId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDeskDragOver(false);
    setDragOverDeskItemId(null);

    const jsonStr = event.dataTransfer.getData("application/json");
    let droppedType = "";
    let droppedId = "";
    let droppedTabUrl = "";
    let droppedTabTitle = "";

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "desk-item" && parsed.itemId) {
          droppedType = "desk-item";
          droppedId = parsed.itemId;
        } else if (parsed.type === "saved-item" && parsed.itemId) {
          droppedType = "saved-item";
          droppedId = parsed.itemId;
        } else if (parsed.type === "open-tab" && parsed.tab) {
          droppedType = "open-tab";
          droppedTabUrl = parsed.tab.url || "";
          droppedTabTitle = parsed.tab.title || "";
        }
      } catch {}
    }

    if (!droppedType) {
      const text = event.dataTransfer.getData("text/plain");
      if (text) {
        if (text.startsWith("desk:")) {
          droppedType = "desk-item";
          droppedId = text.replace("desk:", "");
        } else if (text.includes(":")) {
          const parts = text.split(":");
          droppedType = "saved-item";
          droppedId = parts[parts.length - 1];
        } else if (allActiveItems.some((i) => i.id === text)) {
          droppedType = "saved-item";
          droppedId = text;
        } else if (text.startsWith("http://") || text.startsWith("https://")) {
          droppedType = "open-tab";
          droppedTabUrl = text;
        }
      }
    }

    // 1. Reordering items within Today's Desk
    if (droppedType === "desk-item" && droppedId) {
      if (targetItemId && targetItemId !== droppedId) {
        const current = [...pinnedDeskIds];
        const sourceIdx = current.indexOf(droppedId);
        const targetIdx = current.indexOf(targetItemId);
        if (sourceIdx !== -1 && targetIdx !== -1) {
          current.splice(sourceIdx, 1);
          current.splice(targetIdx, 0, droppedId);
          setPinnedDeskIds(current);
          try {
            localStorage.setItem(TODAYS_DESK_STORAGE_KEY, JSON.stringify(current));
          } catch {}
          toast.success("Reordered Today's Desk");
        }
      }
      return;
    }

    // 2. Dragged item from collection cards
    if (droppedType === "saved-item" && droppedId) {
      const item = allActiveItems.find((i) => i.id === droppedId);
      if (!item) return;

      if (pinnedDeskIds.includes(droppedId)) {
        toast.info(`"${item.title}" is already on Today's Desk`);
        return;
      }

      let nextIds: string[];
      if (targetItemId && pinnedDeskIds.includes(targetItemId)) {
        const targetIdx = pinnedDeskIds.indexOf(targetItemId);
        nextIds = [...pinnedDeskIds];
        nextIds.splice(targetIdx, 0, droppedId);
      } else {
        nextIds = [droppedId, ...pinnedDeskIds].slice(0, 8);
      }

      setPinnedDeskIds(nextIds);
      try {
        localStorage.setItem(TODAYS_DESK_STORAGE_KEY, JSON.stringify(nextIds));
      } catch {}
      toast.success(`Pinned "${item.title}" to Today's Desk 📌`);
      return;
    }

    // 3. Dragged open tab from right dock
    if (droppedType === "open-tab" && droppedTabUrl) {
      const normTabUrl = normalizeUrl(droppedTabUrl);
      const matched = allActiveItems.find((i) => normalizeUrl(i.url) === normTabUrl);

      if (matched) {
        if (pinnedDeskIds.includes(matched.id)) {
          toast.info(`"${matched.title}" is already on Today's Desk`);
          return;
        }
        const nextIds = [matched.id, ...pinnedDeskIds].slice(0, 8);
        setPinnedDeskIds(nextIds);
        try {
          localStorage.setItem(TODAYS_DESK_STORAGE_KEY, JSON.stringify(nextIds));
        } catch {}
        toast.success(`Pinned "${matched.title}" to Today's Desk 📌`);
        return;
      }

      if (collections.length > 0 && collections[0].groups.length > 0 && onDropItem) {
        const targetCol = collections[0];
        const targetGrp = targetCol.groups[0];
        onDropItem(jsonStr || droppedTabUrl, targetCol.id, targetGrp.id);
        toast.success(`Saved and pinned "${droppedTabTitle || "tab"}" to Today's Desk 📌`);
      }
    }
  };

  const handleLaunchDesk = () => {
    const urls = deskItems.map((i) => i.url).filter(Boolean);
    if (!urls.length) return;
    if (onOpenAllUrls) {
      onOpenAllUrls(urls, "tabs");
    } else {
      urls.forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
    }
    toast.success(`Launched ${urls.length} tabs from Today's Desk 🚀`);
  };

  return (
    <section className="min-h-0 flex-1 overflow-auto bg-background/50">
      {/* 1. Space Header */}
      <div className="border-b border-border/80 bg-card/40 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Space Avatar / Icon Badge */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-500/10 to-violet-500/10 border border-primary/30 text-primary shadow-xs">
              <Globe className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl truncate">
                  {activeSpace.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="text-border/80">|</span>
                  <span>
                    {collections.length} {collections.length === 1 ? "Collection" : "Collections"}
                  </span>
                  <span className="text-border/80">|</span>
                  <span>
                    {totalItemCount} {totalItemCount === 1 ? "tab" : "tabs"}
                  </span>
                </div>
              </div>
              {activeSpace.description && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {activeSpace.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Header Actions: Visibility + Collaborator + Primary CTA */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            {/* Public/Private Pill */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
              title="Space visibility"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              Public
            </span>

            {/* Collaborator Avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-violet-500 text-xs font-semibold text-primary-foreground shadow-2xs"
              title="Workspace member"
            >
              Y
            </div>
          </div>
        </div>

        {/* 2. Space Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort / Custom Order Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg border-border/70 bg-card/60"
                  title="Sort order"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>
                    {sortMode === "custom" && "Custom order"}
                    {sortMode === "name" && "Name (A-Z)"}
                    {sortMode === "items" && "Most tabs"}
                    {sortMode === "recent" && "Recently updated"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => setSortMode("custom")} className="cursor-pointer text-xs">
                  Custom order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("name")} className="cursor-pointer text-xs">
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("items")} className="cursor-pointer text-xs">
                  Most tabs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("recent")} className="cursor-pointer text-xs">
                  Recently updated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Buttons */}
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

            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-border/70 bg-card/60 p-0.5 shadow-2xs">
              <ViewButton icon={Grid3X3} mode="grid" activeMode={viewMode} onClick={onViewModeChange} title="Grid view" />
              <ViewButton icon={List} mode="list" activeMode={viewMode} onClick={onViewModeChange} title="List view" />
              <ViewButton
                icon={Columns3}
                mode="compact"
                activeMode={viewMode}
                onClick={onViewModeChange}
                title="Compact view"
              />
              <ViewButton
                icon={Network}
                mode="mindmap"
                activeMode={viewMode}
                onClick={onViewModeChange}
                title="Mindmap view"
              />
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

            {/* Zoom / Density Stepper (+ / -) */}
            <div className="inline-flex items-center rounded-lg border border-border/70 bg-card/60 p-0.5 shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleZoomOut}
                disabled={cardDensity === "compact"}
                title="Zoom out: smaller cards (-)"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="px-1.5 text-[10px] font-mono text-muted-foreground uppercase">
                {cardDensity === "compact" ? "S" : cardDensity === "normal" ? "M" : "L"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleZoomIn}
                disabled={cardDensity === "comfortable"}
                title="Zoom in: larger cards (+)"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Search query notice if active */}
          {hasSearchQuery && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <FilterX className="h-3.5 w-3.5 text-primary" />
              Clear search filter
            </Button>
          )}
        </div>
      </div>

      {/* Today's Desk Hero Shelf */}
      {collections.length > 0 && !hasSearchQuery && activeFilter === "all" && (
        <div className="px-6 pt-5 pb-0">
          <div
            data-testid="todays-desk-shelf"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDeskDragOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDeskDragOver(false);
              }
            }}
            onDrop={(e) => {
              setIsDeskDragOver(false);
              handleDeskDrop(e);
            }}
            className={cn(
              "rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all duration-150",
              isDeskDragOver
                ? "border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-md"
                : "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card/85 to-card/60"
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-2xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Today's Desk</h3>
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.2 text-[10px] font-semibold text-amber-400">
                      {deskItems.length} focus {deskItems.length === 1 ? "tab" : "tabs"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    Your active focus shelf &bull; Drag &amp; drop bookmarks or open tabs here
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  onClick={handleLaunchDesk}
                  disabled={deskItems.length === 0}
                  data-testid="launch-todays-desk-button"
                  className="h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold text-xs shadow-xs"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Launch Desk ({deskItems.length})
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsDeskCollapsed((prev) => !prev)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title={isDeskCollapsed ? "Expand Today's Desk" : "Collapse Today's Desk"}
                >
                  {isDeskCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isDeskCollapsed && (
              deskItems.length === 0 ? (
                <div
                  data-testid="todays-desk-dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDeskDragOver(true);
                  }}
                  onDragLeave={() => setIsDeskDragOver(false)}
                  onDrop={(e) => handleDeskDrop(e)}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-3.5 p-5 rounded-xl border-2 border-dashed transition-all duration-150 text-center select-none cursor-default",
                    isDeskDragOver
                      ? "border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 scale-[1.01]"
                      : "border-amber-500/35 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-2xs">
                    <Pin className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-center sm:items-start text-left">
                    <p className="text-xs font-semibold text-foreground">
                      Drag and drop items here
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Drop bookmarks from your collections or open tabs from the right dock to pin them to Today&apos;s Desk
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {deskItems.map((item) => {
                    const normUrl = normalizeUrl(item.url);
                    const isOpenNow = Boolean(openUrlSet && normUrl && openUrlSet.has(normUrl));
                    const host = getHost(item.url);
                    const isTarget = dragOverDeskItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        data-testid={`desk-item-${item.id}`}
                        draggable
                        onDragStart={(e) => {
                          setIsDraggingDeskCard(true);
                          let originColId = "";
                          let originGrpId = "";
                          for (const c of collections) {
                            for (const g of c.groups) {
                              if (g.items.some((i) => i.id === item.id && !i.isDeleted)) {
                                originColId = c.id;
                                originGrpId = g.id;
                                break;
                              }
                            }
                            if (originColId) break;
                          }

                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({
                              type: "desk-item",
                              itemId: item.id,
                              collectionId: originColId,
                              groupId: originGrpId,
                            })
                          );
                          if (originColId && originGrpId) {
                            e.dataTransfer.setData("text/plain", `${originColId}:${originGrpId}:${item.id}`);
                          } else {
                            e.dataTransfer.setData("text/plain", `desk:${item.id}`);
                          }
                        }}
                        onDragEnd={() => {
                          setTimeout(() => setIsDraggingDeskCard(false), 120);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverDeskItemId(item.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverDeskItemId === item.id) setDragOverDeskItemId(null);
                        }}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDeskDrop(e, item.id);
                        }}
                        onClick={() => {
                          if (isDraggingDeskCard) return;
                          window.open(item.url, "_blank", "noopener,noreferrer");
                        }}
                        className={cn(
                          "group relative flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
                          isTarget
                            ? "border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02]"
                            : "border-border/80 bg-card/80 hover:border-amber-500/50 hover:bg-card hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="flex h-5 w-3.5 shrink-0 items-center justify-center text-muted-foreground/40 group-hover:text-amber-400 transition"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 border border-border/40 overflow-hidden shadow-2xs">
                            <Favicon url={item.url} size="sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <DomainBadge host={host} />
                              {isOpenNow ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 shrink-0"
                                  title="Currently open in browser"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live
                                </span>
                              ) : (
                                <span className="text-[9px] text-muted-foreground/60 shrink-0">Queued</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinDesk(item.id);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Unpin from Today's Desk"
                        >
                          ✕
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {sortedCollections.length ? (
        viewMode === "mindmap" ? (
          <div className="space-y-8 p-6">
            {sortedCollections.map((collection) => {
              const allItems = collection.groups.flatMap((g) =>
                g.items.map((i) => ({ ...i, groupId: (i as any).groupId || g.id }))
              );
              return (
                <div key={collection.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Network className="h-4 w-4 text-indigo-500" />
                      <span>{collection.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({allItems.length} items, {collection.groups.length} groups)
                      </span>
                    </h3>
                  </div>
                  <MindmapView
                    collection={collection}
                    groups={collection.groups}
                    items={allItems}
                    onItemClick={(item) => {
                      if (item.url) {
                        window.open(item.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {sortedCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                viewMode={viewMode}
                cardDensity={cardDensity}
                shareSettings={shareSettings}
                openUrlSet={openUrlSet}
                duplicateUrlCounts={duplicateUrlCounts}
                isPinnedToDesk={(id) => pinnedDeskIds.includes(id)}
                onTogglePinDesk={handleTogglePinDesk}
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
        )
      ) : isFiltered ? (
        <EmptyFilteredDashboard onClear={onClearFilters} />
      ) : (
        <EmptyDashboard
          onCreateCollection={onCreateCollection}
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

export function DomainBadge({ host }: { host: string }) {
  const style = getDomainBadgeStyle(host);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-tight border select-none transition-colors",
        style.bg,
        style.text,
        style.border
      )}
      title={host}
    >
      <Globe className="h-2.5 w-2.5 opacity-60 shrink-0" />
      <span className="truncate max-w-[120px]">{host}</span>
    </span>
  );
}

function CollectionCard({
  collection,
  viewMode,
  cardDensity,
  shareSettings,
  openUrlSet,
  duplicateUrlCounts,
  isPinnedToDesk,
  onTogglePinDesk,
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
  cardDensity?: "compact" | "normal" | "comfortable";
  shareSettings?: ShareSettings[];
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  isPinnedToDesk?: (itemId: string) => boolean;
  onTogglePinDesk?: (itemId: string) => void;
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
        "rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs transition-all duration-200 shadow-2xs overflow-hidden relative",
        isCardDragOver && "ring-2 ring-primary border-primary bg-primary/10 shadow-lg scale-[1.01]"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsCardDragOver(true);
      }}
      onDragLeave={() => setIsCardDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsCardDragOver(false);
        const plain = event.dataTransfer.getData("text/plain");
        const json = event.dataTransfer.getData("application/json");
        const payload = (plain && plain.split(":").length === 3 && !plain.startsWith("{")) ? plain : (json || plain);
        const firstGroup = collection.groups[0];
        if (payload && firstGroup) {
          onDropItem(payload, collection.id, firstGroup.id);
        }
      }}
    >
      {isCardDragOver && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm animate-in fade-in duration-150">
          Drop tab to add to &ldquo;{collection.name}&rdquo;
        </div>
      )}
      <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-card/30">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", colorDotClasses[collection.color])} />
              <span className="capitalize">{collection.color !== "none" ? collection.color : "Default"}</span>
            </span>
            <h3 className="truncate text-base font-bold text-foreground">{collection.name}</h3>
            <span className="text-xs text-muted-foreground font-medium">
              · {itemCount} {itemCount === 1 ? "tab" : "tabs"}
            </span>
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
          {collection.note && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {collection.note}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
          {onOpenAllUrls && allCollectionUrls.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenAllUrls(allCollectionUrls, "tabs")}
              title={`Open all ${allCollectionUrls.length} tabs`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant={collection.isStarred ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onToggleStar(collection.id)}
            title="Star collection"
          >
            <Star className={cn("h-4 w-4", collection.isStarred && "fill-current text-amber-400")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onCreateItem(collection.id, collection.groups[0]?.id)}
            title="Add item to collection"
          >
            <Plus className="h-4 w-4" />
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

      <div className="p-4">
        {visibleGroups.map((group) => (
          <GroupPanel
            key={group.id}
            collectionId={collection.id}
            group={group}
            viewMode={viewMode}
            cardDensity={cardDensity}
            isOnlyGroup={visibleGroups.length <= 1}
            shareSettings={shareSettings}
            openUrlSet={openUrlSet}
            duplicateUrlCounts={duplicateUrlCounts}
            isPinnedToDesk={isPinnedToDesk}
            onTogglePinDesk={onTogglePinDesk}
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
  cardDensity,
  isOnlyGroup,
  shareSettings,
  openUrlSet,
  duplicateUrlCounts,
  isPinnedToDesk,
  onTogglePinDesk,
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
  cardDensity?: "compact" | "normal" | "comfortable";
  isOnlyGroup: boolean;
  shareSettings?: ShareSettings[];
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  isPinnedToDesk?: (itemId: string) => boolean;
  onTogglePinDesk?: (itemId: string) => void;
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
        "rounded-xl transition-all duration-200 relative",
        isDragOver
          ? "border-2 border-dashed border-primary bg-primary/10 p-2.5 ring-2 ring-primary/40 shadow-sm"
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
        const plain = event.dataTransfer.getData("text/plain");
        const json = event.dataTransfer.getData("application/json");
        const payload = (plain && plain.split(":").length === 3 && !plain.startsWith("{")) ? plain : (json || plain);
        if (payload) {
          onDropItem(payload, collectionId, group.id);
        }
      }}
    >
      {isDragOver && (
        <div className="mb-2 rounded-lg bg-primary/20 border border-primary/40 px-3 py-1 text-center text-xs font-semibold text-primary animate-in fade-in duration-150">
          Drop tab to add to &ldquo;{group.name}&rdquo;
        </div>
      )}
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
          <div
            className={cn(
              "grid gap-3.5",
              cardDensity === "compact" &&
                "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5",
              cardDensity === "normal" &&
                "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5",
              cardDensity === "comfortable" &&
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            )}
          >
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                cardDensity={cardDensity}
                openUrlSet={openUrlSet}
                duplicateUrlCounts={duplicateUrlCounts}
                isPinnedToDesk={isPinnedToDesk ? isPinnedToDesk(item.id) : false}
                onTogglePinDesk={onTogglePinDesk ? () => onTogglePinDesk(item.id) : undefined}
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
          <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-2xs">
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                cardDensity={cardDensity}
                openUrlSet={openUrlSet}
                duplicateUrlCounts={duplicateUrlCounts}
                isPinnedToDesk={isPinnedToDesk ? isPinnedToDesk(item.id) : false}
                onTogglePinDesk={onTogglePinDesk ? () => onTogglePinDesk(item.id) : undefined}
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
  cardDensity = "normal",
  openUrlSet,
  duplicateUrlCounts,
  isPinnedToDesk,
  onTogglePinDesk,
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
  cardDensity?: "compact" | "normal" | "comfortable";
  openUrlSet?: Set<string>;
  duplicateUrlCounts?: Map<string, number>;
  isPinnedToDesk?: boolean;
  onTogglePinDesk?: () => void;
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
        className={cn(
          "group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none",
          cardDensity === "compact"
            ? "p-2.5 min-h-[64px]"
            : cardDensity === "comfortable"
            ? "p-4 min-h-[96px]"
            : "p-3.5 min-h-[76px]",
          isOpenNow && "ring-1 ring-emerald-500/30"
        )}
        draggable
        onDragStart={(event) => {
          const payload = onDragStart(item.id);
          event.dataTransfer.setData("text/plain", payload);
          try {
            event.dataTransfer.setData(
              "application/json",
              JSON.stringify({ type: "saved-item", itemId: item.id })
            );
          } catch {}
        }}
        onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl bg-muted/40 border border-border/30 overflow-hidden shadow-2xs",
              cardDensity === "compact" ? "h-7 w-7" : "h-9 w-9"
            )}
          >
            <Favicon url={item.url} size={cardDensity === "compact" ? "sm" : "md"} />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h5 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h5>
              {isOpenNow && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 shrink-0"
                  title="This tab is currently open in your browser"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Open now
                </span>
              )}
              {isDuplicate && (
                <span
                  className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 shrink-0"
                  title={`This link is saved ${duplicateUrlCounts?.get(normUrl)} times across your workspace`}
                >
                  Duplicate
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <DomainBadge host={getHost(item.url)} />
              {item.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted/60 border border-border/40 px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {cardDensity === "comfortable" && item.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Hover-revealed micro-actions */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-card/90 backdrop-blur-xs rounded-lg p-0.5 border border-border/40 shadow-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {onTogglePinDesk && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 transition-colors",
                isPinnedToDesk
                  ? "text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinDesk();
              }}
              title={isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
            >
              <Pin className={cn("h-3.5 w-3.5", isPinnedToDesk && "fill-current")} />
            </Button>
          )}

          <div
            className="flex h-6 w-5 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center text-muted-foreground/50 hover:text-foreground"
            title="Drag to reorder or move"
          >
            <GripVertical className="h-3 w-3" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, "_blank", "noopener,noreferrer");
            }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
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
              {onTogglePinDesk && (
                <DropdownMenuItem
                  onClick={() => {
                    onTogglePinDesk();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                  title={isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
                >
                  <Pin className="mr-2 h-3.5 w-3.5" />
                  {isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
                </DropdownMenuItem>
              )}
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
    );
  }

  // List or Compact view inside divided list container:
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-3 transition-colors hover:bg-muted/40 cursor-pointer select-none",
        isCompact ? "p-2.5" : "p-3.5"
      )}
      draggable
      onDragStart={(event) => {
        const payload = onDragStart(item.id);
        event.dataTransfer.setData("text/plain", payload);
        try {
          event.dataTransfer.setData(
            "application/json",
            JSON.stringify({ type: "saved-item", itemId: item.id })
          );
        } catch {}
      }}
      onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="flex h-5 w-4 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center text-muted-foreground/30 transition hover:text-foreground opacity-30 group-hover:opacity-100"
          title="Drag to reorder or move"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="flex shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30 overflow-hidden h-7 w-7">
          <Favicon url={item.url} size={isCompact ? "sm" : "md"} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h5>
            {isOpenNow && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 shrink-0"
                title="This tab is currently open in your browser"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open now
              </span>
            )}
            {isDuplicate && (
              <span
                className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 shrink-0"
                title={`This link is saved ${duplicateUrlCounts?.get(normUrl)} times across your workspace`}
              >
                Duplicate
              </span>
            )}
            <DomainBadge host={getHost(item.url)} />
            {item.tags && item.tags.length > 0 && !isCompact && (
              <div className="flex items-center gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded bg-secondary/60 px-1.5 py-0.2 text-[9px] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!isCompact && item.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 opacity-60 group-hover:opacity-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        {onTogglePinDesk && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 transition-colors",
              isPinnedToDesk
                ? "text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinDesk();
            }}
            title={isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
          >
            <Pin className={cn("h-3.5 w-3.5", isPinnedToDesk && "fill-current")} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, "_blank", "noopener,noreferrer");
          }}
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
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
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
            {onTogglePinDesk && (
              <DropdownMenuItem
                onClick={() => {
                  onTogglePinDesk();
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
                title={isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
              >
                <Pin className="mr-2 h-3.5 w-3.5" />
                {isPinnedToDesk ? "Unpin from Today's Desk" : "Pin to Today's Desk"}
              </DropdownMenuItem>
            )}
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
  );
}

function EmptyDashboard({
  onCreateCollection,
  onRestoreDemoData,
}: {
  onCreateCollection: () => void;
  onCreateItem?: (collectionId?: string, groupId?: string) => void;
  onRestoreDemoData?: () => void;
}) {
  return (
    <div className="flex min-h-[520px] items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Start this Space</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Create your first collection to start organizing bookmarks, links, and documents.
        </p>

        {/* Informational Guidance: How and where to add items */}
        <div className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-left shadow-2xs backdrop-blur">
          <div className="flex items-center gap-2 font-semibold text-xs text-foreground mb-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>Where is the option to add items?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            In LetsMarkNow, saved items (bookmarks, links, docs) must belong to a <strong>collection</strong> and <strong>group</strong>. Because this space currently has 0 collections, items cannot be added yet.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                1
              </span>
              <span>
                <strong>Create a Collection first</strong> below (e.g. &ldquo;Engineering&rdquo;, &ldquo;Design Systems&rdquo;, or &ldquo;Reading List&rdquo;).
              </span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                2
              </span>
              <span>
                <strong>Add Items anytime:</strong> Look for the <strong>+</strong> button in the header of each collection card or group section, save active tabs with the Chrome extension popup, or press <kbd className="rounded border border-border/80 bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={onCreateCollection}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create collection
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
