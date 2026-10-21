import { cleanWorkspace, mockWorkspace } from "@/data/mockWorkspace";
import type { AppData, ViewMode } from "@/types/lmn";

export const LOCAL_STORAGE_KEY = "lmn_workspace_store_v1";
export const VIEW_MODE_STORAGE_KEY = "lmn_selected_view_mode_v1";

export type ActiveFilter = "all" | "starred" | "recent";

export interface StoredWorkspaceState {
  data: AppData;
  activeOrganizationId?: string;
  activeSpaceId?: string;
  viewMode?: ViewMode;
  activeFilter?: ActiveFilter;
}

const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

function hasMockCollections(data: AppData): boolean {
  if (!data || !Array.isArray(data.collections)) return false;
  const mockIds = new Set(["collection-design", "collection-productivity", "collection-growth"]);
  return data.collections.some((col) => mockIds.has(col.id));
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
  const defaultFallback = isTestEnv ? mockWorkspace : cleanWorkspace;

  if (typeof window === "undefined" || !window.localStorage) {
    return { data: defaultFallback, viewMode: "grid" };
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return { data: defaultFallback, viewMode: "grid" };
    }

    const parsed = JSON.parse(raw);

    // If stored state in real browser is the old default mock dummy data, purge it to clean state
    if (!isTestEnv && parsed?.data && hasMockCollections(parsed.data)) {
      saveWorkspaceState({ data: cleanWorkspace, viewMode: "grid" });
      return { data: cleanWorkspace, viewMode: "grid" };
    }

    const rawData = isValidAppData(parsed.data) ? parsed.data : defaultFallback;
    const data: AppData = {
      ...rawData,
      shareSettings: Array.isArray(rawData.shareSettings)
        ? rawData.shareSettings
        : defaultFallback.shareSettings || [],
    };
    const activeOrgExists = data.organizations.some(
      (org) => org.id === parsed.activeOrganizationId
    );
    const activeSpaceExists = data.spaces.some(
      (space) => space.id === parsed.activeSpaceId
    );

    let viewMode: ViewMode = ["list", "compact", "grid", "mindmap"].includes(parsed.viewMode)
      ? parsed.viewMode
      : "grid";

    try {
      const directSaved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (directSaved) {
        const clean = directSaved.replace(/"/g, "").trim();
        if (["list", "compact", "grid", "mindmap"].includes(clean)) {
          viewMode = clean as ViewMode;
        }
      }
    } catch {
      // ignore
    }

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

  return { data: defaultFallback };
}

export function saveWorkspaceState(state: StoredWorkspaceState): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    if (state.viewMode && ["list", "compact", "grid", "mindmap"].includes(state.viewMode)) {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, state.viewMode);
    }
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
