import type {
  AppData,
  Collection,
  Group,
  Organization,
  SavedItem,
  ShareSettings,
  ShareTargetType,
  Space,
} from "@/types/lmn";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateShareSlug(targetName: string, targetId: string): string {
  const base = slugify(targetName) || "share";
  const suffix = targetId.replace(/[^a-zA-Z0-9]/g, "").slice(-4) || "link";
  return `${base}-${suffix}`;
}

export function getSharePath(targetType: ShareTargetType, slug: string): string {
  return `/web/share/${slug}`;
}

export function getShareUrl(targetType: ShareTargetType, slug: string): string {
  let origin = typeof window !== "undefined" ? window.location.origin : "";
  if (
    !origin ||
    origin.startsWith("chrome-extension:") ||
    origin.startsWith("moz-extension:") ||
    !origin.startsWith("http")
  ) {
    origin = (import.meta.env?.VITE_WEB_URL as string) || "http://localhost:5173";
  }
  return `${origin}${getSharePath(targetType, slug)}`;
}

export function findShareSettings(
  shareSettings: ShareSettings[] | undefined,
  targetType: ShareTargetType,
  targetId: string
): ShareSettings | undefined {
  if (!shareSettings) return undefined;
  return shareSettings.find(
    (setting) => setting.targetType === targetType && setting.targetId === targetId
  );
}

export interface ResolvedShareItem extends SavedItem {
  collectionName?: string;
  groupName?: string;
}

export interface ResolvedShare {
  status: "found" | "private" | "not_found";
  share?: ShareSettings;
  targetType?: ShareTargetType;
  targetName?: string;
  targetDescription?: string;
  workspaceName?: string;
  items: ResolvedShareItem[];
  singleItem?: ResolvedShareItem;
}

export function resolveShare(
  data: AppData,
  paramTargetType?: string,
  paramSlugOrId?: string
): ResolvedShare {
  if (!paramSlugOrId && !paramTargetType) {
    // Default fallback to first available public share or first collection
    const defaultShare = data.shareSettings?.find((s) => s.visibility === "public");
    if (defaultShare) {
      return resolveShare(data, defaultShare.targetType, defaultShare.publicSlug);
    }
    const firstCol = data.collections[0];
    if (firstCol) {
      const items = firstCol.groups.flatMap((g) =>
        g.items
          .filter((i) => !i.isDeleted)
          .map((i) => ({ ...i, collectionName: firstCol.name, groupName: g.name }))
      );
      return {
        status: "found",
        targetType: "collection",
        targetName: firstCol.name,
        targetDescription: firstCol.note,
        workspaceName: data.organizations[0]?.name || "Workspace",
        items,
      };
    }
    return { status: "not_found", items: [] };
  }

  // Look for matching shareSetting by slug or targetId
  const allShares = data.shareSettings || [];
  const matchedShare = allShares.find((s) => {
    if (paramTargetType && s.targetType !== paramTargetType) {
      // If only one param was passed (e.g. /web/share/:shareId), paramTargetType might be the slug or shareId
      if (s.publicSlug === paramTargetType || s.targetId === paramTargetType || s.id === paramTargetType) {
        return true;
      }
      return false;
    }
    return (
      s.publicSlug === paramSlugOrId ||
      s.targetId === paramSlugOrId ||
      s.id === paramSlugOrId
    );
  });

  // If a share record exists and is marked private
  if (matchedShare && matchedShare.visibility === "private") {
    return {
      status: "private",
      share: matchedShare,
      targetType: matchedShare.targetType,
      items: [],
    };
  }

  let detectedType: ShareTargetType | undefined;
  const probe = paramSlugOrId || paramTargetType || "";
  if (!paramTargetType || !["workspace", "space", "collection", "group", "item"].includes(paramTargetType)) {
    if (data.organizations.some((o) => o.id === probe || slugify(o.name) === probe)) {
      detectedType = "workspace";
    } else if (data.spaces.some((s) => s.id === probe || slugify(s.name) === probe)) {
      detectedType = "space";
    } else if (data.collections.some((c) => c.id === probe || slugify(c.name) === probe)) {
      detectedType = "collection";
    } else if (data.collections.some((c) => c.groups.some((g) => g.id === probe || slugify(g.name) === probe))) {
      detectedType = "group";
    } else if (data.collections.some((c) => c.groups.some((g) => g.items.some((i) => i.id === probe || slugify(i.title) === probe)))) {
      detectedType = "item";
    }
  }

  const effectiveTargetType: ShareTargetType = (matchedShare?.targetType ||
    detectedType ||
    (["workspace", "space", "collection", "group", "item"].includes(paramTargetType || "")
      ? paramTargetType
      : "collection")) as ShareTargetType;

  const targetId = matchedShare?.targetId || probe;

  // 1. Target: WORKSPACE
  if (effectiveTargetType === "workspace") {
    const org =
      data.organizations.find((o) => o.id === targetId || slugify(o.name) === targetId) ||
      (matchedShare ? data.organizations.find((o) => o.id === matchedShare.targetId) : undefined);

    if (!org) return { status: "not_found", items: [] };

    const orgSpaces = data.spaces.filter((s) => s.organizationId === org.id);
    const orgSpaceIds = new Set(orgSpaces.map((s) => s.id));
    const orgCollections = data.collections.filter((c) => orgSpaceIds.has(c.spaceId));

    const items: ResolvedShareItem[] = orgCollections.flatMap((c) =>
      c.groups.flatMap((g) =>
        g.items
          .filter((i) => !i.isDeleted)
          .map((i) => ({ ...i, collectionName: c.name, groupName: g.name }))
      )
    );

    return {
      status: "found",
      share: matchedShare,
      targetType: "workspace",
      targetName: org.name,
      targetDescription: `Shared workspace containing ${orgCollections.length} collections and ${items.length} bookmarks.`,
      workspaceName: org.name,
      items,
    };
  }

  // 2. Target: SPACE
  if (effectiveTargetType === "space") {
    const space =
      data.spaces.find((s) => s.id === targetId || slugify(s.name) === targetId) ||
      (matchedShare ? data.spaces.find((s) => s.id === matchedShare.targetId) : undefined);

    if (!space) return { status: "not_found", items: [] };

    const org = data.organizations.find((o) => o.id === space.organizationId);
    const spaceCols = data.collections.filter((c) => c.spaceId === space.id);

    const items: ResolvedShareItem[] = spaceCols.flatMap((c) =>
      c.groups.flatMap((g) =>
        g.items
          .filter((i) => !i.isDeleted)
          .map((i) => ({ ...i, collectionName: c.name, groupName: g.name }))
      )
    );

    return {
      status: "found",
      share: matchedShare,
      targetType: "space",
      targetName: space.name,
      targetDescription: space.description || `Shared space with ${spaceCols.length} collections.`,
      workspaceName: org?.name || "Workspace",
      items,
    };
  }

  // 3. Target: COLLECTION
  if (effectiveTargetType === "collection") {
    const collection =
      data.collections.find((c) => c.id === targetId || slugify(c.name) === targetId) ||
      (matchedShare ? data.collections.find((c) => c.id === matchedShare.targetId) : undefined);

    if (!collection) return { status: "not_found", items: [] };

    const space = data.spaces.find((s) => s.id === collection.spaceId);
    const org = space ? data.organizations.find((o) => o.id === space.organizationId) : undefined;

    const items: ResolvedShareItem[] = collection.groups.flatMap((g) =>
      g.items
        .filter((i) => !i.isDeleted)
        .map((i) => ({ ...i, collectionName: collection.name, groupName: g.name }))
    );

    return {
      status: "found",
      share: matchedShare,
      targetType: "collection",
      targetName: collection.name,
      targetDescription: collection.note,
      workspaceName: org?.name || "Workspace",
      items,
    };
  }

  // 4. Target: GROUP
  if (effectiveTargetType === "group") {
    let matchedGroup: Group | undefined;
    let parentCollection: Collection | undefined;

    for (const col of data.collections) {
      const g = col.groups.find((grp) => grp.id === targetId || slugify(grp.name) === targetId);
      if (g) {
        matchedGroup = g;
        parentCollection = col;
        break;
      }
    }

    if (!matchedGroup || !parentCollection) return { status: "not_found", items: [] };

    const items: ResolvedShareItem[] = matchedGroup.items
      .filter((i) => !i.isDeleted)
      .map((i) => ({
        ...i,
        collectionName: parentCollection?.name,
        groupName: matchedGroup?.name,
      }));

    return {
      status: "found",
      share: matchedShare,
      targetType: "group",
      targetName: matchedGroup.name,
      targetDescription: `Group inside ${parentCollection.name}`,
      workspaceName: parentCollection.name,
      items,
    };
  }

  // 5. Target: ITEM
  if (effectiveTargetType === "item") {
    let matchedItem: SavedItem | undefined;
    let parentCollection: Collection | undefined;
    let parentGroup: Group | undefined;

    for (const col of data.collections) {
      for (const grp of col.groups) {
        const item = grp.items.find(
          (i) => i.id === targetId || slugify(i.title) === targetId
        );
        if (item && !item.isDeleted) {
          matchedItem = item;
          parentCollection = col;
          parentGroup = grp;
          break;
        }
      }
      if (matchedItem) break;
    }

    if (!matchedItem) return { status: "not_found", items: [] };

    const resolvedSingle: ResolvedShareItem = {
      ...matchedItem,
      collectionName: parentCollection?.name,
      groupName: parentGroup?.name,
    };

    return {
      status: "found",
      share: matchedShare,
      targetType: "item",
      targetName: matchedItem.title,
      targetDescription: matchedItem.description,
      workspaceName: parentCollection?.name || "Bookmark",
      items: [resolvedSingle],
      singleItem: resolvedSingle,
    };
  }

  return { status: "not_found", items: [] };
}
