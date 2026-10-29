import React from "react";
import { Bookmark, ExternalLink, Maximize2, Network, Settings, User } from "lucide-react";
import type { Organization } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authStore";

export interface ExtensionHeaderProps {
  organizations?: Organization[];
  activeOrganizationId?: string;
  onSelectOrganization?(id: string): void;
  onOpenFullTab(): void;
  onOpenMindmap?(): void;
  onOpenSettings?(): void;
  onOpenWebDashboard?(): void;
  onOpenAuth?(): void;
}

export function ExtensionHeader({
  organizations,
  activeOrganizationId,
  onSelectOrganization,
  onOpenFullTab,
  onOpenMindmap,
  onOpenSettings,
  onOpenAuth,
}: ExtensionHeaderProps) {
  const activeOrg = organizations?.find((o) => o.id === activeOrganizationId);
  const { session } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-card/90 px-3.5 py-2.5 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Bookmark className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-tight text-foreground">
            LetsMarkNow
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary uppercase border border-primary/20">
            v1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {organizations && organizations.length > 1 && onSelectOrganization && (
          <select
            value={activeOrganizationId}
            onChange={(e) => onSelectOrganization(e.target.value)}
            className="h-7 rounded-lg border border-border/80 bg-background/80 px-2 text-[11px] font-medium text-foreground hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
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
          <span className="hidden sm:inline-block text-[11px] font-medium text-muted-foreground truncate max-w-[110px]">
            {activeOrg.name}
          </span>
        )}

        {onOpenMindmap && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenMindmap}
            data-testid="open-mindmap-button"
            className="h-7 px-2 gap-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            title="Open Mindmap Canvas"
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mindmap</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenFullTab}
          data-testid="open-full-tab-button"
          className="h-7 px-2 min-[360px]:px-2.5 gap-1 min-[360px]:gap-1.5 rounded-lg text-xs font-semibold border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground transition-colors shadow-2xs shrink-0"
          title="Open Full Extension Dashboard"
        >
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          <span className="hidden min-[360px]:inline">Dashboard</span>
        </Button>

        {onOpenAuth && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenAuth}
            data-testid="header-auth-button"
            className="h-7 px-2 gap-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title={session ? `Account: ${session.name || session.email}` : "Sign In to Cloud"}
          >
            <User className={`h-3.5 w-3.5 ${session ? "text-primary" : ""}`} />
            <span className="hidden md:inline truncate max-w-[80px]">
              {session ? (session.name?.split(" ")[0] || "Account") : "Sign In"}
            </span>
          </Button>
        )}

        {onOpenSettings && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenSettings}
            data-testid="open-settings-button"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Extension Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
