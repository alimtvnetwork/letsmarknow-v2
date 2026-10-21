import React from "react";
import { FolderPlus, RotateCcw, Sparkles, XCircle } from "lucide-react";
import type { BrowserTabSnapshot } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import type { WorkspaceUrlStats } from "../lib/tabCapture";
import { normalizeUrl } from "../lib/tabCapture";
import { cn } from "@/lib/utils";

export interface SaveSessionBarProps {
  openTabs: BrowserTabSnapshot[];
  savedUrlStats: WorkspaceUrlStats;
  latestSessionName?: string | null;
  onSaveSession: () => void;
  onCloseSavedTabs: () => void;
  onRestoreLastSession: () => void;
  isSaving?: boolean;
  className?: string;
}

export function SaveSessionBar({
  openTabs,
  savedUrlStats,
  latestSessionName,
  onSaveSession,
  onCloseSavedTabs,
  onRestoreLastSession,
  isSaving = false,
  className,
}: SaveSessionBarProps) {
  // Count how many open tabs are already saved in the workspace
  const openSavedTabsCount = openTabs.filter((tab) => {
    if (!tab.url) return false;
    const norm = normalizeUrl(tab.url);
    return norm && savedUrlStats.urlSet.has(norm);
  }).length;

  return (
    <div
      data-testid="save-session-bar"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3.5 rounded-2xl border border-white/10 border-t-white/15 bg-card/85 p-4 backdrop-blur-xl shadow-obsidian shadow-lg transition-all",
        className
      )}
    >
      {/* Tab Counter & Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/25 to-indigo-500/10 border border-primary/30 text-primary shadow-2xs">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {openTabs.length} tabs open
            </span>
            {openSavedTabsCount > 0 && (
              <span className="rounded-full bg-emerald-500/15 text-emerald-500 px-2 py-0.5 text-[10px] font-semibold">
                {openSavedTabsCount} saved
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {openSavedTabsCount > 0
              ? `${openSavedTabsCount} open tab${openSavedTabsCount > 1 ? "s are" : " is"} already saved in your workspace.`
              : "Capture all open tabs into a clean collection session or clean up clutter."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onSaveSession}
          disabled={openTabs.length === 0 || isSaving}
          data-testid="session-bar-save-button"
          className="h-8 text-xs font-medium"
        >
          <FolderPlus className="h-3.5 w-3.5 mr-1.5 text-primary" />
          <span>Save session</span>
          <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-mono font-semibold text-foreground shadow-2xs">S</kbd>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onCloseSavedTabs}
          disabled={openSavedTabsCount === 0 || isSaving}
          data-testid="session-bar-close-saved-button"
          className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
          title={
            openSavedTabsCount > 0
              ? `Close ${openSavedTabsCount} open tabs that are already saved`
              : "No already-saved tabs currently open"
          }
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          <span>Close saved tabs ({openSavedTabsCount})</span>
          <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-mono font-semibold text-foreground shadow-2xs">A</kbd>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRestoreLastSession}
          disabled={!latestSessionName || isSaving}
          data-testid="session-bar-restore-button"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          title={
            latestSessionName
              ? `Reopen tabs from "${latestSessionName}"`
              : "No recent session found in current workspace"
          }
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          <span>Restore last session</span>
          <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-border/80 bg-background/80 text-[10px] font-mono font-semibold text-foreground shadow-2xs">R</kbd>
        </Button>
      </div>
    </div>
  );
}
