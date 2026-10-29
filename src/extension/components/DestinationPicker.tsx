import React from "react";
import { FolderPlus, Layers, Plus } from "lucide-react";
import type { Collection, Organization, Space } from "@/types/lmn";
import { Button } from "@/components/ui/button";

export interface DestinationPickerProps {
  organizations: Organization[];
  spaces: Space[];
  collections: Collection[];
  selectedOrganizationId: string;
  selectedSpaceId: string;
  selectedCollectionId: string;
  selectedGroupId: string;
  onSelectOrganization(id: string): void;
  onSelectSpace(id: string): void;
  onSelectCollection(id: string): void;
  onSelectGroup(id: string): void;
  onCreateCollection(): void;
  onCreateGroup(): void;
}

export function DestinationPicker({
  organizations,
  spaces,
  collections,
  selectedOrganizationId,
  selectedSpaceId,
  selectedCollectionId,
  selectedGroupId,
  onSelectOrganization,
  onSelectSpace,
  onSelectCollection,
  onSelectGroup,
  onCreateCollection,
  onCreateGroup,
}: DestinationPickerProps) {
  // Filter spaces for selected organization
  const filteredSpaces = spaces.filter((s) => s.organizationId === selectedOrganizationId);

  // Filter collections for selected space
  const filteredCollections = collections.filter((c) => c.spaceId === selectedSpaceId);

  // Find active collection and its groups
  const activeCollection = collections.find((c) => c.id === selectedCollectionId);
  const availableGroups = activeCollection ? activeCollection.groups : [];

  return (
    <div className="space-y-2.5 rounded-xl border border-border/80 border-t-white/12 bg-card/75 backdrop-blur-md p-3.5 text-xs shadow-obsidian transition-all hover:border-border">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
        <span className="font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>Filing Destination</span>
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {filteredCollections.length} collections in space
        </span>
      </div>

      {/* Workspace & Space 2-Col Grid */}
      <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label
            htmlFor="ext-select-org"
            className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Workspace
          </label>
          <select
            id="ext-select-org"
            aria-label="Workspace"
            data-testid="destination-org-select"
            value={selectedOrganizationId}
            onChange={(e) => onSelectOrganization(e.target.value)}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs text-foreground font-medium transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="ext-select-space"
            className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Space
          </label>
          <select
            id="ext-select-space"
            aria-label="Space"
            data-testid="destination-space-select"
            value={selectedSpaceId}
            onChange={(e) => onSelectSpace(e.target.value)}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs text-foreground font-medium transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {filteredSpaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collection & Group 2-Col Grid */}
      <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5 pt-0.5">
        {/* Collection Selection */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ext-select-collection"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate mr-1"
            >
              Collection
            </label>
            <button
              type="button"
              onClick={onCreateCollection}
              className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20 shrink-0"
              title="Create new collection"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>New</span>
            </button>
          </div>

          {filteredCollections.length > 0 ? (
            <select
              id="ext-select-collection"
              aria-label="Collection"
              data-testid="destination-collection-select"
              value={selectedCollectionId}
              onChange={(e) => onSelectCollection(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background/70 px-2 py-1 text-xs text-foreground font-medium transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {filteredCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.groups.reduce((acc, g) => acc + g.items.filter((i) => !i.isDeleted).length, 0)} items)
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-2 py-1 bg-muted/20">
              <span className="text-[10px] text-muted-foreground truncate">No collections</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCreateCollection}
                className="h-5 px-1.5 text-[9px]"
              >
                <FolderPlus className="h-2.5 w-2.5 mr-0.5" />
                Create
              </Button>
            </div>
          )}
        </div>

        {/* Group Selection */}
        {filteredCollections.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ext-select-group"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate mr-1"
              >
                Group
              </label>
              <button
                type="button"
                onClick={onCreateGroup}
                className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20 shrink-0"
                title="Create new group"
              >
                <Plus className="h-2.5 w-2.5" />
                <span>New</span>
              </button>
            </div>

            <select
              id="ext-select-group"
              aria-label="Group"
              data-testid="destination-group-select"
              value={selectedGroupId}
              onChange={(e) => onSelectGroup(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background/70 px-2 py-1 text-xs text-foreground font-medium transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.items.filter((i) => !i.isDeleted).length} items)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
