import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpenTabsList } from "./OpenTabsList";
import type { BrowserTabSnapshot } from "@/types/lmn";
import type { WorkspaceUrlStats } from "../lib/tabCapture";

describe("OpenTabsList Component", () => {
  const mockTabs: BrowserTabSnapshot[] = [
    {
      id: 101,
      title: "Google Docs",
      url: "https://docs.google.com/document/d/1",
      favIconUrl: "https://docs.google.com/favicon.ico",
      active: true,
      pinned: true,
    },
    {
      id: 102,
      title: "GitHub Pull Requests",
      url: "https://github.com/pulls",
      active: false,
      pinned: false,
    },
    {
      id: 103,
      title: "Chrome Settings",
      url: "chrome://settings",
      active: false,
      pinned: false,
    },
  ];

  const mockStats: WorkspaceUrlStats = {
    urlSet: new Set(["https://github.com/pulls"]),
    urlCounts: new Map([["https://github.com/pulls", 1]]),
    urlToCollectionMap: new Map([["https://github.com/pulls", "Dev Links"]]),
  };

  it("renders tabs with status badges and indicators", () => {
    render(
      <OpenTabsList
        tabs={mockTabs}
        selectedTabIds={[]}
        savedUrlStats={mockStats}
        onToggleSelectTab={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onSaveSelected={vi.fn()}
        onSaveAll={vi.fn()}
      />
    );

    expect(screen.getByText("Google Docs")).toBeInTheDocument();
    expect(screen.getByText("GitHub Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("Chrome Settings")).toBeInTheDocument();

    // Active indicator
    expect(screen.getByText("Active")).toBeInTheDocument();

    // System/invalid indicator
    expect(screen.getByText("System")).toBeInTheDocument();

    // Already saved badge for tab 102
    expect(screen.getByText("Already saved")).toBeInTheDocument();
  });

  it("attaches drag events with json and text payload on valid tabs", () => {
    render(
      <OpenTabsList
        tabs={mockTabs}
        selectedTabIds={[]}
        savedUrlStats={mockStats}
        onToggleSelectTab={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onSaveSelected={vi.fn()}
        onSaveAll={vi.fn()}
      />
    );

    const docRow = screen.getByText("Google Docs").closest("[draggable]");
    expect(docRow).toHaveAttribute("draggable", "true");

    const setData = vi.fn();
    fireEvent.dragStart(docRow!, {
      dataTransfer: { setData },
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      expect.stringContaining("Google Docs")
    );
    expect(setData).toHaveBeenCalledWith(
      "text/plain",
      "https://docs.google.com/document/d/1"
    );
  });

  it("toggles tab selection and handles select all / deselect all", () => {
    const onToggleSelectTab = vi.fn();
    const onSelectAll = vi.fn();

    render(
      <OpenTabsList
        tabs={mockTabs}
        selectedTabIds={[101]}
        savedUrlStats={mockStats}
        onToggleSelectTab={onToggleSelectTab}
        onSelectAll={onSelectAll}
        onDeselectAll={vi.fn()}
        onSaveSelected={vi.fn()}
        onSaveAll={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText("Select tab Google Docs");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(onToggleSelectTab).toHaveBeenCalledWith(101);

    const selectAllBtn = screen.getByRole("button", { name: /select all/i });
    fireEvent.click(selectAllBtn);
    expect(onSelectAll).toHaveBeenCalled();
  });

  it("triggers save selected and close tab callbacks", () => {
    const onSaveSelected = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <OpenTabsList
        tabs={mockTabs}
        selectedTabIds={[101]}
        savedUrlStats={mockStats}
        onToggleSelectTab={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onSaveSelected={onSaveSelected}
        onSaveAll={vi.fn()}
        onCloseTab={onCloseTab}
      />
    );

    const saveSelectedBtn = screen.getByTestId("save-selected-tabs-button");
    fireEvent.click(saveSelectedBtn);
    expect(onSaveSelected).toHaveBeenCalled();

    const closeButtons = screen.getAllByTitle("Close Tab");
    fireEvent.click(closeButtons[0]);
    expect(onCloseTab).toHaveBeenCalledWith(101);
  });
});
