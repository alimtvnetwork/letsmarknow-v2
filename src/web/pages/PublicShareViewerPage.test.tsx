import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicShareViewerPage from "./PublicShareViewerPage";
import * as workspaceApiClient from "@/lib/workspaceApiClient";

describe("PublicShareViewerPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders demo share immediately without backend call", () => {
    render(
      <MemoryRouter initialEntries={["/web/share/public-share-demo"]}>
        <Routes>
          <Route path="/web/share/:shareId" element={<PublicShareViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("public-share-page")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search shared links/i)).toBeInTheDocument();
  });

  it("fetches and renders remote public share contents when not found locally", async () => {
    vi.spyOn(workspaceApiClient, "fetchPublicShareContents").mockResolvedValueOnce({
      slug: "remote-design-stack",
      target_type: "collection",
      target: {
        id: "col-123",
        name: "Remote Design Stack",
        description: "Curated tools for UI designers",
      },
      groups: [
        {
          id: "grp-1",
          name: "Prototyping",
          items: [
            {
              id: "item-1",
              title: "Figma App",
              url: "https://figma.com",
              description: "Collaborative interface design tool",
              tags: ["design", "ui"],
            },
          ],
        },
      ],
      items: [],
    });

    render(
      <MemoryRouter initialEntries={["/web/share/remote-design-stack"]}>
        <Routes>
          <Route path="/web/share/:shareId" element={<PublicShareViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Remote Design Stack")).toBeInTheDocument();
    });

    expect(screen.getByText("Figma App")).toBeInTheDocument();
    expect(screen.getByText("Collaborative interface design tool")).toBeInTheDocument();
    expect(screen.getAllByText("#design").length).toBeGreaterThan(0);
  });

  it("shows 'Share not found' if remote share request fails", async () => {
    vi.spyOn(workspaceApiClient, "fetchPublicShareContents").mockRejectedValueOnce(
      new Error("Share not found")
    );

    render(
      <MemoryRouter initialEntries={["/web/share/non-existent-share-slug"]}>
        <Routes>
          <Route path="/web/share/:shareId" element={<PublicShareViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Share not found")).toBeInTheDocument();
    });
  });
});
