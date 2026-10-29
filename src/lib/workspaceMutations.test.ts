import { describe, expect, it } from "vitest";
import {
  createCollectionMutation,
  createSpaceMutation,
  emptyTrashMutation,
  permanentlyDeleteItemMutation,
  purgeExpiredTrashMutation,
  restoreItemMutation,
  softDeleteItemMutation,
  TRASH_RETENTION_MS,
  updateSpaceMutation,
} from "./workspaceMutations";
import type { AppData } from "@/types/lmn";

describe("Trash Retention & Deletion Mutations", () => {
  const baseData: AppData = {
    organizations: [{ id: "org-1", name: "Org", initials: "O", plan: "Free" }],
    spaces: [{ id: "space-1", organizationId: "org-1", name: "Space 1", description: "", accentClass: "" }],
    collections: [
      {
        id: "col-1",
        spaceId: "space-1",
        name: "Collection 1",
        note: "",
        color: "blue",
        isStarred: false,
        groups: [
          {
            id: "grp-1",
            name: "Group 1",
            items: [
              {
                id: "item-active",
                title: "Active Link",
                url: "https://example.com",
                description: "",
                tags: [],
                color: "blue",
                addedAt: new Date().toISOString(),
                isDeleted: false,
              },
              {
                id: "item-recent-trash",
                title: "Recent Deleted Link",
                url: "https://recent.com",
                description: "",
                tags: [],
                color: "pink",
                addedAt: new Date().toISOString(),
                isDeleted: true,
                deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              },
              {
                id: "item-expired-trash",
                title: "Expired Deleted Link (16 days)",
                url: "https://expired.com",
                description: "",
                tags: [],
                color: "teal",
                addedAt: new Date().toISOString(),
                isDeleted: true,
                deletedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ago
              },
            ],
          },
        ],
      },
    ],
    shareSettings: [],
  };

  it("softDeleteItemMutation records isDeleted and deletedAt timestamp", () => {
    const updated = softDeleteItemMutation(baseData, "col-1", "grp-1", "item-active");
    const item = updated.collections[0].groups[0].items.find((i) => i.id === "item-active");
    expect(item?.isDeleted).toBe(true);
    expect(item?.deletedAt).toBeDefined();
  });

  it("restoreItemMutation resets isDeleted and clears deletedAt", () => {
    const restored = restoreItemMutation(baseData, "item-recent-trash");
    const item = restored.collections[0].groups[0].items.find((i) => i.id === "item-recent-trash");
    expect(item?.isDeleted).toBe(false);
    expect(item?.deletedAt).toBeUndefined();
  });

  it("permanentlyDeleteItemMutation removes only the targeted item", () => {
    const next = permanentlyDeleteItemMutation(baseData, "item-recent-trash");
    const items = next.collections[0].groups[0].items;
    expect(items.some((i) => i.id === "item-recent-trash")).toBe(false);
    expect(items.some((i) => i.id === "item-active")).toBe(true);
    expect(items.some((i) => i.id === "item-expired-trash")).toBe(true);
  });

  it("emptyTrashMutation removes all soft-deleted items permanently", () => {
    const next = emptyTrashMutation(baseData);
    const items = next.collections[0].groups[0].items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item-active");
  });

  it("purgeExpiredTrashMutation removes items deleted >= 15 days ago and keeps recent ones", () => {
    const now = Date.now();
    const purged = purgeExpiredTrashMutation(baseData, 15, now);
    const items = purged.collections[0].groups[0].items;

    // Active item kept
    expect(items.some((i) => i.id === "item-active")).toBe(true);
    // Recent item (5 days old) kept in trash
    expect(items.some((i) => i.id === "item-recent-trash")).toBe(true);
    // Expired item (16 days old) permanently purged
    expect(items.some((i) => i.id === "item-expired-trash")).toBe(false);
  });

  it("createSpaceMutation and updateSpaceMutation set and update custom icon/emoji", () => {
    const { nextData, newSpace } = createSpaceMutation(
      baseData,
      "org-1",
      "Launch Space",
      "Space desc",
      "bg-primary",
      "🚀"
    );
    expect(newSpace.icon).toBe("🚀");
    expect(nextData.spaces.find((s) => s.id === newSpace.id)?.icon).toBe("🚀");

    const updatedData = updateSpaceMutation(
      nextData,
      newSpace.id,
      "Launch Space",
      "Space desc",
      "bg-primary",
      "🎨"
    );
    expect(updatedData.spaces.find((s) => s.id === newSpace.id)?.icon).toBe("🎨");
  });

  it("createCollectionMutation supports custom icon/emoji", () => {
    const { nextData, newCollection } = createCollectionMutation(
      baseData,
      "space-1",
      "Design Systems",
      "Note",
      "pink",
      "🎨"
    );
    expect(newCollection.icon).toBe("🎨");
    expect(nextData.collections.find((c) => c.id === newCollection.id)?.icon).toBe("🎨");
  });
});
