import React from "react";
import { Check, FolderPlus, Globe, Layers, Loader2 } from "lucide-react";
import type { BrowserTabSnapshot } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { getDomainFromUrl } from "../lib/tabCapture";

export interface SaveAllTabsCardProps {
  tabCount: number;
  validTabCount: number;
  tabs?: BrowserTabSnapshot[];
  status?: "idle" | "loading" | "saved" | "error";
  onSaveAll(): void;
  onSaveSession?: () => void;
}

export function SaveAllTabsCard({
  tabCount,
  validTabCount,
  tabs = [],
  status = "idle",
  onSaveAll,
  onSaveSession,
}: SaveAllTabsCardProps) {
  // Extract up to 5 preview tabs for the favicon strip
  const previewTabs = tabs.slice(0, 5);
  const remainingCount = Math.max(0, tabCount - 5);

  return (
    <div
      data-testid="save-all-tabs-card"
      className="rounded-xl border border-border/70 bg-card/75 p-2.5 shadow-xs space-y-2 text-xs transition-all hover:border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
            <Layers className="h-3 w-3 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-xs block leading-tight">
              Open Window Tabs
            </span>
            <span className="text-[10px] text-muted-foreground">
              {validTabCount} saveable · {tabCount} total
            </span>
          </div>
        </div>
      </div>

      {/* Visual Overlapping Favicon Strip */}
      {previewTabs.length > 0 && (
        <div className="flex items-center justify-between bg-background/50 rounded-lg p-2 border border-border/50">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {previewTabs.map((tab, idx) => {
              const domain = getDomainFromUrl(tab.url);
              const fallbackIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
              return (
                <div
                  key={tab.id || idx}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted shadow-xs overflow-hidden shrink-0"
                  title={tab.title || domain}
                >
                  {tab.favIconUrl ? (
                    <img
                      src={tab.favIconUrl}
                      alt={domain}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackIcon;
                      }}
                      className="h-3.5 w-3.5 object-contain"
                    />
                  ) : (
                    <img
                      src={fallbackIcon}
                      alt={domain}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="h-3.5 w-3.5 object-contain"
                    />
                  )}
                </div>
              );
            })}
            {remainingCount > 0 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground shadow-xs shrink-0">
                +{remainingCount}
              </div>
            )}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
            {previewTabs[0] ? getDomainFromUrl(previewTabs[0].url) : "Window tabs"}
            {tabCount > 1 ? ` + ${tabCount - 1} more` : ""}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-0.5">
        {status === "saved" ? (
          <Button
            size="sm"
            disabled
            className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-600 text-white font-medium"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            All Tabs Saved
          </Button>
        ) : status === "loading" ? (
          <Button size="sm" disabled className="flex-1 h-8 text-xs">
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            Saving Tabs...
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={validTabCount === 0}
            onClick={onSaveAll}
            data-testid="save-all-tabs-button"
            className="flex-1 h-8 text-xs font-semibold hover:border-primary/50 transition-colors"
          >
            <span className="truncate">Save All Tabs ({validTabCount})</span>
          </Button>
        )}

        {onSaveSession && (
          <Button
            size="sm"
            variant="secondary"
            disabled={validTabCount === 0 || status === "loading"}
            onClick={onSaveSession}
            data-testid="save-session-button"
            className="h-8 text-xs font-medium px-3 hover:bg-muted transition-colors shrink-0"
            title="Snapshot whole window as a new dated session collection"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
            <span className="truncate">As Session</span>
          </Button>
        )}
      </div>
    </div>
  );
}
