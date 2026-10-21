import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PopupApp } from "../popup/PopupApp";
import { ExtensionTabApp } from "../tab/ExtensionTabApp";
import * as browserApi from "../lib/browserApi";

describe("Cross-Surface E2E Smoke Tests: Popup to Next Queue Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds current active tab to Next queue from Popup, then inspects and checks off in Dashboard", async () => {
    // 1. Mock the active tab in browserApi
    vi.spyOn(browserApi, "getActiveTab").mockResolvedValue({
      id: 99,
      title: "GitHub: Let's Mark Now",
      url: "https://github.com/letsmarknow",
      favIconUrl: "https://github.githubassets.com/favicons/favicon.svg",
      active: true,
    });

    // 2. Render the Popup surface
    const { unmount } = render(<PopupApp />);

    await waitFor(() => {
      expect(screen.getByTestId("add-to-next-button")).toBeInTheDocument();
    });

    // 3. User clicks "Add to Next Queue" in the popup
    const addToNextBtn = screen.getByTestId("add-to-next-button");
    fireEvent.click(addToNextBtn);

    // Wait for async persistence to complete
    await waitFor(() => {
      expect(screen.getByTestId("extension-popup-app")).toBeInTheDocument();
    });

    // 4. Unmount popup (user closes popup)
    unmount();

    // 5. User opens the full Extension Tab Dashboard
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("nav-next-queue-button")).toBeInTheDocument();
    });

    // 6. Verify Next Queue button in the sidebar reflects the newly added uncompleted item
    const navNextBtn = screen.getByTestId("nav-next-queue-button");
    expect(navNextBtn).toHaveTextContent("1");

    // 7. Click Next Queue button in the sidebar
    fireEvent.click(navNextBtn);

    // 8. Verify the dedicated Next Queue view is rendered
    await waitFor(() => {
      expect(screen.getByTestId("next-queue-view")).toBeInTheDocument();
    });

    expect(screen.getByText("GitHub: Let's Mark Now")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/letsmarknow")).toBeInTheDocument();

    // 9. Check off the item as completed
    const completeButton = screen.getByTitle("Mark completed");
    expect(completeButton).toBeInTheDocument();
    fireEvent.click(completeButton);

    // 10. Verify item updates to done and button title changes to "Mark incomplete"
    await waitFor(() => {
      expect(screen.getByTitle("Mark incomplete")).toBeInTheDocument();
    });
    expect(screen.getByText(/0 open/i)).toBeInTheDocument();
  });
});
