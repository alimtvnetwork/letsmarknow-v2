import { describe, expect, it } from "vitest";
import {
  findDuplicateGroups,
  countRedundantDuplicates,
  cleanDuplicatesMutation,
  getItemRecencyScore,
} from "./duplicateCleaner";
import { extractWorkspaceUrlStats } from "@/extension/lib/tabCapture";
import type { AppData, Collection } from "@/types/lmn";

describe("duplicateCleaner", () => {
  const sampleCollections: Collection[] = [
    {
      id: "col-1",
      spaceId: "space-1",
      name: "Dev Resources",
      note: "",
      color: "blue",
      isStarred: false,
      groups: [
        {
          id: "grp-1",
          name: "Docs",
          color: "blue",
          items: [
            {
              id: "item-1",
              title: "React Docs (Older)",
              url: "https://react.dev",
              description: "",
              tags: [],
              color: "blue",
              addedAt: "2026-01-01T10:00:00.000Z",
              isDeleted: false,
            },
            {
              id: "item-2",
              title: "Vite Docs",
              url: "https://vitejs.dev",
              description: "",
              tags: [],
              color: "purple",
              addedAt: "2026-02-01T10:00:00.000Z",
              isDeleted: false,
            },
          ],
        },
      ],
    },
    {
      id: "col-2",
      spaceId: "space-1",
      name: "Frontend Toolkit",
      note: "",
      color: "purple",
      isStarred: false,
      groups: [
        {
          id: "grp-2",
          name: "React Ecosystem",
          color: "purple",
          items: [
            {
              id: "item-3",
              title: "React Docs (Newer)",
              url: "https://react.dev/", // trailing slash normalizes to same
              description: "The React library documentation",
              tags: ["react", "frontend"],
              color: "blue",
              addedAt: "2026-03-01T12:00:00.000Z",
              isDeleted: false,
            },
            {
              id: "item-4",
              title: "React Docs (Middle)",
              url: "https://react.dev",
              description: "",
              tags: [],
              color: "blue",
              addedAt: "2026-02-15T09:00:00.000Z",
              isDeleted: false,
            },
            {
              id: "item-5",
              title: "Vite Docs Deleted",
              url: "https://vitejs.dev",
              description: "",
              tags: [],
              color: "purple",
              addedAt: "2026-02-10T00:00:00.000Z",
              isDeleted: true, // Should be ignored
            },
          ],
        },
      ],
    },
  ];

  it("evaluates recency score appropriately for various date strings", () => {
    expect(getItemRecencyScore({ addedAt: "Just now" } as any)).toBeGreaterThan(
      getItemRecencyScore({ addedAt: "Today" } as any)
    );
    expect(getItemRecencyScore({ addedAt: "Today" } as any)).toBeGreaterThan(
      getItemRecencyScore({ addedAt: "Yesterday" } as any)
    );
    expect(getItemRecencyScore({ addedAt: "2026-03-01T12:00:00.000Z" } as any)).toBeGreaterThan(
      getItemRecencyScore({ addedAt: "2026-01-01T10:00:00.000Z" } as any)
    );
  });

  it("finds duplicate groups across collections and selects newest item", () => {
    const groups = findDuplicateGroups(sampleCollections);
    expect(groups).toHaveLength(1); // Only react.dev is duplicated (vite has 1 active, 1 deleted)

    const reactGroup = groups[0];
    expect(reactGroup.normalizedUrl).toBe("https://react.dev");
    expect(reactGroup.totalCount).toBe(3);
    expect(reactGroup.newestItem.item.id).toBe("item-3"); // March 1st is newest
    expect(reactGroup.newestItem.item.title).toBe("React Docs (Newer)");
    expect(reactGroup.duplicateItems).toHaveLength(2);
    expect(reactGroup.duplicateItems.map((d) => d.item.id)).toEqual(["item-4", "item-1"]);
  });

  it("counts redundant duplicates accurately", () => {
    const groups = findDuplicateGroups(sampleCollections);
    const count = countRedundantDuplicates(groups);
    expect(count).toBe(2); // 3 items minus 1 keeper = 2 to clean
  });

  it("cleans duplicates via soft-delete mutation preserving the newest item", () => {
    const data: AppData = {
      organizations: [],
      spaces: [],
      collections: sampleCollections,
      sessions: [],
    };

    const groups = findDuplicateGroups(data.collections);
    const { nextData, cleanedCount } = cleanDuplicatesMutation(data, groups, "trash");

    expect(cleanedCount).toBe(2);

    // Verify item-3 is preserved and active
    const keptItem = nextData.collections
      .find((c) => c.id === "col-2")
      ?.groups.find((g) => g.id === "grp-2")
      ?.items.find((i) => i.id === "item-3");
    expect(keptItem?.isDeleted).toBe(false);

    // Verify item-1 and item-4 are marked as deleted
    const deleted1 = nextData.collections
      .find((c) => c.id === "col-1")
      ?.groups.find((g) => g.id === "grp-1")
      ?.items.find((i) => i.id === "item-1");
    expect(deleted1?.isDeleted).toBe(true);
    expect(deleted1?.deletedAt).toBeTruthy();

    const deleted4 = nextData.collections
      .find((c) => c.id === "col-2")
      ?.groups.find((g) => g.id === "grp-2")
      ?.items.find((i) => i.id === "item-4");
    expect(deleted4?.isDeleted).toBe(true);

    // Re-evaluating duplicates after cleaning should yield 0 duplicates
    const nextGroups = findDuplicateGroups(nextData.collections);
    expect(nextGroups).toHaveLength(0);
    expect(countRedundantDuplicates(nextGroups)).toBe(0);

    // Workspace url stats count for react.dev should now be 1
    const stats = extractWorkspaceUrlStats(nextData.collections);
    expect(stats.urlCounts.get("https://react.dev")).toBe(1);
  });
});
