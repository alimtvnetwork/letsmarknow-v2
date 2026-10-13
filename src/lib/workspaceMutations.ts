import { countActiveItems, createId, getHost } from "@/components/dashboard/helpers";
import type { AppData, Collection, ColorLabel, Group, Organization, SavedItem, Space } from "@/types/lmn";

export function isValidUrl(urlString: string): boolean {
  const trimmed = urlString.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createWorkspaceMutation(
  data: AppData,
  name: string,
  initials: string,
  plan: string
): { nextData: AppData; newOrg: Organization; newSpace: Space } {
  const cleanName = name.trim();
  const cleanInitials = (
    initials.trim() ||
    cleanName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
  ).slice(0, 3).toUpperCase();

  const organization: Organization = {
    id: createId("org"),
    name: cleanName,
    initials: cleanInitials,
    plan: plan || "Free",
  };

  const space: Space = {
    id: createId("space"),
    organizationId: organization.id,
    name: "Inbox",
    description: "Default space for this workspace.",
    accentClass: "bg-primary",
  };

  return {
    nextData: {
      ...data,
      organizations: [...data.organizations, organization],
      spaces: [...data.spaces, space],
    },
    newOrg: organization,
    newSpace: space,
  };
}

export function updateWorkspaceMutation(
  data: AppData,
  orgId: string,
  name: string,
  initials: string,
  plan: string
): AppData {
  const cleanName = name.trim();
  const cleanInitials = (
    initials.trim() ||
    cleanName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
  ).slice(0, 3).toUpperCase();

  return {
    ...data,
    organizations: data.organizations.map((org) =>
      org.id === orgId
        ? {
            ...org,
            name: cleanName || org.name,
            initials: cleanInitials || org.initials,
            plan: plan || org.plan,
          }
        : org
    ),
  };
}

export function deleteWorkspaceMutation(
  data: AppData,
  orgId: string
): { nextData: AppData; nextOrgId: string; nextSpaceId: string } | null {
  if (data.organizations.length <= 1) {
    return null; // Cannot delete last remaining workspace
  }

  const remainingOrgs = data.organizations.filter((org) => org.id !== orgId);
  const deletedSpaceIds = new Set(
    data.spaces.filter((space) => space.organizationId === orgId).map((s) => s.id)
  );

  const remainingSpaces = data.spaces.filter((space) => space.organizationId !== orgId);
  const remainingCollections = data.collections.filter(
    (col) => !deletedSpaceIds.has(col.spaceId)
  );

  const nextOrg = remainingOrgs[0];
  const nextOrgSpaces = remainingSpaces.filter((s) => s.organizationId === nextOrg.id);
  const nextSpaceId = nextOrgSpaces[0]?.id || "";

  return {
    nextData: {
      organizations: remainingOrgs,
      spaces: remainingSpaces,
      collections: remainingCollections,
    },
    nextOrgId: nextOrg.id,
    nextSpaceId,
  };
}

export function createSpaceMutation(
  data: AppData,
  orgId: string,
  name: string,
  description: string,
  accentClass: string
): { nextData: AppData; newSpace: Space } {
  const space: Space = {
    id: createId("space"),
    organizationId: orgId,
    name: name.trim(),
    description: description.trim() || "A new space for organized saved links.",
    accentClass: accentClass || "bg-primary",
  };

  return {
    nextData: {
      ...data,
      spaces: [...data.spaces, space],
    },
    newSpace: space,
  };
}

export function updateSpaceMutation(
  data: AppData,
  spaceId: string,
  name: string,
  description: string,
  accentClass: string
): AppData {
  return {
    ...data,
    spaces: data.spaces.map((space) =>
      space.id === spaceId
        ? {
            ...space,
            name: name.trim() || space.name,
            description: description.trim() || space.description,
            accentClass: accentClass || space.accentClass,
          }
        : space
    ),
  };
}

export function deleteSpaceMutation(
  data: AppData,
  spaceId: string,
  orgId: string
): { nextData: AppData; nextSpaceId: string } | null {
  const currentOrgSpaces = data.spaces.filter((s) => s.organizationId === orgId);
  if (currentOrgSpaces.length <= 1) {
    return null; // Cannot delete the last space in workspace
  }

  const remainingSpaces = data.spaces.filter((space) => space.id !== spaceId);
  const remainingCollections = data.collections.filter(
    (col) => col.spaceId !== spaceId
  );

  const nextOrgSpaces = remainingSpaces.filter((s) => s.organizationId === orgId);
  const nextSpaceId = nextOrgSpaces[0]?.id || "";

  return {
    nextData: {
      ...data,
      spaces: remainingSpaces,
      collections: remainingCollections,
    },
    nextSpaceId,
  };
}

export function createCollectionMutation(
  data: AppData,
  spaceId: string,
  name: string,
  note: string,
  color: ColorLabel
): { nextData: AppData; newCollection: Collection } {
  const collection: Collection = {
    id: createId("collection"),
    spaceId,
    name: name.trim(),
    note: note.trim() || "New collection ready for saved tabs, notes, and grouped links.",
    color: color || "pink",
    isStarred: false,
    groups: [{ id: createId("group"), name: "Inbox", items: [] }],
  };

  return {
    nextData: {
      ...data,
      collections: [collection, ...data.collections],
    },
    newCollection: collection,
  };
}

export function updateCollectionMutation(
  data: AppData,
  collectionId: string,
  updater: (collection: Collection) => Collection
): AppData {
  return {
    ...data,
    collections: data.collections.map((col) =>
      col.id === collectionId ? updater(col) : col
    ),
  };
}

export function duplicateCollectionMutation(
  data: AppData,
  collectionId: string
): AppData {
  const source = data.collections.find((c) => c.id === collectionId);
  if (!source) return data;

  const duplicate: Collection = {
    ...source,
    id: createId("collection"),
    name: `${source.name} Copy`,
    isStarred: false,
    groups: source.groups.map((group) => ({
      ...group,
      id: createId("group"),
      items: group.items.map((item) => ({ ...item, id: createId("item") })),
    })),
  };

  return {
    ...data,
    collections: [duplicate, ...data.collections],
  };
}

export function deleteCollectionMutation(data: AppData, collectionId: string): AppData {
  return {
    ...data,
    collections: data.collections.filter((col) => col.id !== collectionId),
  };
}

export function createGroupMutation(
  data: AppData,
  collectionId: string,
  name: string
): AppData {
  const group: Group = {
    id: createId("group"),
    name: name.trim(),
    items: [],
  };

  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: [...col.groups, group],
  }));
}

export function updateGroupMutation(
  data: AppData,
  collectionId: string,
  groupId: string,
  name: string
): AppData {
  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.map((g) => (g.id === groupId ? { ...g, name: name.trim() || g.name } : g)),
  }));
}

export function deleteGroupMutation(
  data: AppData,
  collectionId: string,
  groupId: string
): AppData | null {
  const collection = data.collections.find((c) => c.id === collectionId);
  if (!collection || collection.groups.length <= 1) {
    return null; // Cannot delete the last group in a collection
  }

  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.filter((g) => g.id !== groupId),
  }));
}

export function createItemMutation(
  data: AppData,
  collectionId: string,
  groupId: string,
  item: Omit<SavedItem, "id" | "addedAt">
): AppData {
  const fullItem: SavedItem = {
    ...item,
    id: createId("item"),
    addedAt: "Just now",
  };

  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.map((g) =>
      g.id === groupId ? { ...g, items: [fullItem, ...g.items] } : g
    ),
  }));
}

export function updateItemMutation(
  data: AppData,
  collectionId: string,
  groupId: string,
  itemId: string,
  updates: Partial<SavedItem>
): AppData {
  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            items: g.items.map((i) =>
              i.id === itemId
                ? { ...i, ...updates, addedAt: "Updated now" }
                : i
            ),
          }
        : g
    ),
  }));
}

export function duplicateItemMutation(
  data: AppData,
  collectionId: string,
  groupId: string,
  itemId: string
): AppData {
  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.map((group) => {
      if (group.id !== groupId) return group;
      const item = group.items.find((i) => i.id === itemId);
      return item
        ? {
            ...group,
            items: [
              { ...item, id: createId("item"), title: `${item.title} Copy` },
              ...group.items,
            ],
          }
        : group;
    }),
  }));
}

export function softDeleteItemMutation(
  data: AppData,
  collectionId: string,
  groupId: string,
  itemId: string
): AppData {
  return updateCollectionMutation(data, collectionId, (col) => ({
    ...col,
    groups: col.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map((item) =>
              item.id === itemId ? { ...item, isDeleted: true } : item
            ),
          }
        : group
    ),
  }));
}

export function restoreItemMutation(data: AppData, itemId: string): AppData {
  return {
    ...data,
    collections: data.collections.map((col) => ({
      ...col,
      groups: col.groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.id === itemId ? { ...item, isDeleted: false } : item
        ),
      })),
    })),
  };
}

export function moveItemMutation(
  data: AppData,
  sourceCollectionId: string,
  sourceGroupId: string,
  itemId: string,
  targetCollectionId: string,
  targetGroupId: string
): AppData | null {
  if (sourceCollectionId === targetCollectionId && sourceGroupId === targetGroupId) {
    return null;
  }

  const movingItem = data.collections
    .find((c) => c.id === sourceCollectionId)
    ?.groups.find((g) => g.id === sourceGroupId)
    ?.items.find((i) => i.id === itemId);

  if (!movingItem) return null;

  return {
    ...data,
    collections: data.collections.map((col) => {
      if (col.id === sourceCollectionId && col.id === targetCollectionId) {
        return {
          ...col,
          groups: col.groups.map((group) => {
            if (group.id === sourceGroupId) {
              return { ...group, items: group.items.filter((i) => i.id !== itemId) };
            }
            if (group.id === targetGroupId) {
              return { ...group, items: [movingItem, ...group.items] };
            }
            return group;
          }),
        };
      }

      if (col.id === sourceCollectionId) {
        return {
          ...col,
          groups: col.groups.map((group) =>
            group.id === sourceGroupId
              ? { ...group, items: group.items.filter((i) => i.id !== itemId) }
              : group
          ),
        };
      }

      if (col.id === targetCollectionId) {
        return {
          ...col,
          groups: col.groups.map((group) =>
            group.id === targetGroupId
              ? { ...group, items: [movingItem, ...group.items] }
              : group
          ),
        };
      }

      return col;
    }),
  };
}
