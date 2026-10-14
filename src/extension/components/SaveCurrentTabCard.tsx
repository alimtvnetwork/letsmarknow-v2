import React from "react";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Check,
  Globe,
  Loader2,
  Pin,
  RefreshCw,
} from "lucide-react";
import type { BrowserTabSnapshot } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { getDomainFromUrl, isSaveableUrl } from "../lib/tabCapture";

export interface SaveCurrentTabCardProps {
  tab: BrowserTabSnapshot | null;
  status: "idle" | "loading" | "saved" | "error" | "invalid";
  errorMessage?: string;
  alreadySaved?: boolean;
  onSave(): void;
}

export function SaveCurrentTabCard({
  tab,
  status,
  errorMessage,
  alreadySaved,
  onSave,
}: SaveCurrentTabCardProps) {
  if (!tab) {
    return (
      <div className="rounded-lg border border-border/70 bg-card/60 p-3 text-center">
        <p className="text-xs text-muted-foreground">No active tab detected</p>
      </div>
    );
  }

  const domain = getDomainFromUrl(tab.url);
  const isValid = isSaveableUrl(tab.url);
  const displayStatus = !isValid ? "invalid" : status;

  return (
    <div
      data-testid="save-current-tab-card"
      className="rounded-lg border border-border/70 bg-card/80 p-3 shadow-xs space-y-2.5 transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
          {tab.favIconUrl ? (
            <img
              src={tab.favIconUrl}
              alt={domain}
              onError={(e) => {
                // hide broken images and fallback to Globe
                (e.target as HTMLElement).style.display = "none";
              }}
              className="h-4 w-4 rounded-xs object-contain"
            />
          ) : (
            <Globe className="h-4 w-4 text-muted-foreground/70" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className="truncate text-xs font-semibold text-foreground leading-tight"
              title={tab.title}
            >
              {tab.title || domain || "Untitled Tab"}
            </h3>
            {tab.pinned && (
              <span title="Pinned tab">
                <Pin className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500/20" />
              </span>
            )}
          </div>
          <p
            className="truncate text-[11px] text-muted-foreground font-mono mt-0.5"
            title={tab.url}
          >
            {domain}
          </p>
        </div>
      </div>

      {/* Edge States / Alert Messages */}
      {displayStatus === "invalid" && (
        <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-500 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Internal/system pages cannot be saved.</span>
        </div>
      )}

      {displayStatus === "error" && errorMessage && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive border border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-0.5">
        {displayStatus === "invalid" ? (
          <Button
            size="sm"
            disabled
            variant="outline"
            className="w-full h-8 text-xs text-muted-foreground"
          >
            Cannot Save This Page
          </Button>
        ) : displayStatus === "saved" ? (
          <Button
            size="sm"
            disabled
            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-600 text-white font-medium"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Saved Successfully
          </Button>
        ) : displayStatus === "loading" ? (
          <Button size="sm" disabled className="w-full h-8 text-xs">
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Saving Tab...
          </Button>
        ) : displayStatus === "error" ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onSave}
            className="w-full h-8 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry Save
          </Button>
        ) : alreadySaved ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 flex-1">
              <BookmarkCheck className="h-3 w-3" />
              <span>Already in collection</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              className="h-8 text-xs px-2.5"
            >
              Save Again
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={onSave}
            data-testid="save-current-tab-button"
            className="w-full h-8 text-xs font-medium"
          >
            <Bookmark className="h-3.5 w-3.5 mr-1.5" />
            Save Current Tab
          </Button>
        )}
      </div>
    </div>
  );
}
