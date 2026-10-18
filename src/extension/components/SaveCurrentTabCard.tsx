import React, { useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Check,
  CornerDownLeft,
  Folder,
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
  destinationSummary?: string;
  onSave(): void;
}

export function SaveCurrentTabCard({
  tab,
  status,
  errorMessage,
  alreadySaved,
  destinationSummary,
  onSave,
}: SaveCurrentTabCardProps) {
  const [iconError, setIconError] = useState(false);
  const [googleIconError, setGoogleIconError] = useState(false);

  if (!tab) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/60 p-4 text-center">
        <p className="text-xs text-muted-foreground">No active tab detected</p>
      </div>
    );
  }

  const domain = getDomainFromUrl(tab.url);
  const cleanDomain = domain ? domain.replace(/^(www\.)/, "") : "";
  const initial = cleanDomain ? cleanDomain.charAt(0).toUpperCase() : "L";
  const googleFavicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";
  const isValid = isSaveableUrl(tab.url);
  const displayStatus = !isValid ? "invalid" : status;

  return (
    <div
      data-testid="save-current-tab-card"
      className="rounded-xl border border-border/80 bg-card/85 p-2.5 shadow-xs space-y-2 transition-all"
    >
      {/* Top Header: Tab Details with Robust Favicon Fallback */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 shadow-xs overflow-hidden">
          {tab.favIconUrl && !iconError ? (
            <img
              src={tab.favIconUrl}
              alt={domain}
              onError={() => setIconError(true)}
              className="h-5 w-5 rounded-xs object-contain"
            />
          ) : googleFavicon && !googleIconError ? (
            <img
              src={googleFavicon}
              alt={domain}
              onError={() => setGoogleIconError(true)}
              className="h-5 w-5 rounded-xs object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-indigo-500/20 text-xs font-bold text-primary">
              {initial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className="truncate text-xs font-bold text-foreground leading-snug tracking-tight"
              title={tab.title}
            >
              {tab.title || domain || "Untitled Tab"}
            </h3>
            {tab.pinned && (
              <span title="Pinned tab" className="shrink-0">
                <Pin className="h-3 w-3 text-amber-500 fill-amber-500/20" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p
              className="truncate text-[11px] text-muted-foreground font-mono"
              title={tab.url}
            >
              {domain}
            </p>
          </div>
        </div>
      </div>


      {/* Edge States / Alert Messages */}
      {displayStatus === "invalid" && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-500 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Internal/system pages cannot be saved.</span>
        </div>
      )}

      {displayStatus === "error" && errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive border border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-0.5">
        {displayStatus === "invalid" ? (
          <Button
            size="sm"
            disabled
            variant="outline"
            className="w-full h-9 text-xs text-muted-foreground"
          >
            Cannot Save This Page
          </Button>
        ) : displayStatus === "saved" ? (
          <Button
            size="sm"
            disabled
            className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-600 text-white font-semibold shadow-xs"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Saved Successfully
          </Button>
        ) : displayStatus === "loading" ? (
          <Button size="sm" disabled className="w-full h-9 text-xs font-semibold">
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Saving Tab...
          </Button>
        ) : displayStatus === "error" ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onSave}
            className="w-full h-9 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry Save
          </Button>
        ) : alreadySaved ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold px-2.5 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex-1">
              <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Already in collection</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              className="h-9 text-xs font-semibold px-3 hover:border-primary/50"
            >
              Save Again
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={onSave}
            data-testid="save-current-tab-button"
            className="w-full h-9 text-xs font-bold gap-2 shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Save Current Tab</span>
            <span className="ml-auto flex items-center gap-0.5 rounded-sm bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono text-primary-foreground">
              <CornerDownLeft className="h-2.5 w-2.5" />
              <span>Enter</span>
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
