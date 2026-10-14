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
    <div className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-3 text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <span className="font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Destination
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Workspace select */}
        <div className="space-y-1">
          <label
            htmlFor="ext-select-org"
            className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            Workspace
          </label>
          <select
            id="ext-select-org"
            aria-label="Workspace"
            data-testid="destination-org-select"
            value={selectedOrganizationId}
            onChange={(e) => onSelectOrganization(e.target.value)}
            className="w-full rounded-md border border-input bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Space select */}
        <div className="space-y-1">
          <label
            htmlFor="ext-select-space"
            className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            Space
          </label>
          <select
            id="ext-select-space"
            aria-label="Space"
            data-testid="destination-space-select"
            value={selectedSpaceId}
            onChange={(e) => onSelectSpace(e.target.value)}
            className="w-full rounded-md border border-input bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {filteredSpaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collection select + quick create */}
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="ext-select-collection"
            className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            Collection
          </label>
          <button
            type="button"
            onClick={onCreateCollection}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            title="Create new collection"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>

        {filteredCollections.length > 0 ? (
          <select
            id="ext-select-collection"
            aria-label="Collection"
            data-testid="destination-collection-select"
            value={selectedCollectionId}
            onChange={(e) => onSelectCollection(e.target.value)}
            className="w-full rounded-md border border-input bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {filteredCollections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.groups.reduce((acc, g) => acc + g.items.filter((i) => !i.isDeleted).length, 0)})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-2 py-1.5 bg-muted/20">
            <span className="text-[11px] text-muted-foreground">No collections in this space</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCreateCollection}
              className="h-6 px-2 text-[10px]"
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Create
            </Button>
          </div>
        )}
      </div>

      {/* Group select + quick create */}
      {filteredCollections.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ext-select-group"
              className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Group
            </label>
            <button
              type="button"
              onClick={onCreateGroup}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              title="Create new group"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>

          <select
            id="ext-select-group"
            aria-label="Group"
            data-testid="destination-group-select"
            value={selectedGroupId}
            onChange={(e) => onSelectGroup(e.target.value)}
            className="w-full rounded-md border border-input bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
  );
}
