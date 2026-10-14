import React from "react";
import { Check, FolderPlus, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SaveAllTabsCardProps {
  tabCount: number;
  validTabCount: number;
  status?: "idle" | "loading" | "saved" | "error";
  onSaveAll(): void;
  onSaveSession?: () => void;
}

export function SaveAllTabsCard({
  tabCount,
  validTabCount,
  status = "idle",
  onSaveAll,
  onSaveSession,
}: SaveAllTabsCardProps) {
  return (
    <div
      data-testid="save-all-tabs-card"
      className="rounded-lg border border-border/70 bg-card/60 p-3 shadow-xs space-y-2 text-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">Open Window Tabs</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {validTabCount} saveable / {tabCount} total
        </span>
      </div>

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
            className="flex-1 h-8 text-xs font-medium"
          >
            Save All Tabs ({validTabCount})
          </Button>
        )}

        {onSaveSession && (
          <Button
            size="sm"
            variant="secondary"
            disabled={validTabCount === 0 || status === "loading"}
            onClick={onSaveSession}
            data-testid="save-session-button"
            className="h-8 text-xs font-medium px-2.5"
            title="Save all tabs as a new session collection"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1" />
            As Session
          </Button>
        )}
      </div>
    </div>
  );
}
