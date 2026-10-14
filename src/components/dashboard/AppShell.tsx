import { useState } from "react";
import {
  Check,
  ChevronDown,
  History,
  LayoutDashboard,
  Pencil,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AppPage, Organization, ShareSettings, Space } from "@/types/lmn";

interface WorkspaceRailProps {
  organizations: Organization[];
  activeOrgId: string;
  onSelect: (organizationId: string) => void;
  onCreateWorkspace: () => void;
  className?: string;
}

export function WorkspaceRail({
  organizations,
  activeOrgId,
  onSelect,
  onCreateWorkspace,
  className,
}: WorkspaceRailProps) {
  return (
    <aside
      className={cn(
        "flex w-[72px] shrink-0 flex-col items-center border-r border-border bg-sidebar py-4",
        className
      )}
    >
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
        L
      </div>
      <div className="flex flex-col items-center gap-3">
        {organizations.map((organization) => (
          <button
            key={organization.id}
            type="button"
            onClick={() => onSelect(organization.id)}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold transition",
              activeOrgId === organization.id
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:border-primary/60"
            )}
            title={organization.name}
          >
            {organization.initials}
            {activeOrgId === organization.id && (
              <span className="absolute -right-[15px] h-7 w-1 rounded-full bg-primary" />
            )}
          </button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-lg border border-dashed border-sidebar-border text-muted-foreground transition hover:border-primary/60 hover:bg-sidebar-accent hover:text-foreground"
          title="Add workspace"
          onClick={onCreateWorkspace}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1" />
    </aside>
  );
}

interface SpaceSidebarProps {
  activePage: AppPage;
  activeOrganization: Organization;
  organizations?: Organization[];
  spaces: Space[];
  activeSpaceId: string;
  deletedCount: number;
  shareSettings?: ShareSettings[];
  onSelectSpace: (spaceId: string) => void;
  onSelectOrganization?: (organizationId: string) => void;
  onCreateWorkspace?: () => void;
  onEditWorkspace?: (organizationId: string) => void;
  onDeleteWorkspace?: (organizationId: string) => void;
  onShareWorkspace?: (organizationId: string) => void;
  onCreateSpace: () => void;
  onEditSpace: (spaceId: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onShareSpace?: (spaceId: string) => void;
  className?: string;
  onNavigateExtra?: () => void;
}

export function SpaceSidebar({
  activePage,
  activeOrganization,
  organizations = [],
  spaces,
  activeSpaceId,
  deletedCount,
  shareSettings,
  onSelectSpace,
  onSelectOrganization,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onShareWorkspace,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  onShareSpace,
  className,
  onNavigateExtra,
}: SpaceSidebarProps) {
  const navigate = useNavigate();

  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    onNavigateExtra?.();
  };

  return (
    <aside
      className={cn(
        "flex w-[292px] shrink-0 flex-col border-r border-border bg-card/60",
        className
      )}
    >
      <div className="border-b border-border p-4">
        <DropdownMenu open={isWsMenuOpen} onOpenChange={setIsWsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg p-1.5 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Workspace switcher"
              onClick={() => setIsWsMenuOpen((prev) => !prev)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Workspace
                </p>
                <h1 className="mt-0.5 truncate text-base font-semibold">{activeOrganization.name}</h1>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  onSelectOrganization?.(org.id);
                  setIsWsMenuOpen(false);
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                    {org.initials}
                  </span>
                  <span className="truncate text-sm">{org.name}</span>
                </div>
                {org.id === activeOrganization.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {onEditWorkspace && (
              <DropdownMenuItem
                onClick={() => {
                  onEditWorkspace(activeOrganization.id);
                  setIsWsMenuOpen(false);
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit workspace
              </DropdownMenuItem>
            )}
            {onShareWorkspace && (
              <DropdownMenuItem
                onClick={() => {
                  onShareWorkspace(activeOrganization.id);
                  setIsWsMenuOpen(false);
                }}
                className="cursor-pointer"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share workspace
              </DropdownMenuItem>
            )}
            {onDeleteWorkspace && (
              <DropdownMenuItem
                onClick={() => {
                  onDeleteWorkspace(activeOrganization.id);
                  setIsWsMenuOpen(false);
                }}
                disabled={organizations.length <= 1}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete workspace
              </DropdownMenuItem>
            )}
            {onCreateWorkspace && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onCreateWorkspace();
                    setIsWsMenuOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create workspace
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {(() => {
          const wsShare = shareSettings?.find(
            (s) => s.targetType === "workspace" && s.targetId === activeOrganization.id
          );
          return (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {activeOrganization.plan} workspace
              </div>
              {wsShare && wsShare.visibility !== "private" && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    wsShare.visibility === "public"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-sky-500/15 text-sky-400"
                  )}
                  title={`Workspace is ${wsShare.visibility}`}
                >
                  {wsShare.visibility}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      <nav className="space-y-1 p-3">
        <SidebarButton
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={activePage === "dashboard"}
          onClick={() => handleNav("/web/app")}
        />
        <SidebarButton
          icon={Trash2}
          label="Trash"
          count={deletedCount}
          isActive={activePage === "trash"}
          onClick={() => handleNav("/web/app?view=trash")}
        />
        <SidebarButton
          icon={Settings}
          label="Settings"
          isActive={activePage === "settings"}
          onClick={() => handleNav("/web/app?view=settings")}
        />
        <SidebarButton
          icon={History}
          label="Activity"
          isActive={activePage === "activity"}
          onClick={() => handleNav("/web/app?view=activity")}
        />
        <SidebarButton
          icon={Share2}
          label="Public share"
          isActive={activePage === "share"}
          onClick={() => handleNav("/web/app?view=share")}
        />
      </nav>

      <div className="mt-2 flex items-center justify-between px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Spaces
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCreateSpace}
          title="Create space"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 pb-4">
        {spaces.map((space) => {
          const spaceShare = shareSettings?.find(
            (s) => s.targetType === "space" && s.targetId === space.id
          );
          return (
            <div
              key={space.id}
              className={cn(
                "group rounded-lg border p-3 transition",
                activePage === "dashboard" && activeSpaceId === space.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSpace(space.id);
                    onNavigateExtra?.();
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", space.accentClass)} />
                    <span className="truncate text-sm font-medium">{space.name}</span>
                    {spaceShare && spaceShare.visibility !== "private" && (
                      <span
                        className={cn(
                          "ml-auto rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase",
                          spaceShare.visibility === "public"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-sky-500/15 text-sky-400"
                        )}
                        title={`Space is ${spaceShare.visibility}`}
                      >
                        {spaceShare.visibility}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {space.description}
                  </p>
                </button>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  {onShareSpace && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareSpace(space.id);
                      }}
                      title="Share space"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEditSpace(space.id)}
                    title="Edit space"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={spaces.length <= 1}
                    onClick={() => onDeleteSpace(space.id)}
                    title="Delete space"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function MobileSidebarDrawer({
  isOpen,
  onOpenChange,
  organizations,
  activeOrganization,
  spaces,
  activeSpaceId,
  deletedCount,
  activePage,
  shareSettings,
  onSelectOrganization,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onShareWorkspace,
  onSelectSpace,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  onShareSpace,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  activeOrganization: Organization;
  spaces: Space[];
  activeSpaceId: string;
  deletedCount: number;
  activePage: AppPage;
  shareSettings?: ShareSettings[];
  onSelectOrganization: (id: string) => void;
  onCreateWorkspace: () => void;
  onEditWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onShareWorkspace?: (id: string) => void;
  onSelectSpace: (id: string) => void;
  onCreateSpace: () => void;
  onEditSpace: (id: string) => void;
  onDeleteSpace: (id: string) => void;
  onShareSpace?: (id: string) => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[340px] max-w-full p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <WorkspaceRail
          organizations={organizations}
          activeOrgId={activeOrganization.id}
          onSelect={(id) => {
            onSelectOrganization(id);
            onOpenChange(false);
          }}
          onCreateWorkspace={() => {
            onCreateWorkspace();
            onOpenChange(false);
          }}
          className="w-16"
        />
        <SpaceSidebar
          activePage={activePage}
          activeOrganization={activeOrganization}
          organizations={organizations}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          deletedCount={deletedCount}
          shareSettings={shareSettings}
          onSelectSpace={(id) => {
            onSelectSpace(id);
            onOpenChange(false);
          }}
          onSelectOrganization={onSelectOrganization}
          onCreateWorkspace={() => {
            onCreateWorkspace();
            onOpenChange(false);
          }}
          onEditWorkspace={(id) => {
            onEditWorkspace(id);
            onOpenChange(false);
          }}
          onDeleteWorkspace={(id) => {
            onDeleteWorkspace(id);
            onOpenChange(false);
          }}
          onShareWorkspace={(id) => {
            onShareWorkspace?.(id);
            onOpenChange(false);
          }}
          onCreateSpace={() => {
            onCreateSpace();
            onOpenChange(false);
          }}
          onEditSpace={(id) => {
            onEditSpace(id);
            onOpenChange(false);
          }}
          onDeleteSpace={(id) => {
            onDeleteSpace(id);
            onOpenChange(false);
          }}
          onShareSpace={(id) => {
            onShareSpace?.(id);
            onOpenChange(false);
          }}
          onNavigateExtra={() => onOpenChange(false)}
          className="flex-1 border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {!!count && (
        <span className="rounded-full bg-background/30 px-2 py-0.5 text-xs font-semibold">
          {count}
        </span>
      )}
    </button>
  );
}
