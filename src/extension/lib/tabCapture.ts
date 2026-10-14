import type { BrowserTabSnapshot, Collection, ColorLabel, SavedItem } from "@/types/lmn";

const DISALLOWED_PROTOCOLS = [
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "data:",
  "javascript:",
  "view-source:",
  "brave:",
  "devtools:",
];

/**
 * Validates whether a URL is a saveable web page (http/https).
 * Internal, extension, browser, and blank pages are disallowed.
 */
export function isSaveableUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  for (const protocol of DISALLOWED_PROTOCOLS) {
    if (lower.startsWith(protocol)) return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts the clean hostname/domain from a URL.
 */
export function getDomainFromUrl(url?: string | null): string {
  if (!url) return "unknown";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Filters a list of tab snapshots, keeping only saveable tabs.
 */
export function filterSaveableTabs(tabs: BrowserTabSnapshot[]): BrowserTabSnapshot[] {
  return tabs.filter((tab) => isSaveableUrl(tab.url));
}

/**
 * Converts a browser tab snapshot into a SavedItem payload.
 */
export function tabToSavedItem(
  tab: BrowserTabSnapshot,
  options?: {
    source?: "manual" | "current-tab" | "session";
    tags?: string[];
    description?: string;
    color?: ColorLabel;
  }
): Omit<SavedItem, "id" | "addedAt"> {
  const domain = getDomainFromUrl(tab.url);
  return {
    title: tab.title?.trim() || domain || "Untitled Tab",
    url: tab.url,
    description: options?.description ?? `Captured from ${domain}`,
    tags: options?.tags ?? (domain && domain !== "unknown" ? [domain] : []),
    color: options?.color ?? "pink",
    faviconUrl: tab.favIconUrl,
    source: options?.source ?? "current-tab",
    isDeleted: false,
  };
}

/**
 * Generates a default session name based on the date, e.g. "Session - Oct 13".
 */
export function generateSessionName(date: Date = new Date()): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `Session - ${month} ${day}`;
}

/**
  * Normalizes a URL for comparison: lowercase hostname, stripped trailing slash, stripped hash fragment.
  */
export function normalizeUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${parsed.search}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}

export interface WorkspaceUrlStats {
  urlSet: Set<string>;
  urlCounts: Map<string, number>;
  urlToCollectionMap: Map<string, string>;
}

/**
 * Extracts URL statistics from all active collections in a workspace.
 */
export function extractWorkspaceUrlStats(collections: Collection[] = []): WorkspaceUrlStats {
  const urlSet = new Set<string>();
  const urlCounts = new Map<string, number>();
  const urlToCollectionMap = new Map<string, string>();

  for (const col of collections) {
    for (const grp of col.groups) {
      for (const item of grp.items) {
        if (!item.isDeleted && item.url) {
          const norm = normalizeUrl(item.url);
          if (norm) {
            urlSet.add(norm);
            urlCounts.set(norm, (urlCounts.get(norm) || 0) + 1);
            if (!urlToCollectionMap.has(norm)) {
              urlToCollectionMap.set(norm, col.name);
            }
          }
        }
      }
    }
  }

  return { urlSet, urlCounts, urlToCollectionMap };
}

/**
 * Extracts normalized URLs from currently open browser tabs.
 */
export function extractOpenUrlSet(tabs: BrowserTabSnapshot[] = []): Set<string> {
  const set = new Set<string>();
  for (const tab of tabs) {
    if (tab.url) {
      const norm = normalizeUrl(tab.url);
      if (norm) set.add(norm);
    }
  }
  return set;
}
