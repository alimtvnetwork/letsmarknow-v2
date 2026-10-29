import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveSessionBar } from "./SaveSessionBar";
import type { BrowserTabSnapshot } from "@/types/lmn";
import type { WorkspaceUrlStats } from "../lib/tabCapture";

describe("SaveSessionBar", () => {
  const mockTabs: BrowserTabSnapshot[] = [
    { id: 1, title: "Tab 1", url: "https://example.com/one", active: true },
    { id: 2, title: "Tab 2", url: "https://example.com/two", active: false },
    { id: 3, title: "Tab 3", url: "https://github.com", active: false },
  ];

  const mockStats: WorkspaceUrlStats = {
    urlSet: new Set(["https://example.com/one", "https://github.com"]),
    urlCounts: new Map([
      ["https://example.com/one", 1],
      ["https://github.com", 2],
    ]),
    urlToCollectionMap: new Map([
      ["https://example.com/one", "Development"],
      ["https://github.com", "Resources"],
    ]),
  };

  it("renders open tab counters and calculates saved tabs count", () => {
    render(
      <SaveSessionBar
        openTabs={mockTabs}
        savedUrlStats={mockStats}
        latestSessionName="Session - Oct 13"
        onSaveSession={vi.fn()}
        onCloseSavedTabs={vi.fn()}
        onRestoreLastSession={vi.fn()}
      />
    );

    expect(screen.getByText("3 tabs open")).toBeInTheDocument();
    // 2 tabs (example.com/one and github.com) are in urlSet
    expect(screen.getByText("2 saved")).toBeInTheDocument();
    expect(screen.getByText(/2 open tabs are already saved in your workspace/i)).toBeInTheDocument();
  });

  it("triggers onSaveSession when Save session button is clicked", () => {
    const onSaveSession = vi.fn();
    render(
      <SaveSessionBar
        openTabs={mockTabs}
        savedUrlStats={mockStats}
        latestSessionName="Session - Oct 13"
        onSaveSession={onSaveSession}
        onCloseSavedTabs={vi.fn()}
        onRestoreLastSession={vi.fn()}
      />
    );

    const saveBtn = screen.getByTestId("session-bar-save-button");
    fireEvent.click(saveBtn);
    expect(onSaveSession).toHaveBeenCalledTimes(1);
  });

  it("triggers onCloseSavedTabs when Close saved tabs button is clicked", () => {
    const onCloseSavedTabs = vi.fn();
    render(
      <SaveSessionBar
        openTabs={mockTabs}
        savedUrlStats={mockStats}
        latestSessionName="Session - Oct 13"
        onSaveSession={vi.fn()}
        onCloseSavedTabs={onCloseSavedTabs}
        onRestoreLastSession={vi.fn()}
      />
    );

    const closeBtn = screen.getByTestId("session-bar-close-saved-button");
    expect(closeBtn).not.toBeDisabled();
    fireEvent.click(closeBtn);
    expect(onCloseSavedTabs).toHaveBeenCalledTimes(1);
  });

  it("triggers onRestoreLastSession when Restore button is clicked", () => {
    const onRestoreLastSession = vi.fn();
    render(
      <SaveSessionBar
        openTabs={mockTabs}
        savedUrlStats={mockStats}
        latestSessionName="Session - Oct 13"
        onSaveSession={vi.fn()}
        onCloseSavedTabs={vi.fn()}
        onRestoreLastSession={onRestoreLastSession}
      />
    );

    const restoreBtn = screen.getByTestId("session-bar-restore-button");
    expect(restoreBtn).not.toBeDisabled();
    fireEvent.click(restoreBtn);
    expect(onRestoreLastSession).toHaveBeenCalledTimes(1);
  });

  it("disables restore and close buttons when no saved tabs or sessions exist", () => {
    const emptyStats: WorkspaceUrlStats = {
      urlSet: new Set(),
      urlCounts: new Map(),
      urlToCollectionMap: new Map(),
    };

    render(
      <SaveSessionBar
        openTabs={mockTabs}
        savedUrlStats={emptyStats}
        latestSessionName={null}
        onSaveSession={vi.fn()}
        onCloseSavedTabs={vi.fn()}
        onRestoreLastSession={vi.fn()}
      />
    );

    expect(screen.getByTestId("session-bar-close-saved-button")).toBeDisabled();
    expect(screen.getByTestId("session-bar-restore-button")).toBeDisabled();
  });
});
