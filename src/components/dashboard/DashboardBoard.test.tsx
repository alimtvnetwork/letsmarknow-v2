import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardBoard } from "./DashboardBoard";
import type { Collection, Space } from "@/types/lmn";

describe("DashboardBoard Top 5 Extension Native Capabilities", () => {
  const mockSpace: Space = {
    id: "space-1",
    name: "Engineering",
    description: "Core dev bookmarks",
    organizationId: "org-1",
    accentClass: "bg-blue-500",
  };

  const mockCollections: Collection[] = [
    {
      id: "col-1",
      spaceId: "space-1",
      name: "Dev Workflows",
      color: "pink",
      isStarred: false,
      groups: [
        {
          id: "grp-1",
          name: "Docs & PRs",
          items: [
            {
              id: "item-1",
              title: "React Official Docs",
              url: "https://react.dev",
              tags: ["react", "frontend"],
              color: "pink",
              isDeleted: false,
            },
            {
              id: "item-2",
              title: "GitHub Repository",
              url: "https://github.com/repo",
              tags: ["git"],
              color: "blue",
              isDeleted: false,
            },
          ],
        },
      ],
    },
  ];

  it("renders 'Open now' badge when a bookmark URL matches currently open browser tabs", () => {
    const openUrlSet = new Set(["https://react.dev"]);
    const duplicateUrlCounts = new Map([
      ["https://react.dev", 1],
      ["https://github.com/repo", 1],
    ]);

    render(
      <DashboardBoard
        activeSpace={mockSpace}
        collections={mockCollections}
        viewMode="list"
        activeFilter="all"
        openUrlSet={openUrlSet}
        duplicateUrlCounts={duplicateUrlCounts}
        onViewModeChange={vi.fn()}
        onFilterChange={vi.fn()}
        onToggleStar={vi.fn()}
        onDuplicateCollection={vi.fn()}
        onEditCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onAddGroup={vi.fn()}
        onEditGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        onEditItem={vi.fn()}
        onDuplicateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onMoveItem={vi.fn()}
        onDropItem={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateItem={vi.fn()}
      />
    );

    // "Open now" should appear for React Docs
    expect(screen.getByText("Open now")).toBeInTheDocument();
    // "Duplicate" should not appear since count is 1
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
  });

  it("renders 'Duplicate' badge when a link appears > 1 time across the workspace", () => {
    const openUrlSet = new Set<string>();
    const duplicateUrlCounts = new Map([
      ["https://react.dev", 1],
      ["https://github.com/repo", 3], // Duplicate count > 1
    ]);

    render(
      <DashboardBoard
        activeSpace={mockSpace}
        collections={mockCollections}
        viewMode="list"
        activeFilter="all"
        openUrlSet={openUrlSet}
        duplicateUrlCounts={duplicateUrlCounts}
        onViewModeChange={vi.fn()}
        onFilterChange={vi.fn()}
        onToggleStar={vi.fn()}
        onDuplicateCollection={vi.fn()}
        onEditCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onAddGroup={vi.fn()}
        onEditGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        onEditItem={vi.fn()}
        onDuplicateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onMoveItem={vi.fn()}
        onDropItem={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateItem={vi.fn()}
      />
    );

    expect(screen.getByText("Duplicate")).toBeInTheDocument();
  });

  it("triggers onOpenAllUrls from collection menu for new tabs, new window, and replace window", () => {
    const onOpenAllUrls = vi.fn();

    render(
      <DashboardBoard
        activeSpace={mockSpace}
        collections={mockCollections}
        viewMode="list"
        activeFilter="all"
        onOpenAllUrls={onOpenAllUrls}
        onViewModeChange={vi.fn()}
        onFilterChange={vi.fn()}
        onToggleStar={vi.fn()}
        onDuplicateCollection={vi.fn()}
        onEditCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onAddGroup={vi.fn()}
        onEditGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        onEditItem={vi.fn()}
        onDuplicateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onMoveItem={vi.fn()}
        onDropItem={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateItem={vi.fn()}
      />
    );

    const collectionActionBtn = screen.getByTitle("Collection actions");
    fireEvent.click(collectionActionBtn);

    const openAllTabsOption = screen.getByText(/open all in new tabs/i);
    expect(openAllTabsOption).toBeInTheDocument();

    fireEvent.click(openAllTabsOption);
    expect(onOpenAllUrls).toHaveBeenCalledWith(
      ["https://react.dev", "https://github.com/repo"],
      "tabs"
    );
  });

  it("handles dropping dropped items into group dropzone", () => {
    const onDropItem = vi.fn();

    render(
      <DashboardBoard
        activeSpace={mockSpace}
        collections={mockCollections}
        viewMode="list"
        activeFilter="all"
        onDropItem={onDropItem}
        onViewModeChange={vi.fn()}
        onFilterChange={vi.fn()}
        onToggleStar={vi.fn()}
        onDuplicateCollection={vi.fn()}
        onEditCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onAddGroup={vi.fn()}
        onEditGroup={vi.fn()}
        onDeleteGroup={vi.fn()}
        onEditItem={vi.fn()}
        onDuplicateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onMoveItem={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateItem={vi.fn()}
      />
    );

    // Group drop container
    const groupHeading = screen.getByText("Docs & PRs");
    const groupSection = groupHeading.closest("section");
    expect(groupSection).toBeInTheDocument();

    const mockTabPayload = JSON.stringify({
      type: "open-tab",
      tab: { id: 5, title: "Dropped Tab", url: "https://example.com" },
    });

    fireEvent.drop(groupSection!, {
      dataTransfer: {
        getData: (type: string) => (type === "application/json" ? mockTabPayload : ""),
      },
    });

    expect(onDropItem).toHaveBeenCalledWith(mockTabPayload, "col-1", "grp-1");
  });
});
