import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionTabApp } from "./ExtensionTabApp";

describe("ExtensionTabApp", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the extension tab dashboard with collections and items", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    expect(screen.getByText("LetsMarkNow Extension")).toBeInTheDocument();
    expect(screen.getByText("Design Systems")).toBeInTheDocument();
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

  it("renders docked Open Tabs panel on dashboard view", async () => {
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("docked-open-tabs-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("topbar-save-session-button")).toBeInTheDocument();
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
});
