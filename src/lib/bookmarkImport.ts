import type { AppData, Collection, ColorLabel, Group, SavedItem } from "@/types/lmn";
import { COLOR_LABELS } from "@/types/lmn";

export interface ChromeBookmarkNode {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: ChromeBookmarkNode[];
}

/**
 * Fallback sample bookmarks for development or test environments where
 * chrome.bookmarks is unavailable.
 */
export const MOCK_CHROME_BOOKMARKS: ChromeBookmarkNode[] = [
  {
    id: "0",
    title: "root",
    children: [
      {
        id: "1",
        title: "Bookmarks bar",
        children: [
          {
            id: "10",
            title: "Development Tools",
            children: [
              {
                id: "101",
                title: "GitHub: Where the world builds software",
                url: "https://github.com",
              },
              {
                id: "102",
                title: "Tailwind CSS - Rapidly build modern websites",
                url: "https://tailwindcss.com",
              },
              {
                id: "103",
                title: "TypeScript Documentation",
                url: "https://www.typescriptlang.org",
              },
            ],
          },
          {
            id: "20",
            title: "Design & UX Inspiration",
            children: [
              {
                id: "201",
                title: "Dribbble - Discover the World's Top Designers",
                url: "https://dribbble.com",
              },
              {
                id: "202",
                title: "Figma: the collaborative interface design tool",
                url: "https://figma.com",
              },
            ],
          },
          {
            id: "30",
            title: "LetsMarkNow Dashboard",
            url: "https://letsmarknow.dev",
          },
        ],
      },
    ],
  },
];

/**
 * Retrieves the browser bookmark tree from the native chrome.bookmarks API
 * or falls back to mock bookmarks if running in a standard browser tab.
 */
export async function getBrowserBookmarkTree(): Promise<ChromeBookmarkNode[]> {
  if (
    typeof chrome !== "undefined" &&
    chrome.bookmarks &&
    typeof chrome.bookmarks.getTree === "function"
  ) {
    return new Promise((resolve, reject) => {
      try {
        chrome.bookmarks.getTree((tree) => {
          if (chrome.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tree as ChromeBookmarkNode[]);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  return MOCK_CHROME_BOOKMARKS;
}

/**
 * Parses standard Netscape Bookmark HTML file (exported by Chrome, Firefox, Safari, Edge).
 */
export function parseHtmlBookmarks(htmlContent: string): ChromeBookmarkNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  function parseDl(dlElement: Element): ChromeBookmarkNode[] {
    const nodes: ChromeBookmarkNode[] = [];
    const children = Array.from(dlElement.children);

    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if (el.tagName.toUpperCase() === "DT") {
        const link = el.querySelector(":scope > a");
        const folderHeader = el.querySelector(":scope > h3");

        if (link) {
          nodes.push({
            id: `import-${Math.random().toString(36).slice(2, 9)}`,
            title: link.textContent?.trim() || link.getAttribute("href") || "Untitled",
            url: link.getAttribute("href") || undefined,
          });
        } else if (folderHeader) {
          const folderTitle = folderHeader.textContent?.trim() || "Imported Folder";
          const subDl = el.querySelector(":scope > dl") || children[i + 1]?.tagName.toUpperCase() === "DL" ? (children[i + 1] as Element) : null;
          const subChildren = subDl ? parseDl(subDl) : [];

          nodes.push({
            id: `folder-${Math.random().toString(36).slice(2, 9)}`,
            title: folderTitle,
            children: subChildren,
          });
        }
      }
    }
    return nodes;
  }

  const rootDl = doc.querySelector("dl");
  if (!rootDl) return [];
  return parseDl(rootDl);
}

interface FlattenedFolder {
  folderName: string;
  items: { title: string; url: string }[];
  subgroups: { groupName: string; items: { title: string; url: string }[] }[];
}

/**
 * Extracts collections and groups from a nested ChromeBookmarkNode tree.
 */
function extractFolders(nodes: ChromeBookmarkNode[]): FlattenedFolder[] {
  const folders: FlattenedFolder[] = [];
  const looseLinks: { title: string; url: string }[] = [];

  function traverse(node: ChromeBookmarkNode, currentFolder: FlattenedFolder | null) {
    if (node.url) {
      if (currentFolder) {
        currentFolder.items.push({ title: node.title || node.url, url: node.url });
      } else {
        looseLinks.push({ title: node.title || node.url, url: node.url });
      }
      return;
    }

    // It's a folder
    const isRootContainer =
      node.id === "0" ||
      node.title === "root" ||
      node.title.toLowerCase() === "bookmarks bar" ||
      node.title.toLowerCase() === "other bookmarks" ||
      node.title.toLowerCase() === "mobile bookmarks";

    if (isRootContainer) {
      if (node.children) {
        for (const child of node.children) {
          traverse(child, null);
        }
      }
      return;
    }

    // Top-level custom folder -> Becomes a collection
    if (!currentFolder) {
      const newFolder: FlattenedFolder = {
        folderName: node.title || "Imported Collection",
        items: [],
        subgroups: [],
      };

      if (node.children) {
        for (const child of node.children) {
          if (child.url) {
            newFolder.items.push({ title: child.title || child.url, url: child.url });
          } else if (child.children) {
            // Nested subfolder -> Becomes a group inside this collection
            const subItems: { title: string; url: string }[] = [];
            for (const subChild of child.children) {
              if (subChild.url) {
                subItems.push({ title: subChild.title || subChild.url, url: subChild.url });
              }
            }
            if (subItems.length > 0) {
              newFolder.subgroups.push({
                groupName: child.title || "Group",
                items: subItems,
              });
            }
          }
        }
      }

      if (newFolder.items.length > 0 || newFolder.subgroups.length > 0) {
        folders.push(newFolder);
      }
    }
  }

  for (const node of nodes) {
    traverse(node, null);
  }

  // Loose links not in any folder -> Put into a general "Imported Bookmarks" collection
  if (looseLinks.length > 0) {
    folders.unshift({
      folderName: "Imported Bookmarks",
      items: looseLinks,
      subgroups: [],
    });
  }

  return folders;
}

/**
 * Imports parsed Chrome bookmark nodes into an active workspace space.
 */
export function importBookmarksToWorkspace(
  data: AppData,
  targetSpaceId: string,
  bookmarkNodes: ChromeBookmarkNode[]
): {
  nextData: AppData;
  importedCollectionCount: number;
  importedItemCount: number;
} {
  const extractedFolders = extractFolders(bookmarkNodes);
  if (extractedFolders.length === 0) {
    return { nextData: data, importedCollectionCount: 0, importedItemCount: 0 };
  }

  let totalItems = 0;
  const newCollections: Collection[] = [];
  const timestamp = new Date().toISOString();

  extractedFolders.forEach((folder, folderIdx) => {
    const colId = `col-imported-${Date.now()}-${folderIdx}-${Math.random().toString(36).slice(2, 6)}`;
    const colColor: ColorLabel = COLOR_LABELS[folderIdx % COLOR_LABELS.length];
    const groups: Group[] = [];

    // Direct items go into default group
    if (folder.items.length > 0) {
      const defaultGroupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const items: SavedItem[] = folder.items.map((it, itIdx) => ({
        id: `item-${Date.now()}-${folderIdx}-${itIdx}-${Math.random().toString(36).slice(2, 6)}`,
        title: it.title,
        url: it.url,
        description: `Imported from browser bookmarks`,
        tags: ["imported"],
        color: colColor,
        addedAt: timestamp,
        source: "manual",
      }));
      totalItems += items.length;

      groups.push({
        id: defaultGroupId,
        name: "General",
        color: colColor,
        items,
      });
    }

    // Subgroups
    folder.subgroups.forEach((sub, subIdx) => {
      const subGroupId = `grp-${Date.now()}-${folderIdx}-${subIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const subColor: ColorLabel = COLOR_LABELS[(folderIdx + subIdx + 1) % COLOR_LABELS.length];
      const items: SavedItem[] = sub.items.map((it, itIdx) => ({
        id: `item-${Date.now()}-${folderIdx}-${subIdx}-${itIdx}-${Math.random().toString(36).slice(2, 6)}`,
        title: it.title,
        url: it.url,
        description: `Imported from browser bookmarks`,
        tags: ["imported"],
        color: subColor,
        addedAt: timestamp,
        source: "manual",
      }));
      totalItems += items.length;

      groups.push({
        id: subGroupId,
        name: sub.groupName,
        color: subColor,
        items,
      });
    });

    if (groups.length > 0) {
      newCollections.push({
        id: colId,
        spaceId: targetSpaceId,
        name: folder.folderName,
        note: `Imported from browser bookmarks (${groups.reduce((acc, g) => acc + g.items.length, 0)} items)`,
        color: colColor,
        icon: "📁",
        isStarred: false,
        groups,
      });
    }
  });

  const nextData: AppData = {
    ...data,
    collections: [...newCollections, ...(data.collections || [])],
  };

  return {
    nextData,
    importedCollectionCount: newCollections.length,
    importedItemCount: totalItems,
  };
}
