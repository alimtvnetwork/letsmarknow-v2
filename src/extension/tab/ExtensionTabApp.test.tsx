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
    expect(screen.getByText("Design Systems")).toBeInTheDocument();

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
      expect(screen.getByText("Design Systems")).toBeInTheDocument();
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

    // Verify Quick Focus queues are rendered
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Quick Inbox")).toBeInTheDocument();

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
});
