import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionTabApp } from "./ExtensionTabApp";

describe("ExtensionTabApp", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the extension tab dashboard with collections and items in grid view by default", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    expect(screen.getByText("LetsMarkNow")).toBeInTheDocument();
    expect(screen.getAllByText("Design Systems")[0]).toBeInTheDocument();

    const gridViewBtn = screen.getByTitle("grid view");
    expect(gridViewBtn.className).toContain("bg-primary");

    const listViewBtn = screen.getByTitle("list view");
    expect(listViewBtn.className).not.toContain("bg-primary");
  });

  it("navigates to Open Browser Tabs view and displays open tabs", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-open-tabs-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-open-tabs-button"));

    await waitFor(() => {
      expect(screen.getByText(/Currently Open Browser Tabs/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId("save-all-session-button")).toBeInTheDocument();
    expect(screen.getByTestId("save-selected-tabs-button")).toBeInTheDocument();
  });

  it("opens session save dialog from Open Browser Tabs view", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-open-tabs-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-open-tabs-button"));

    await waitFor(() => {
      expect(screen.getByTestId("save-all-session-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("save-all-session-button"));

    await waitFor(() => {
      expect(screen.getByText(/Save Tabs as Session Collection/i)).toBeInTheDocument();
    });
  });

  it("navigates to Extension Settings and updates preferences", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-settings-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-settings-button"));

    await waitFor(() => {
      expect(screen.getByText(/Extension Preferences/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Default Capture Destination/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save preferences/i })).toBeInTheDocument();
  });

  it("keeps docked Open Tabs panel closed by default and opens on toggle", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("topbar-save-session-button")).toBeInTheDocument();
    });

    // Closed by default
    expect(screen.queryByTestId("docked-open-tabs-panel")).not.toBeInTheDocument();

    // Toggle button opens the panel
    const toggleTabsBtn = screen.getByTestId("toggle-docked-tabs-button");
    fireEvent.click(toggleTabsBtn);

    expect(screen.getByTestId("docked-open-tabs-panel")).toBeInTheDocument();
  });

  it("filters collections and items via search input", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getAllByText("Design Systems")[0]).toBeInTheDocument();
    });

    const searchInput = document.querySelector("input[data-dashboard-search]") as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Radix" } });

    await waitFor(() => {
      expect(screen.getByText("Radix UI primitives")).toBeInTheDocument();
    });
  });

  it("saves selected open tabs into active destination", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-open-tabs-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-open-tabs-button"));

    await waitFor(() => {
      expect(screen.getByTestId("save-selected-tabs-button")).toBeInTheDocument();
    });

    // Click select all
    const selectAllBtn = screen.getByRole("button", { name: /select all/i });
    fireEvent.click(selectAllBtn);

    const saveSelectedBtn = screen.getByTestId("save-selected-tabs-button");
    fireEvent.click(saveSelectedBtn);

    await waitFor(() => {
      expect(screen.getByText(/0 of \d+ selected/i)).toBeInTheDocument();
    });
  });

  it("navigates to Workspace & Members view and renders workspace management", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-workspace-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-workspace-button"));

    await waitFor(() => {
      expect(screen.getByTestId("workspace-settings-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("workspace-name-input")).toHaveValue("Personal Engine");
    expect(screen.getByRole("button", { name: /members & invites/i })).toBeInTheDocument();
  });

  it("focuses sidebar search on '/' keyboard shortcut and renders Quick Focus queues", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByText("LetsMarkNow")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search links, spaces...");
    expect(searchInput).toBeInTheDocument();

    // Trigger '/' key press on window
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(searchInput);

    // Verify Quick Focus queue is rendered and Quick Inbox is removed
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.queryByText("Quick Inbox")).not.toBeInTheDocument();

    // Verify Views & Tools section header is rendered
    expect(screen.getByText("Views & Tools")).toBeInTheDocument();

    // Verify Space header is rendered
    expect(screen.getByText(/Spaces \(\d+\)/)).toBeInTheDocument();
  });

  it("keeps the left sidebar section open by default and toggles it on demand", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-sidebar")).toBeInTheDocument();
    });

    const sidebar = screen.getByTestId("extension-sidebar");
    // Open by default: has w-64
    expect(sidebar.className).toContain("w-64");

    // Click collapse button inside sidebar
    const collapseBtn = screen.getByTestId("collapse-sidebar-button");
    fireEvent.click(collapseBtn);

    // Now closed: has w-0
    expect(sidebar.className).toContain("w-0");

    // Click toggle button in TopBar to reopen
    const toggleBtn = screen.getByTestId("toggle-sidebar-button");
    fireEvent.click(toggleBtn);

    // Open again: has w-64
    expect(sidebar.className).toContain("w-64");
  });

  it("handles dropping desk-item or same-group item safely without crashing to loading screen", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Find first group drop container
    const groupHeadings = screen.getAllByRole("heading", { level: 4 });
    const firstGroupHeading = groupHeadings.find((h) => h.textContent?.includes("Reference"));
    expect(firstGroupHeading).toBeDefined();

    const groupSection = firstGroupHeading!.closest("section");
    expect(groupSection).toBeInTheDocument();

    // 1. Drop a desk-item payload onto the group
    fireEvent.drop(groupSection!, {
      dataTransfer: {
        getData: (type: string) => {
          if (type === "application/json") {
            return JSON.stringify({ type: "desk-item", itemId: "item-1" });
          }
          return "desk:item-1";
        },
      },
    });

    // Verify it did NOT crash to the loading screen
    expect(screen.queryByText("Loading LetsMarkNow Tab...")).not.toBeInTheDocument();
    expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();

    // 2. Drop same-group colon payload
    fireEvent.drop(groupSection!, {
      dataTransfer: {
        getData: (type: string) => (type === "text/plain" ? "col-1:grp-1:item-1" : ""),
      },
    });

    // Verify still not crashed to loading screen
    expect(screen.queryByText("Loading LetsMarkNow Tab...")).not.toBeInTheDocument();
    expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
  });

  it("persists view mode selection in localStorage across re-renders and page reload", async () => {
    const { unmount } = render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Click list view button
    const listViewBtn = screen.getByTitle("list view");
    fireEvent.click(listViewBtn);

    await waitFor(() => {
      const raw = localStorage.getItem("lmn_selected_view_mode_v1");
      expect(raw ? JSON.parse(raw) : null).toBe("list");
    });

    unmount();

    // Re-render (simulating page reload)
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Verify list view is still active and grid view is not active
    const reloadedListViewBtn = screen.getByTitle("list view");
    expect(reloadedListViewBtn.className).toContain("bg-primary");
    const reloadedGridViewBtn = screen.getByTitle("grid view");
    expect(reloadedGridViewBtn.className).not.toContain("bg-primary");
  });

  it("restores previously saved mindmap view mode from localStorage on initial mount", async () => {
    localStorage.setItem("lmn_selected_view_mode_v1", JSON.stringify("mindmap"));

    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Verify mindmap view is active
    const mindmapBtn = screen.getByTitle("mindmap view");
    expect(mindmapBtn.className).toContain("bg-primary");
    const gridViewBtn = screen.getByTitle("grid view");
    expect(gridViewBtn.className).not.toContain("bg-primary");
  });

  it("switches from mindmap to grid and saves to storage when clicking Collections button", async () => {
    localStorage.setItem("lmn_selected_view_mode_v1", JSON.stringify("mindmap"));

    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    expect(screen.getByTitle("mindmap view").className).toContain("bg-primary");

    // Click sidebar collections button
    const collectionsBtn = screen.getByTestId("nav-collections-button");
    fireEvent.click(collectionsBtn);

    await waitFor(() => {
      expect(screen.getByTitle("grid view").className).toContain("bg-primary");
      const raw = localStorage.getItem("lmn_selected_view_mode_v1");
      expect(raw ? JSON.parse(raw) : null).toBe("grid");
    });
  });

  it("renders collapsible collection list in sidebar and toggles expansion", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-collections-list")).toBeInTheDocument();
    });

    // Both collections in Personal Engine space should be listed in the sidebar
    expect(screen.getByTestId("nav-collection-item-collection-design")).toBeInTheDocument();

    // Toggle collapse button
    const collapseToggle = screen.getByTestId("toggle-collections-collapse-button");
    fireEvent.click(collapseToggle);

    // List should now be collapsed (hidden)
    expect(screen.queryByTestId("sidebar-collections-list")).not.toBeInTheDocument();

    // Toggle back open
    fireEvent.click(collapseToggle);
    expect(screen.getByTestId("sidebar-collections-list")).toBeInTheDocument();
  });

  it("filters dashboard to single collection when collection item is clicked in sidebar and clears filter", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-collections-list")).toBeInTheDocument();
    });

    // Initially no filter banner
    expect(screen.queryByTestId("active-collection-filter-banner")).not.toBeInTheDocument();

    // Click on collection item in sidebar
    const colItemBtn = screen.getByTestId("nav-collection-item-collection-design");
    fireEvent.click(colItemBtn);

    // Filter banner appears with collection name
    await waitFor(() => {
      expect(screen.getByTestId("active-collection-filter-banner")).toBeInTheDocument();
    });
    expect(screen.getByText("Filtered collection:")).toBeInTheDocument();

    // Click 'Show all collections' on the banner
    const clearBtn = screen.getByTestId("clear-collection-filter-button");
    fireEvent.click(clearBtn);

    // Filter banner disappears
    await waitFor(() => {
      expect(screen.queryByTestId("active-collection-filter-banner")).not.toBeInTheDocument();
    });

    // Filter again via sidebar
    fireEvent.click(colItemBtn);
    expect(screen.getByTestId("active-collection-filter-banner")).toBeInTheDocument();

    // Clicking the parent Collections button also clears the filter
    const collectionsParentBtn = screen.getByTestId("nav-collections-button");
    fireEvent.click(collectionsParentBtn);
    expect(screen.queryByTestId("active-collection-filter-banner")).not.toBeInTheDocument();
  });

  it("renders SPACES before Views & Tools, and nests collections under spaces", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-collections-list")).toBeInTheDocument();
    });

    const sidebar = screen.getByTestId("extension-sidebar");
    const textContent = sidebar.textContent || "";
    const spacesIndex = textContent.indexOf("Spaces");
    const viewsToolsIndex = textContent.indexOf("Views & Tools");

    expect(spacesIndex).toBeGreaterThan(-1);
    expect(viewsToolsIndex).toBeGreaterThan(-1);
    expect(spacesIndex).toBeLessThan(viewsToolsIndex);
    expect(textContent).not.toContain("Quick Inbox");
  });

  it("allows updating/editing a space from the sidebar space options dropdown", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("space-options-button-space-home")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("space-options-button-space-home"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-space-menu-item-space-home")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-space-menu-item-space-home"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit space" })).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Research");
    fireEvent.change(nameInput, { target: { value: "My Super Collections" } });

    fireEvent.click(screen.getByRole("button", { name: "Save space" }));

    await waitFor(() => {
      expect(screen.getAllByText("My Super Collections")[0]).toBeInTheDocument();
    });
  });

  it("allows deleting a space when multiple spaces exist, and disables delete when only one space remains", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("space-options-button-space-launch")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("space-options-button-space-launch"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-space-menu-item-space-launch")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-space-menu-item-space-launch"));

    await waitFor(() => {
      expect(screen.getByText(/Delete space\?/i)).toBeInTheDocument();
    });

    const confirmDeleteBtn = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("space-options-button-space-launch")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("space-options-button-space-home"));

    await waitFor(() => {
      const deleteItem = screen.getByTestId("delete-space-menu-item-space-home");
      expect(deleteItem).toBeInTheDocument();
      expect(deleteItem.getAttribute("aria-disabled") === "true" || deleteItem.hasAttribute("disabled")).toBe(true);
    });
  });

  it("allows editing space via TopBar space options menu", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("topbar-space-options-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("topbar-space-options-button"));

    await waitFor(() => {
      expect(screen.getByTestId("topbar-edit-space-menu-item")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("topbar-edit-space-menu-item"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit space" })).toBeInTheDocument();
    });
  });
});

