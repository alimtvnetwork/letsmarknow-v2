import React from "react";
import { Bookmark, ExternalLink, Maximize2, Settings } from "lucide-react";
import type { Organization } from "@/types/lmn";
import { Button } from "@/components/ui/button";

export interface ExtensionHeaderProps {
  organizations?: Organization[];
  activeOrganizationId?: string;
  onSelectOrganization?(id: string): void;
  onOpenFullTab(): void;
  onOpenSettings?(): void;
  onOpenWebDashboard?(): void;
}

export function ExtensionHeader({
  organizations,
  activeOrganizationId,
  onSelectOrganization,
  onOpenFullTab,
  onOpenSettings,
}: ExtensionHeaderProps) {
  const activeOrg = organizations?.find((o) => o.id === activeOrganizationId);

  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-card/90 px-3.5 py-2.5 backdrop-blur shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
          <Bookmark className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-tight text-foreground">
            LetsMarkNow
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-semibold text-primary uppercase">
            v1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {organizations && organizations.length > 1 && onSelectOrganization && (
          <select
            value={activeOrganizationId}
            onChange={(e) => onSelectOrganization(e.target.value)}
            className="h-6 rounded border border-input bg-background/90 px-1.5 text-[11px] text-muted-foreground focus:outline-none"
            title="Switch Workspace"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}

        {organizations && organizations.length === 1 && activeOrg && (
          <span className="hidden sm:inline-block text-[11px] text-muted-foreground truncate max-w-[100px]">
            {activeOrg.name}
          </span>
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={onOpenFullTab}
          data-testid="open-full-tab-button"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Open Full Extension Tab"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        {onOpenSettings && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenSettings}
            data-testid="open-settings-button"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Extension Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
