import { beforeEach, describe, expect, it } from "vitest";
import { mockWorkspace } from "@/data/mockWorkspace";
import {
  clearWorkspaceState,
  loadWorkspaceState,
  LOCAL_STORAGE_KEY,
  saveWorkspaceState,
} from "./localWorkspaceStore";

describe("localWorkspaceStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads fallback mockWorkspace when localStorage is empty", () => {
    const state = loadWorkspaceState();
    expect(state.data.organizations).toHaveLength(mockWorkspace.organizations.length);
    expect(state.data.spaces).toHaveLength(mockWorkspace.spaces.length);
  });

  it("saves and loads custom workspace state", () => {
    const customData = {
      organizations: [{ id: "org-test", name: "Test Org", initials: "TO", plan: "Pro" }],
      spaces: [{ id: "space-test", organizationId: "org-test", name: "Test Space", description: "", accentClass: "bg-primary" }],
      collections: [],
    };

    saveWorkspaceState({
      data: customData,
      activeOrganizationId: "org-test",
      activeSpaceId: "space-test",
      viewMode: "grid",
      activeFilter: "starred",
    });

    const loaded = loadWorkspaceState();
    expect(loaded.data.organizations[0].name).toBe("Test Org");
    expect(loaded.activeOrganizationId).toBe("org-test");
    expect(loaded.activeSpaceId).toBe("space-test");
    expect(loaded.viewMode).toBe("grid");
    expect(loaded.activeFilter).toBe("starred");
  });

  it("handles corrupted data in localStorage defensively", () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "invalid-json{{");
    const loaded = loadWorkspaceState();
    expect(loaded.data.organizations).toHaveLength(mockWorkspace.organizations.length);
  });

  it("clears workspace state and resets", () => {
    saveWorkspaceState({
      data: mockWorkspace,
      activeOrganizationId: "org-agency",
    });
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).not.toBeNull();

    clearWorkspaceState();
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
  });
});
