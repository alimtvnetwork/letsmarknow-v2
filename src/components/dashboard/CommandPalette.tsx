import { useState, useEffect } from "react";
import {
  Bookmark,
  ExternalLink,
  FileText,
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
  Sparkles,
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
import { toast } from "sonner";
import { Favicon } from "./Favicon";
import { searchQuick, type QuickSearchResultItem } from "@/lib/workspaceApiClient";
import { collectionToMarkdown, copyMarkdownToClipboard } from "@/lib/markdownExport";

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
  onImportBookmarks,
  onExportMarkdown,
  duplicateCount,
  onOpenDuplicateCleaner,
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
  onImportBookmarks?: () => void;
  onExportMarkdown?: () => void;
  duplicateCount?: number;
  onOpenDuplicateCleaner?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<QuickSearchResultItem[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setRemoteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchQuick(query.trim(), 8);
        setRemoteResults(results);
      } catch {
        // Fallback to local
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

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
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search commands, spaces, collections, or links..."
      />
      <CommandList>
        <CommandEmpty>No command or items found.</CommandEmpty>

        {remoteResults.length > 0 && (
          <CommandGroup heading="Live Search Results">
            {remoteResults.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() =>
                  run(() => {
                    if (onOpenItem) {
                      onOpenItem(result.url);
                    } else {
                      window.open(result.url, "_blank", "noopener,noreferrer");
                    }
                  })
                }
              >
                <Favicon url={result.url} size="sm" className="mr-2 shrink-0" />
                <span className="truncate min-w-0 flex-1">{result.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[90px] sm:max-w-[140px] shrink-0 pl-2">
                  {result.collection_name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onCreateCollection)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Create collection
          </CommandItem>
          <CommandItem
            onSelect={() => {
              if (collections.length === 0) {
                toast.info("Please create a collection first before adding items.");
                run(onCreateCollection);
              } else {
                run(onCreateItem);
              }
            }}
          >
            <Link2 className="mr-2 h-4 w-4" />
            <span>Add item</span>
            {collections.length === 0 && (
              <span className="ml-auto text-[10px] text-muted-foreground">(Requires collection)</span>
            )}
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
          {onImportBookmarks && (
            <CommandItem onSelect={() => run(onImportBookmarks)}>
              <Bookmark className="mr-2 h-4 w-4 text-sky-400" />
              Import Chrome Bookmarks
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
          {onExportMarkdown && (
            <CommandItem onSelect={() => run(onExportMarkdown)}>
              <FileText className="mr-2 h-4 w-4 text-emerald-400" />
              Export active space to Markdown
            </CommandItem>
          )}
          {duplicateCount !== undefined && duplicateCount > 0 && onOpenDuplicateCleaner && (
            <CommandItem onSelect={() => run(onOpenDuplicateCleaner)}>
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              <span>Clean {duplicateCount} duplicates...</span>
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
              {space.icon ? (
                <span className="mr-2 text-sm select-none">{space.icon}</span>
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
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
              {collection.icon ? (
                <span className="mr-2 text-sm select-none">{collection.icon}</span>
              ) : (
                <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
              )}
              {collection.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {collections.length > 0 && (
          <CommandGroup heading="Export to Markdown">
            {collections.map((collection) => {
              const count = collection.groups.reduce(
                (acc, g) => acc + g.items.filter((i) => !i.isDeleted).length,
                0
              );
              return (
                <CommandItem
                  key={`export-${collection.id}`}
                  value={`export markdown ${collection.name}`}
                  onSelect={() =>
                    run(() => {
                      const md = collectionToMarkdown(collection);
                      copyMarkdownToClipboard(md, count, `collection "${collection.name}"`);
                    })
                  }
                >
                  <FileText className="mr-2 h-4 w-4 text-emerald-400" />
                  <span>Export &quot;{collection.name}&quot; to Markdown</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{count} links</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

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
                <Favicon url={item.url} size="sm" className="mr-2 shrink-0" />
                <span className="truncate min-w-0 flex-1">{item.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[90px] sm:max-w-[140px] shrink-0 pl-2">
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
