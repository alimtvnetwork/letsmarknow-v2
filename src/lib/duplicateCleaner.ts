import type { AppData, Collection, SavedItem } from "@/types/lmn";
import { normalizeUrl } from "@/extension/lib/tabCapture";

export interface DuplicateItemRef {
  item: SavedItem;
  collectionId: string;
  collectionName: string;
  groupId: string;
  groupName: string;
}

export interface DuplicateGroup {
  normalizedUrl: string;
  displayUrl: string;
  title: string;
  newestItem: DuplicateItemRef;
  duplicateItems: DuplicateItemRef[];
  totalCount: number;
}

/**
 * Parses recency score for item ordering (higher = newer).
 */
export function getItemRecencyScore(item: SavedItem): number {
  if (!item.addedAt) return 0;
  const lower = item.addedAt.trim().toLowerCase();
  if (lower === "just now" || lower === "updated now") return 9999999999999;
  if (lower === "today") return 9999999999998;
  if (lower === "yesterday") return 9999999999990;
  const parsed = Date.parse(item.addedAt);
  if (!isNaN(parsed)) return parsed;
  return 0;
}

/**
 * Finds all duplicated active links across collections, grouped by normalized URL.
 * Automatically classifies the newest item vs older duplicate copies to be cleaned.
 */
export function findDuplicateGroups(collections: Collection[] = []): DuplicateGroup[] {
  const urlMap = new Map<string, DuplicateItemRef[]>();

  for (const col of collections) {
    for (const grp of col.groups) {
      for (const item of grp.items) {
        if (!item.isDeleted && item.url) {
          const norm = normalizeUrl(item.url);
          if (norm) {
            const list = urlMap.get(norm) ?? [];
            list.push({
              item,
              collectionId: col.id,
              collectionName: col.name,
              groupId: grp.id,
              groupName: grp.name,
            });
            urlMap.set(norm, list);
          }
        }
      }
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];

  for (const [normUrl, refs] of urlMap.entries()) {
    if (refs.length > 1) {
      // Sort newest item first:
      // 1. Recency score descending
      // 2. Metadata completeness (preview image, description, tags)
      const sorted = [...refs].sort((a, b) => {
        const scoreA = getItemRecencyScore(a.item);
        const scoreB = getItemRecencyScore(b.item);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Fallback: prefer item with preview image or description
        const metaScoreA = (a.item.previewImageUrl ? 2 : 0) + (a.item.description ? 1 : 0);
        const metaScoreB = (b.item.previewImageUrl ? 2 : 0) + (b.item.description ? 1 : 0);
        return metaScoreB - metaScoreA;
      });

      const newestItem = sorted[0];
      const duplicateItems = sorted.slice(1);

      duplicateGroups.push({
        normalizedUrl: normUrl,
        displayUrl: newestItem.item.url,
        title: newestItem.item.title || newestItem.item.url,
        newestItem,
        duplicateItems,
        totalCount: refs.length,
      });
    }
  }

  // Sort groups with the highest duplicate count first
  return duplicateGroups.sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Counts the total number of redundant duplicate items across all duplicate groups.
 */
export function countRedundantDuplicates(duplicateGroups: DuplicateGroup[]): number {
  return duplicateGroups.reduce((acc, g) => acc + g.duplicateItems.length, 0);
}

/**
 * Cleans duplicates across workspace data by moving older redundant copies to trash.
 * Preserves the single newest item for each URL.
 */
export function cleanDuplicatesMutation(
  data: AppData,
  duplicateGroups: DuplicateGroup[],
  mode: "trash" | "permanent" = "trash"
): { nextData: AppData; cleanedCount: number } {
  const duplicateItemIds = new Set<string>();
  for (const group of duplicateGroups) {
    for (const dup of group.duplicateItems) {
      duplicateItemIds.add(dup.item.id);
    }
  }

  if (duplicateItemIds.size === 0) {
    return { nextData: data, cleanedCount: 0 };
  }

  const now = new Date().toISOString();
  let cleanedCount = 0;

  const nextCollections = data.collections.map((col) => ({
    ...col,
    groups: col.groups.map((grp) => {
      if (mode === "permanent") {
        const remainingItems = grp.items.filter((item) => {
          if (duplicateItemIds.has(item.id)) {
            cleanedCount++;
            return false;
          }
          return true;
        });
        return { ...grp, items: remainingItems };
      } else {
        const nextItems = grp.items.map((item) => {
          if (duplicateItemIds.has(item.id) && !item.isDeleted) {
            cleanedCount++;
            return {
              ...item,
              isDeleted: true,
              deletedAt: item.deletedAt || now,
            };
          }
          return item;
        });
        return { ...grp, items: nextItems };
      }
    }),
  }));

  return {
    nextData: {
      ...data,
      collections: nextCollections,
    },
    cleanedCount,
  };
}
