import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MindmapView, computeAutoLayout } from "./MindmapView";
import type { Collection, Group, SavedItem } from "@/types/lmn";

// Mock API client
vi.mock("@/lib/workspaceApiClient", () => ({
  fetchBackendMindmapLayouts: vi.fn().mockResolvedValue([]),
  fetchBackendMindmapLayout: vi.fn(),
  createBackendMindmapLayout: vi.fn(),
}));

describe("MindmapView Component & computeAutoLayout", () => {
  const mockCollection: Collection = {
    id: "col-123",
    name: "Engineering Resources",
    color: "#6366f1",
    icon: "folder",
    groups: [],
    itemCount: 2,
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockGroups: Group[] = [
    {
      id: "grp-1",
      name: "Architecture Specs",
      color: "#3b82f6",
      collectionId: "col-123",
      items: [],
      order: 0,
    },
    {
      id: "grp-2",
      name: "API Guides",
      color: "#10b981",
      collectionId: "col-123",
      items: [],
      order: 1,
    },
  ];

  const mockItems: SavedItem[] = [
    {
      id: "item-1",
      title: "SQLite Split-DB Spec",
      url: "https://example.com/split-db",
      collectionId: "col-123",
      groupId: "grp-1",
      tags: ["db"],
      color: "#6366f1",
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-2",
      title: "REST Endpoints",
      url: "https://example.com/api",
      collectionId: "col-123",
      groupId: "grp-2",
      tags: ["api"],
      color: "#10b981",
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes radial auto-layout deterministically", () => {
    const layout = computeAutoLayout(mockCollection, mockGroups, mockItems);

    expect(layout.nodes).toHaveLength(5); // 1 collection + 2 groups + 2 items
    expect(layout.edges).toHaveLength(4); // 2 col-grp edges + 2 grp-item edges

    const centerNode = layout.nodes.find((n) => n.kind === "collection");
    expect(centerNode).toBeDefined();
    expect(centerNode?.x).toBe(0);
    expect(centerNode?.y).toBe(0);
    expect(centerNode?.label).toBe("Engineering Resources");

    const groupNodes = layout.nodes.filter((n) => n.kind === "group");
    expect(groupNodes).toHaveLength(2);

    const itemNodes = layout.nodes.filter((n) => n.kind === "item");
    expect(itemNodes).toHaveLength(2);
  });

  it("suppresses single default 'Inbox' group to keep the mindmap direct and clutter-free", () => {
    const singleInboxGroup: Group[] = [
      {
        id: "grp-inbox",
        name: "Inbox",
        color: "#3b82f6",
        collectionId: "col-123",
        items: [],
        order: 0,
      },
    ];

    const layout = computeAutoLayout(mockCollection, singleInboxGroup, mockItems);

    // Group nodes should be 0 because default 'Inbox' is suppressed
    const groupNodes = layout.nodes.filter((n) => n.kind === "group");
    expect(groupNodes).toHaveLength(0);

    // Items attach directly to the collection
    const itemEdges = layout.edges.filter((e) => e.to.startsWith("item-"));
    expect(itemEdges).toHaveLength(2);
    itemEdges.forEach((edge) => {
      expect(edge.from).toBe("col-col-123");
    });
  });

  it("renders the canvas HUD and all nodes without errors", async () => {
    render(
      <MindmapView
        collection={mockCollection}
        groups={mockGroups}
        items={mockItems}
      />
    );

    expect(screen.getByText("Auto Layout")).toBeInTheDocument();
    expect(screen.getByText("Save View")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Engineering Resources")).toBeInTheDocument();
      expect(screen.getByText("Architecture Specs")).toBeInTheDocument();
      expect(screen.getByText("SQLite Split-DB Spec")).toBeInTheDocument();
    });
  });

  it("handles zoom in, zoom out, and reset zoom controls", () => {
    render(
      <MindmapView
        collection={mockCollection}
        groups={mockGroups}
        items={mockItems}
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    const zoomOutBtn = screen.getByTitle("Zoom Out");
    const resetZoomBtn = screen.getByTitle("Reset View");

    expect(screen.getByText("100%")).toBeInTheDocument();

    act(() => {
      fireEvent.click(zoomInBtn);
    });
    expect(screen.getByText("120%")).toBeInTheDocument();

    act(() => {
      fireEvent.click(zoomOutBtn);
    });
    expect(screen.getByText("100%")).toBeInTheDocument();

    act(() => {
      fireEvent.click(zoomInBtn);
      fireEvent.click(zoomInBtn);
    });
    expect(screen.getByText("144%")).toBeInTheDocument();

    act(() => {
      fireEvent.click(resetZoomBtn);
    });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("triggers onItemClick when clicking an item node without drag movement", async () => {
    const onItemClick = vi.fn();
    render(
      <MindmapView
        collection={mockCollection}
        groups={mockGroups}
        items={mockItems}
        onItemClick={onItemClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("mindmap-node-item-item-1")).toBeInTheDocument();
    });

    const itemNode = screen.getByTestId("mindmap-node-item-item-1");

    // Pointer down without moving
    fireEvent.pointerDown(itemNode, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.click(itemNode);

    expect(onItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it("does not trigger onItemClick when pointer moves beyond drag threshold", async () => {
    const onItemClick = vi.fn();
    render(
      <MindmapView
        collection={mockCollection}
        groups={mockGroups}
        items={mockItems}
        onItemClick={onItemClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("mindmap-node-item-item-1")).toBeInTheDocument();
    });

    const itemNode = screen.getByTestId("mindmap-node-item-item-1");

    // Start drag
    fireEvent(
      itemNode,
      new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, button: 0 })
    );

    // Drag move beyond threshold (moved dx = 80, dy = 90)
    fireEvent(
      itemNode,
      new MouseEvent("pointermove", { bubbles: true, clientX: 180, clientY: 190 })
    );
    fireEvent(
      itemNode,
      new MouseEvent("pointerup", { bubbles: true, clientX: 180, clientY: 190 })
    );

    // Click after dragging should be suppressed
    fireEvent.click(itemNode);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("exports layout as JSON when download button is clicked", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <MindmapView
        collection={mockCollection}
        groups={mockGroups}
        items={mockItems}
      />
    );

    const exportBtn = screen.getByTitle("Export Layout as JSON");
    act(() => {
      fireEvent.click(exportBtn);
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();
    anchorClickSpy.mockRestore();
  });
});
