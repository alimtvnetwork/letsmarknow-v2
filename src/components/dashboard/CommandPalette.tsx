import {
  ExternalLink,
  FilterX,
  FolderPlus,
  Globe2,
  History,
  Layers,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share2,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Collection, Space } from "@/types/lmn";
import { Favicon } from "./Favicon";

export function CommandPalette({
  isOpen,
  spaces,
  collections,
  latestDeletedItem,
  onOpenChange,
  onCreateWorkspace,
  onCreateSpace,
  onCreateCollection,
  onCreateItem,
  onRestoreLatestItem,
  onJumpSpace,
  onJumpCollection,
  onOpenItem,
  onNavigate,
  onShareWorkspace,
  onShareSpace,
  onClearFilters,
}: {
  isOpen: boolean;
  spaces: Space[];
  collections: Collection[];
  latestDeletedItem?: { id: string; title: string };
  onOpenChange: (isOpen: boolean) => void;
  onCreateWorkspace: () => void;
  onCreateSpace: () => void;
  onCreateCollection: () => void;
  onCreateItem: () => void;
  onRestoreLatestItem?: () => void;
  onJumpSpace: (spaceId: string) => void;
  onJumpCollection: (spaceId: string, collectionId: string) => void;
  onOpenItem?: (url: string) => void;
  onNavigate: (path: string) => void;
  onShareWorkspace?: () => void;
  onShareSpace?: () => void;
  onClearFilters?: () => void;
}) {
  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const allItems = collections.flatMap((collection) =>
    collection.groups.flatMap((group) =>
      group.items
        .filter((item) => !item.isDeleted)
        .map((item) => ({
          ...item,
          collectionName: collection.name,
        }))
    )
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands, spaces, collections, or links..." />
      <CommandList>
        <CommandEmpty>No command or items found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onCreateCollection)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Create collection
          </CommandItem>
          <CommandItem onSelect={() => run(onCreateItem)}>
            <Link2 className="mr-2 h-4 w-4" />
            Add item
          </CommandItem>
          <CommandItem onSelect={() => run(onCreateSpace)}>
            <Layers className="mr-2 h-4 w-4" />
            Create space
          </CommandItem>
          <CommandItem onSelect={() => run(onCreateWorkspace)}>
            <Plus className="mr-2 h-4 w-4" />
            Create workspace
          </CommandItem>
          {latestDeletedItem && onRestoreLatestItem && (
            <CommandItem onSelect={() => run(onRestoreLatestItem)}>
              <RotateCcw className="mr-2 h-4 w-4 text-emerald-400" />
              Restore latest: {latestDeletedItem.title}
            </CommandItem>
          )}
          {onShareWorkspace && (
            <CommandItem onSelect={() => run(onShareWorkspace)}>
              <Share2 className="mr-2 h-4 w-4 text-primary" />
              Share workspace
            </CommandItem>
          )}
          {onShareSpace && (
            <CommandItem onSelect={() => run(onShareSpace)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share active space
            </CommandItem>
          )}
          {onClearFilters && (
            <CommandItem onSelect={() => run(onClearFilters)}>
              <FilterX className="mr-2 h-4 w-4 text-muted-foreground" />
              Clear search & filters
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(() => onNavigate("/web/app?view=share"))}>
            <Globe2 className="mr-2 h-4 w-4" />
            Open public share
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("/web/app?view=settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            Open settings
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("/web/app?view=activity"))}>
            <History className="mr-2 h-4 w-4" />
            Open activity
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("/web/app?view=trash"))}>
            <Trash2 className="mr-2 h-4 w-4" />
            Open trash
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Spaces">
          {spaces.map((space) => (
            <CommandItem key={space.id} onSelect={() => run(() => onJumpSpace(space.id))}>
              <Search className="mr-2 h-4 w-4" />
              {space.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Collections">
          {collections.map((collection) => (
            <CommandItem
              key={collection.id}
              onSelect={() => run(() => onJumpCollection(collection.spaceId, collection.id))}
            >
              <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
              {collection.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {allItems.length > 0 && (
          <CommandGroup heading="Saved Items">
            {allItems.slice(0, 20).map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() =>
                  run(() => {
                    if (onOpenItem) {
                      onOpenItem(item.url);
                    } else {
                      window.open(item.url, "_blank", "noopener,noreferrer");
                    }
                  })
                }
              >
                <Favicon url={item.url} size="sm" className="mr-2" />
                <span className="truncate">{item.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[120px]">
                  {item.collectionName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
