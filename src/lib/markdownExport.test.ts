import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  collectionToMarkdown,
  copyMarkdownToClipboard,
  groupToMarkdown,
  itemToMarkdown,
  spaceToMarkdown,
} from "./markdownExport";
import type { Collection, Group, SavedItem, Space } from "@/types/lmn";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Markdown Export Functions", () => {
  const mockItem1: SavedItem = {
    id: "item-1",
    title: "Google Cloud Console",
    url: "https://console.cloud.google.com",
    description: "Cloud management",
    tags: ["cloud"],
    color: "blue",
    addedAt: "2026-10-27T00:00:00Z",
  };

  const mockItem2: SavedItem = {
    id: "item-2",
    title: "Google Search",
    url: "https://google.com",
    description: "Search engine",
    tags: ["search"],
    color: "pink",
    addedAt: "2026-10-27T00:00:00Z",
  };

  const mockDeletedItem: SavedItem = {
    id: "item-3",
    title: "Old Link",
    url: "https://old.com",
    description: "",
    tags: [],
    color: "teal",
    addedAt: "2026-10-27T00:00:00Z",
    isDeleted: true,
  };

  const mockGroup: Group = {
    id: "group-1",
    name: "General",
    items: [mockItem1, mockItem2, mockDeletedItem],
  };

  const mockNamedGroup: Group = {
    id: "group-2",
    name: "Research",
    items: [mockItem1],
  };

  const mockCollection: Collection = {
    id: "col-1",
    spaceId: "space-1",
    name: "Google Tools",
    note: "Helpful links for daily work",
    color: "pink",
    isStarred: false,
    groups: [mockGroup],
  };

  const mockMultiGroupCollection: Collection = {
    id: "col-2",
    spaceId: "space-1",
    name: "Work Hub",
    note: "",
    color: "blue",
    isStarred: true,
    groups: [mockGroup, mockNamedGroup],
  };

  const mockSpace: Space = {
    id: "space-1",
    organizationId: "org-1",
    name: "Development",
    description: "Engineering and daily tools",
    accentClass: "bg-primary",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("itemToMarkdown formats link cleanly", () => {
    const md = itemToMarkdown(mockItem1);
    expect(md).toBe("- [Google Cloud Console](https://console.cloud.google.com)");
  });

  it("groupToMarkdown suppresses default General header for single group and omits deleted items", () => {
    const md = groupToMarkdown(mockGroup, true);
    expect(md).toContain("- [Google Cloud Console](https://console.cloud.google.com)");
    expect(md).toContain("- [Google Search](https://google.com)");
    expect(md).not.toContain("Old Link");
    expect(md).not.toContain("### General");
  });

  it("groupToMarkdown includes header for custom named groups", () => {
    const md = groupToMarkdown(mockNamedGroup, true);
    expect(md).toContain("### Research");
    expect(md).toContain("- [Google Cloud Console](https://console.cloud.google.com)");
  });

  it("collectionToMarkdown renders collection name, note, and items without redundant headers when single group", () => {
    const md = collectionToMarkdown(mockCollection);
    expect(md).toContain("## Google Tools");
    expect(md).toContain("*Helpful links for daily work*");
    expect(md).toContain("- [Google Cloud Console](https://console.cloud.google.com)");
    expect(md).toContain("- [Google Search](https://google.com)");
    expect(md).not.toContain("### General");
  });

  it("collectionToMarkdown renders group subheaders when multiple groups exist", () => {
    const md = collectionToMarkdown(mockMultiGroupCollection);
    expect(md).toContain("## Work Hub");
    expect(md).toContain("### Research");
    expect(md).toContain("- [Google Cloud Console](https://console.cloud.google.com)");
  });

  it("spaceToMarkdown combines collections within space separated by horizontal rules", () => {
    const md = spaceToMarkdown(mockSpace, [mockCollection, mockMultiGroupCollection]);
    expect(md).toContain("# Development");
    expect(md).toContain("*Engineering and daily tools*");
    expect(md).toContain("## Google Tools");
    expect(md).toContain("## Work Hub");
    expect(md).toContain("---");
  });

  it("copyMarkdownToClipboard copies to navigator.clipboard and calls toast", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const success = await copyMarkdownToClipboard("- [Test](https://test.com)", 1);
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("- [Test](https://test.com)");
    expect(toast.success).toHaveBeenCalledWith("Copied 1 links as Markdown");
  });
});
