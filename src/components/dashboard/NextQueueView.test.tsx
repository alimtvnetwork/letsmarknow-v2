import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { NextQueueView } from "./NextQueueView";
import * as api from "@/lib/workspaceApiClient";

describe("NextQueueView Component (07-features/17-next-queue.md)", () => {
  const mockItems: api.BackendNextItem[] = [
    {
      id: "item-1",
      accountId: "acc-1",
      nextCollectionId: "next-col-1",
      itemId: null,
      sourceCollectionId: null,
      titleSnapshot: "Active Open Task",
      urlSnapshot: "https://example.com/task-1",
      faviconUrlSnapshot: null,
      position: 1024,
      isDone: false,
      isTombstone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-2",
      accountId: "acc-1",
      nextCollectionId: "next-col-1",
      itemId: null,
      sourceCollectionId: null,
      titleSnapshot: "Completed Old Task",
      urlSnapshot: "https://example.com/task-2",
      faviconUrlSnapshot: null,
      position: 2048,
      isDone: true,
      isTombstone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchNextQueue").mockResolvedValue({
      items: mockItems,
      total_count: 2,
      open_count: 1,
    });

    vi.spyOn(api, "subscribeNextQueueSSE").mockImplementation(() => () => {});
  });

  it("renders Next queue header, open count badge, and items", async () => {
    render(<NextQueueView />);

    await waitFor(() => {
      expect(screen.getByText("Active Open Task")).toBeInTheDocument();
      expect(screen.getByText("Completed Old Task")).toBeInTheDocument();
    });

    const badge = screen.getByTestId("next-open-count-badge");
    expect(badge).toHaveTextContent("1");
    expect(screen.getByText("Add to Next")).toBeInTheDocument();
  });

  it("submits a new item via Add to Next form", async () => {
    const addSpy = vi.spyOn(api, "addToNextQueue").mockResolvedValue({
      data: {
        id: "item-3",
        accountId: "acc-1",
        nextCollectionId: "next-col-1",
        itemId: null,
        sourceCollectionId: null,
        titleSnapshot: "Brand New Item",
        urlSnapshot: "https://example.com/brand-new",
        faviconUrlSnapshot: null,
        position: 3072,
        isDone: false,
        isTombstone: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: "Added to Next",
    });

    render(<NextQueueView />);

    await waitFor(() => {
      expect(screen.getByText("Active Open Task")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Paste URL to add to Next/i);
    fireEvent.change(input, { target: { value: "https://example.com/brand-new" } });

    const addButton = screen.getByRole("button", { name: /Add to Next/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com/brand-new",
          source_kind: "manual",
        })
      );
      expect(screen.getByText("Brand New Item")).toBeInTheDocument();
    });
  });

  it("toggles done state when checking the item checkbox", async () => {
    const updateSpy = vi.spyOn(api, "updateNextQueueItem").mockResolvedValue({
      ...mockItems[0],
      isDone: true,
    });

    render(<NextQueueView />);

    await waitFor(() => {
      expect(screen.getByText("Active Open Task")).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Mark Active Open Task as complete/i);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith("item-1", { is_done: true });
    });
  });

  it("removes an item from Next queue", async () => {
    const removeSpy = vi.spyOn(api, "removeNextQueueItem").mockResolvedValue({
      ok: true,
      removed_id: "item-1",
    });

    render(<NextQueueView />);

    await waitFor(() => {
      expect(screen.getByText("Active Open Task")).toBeInTheDocument();
    });

    const removeBtn = screen.getAllByTitle("Remove from Next")[0];
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith("item-1");
      expect(screen.queryByText("Active Open Task")).not.toBeInTheDocument();
    });
  });
});
