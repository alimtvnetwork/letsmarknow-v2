import { beforeEach, describe, expect, it } from "vitest";
import { mockWorkspace } from "@/data/mockWorkspace";
import {
  exportExtensionData,
  importExtensionData,
  loadPreferences,
  loadWorkspaceData,
  quickCreateCollection,
  quickCreateGroup,
  resetExtensionData,
  saveItemToDestination,
  savePreferences,
  saveSessionAsCollection,
  saveTabsToDestination,
  saveWorkspaceData,
} from "./extensionStore";
import type { BrowserTabSnapshot } from "@/types/lmn";

describe("extensionStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads default mock workspace data when storage is empty", async () => {
    const data = await loadWorkspaceData();
    expect(data.organizations.length).toBeGreaterThan(0);
    expect(data.collections.length).toBeGreaterThan(0);
  });

  it("persists and reloads updated workspace data", async () => {
    const initial = await loadWorkspaceData();
    const updated = {
      ...initial,
      organizations: [
        ...initial.organizations,
        { id: "custom-org", name: "Custom Labs", initials: "CL", plan: "Pro" },
      ],
    };

    await saveWorkspaceData(updated);
    const loaded = await loadWorkspaceData();
    expect(loaded.organizations.some((o) => o.id === "custom-org")).toBe(true);
  });

  it("saves an individual tab into chosen destination collection & group", async () => {
    const initial = await loadWorkspaceData();
    const collectionId = initial.collections[0].id;
    const groupId = initial.collections[0].groups[0].id;

    const tab: BrowserTabSnapshot = {
      id: 501,
      title: "TanStack Query",
      url: "https://tanstack.com/query/latest",
      favIconUrl: "https://tanstack.com/favicon.ico",
    };

    const { nextData, savedItem } = await saveItemToDestination({
      tab,
      orgId: initial.organizations[0].id,
      spaceId: initial.spaces[0].id,
      collectionId,
      groupId,
      tags: ["state", "react"],
      color: "teal",
    });

    expect(savedItem.title).toBe("TanStack Query");
    expect(savedItem.url).toBe("https://tanstack.com/query/latest");
    expect(savedItem.tags).toContain("state");

    const targetGroup = nextData.collections
      .find((c) => c.id === collectionId)
      ?.groups.find((g) => g.id === groupId);
    expect(targetGroup?.items.some((i) => i.id === savedItem.id)).toBe(true);
  });

  it("rejects saving invalid URLs", async () => {
    const initial = await loadWorkspaceData();
    const tab: BrowserTabSnapshot = {
      title: "Extensions",
      url: "chrome://extensions",
    };

    await expect(
      saveItemToDestination({
        tab,
        orgId: initial.organizations[0].id,
        spaceId: initial.spaces[0].id,
        collectionId: initial.collections[0].id,
        groupId: initial.collections[0].groups[0].id,
      })
    ).rejects.toThrow();
  });

  it("saves multiple tabs into destination, filtering invalid tabs", async () => {
    const initial = await loadWorkspaceData();
    const collectionId = initial.collections[0].id;
    const groupId = initial.collections[0].groups[0].id;

    const tabs: BrowserTabSnapshot[] = [
      { id: 1, title: "Next.js", url: "https://nextjs.org" },
      { id: 2, title: "Settings", url: "chrome://settings" },
      { id: 3, title: "Remix", url: "https://remix.run" },
    ];

    const { nextData, savedCount } = await saveTabsToDestination({
      tabs,
      orgId: initial.organizations[0].id,
      spaceId: initial.spaces[0].id,
      collectionId,
      groupId,
    });

    expect(savedCount).toBe(2);
    const targetGroup = nextData.collections
      .find((c) => c.id === collectionId)
      ?.groups.find((g) => g.id === groupId);
    expect(targetGroup?.items.some((i) => i.url === "https://nextjs.org")).toBe(true);
    expect(targetGroup?.items.some((i) => i.url === "https://remix.run")).toBe(true);
  });

  it("saves all open tabs as a new session collection", async () => {
    const initial = await loadWorkspaceData();
    const spaceId = initial.spaces[0].id;

    const tabs: BrowserTabSnapshot[] = [
      { id: 1, title: "Vue", url: "https://vuejs.org" },
      { id: 2, title: "Svelte", url: "https://svelte.dev" },
    ];

    const { nextData, newCollection } = await saveSessionAsCollection({
      sessionName: "Testing Session",
      tabs,
      spaceId,
    });

    expect(newCollection.name).toBe("Testing Session");
    expect(nextData.collections.some((c) => c.id === newCollection.id)).toBe(true);
    expect(newCollection.groups[0].items).toHaveLength(2);
  });

  it("quick creates collections and groups", async () => {
    const initial = await loadWorkspaceData();
    const spaceId = initial.spaces[0].id;

    const { nextData: d1, newCollection } = await quickCreateCollection({
      name: "Fast Bookmarks",
      spaceId,
      color: "green",
    });

    expect(newCollection.name).toBe("Fast Bookmarks");
    expect(d1.collections.some((c) => c.id === newCollection.id)).toBe(true);

    const { nextData: d2, newGroup } = await quickCreateGroup({
      name: "Starred Resources",
      collectionId: newCollection.id,
    });

    expect(newGroup.name).toBe("Starred Resources");
    const foundCol = d2.collections.find((c) => c.id === newCollection.id);
    expect(foundCol?.groups.some((g) => g.id === newGroup.id)).toBe(true);
  });

  it("loads and saves extension preferences", async () => {
    const prefs = await loadPreferences();
    expect(prefs.openFullTabAfterSave).toBe(false);

    await savePreferences({
      ...prefs,
      openFullTabAfterSave: true,
      closeTabsAfterSave: true,
      defaultOrganizationId: "org-1",
    });

    const reloaded = await loadPreferences();
    expect(reloaded.openFullTabAfterSave).toBe(true);
    expect(reloaded.closeTabsAfterSave).toBe(true);
    expect(reloaded.defaultOrganizationId).toBe("org-1");
  });

  it("exports, resets, and imports data", async () => {
    const exportedJson = await exportExtensionData();
    expect(exportedJson).toContain("organizations");

    const resetData = await resetExtensionData();
    expect(resetData.organizations[0].name).toBe(mockWorkspace.organizations[0].name);

    const customJson = JSON.stringify({
      organizations: [{ id: "o-imp", name: "Imported Org", initials: "IO", plan: "Enterprise" }],
      spaces: [{ id: "s-imp", organizationId: "o-imp", name: "Imported Space", description: "", accentClass: "" }],
      collections: [],
    });

    const imported = await importExtensionData(customJson);
    expect(imported.organizations[0].id).toBe("o-imp");
  });

  it("handles corrupted/invalid storage data by falling back safely", async () => {
    // Put corrupted data into localStorage
    localStorage.setItem("lmn_workspace_v1", "INVALID_JSON_{{");
    const data = await loadWorkspaceData();
    expect(data.organizations.length).toBeGreaterThan(0);
    expect(data.organizations[0].id).toBe(mockWorkspace.organizations[0].id);

    // Put non-conforming object in storage
    localStorage.setItem("lmn_workspace_v1", JSON.stringify({ random: "data" }));
    const fallbackData = await loadWorkspaceData();
    expect(fallbackData.organizations.length).toBeGreaterThan(0);
  });
});
