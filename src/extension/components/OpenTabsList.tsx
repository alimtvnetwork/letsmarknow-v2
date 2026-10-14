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

      {/* Tabs list */}
      <div className="space-y-1.5 divide-y divide-border/40 rounded-lg border border-border bg-card/40 overflow-hidden">
        {tabs.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No open tabs detected in current window
          </div>
        ) : (
          tabs.map((tab, idx) => {
            const domain = getDomainFromUrl(tab.url);
            const isValid = isSaveableUrl(tab.url);
            const isSelected = tab.id !== undefined && selectedTabIds.includes(tab.id);
            const normUrl = normalizeUrl(tab.url);
            const isAlreadySaved = Boolean(savedUrlStats && normUrl && savedUrlStats.urlSet.has(normUrl));
            const savedInCol = normUrl && savedUrlStats ? savedUrlStats.urlToCollectionMap.get(normUrl) : null;

            return (
              <div
                key={tab.id ?? `tab-${idx}`}
                draggable={isValid}
                onDragStart={(event) => {
                  if (!isValid) return;
                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ type: "open-tab", tab })
                  );
                  event.dataTransfer.setData("text/plain", tab.url || "");
                }}
                className={`group/tab flex items-center gap-2.5 p-2.5 transition-colors ${
                  isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                } ${!isValid ? "opacity-60" : "cursor-grab active:cursor-grabbing"}`}
              >
                {/* Drag Handle */}
                {isValid && (
                  <div
                    className="flex h-4 w-3 shrink-0 items-center justify-center text-muted-foreground/30 opacity-40 group-hover/tab:opacity-100 transition"
                    title="Drag tab into any collection or group"
                  >
                    <GripVertical className="h-3 w-3" />
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

                {/* Favicon */}
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/40">
                  {tab.favIconUrl ? (
                    <img
                      src={tab.favIconUrl}
                      alt={domain}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="h-3.5 w-3.5 object-contain"
                    />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>

                {/* Title & Domain */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate text-xs font-medium text-foreground leading-tight">
                      {tab.title || domain || "Untitled Tab"}
                    </p>
                    {tab.pinned && (
                      <span title="Pinned">
                        <Pin className="h-3 w-3 text-amber-500 shrink-0" />
                      </span>
                    )}
                    {tab.active && (
                      <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-semibold text-primary uppercase shrink-0">
                        Active
                      </span>
                    )}
                    {isAlreadySaved && (
                      <span
                        className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-500 shrink-0"
                        title={savedInCol ? `Already saved in collection "${savedInCol}"` : "Already saved in workspace"}
                      >
                        Already saved
                      </span>
                    )}
                    {!isValid && (
                      <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-medium text-muted-foreground uppercase shrink-0">
                        System
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground font-mono mt-0.5">
                    {tab.url}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
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
