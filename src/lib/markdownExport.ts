import { toast } from "sonner";
import type { Collection, Group, SavedItem, Space } from "@/types/lmn";

/**
 * Formats a single saved item as a Markdown link list item.
 */
export function itemToMarkdown(item: SavedItem): string {
  const title = (item.title || item.url || "Untitled").trim();
  const url = item.url?.trim() || "";
  const noteSuffix = item.userNote?.trim() ? ` — _${item.userNote.trim()}_` : "";
  return `- [${title}](${url})${noteSuffix}`;
}

/**
 * Formats a group of items as Markdown.
 */
export function groupToMarkdown(group: Group, includeHeader = true): string {
  const lines: string[] = [];
  const activeItems = group.items.filter((i) => !i.isDeleted && i.url);

  const isDefaultName =
    !group.name ||
    group.name.trim().toLowerCase() === "general" ||
    group.name.trim().toLowerCase() === "inbox";

  if (includeHeader && !isDefaultName) {
    lines.push(`### ${group.name.trim()}`);
    lines.push("");
  }

  activeItems.forEach((item) => {
    lines.push(itemToMarkdown(item));
  });

  return lines.join("\n");
}

/**
 * Formats a complete collection with its groups and items as Markdown.
 */
export function collectionToMarkdown(collection: Collection): string {
  const lines: string[] = [];
  const colTitle = collection.icon ? `${collection.icon} ${collection.name.trim()}` : collection.name.trim();
  lines.push(`## ${colTitle}`);

  if (collection.note?.trim()) {
    lines.push("");
    lines.push(`*${collection.note.trim()}*`);
  }
  lines.push("");

  const visibleGroups = collection.groups.filter((g) =>
    g.items.some((i) => !i.isDeleted && i.url)
  );

  const isSingleGroup = visibleGroups.length <= 1;

  visibleGroups.forEach((g) => {
    const groupMd = groupToMarkdown(g, !isSingleGroup);
    if (groupMd.trim()) {
      lines.push(groupMd);
      lines.push("");
    }
  });

  return lines.join("\n").trim();
}

/**
 * Formats an entire space and all its collections as Markdown.
 */
export function spaceToMarkdown(space: Space, collections: Collection[]): string {
  const lines: string[] = [];
  const spaceTitle = space.icon ? `${space.icon} ${space.name.trim()}` : space.name.trim();
  lines.push(`# ${spaceTitle}`);

  if (space.description?.trim()) {
    lines.push("");
    lines.push(`*${space.description.trim()}*`);
  }
  lines.push("");

  const activeCollections = collections.filter(
    (c) =>
      c.spaceId === space.id &&
      c.groups.some((g) => g.items.some((i) => !i.isDeleted && i.url))
  );

  activeCollections.forEach((col, idx) => {
    const colMd = collectionToMarkdown(col);
    if (colMd.trim()) {
      lines.push(colMd);
      if (idx < activeCollections.length - 1) {
        lines.push("");
        lines.push("---");
        lines.push("");
      }
    }
  });

  return lines.join("\n").trim();
}

/**
 * Copies the provided Markdown text to clipboard and fires a user toast.
 */
export async function copyMarkdownToClipboard(
  text: string,
  count?: number,
  label = "links"
): Promise<boolean> {
  if (!text.trim()) {
    toast.error("No links to export");
    return false;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      const msg = count !== undefined ? `Copied ${count} ${label} as Markdown` : "Copied as Markdown";
      toast.success(msg);
      return true;
    }
  } catch (err) {
    console.warn("Clipboard write failed, trying fallback:", err);
  }

  // Fallback using textarea execCommand
  try {
    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      const msg = count !== undefined ? `Copied ${count} ${label} as Markdown` : "Copied as Markdown";
      toast.success(msg);
      return true;
    }
  } catch {
    toast.error("Failed to copy Markdown to clipboard");
  }

  return false;
}

/**
 * Triggers a client-side download of a .md file.
 */
export function downloadMarkdownFile(filename: string, content: string): void {
  if (!content.trim()) {
    toast.error("No content to export");
    return;
  }

  try {
    const cleanFilename = filename.endsWith(".md") ? filename : `${filename}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${cleanFilename}`);
  } catch (err) {
    console.error("Export download failed:", err);
    toast.error("Failed to download Markdown file");
  }
}
