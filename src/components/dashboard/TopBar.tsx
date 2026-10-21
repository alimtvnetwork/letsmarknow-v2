import { Command, PanelLeft, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Space } from "@/types/lmn";

interface TopBarProps {
  activeSpace: Space;
  itemCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  onCreateCollection: () => void;
  onCreateItem?: () => void;
  onOpenCommand: () => void;
  onToggleMobileMenu?: () => void;
  children?: React.ReactNode;
}

export function TopBar({
  activeSpace,
  itemCount,
  query,
  onQueryChange,
  onCreateCollection,
  onOpenCommand,
  onToggleMobileMenu,
  children,
}: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 md:px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          data-testid="toggle-sidebar-button"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleMobileMenu}
          title="Toggle sidebar navigation"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{activeSpace.name}</h2>
          <p className="text-xs text-muted-foreground">{itemCount} active items</p>
        </div>
      </div>

      <div className="hidden min-w-[320px] max-w-xl flex-1 items-center rounded-lg border border-border bg-card px-3 md:flex">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          data-dashboard-search
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search links, tags, groups..."
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:text-foreground"
          title="Open command palette"
        >
          <Command className="h-3 w-3" /> K
        </button>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <Button size="sm" onClick={onCreateCollection} title="Create collection (required before adding items)">
          <Plus className="h-4 w-4" />
          Collection
        </Button>
      </div>
    </header>
  );
}
