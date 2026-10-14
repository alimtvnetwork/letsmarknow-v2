import { mockWorkspace } from "@/data/mockWorkspace";
import type { AppData, ViewMode } from "@/types/lmn";

export const LOCAL_STORAGE_KEY = "lmn_workspace_store_v1";

export type ActiveFilter = "all" | "starred" | "recent";

export interface StoredWorkspaceState {
  data: AppData;
  activeOrganizationId?: string;
  activeSpaceId?: string;
  viewMode?: ViewMode;
  activeFilter?: ActiveFilter;
}

export function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.organizations) &&
    candidate.organizations.length > 0 &&
    Array.isArray(candidate.spaces) &&
    candidate.spaces.length > 0 &&
    Array.isArray(candidate.collections)
  );
}

export function loadWorkspaceState(): StoredWorkspaceState {
  if (typeof window === "undefined" || !window.localStorage) {
    return { data: mockWorkspace, viewMode: "grid" };
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return { data: mockWorkspace, viewMode: "grid" };
    }

    const parsed = JSON.parse(raw);
      const rawData = isValidAppData(parsed.data) ? parsed.data : mockWorkspace;
      const data: AppData = {
        ...rawData,
        shareSettings: Array.isArray(rawData.shareSettings)
          ? rawData.shareSettings
          : mockWorkspace.shareSettings || [],
      };
      const activeOrgExists = data.organizations.some(
        (org) => org.id === parsed.activeOrganizationId
      );
      const activeSpaceExists = data.spaces.some(
        (space) => space.id === parsed.activeSpaceId
      );

      const viewMode: ViewMode = ["list", "compact", "grid"].includes(parsed.viewMode)
        ? parsed.viewMode
        : "grid";

      const activeFilter: ActiveFilter = ["all", "starred", "recent"].includes(
        parsed.activeFilter
      )
        ? parsed.activeFilter
        : "all";

      return {
        data,
        activeOrganizationId: activeOrgExists
          ? parsed.activeOrganizationId
          : data.organizations[0]?.id,
        activeSpaceId: activeSpaceExists ? parsed.activeSpaceId : undefined,
        viewMode,
        activeFilter,
      };
  } catch (err) {
    console.warn("Failed to load workspace state from localStorage", err);
  }

  return { data: mockWorkspace };
}

export function saveWorkspaceState(state: StoredWorkspaceState): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save workspace state to localStorage", err);
  }
}

export function clearWorkspaceState(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear workspace state from localStorage", err);
  }
}
