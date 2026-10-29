import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("does not render Extension Settings or Next Queue in the sidebar", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("nav-settings-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-next-queue-button")).not.toBeInTheDocument();
    expect(screen.queryByText("Extension Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Next Queue")).not.toBeInTheDocument();
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

    // Verify Quick Focus and Next/Inbox queues are removed
    expect(screen.queryByText("Quick Focus")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
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

  it("opens Command Palette via TopBar button and Cmd+K keyboard shortcut", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTitle("Open command palette")).toBeInTheDocument();
    });

    // 1. Open via TopBar button
    fireEvent.click(screen.getByTitle("Open command palette"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search commands, spaces, collections, or links...")
      ).toBeInTheDocument();
    });

    // Close via Escape
    fireEvent.keyDown(document.body, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search commands, spaces, collections, or links...")
      ).not.toBeInTheDocument();
    });

    // 2. Open via Cmd+K keyboard shortcut
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search commands, spaces, collections, or links...")
      ).toBeInTheDocument();
    });

    // Verify command options are present
    expect(screen.getByText("Import Chrome Bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Create collection")).toBeInTheDocument();
  });

  it("renders visual card preview banners on grid cards", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Verify visual card preview elements exist on rendered cards
    const previews = screen.getAllByTestId(/^visual-card-preview-/);
    expect(previews.length).toBeGreaterThan(0);
  });

  it("imports browser bookmarks into workspace via 1-Click bookmark import dialog", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-import-bookmarks-button")).toBeInTheDocument();
    });

    // Open import dialog
    fireEvent.click(screen.getByTestId("sidebar-import-bookmarks-button"));

    await waitFor(() => {
      expect(screen.getByText("Import Chrome & Browser Bookmarks")).toBeInTheDocument();
      expect(screen.getByTestId("import-browser-bookmarks-button")).toBeInTheDocument();
    });

    // Click 1-Click browser import
    fireEvent.click(screen.getByTestId("import-browser-bookmarks-button"));

    // Verify import completed message
    await waitFor(() => {
      expect(screen.getByText("Import Complete!")).toBeInTheDocument();
    });

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    // Verify imported collection is now visible in the workspace
    await waitFor(() => {
      expect(screen.getAllByText("Development Tools")[0]).toBeInTheDocument();
    });
  });

  it("exports space and collections to Markdown with 1-click clipboard copy", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("topbar-space-options-button")).toBeInTheDocument();
    });

    // 1. Export space via TopBar
    fireEvent.click(screen.getByTestId("topbar-space-options-button"));

    await waitFor(() => {
      expect(screen.getByText("Export to Markdown")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Export to Markdown"));

    expect(writeTextMock).toHaveBeenCalled();
    const lastExportedText = writeTextMock.mock.calls[0][0];
    expect(lastExportedText).toContain("# ");
    expect(lastExportedText).toContain("- [");
  });

  it("detects duplicates, displays TopBar warning pill, and cleans duplicates in 1 click", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Initially 0 duplicates -> pill should NOT be rendered
    expect(screen.queryByTestId("duplicate-cleaner-pill")).not.toBeInTheDocument();

    // Duplicate an item
    const itemCard = screen.getAllByText("Radix UI primitives")[0].closest(".group");
    expect(itemCard).not.toBeNull();
    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Duplicate item"));

    // Now 1 duplicate exists -> pill should appear in TopBar
    await waitFor(() => {
      expect(screen.getByTestId("duplicate-cleaner-pill")).toBeInTheDocument();
      expect(screen.getByText(/1 Duplicate Found/i)).toBeInTheDocument();
    });

    // Click pill to open preview modal
    fireEvent.click(screen.getByTestId("duplicate-cleaner-pill"));

    await waitFor(() => {
      expect(screen.getByText("Duplicate Cleaner & URL Deduplicator")).toBeInTheDocument();
      expect(screen.getByTestId("clean-duplicates-confirm-button")).toBeInTheDocument();
      expect(screen.getByText("Keep Newest & Clean Duplicates")).toBeInTheDocument();
    });

    // Click "Keep Newest & Clean Duplicates"
    fireEvent.click(screen.getByTestId("clean-duplicates-confirm-button"));

    // Verify modal closes and pill disappears
    await waitFor(() => {
      expect(screen.queryByTestId("duplicate-cleaner-pill")).not.toBeInTheDocument();
    });
  });

  it("navigates to settings when clicking the settings button in the user profile bar", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-settings-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("sidebar-settings-button"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Rename & Workspace Identity/i })).toBeInTheDocument();
    });
  });

  it("adds and edits inline sticky notes and context annotations on bookmark cards", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Find the first item card
    const itemCard = screen.getAllByText("Radix UI primitives")[0].closest(".group");
    expect(itemCard).not.toBeNull();

    // Find the note button in the item card
    const noteButton = within(itemCard as HTMLElement).getByTestId("item-note-button");
    expect(noteButton).toBeInTheDocument();

    // Click note button to toggle inline note editor
    fireEvent.click(noteButton);

    // Verify inline note editor is active
    await waitFor(() => {
      expect(within(itemCard as HTMLElement).getByTestId("item-note-editor")).toBeInTheDocument();
      expect(within(itemCard as HTMLElement).getByTestId("item-note-input")).toBeInTheDocument();
    });

    // Type a context note
    const noteInput = within(itemCard as HTMLElement).getByTestId("item-note-input");
    fireEvent.change(noteInput, { target: { value: "Review accessibility props before release" } });

    // Save note
    const saveButton = within(itemCard as HTMLElement).getByTestId("save-item-note-button");
    fireEvent.click(saveButton);

    // Verify note chip is displayed on the card face
    await waitFor(() => {
      expect(screen.getByText("Review accessibility props before release")).toBeInTheDocument();
    });

    // Click note chip to reopen editor and modify note
    const noteChip = screen.getByText("Review accessibility props before release").closest("[data-testid^='item-note-chip-']");
    expect(noteChip).not.toBeNull();
    fireEvent.click(noteChip as HTMLElement);

    await waitFor(() => {
      expect(within(itemCard as HTMLElement).getByTestId("item-note-input")).toBeInTheDocument();
    });
  });

  it("allows selecting custom emoji/icon for collections and displays it in sidebar and card header", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // Open create collection dialog via TopBar button
    const createColBtn = screen.getByTitle("Create collection (required before adding items)");
    fireEvent.click(createColBtn);

    // Verify collection dialog and emoji picker are open
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Create collection" })).toBeInTheDocument();
      expect(screen.getByTestId("emoji-option-🚀")).toBeInTheDocument();
    });

    // Click 🚀 emoji
    fireEvent.click(screen.getByTestId("emoji-option-🚀"));

    // Type collection name
    const nameInput = screen.getByPlaceholderText("Marketing research");
    fireEvent.change(nameInput, { target: { value: "Rocket Launch Project" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));

    // Verify collection is created with custom emoji rendered in sidebar and collection card
    await waitFor(() => {
      expect(screen.getAllByText("Rocket Launch Project")[0]).toBeInTheDocument();
      expect(screen.getAllByText("🚀")[0]).toBeInTheDocument();
    });
  });
});

