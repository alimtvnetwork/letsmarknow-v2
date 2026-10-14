import React, { useState } from "react";
import {
  Bookmark,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  FolderPlus,
  Globe,
  GripVertical,
  Pin,
  Square,
  X,
} from "lucide-react";
import type { BrowserTabSnapshot } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import {
  getDomainFromUrl,
  isSaveableUrl,
  normalizeUrl,
  type WorkspaceUrlStats,
} from "../lib/tabCapture";

export interface OpenTabsListProps {
  tabs: BrowserTabSnapshot[];
  selectedTabIds: number[];
  savedUrlStats?: WorkspaceUrlStats;
  onToggleSelectTab(tabId: number): void;
  onSelectAll(): void;
  onDeselectAll(): void;
  onSaveSelected(): void;
  onSaveAll(): void;
  onSaveAsSession?(): void;
  onCloseTab?(tabId: number): void;
  isSaving?: boolean;
}

export function OpenTabsList({
  tabs,
  selectedTabIds,
  savedUrlStats,
  onToggleSelectTab,
  onSelectAll,
  onDeselectAll,
  onSaveSelected,
  onSaveAll,
  onSaveAsSession,
  onCloseTab,
  isSaving = false,
}: OpenTabsListProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<number | string | null>(null);

  const saveableTabs = tabs.filter((t) => isSaveableUrl(t.url));
  const allSaveableSelected =
    saveableTabs.length > 0 &&
    saveableTabs.every((t) => t.id !== undefined && selectedTabIds.includes(t.id));

  const handleCopyUrl = async (tab: BrowserTabSnapshot) => {
    if (!tab.url) return;
    try {
      await navigator.clipboard.writeText(tab.url);
      if (tab.id !== undefined) {
        setCopiedId(tab.id);
        setTimeout(() => setCopiedId(null), 1500);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-3">
      {/* Action / Toolbar header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/60 p-2.5">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={allSaveableSelected ? onDeselectAll : onSelectAll}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
          >
            {allSaveableSelected ? (
              <CheckSquare className="h-3.5 w-3.5 mr-1 text-primary" />
            ) : (
              <Square className="h-3.5 w-3.5 mr-1" />
            )}
            {allSaveableSelected ? "Deselect All" : "Select All"}
          </Button>

          <span className="text-[11px] text-muted-foreground border-l border-border pl-2">
            {selectedTabIds.length} of {saveableTabs.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSaveAsSession && (
            <Button
              size="sm"
              variant="outline"
              disabled={selectedTabIds.length === 0 || isSaving}
              onClick={onSaveAsSession}
              className="h-7 text-xs"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary" />
              Save As Collection
            </Button>
          )}

          <Button
            size="sm"
            disabled={selectedTabIds.length === 0 || isSaving}
            onClick={onSaveSelected}
            data-testid="save-selected-tabs-button"
            className="h-7 text-xs font-medium"
          >
            <Bookmark className="h-3.5 w-3.5 mr-1" />
            Save Selected ({selectedTabIds.length})
          </Button>
        </div>
      </div>

      {/* Tabs list: Toby-style individual pill cards */}
      <div className="space-y-2">
        {tabs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/20 p-6 text-center text-xs text-muted-foreground">
            No open tabs detected in current window
          </div>
        ) : (
          tabs.map((tab, idx) => {
            const domain = getDomainFromUrl(tab.url);
            const isValid = isSaveableUrl(tab.url);
            const tabKey = tab.id ?? `tab-${idx}`;
            const isSelected = tab.id !== undefined && selectedTabIds.includes(tab.id);
            const isDragging = draggedTabId === tabKey;
            const normUrl = normalizeUrl(tab.url);
            const isAlreadySaved = Boolean(savedUrlStats && normUrl && savedUrlStats.urlSet.has(normUrl));
            const savedInCol = normUrl && savedUrlStats ? savedUrlStats.urlToCollectionMap.get(normUrl) : null;

            return (
              <div
                key={tabKey}
                draggable={isValid}
                onDragStart={(event) => {
                  if (!isValid) return;
                  setDraggedTabId(tabKey);
                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ type: "open-tab", tab })
                  );
                  event.dataTransfer.setData("text/plain", tab.url || "");
                }}
                onDragEnd={() => setDraggedTabId(null)}
                className={`group/tab relative flex items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-150 shadow-2xs select-none ${
                  isSelected
                    ? "border-primary/60 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-card/50 hover:bg-card/90 hover:border-border hover:shadow-xs"
                } ${!isValid ? "opacity-60 bg-muted/20 border-border/40" : "cursor-grab active:cursor-grabbing"} ${
                  isDragging ? "opacity-40 border-dashed border-primary ring-2 ring-primary/30 scale-[0.98]" : ""
                }`}
              >
                {/* Drag Handle */}
                {isValid && (
                  <div
                    className="flex h-5 w-3.5 shrink-0 items-center justify-center text-muted-foreground/30 opacity-40 group-hover/tab:opacity-100 transition"
                    title="Drag tab into any collection or group"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                )}

                {/* Checkbox */}
                <input
                  type="checkbox"
                  disabled={!isValid}
                  checked={isSelected}
                  onChange={() => tab.id !== undefined && onToggleSelectTab(tab.id)}
                  aria-label={`Select tab ${tab.title}`}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-40"
                />

                {/* Favicon Box */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/80 shadow-2xs">
                  {tab.favIconUrl ? (
                    <img
                      src={tab.favIconUrl}
                      alt={domain}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Title & Domain */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate text-xs font-semibold text-foreground leading-tight">
                      {tab.title || domain || "Untitled Tab"}
                    </p>
                    {tab.pinned && (
                      <span title="Pinned">
                        <Pin className="h-3 w-3 text-amber-500 shrink-0" />
                      </span>
                    )}
                    {tab.active && (
                      <span className="rounded-full bg-primary/15 text-primary text-[9px] font-bold px-2 py-0.2 uppercase tracking-wider shrink-0">
                        Active
                      </span>
                    )}
                    {isAlreadySaved && (
                      <span
                        className="rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold px-2 py-0.2 shrink-0"
                        title={savedInCol ? `Already saved in collection "${savedInCol}"` : "Already saved in workspace"}
                      >
                        Already saved
                      </span>
                    )}
                    {!isValid && (
                      <span className="rounded-full bg-muted text-muted-foreground text-[9px] font-semibold px-2 py-0.2 uppercase tracking-wider shrink-0">
                        System
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground font-mono mt-0.5" title={tab.url}>
                    {tab.url}
                  </p>
                </div>

                {/* Micro-actions on hover */}
                <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover/tab:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopyUrl(tab)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Copy URL"
                  >
                    {copiedId === tab.id ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>

                  <a
                    href={tab.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {onCloseTab && tab.id !== undefined && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onCloseTab(tab.id!)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Close Tab"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
