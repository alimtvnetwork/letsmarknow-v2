import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PopupApp } from "../popup/PopupApp";
import { ExtensionTabApp } from "../tab/ExtensionTabApp";
import * as browserApi from "../lib/browserApi";

describe("Cross-Surface E2E Smoke Tests: Popup to Extension Tab Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves current active tab from Popup, then verifies Extension Tab Dashboard without Next Queue or Settings clutter", async () => {
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
      expect(screen.getByTestId("save-current-tab-button")).toBeInTheDocument();
    });

    // 3. User saves current tab in popup
    const saveBtn = screen.getByTestId("save-current-tab-button");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });

    // 4. Unmount popup (user closes popup)
    unmount();

    // 5. User opens the full Extension Tab Dashboard
    render(<ExtensionTabApp />);

    await waitFor(() => {
      expect(screen.getByTestId("extension-tab-app")).toBeInTheDocument();
    });

    // 6. Verify Next Queue and Extension Settings are completely removed
    expect(screen.queryByText("Next Queue")).not.toBeInTheDocument();
    expect(screen.queryByText("Extension Settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-next-queue-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-settings-button")).not.toBeInTheDocument();
  });
});
