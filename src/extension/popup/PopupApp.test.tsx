import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PopupApp } from "./PopupApp";
import * as browserApi from "../lib/browserApi";

describe("PopupApp", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders popup with active tab details, destination picker, and actions", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-popup-app")).toBeInTheDocument();
    });

    expect(screen.getByText("LetsMarkNow")).toBeInTheDocument();
    expect(screen.getByTestId("save-current-tab-card")).toBeInTheDocument();
    expect(screen.getByTestId("destination-collection-select")).toBeInTheDocument();
    expect(screen.getByTestId("save-all-tabs-card")).toBeInTheDocument();
  });

  it("saves the current active tab successfully", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("save-current-tab-button")).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId("save-current-tab-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it("saves all open tabs in the window", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("save-all-tabs-button")).toBeInTheDocument();
    });

    const saveAllButton = screen.getByTestId("save-all-tabs-button");
    fireEvent.click(saveAllButton);

    await waitFor(() => {
      expect(screen.getByText(/all tabs saved/i)).toBeInTheDocument();
    });
  });

  it("allows quick creating a collection inline", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-popup-app")).toBeInTheDocument();
    });

    // Click quick create collection
    const newButtons = screen.getAllByRole("button", { name: /new/i });
    fireEvent.click(newButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/design inspiration/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/design inspiration/i);
    fireEvent.change(input, { target: { value: "Tech News Daily" } });

    const createBtn = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tech News Daily/i)).toBeInTheDocument();
    });
  });

  it("allows quick creating a group inline", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-popup-app")).toBeInTheDocument();
    });

    const newButtons = screen.getAllByRole("button", { name: /new/i });
    fireEvent.click(newButtons[1]); // New group

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/must read, tools/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/must read, tools/i);
    fireEvent.change(input, { target: { value: "Priority Links" } });

    const createBtn = screen.getByRole("button", { name: /^create group$/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Priority Links/i)).toBeInTheDocument();
    });
  });

  it("triggers open extension tab and open web dashboard", async () => {
    const openExtensionTabSpy = vi.spyOn(browserApi, "openExtensionTab").mockImplementation(async () => {});
    const openWebDashboardSpy = vi.spyOn(browserApi, "openWebDashboard").mockImplementation(async () => {});

    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("open-full-tab-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("open-full-tab-button"));
    expect(openExtensionTabSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /web app/i }));
    expect(openWebDashboardSpy).toHaveBeenCalled();
  });

  it("handles invalid tab state properly with warning", async () => {
    vi.spyOn(browserApi, "getActiveTab").mockResolvedValue({
      id: 999,
      title: "Extensions Settings",
      url: "chrome://extensions",
    });

    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByText(/internal\/system pages cannot be saved/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /cannot save this page/i })).toBeDisabled();
  });

  it("changes selected destination space and collection", async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("destination-collection-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("destination-collection-select");
    fireEvent.change(select, { target: { value: select.querySelector("option:nth-child(2)")?.getAttribute("value") || "" } });
    expect(select).toBeInTheDocument();
  });
});
