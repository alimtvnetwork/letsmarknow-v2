import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WebOrganizerFallback from "./pages/WebOrganizerFallback";

const renderDashboard = (route = "/web/app") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <WebOrganizerFallback />
    </MemoryRouter>,
  );

describe("web dashboard UI", { timeout: 30000 }, () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the main workspace, spaces, collections, groups, and items", () => {
    renderDashboard();

    expect(screen.getAllByText("My Collections").length).toBeGreaterThan(0);
    expect(screen.getByText("Personal Engine")).toBeInTheDocument();
    expect(screen.getByText("Design Systems")).toBeInTheDocument();
    expect(screen.getByText("Browser Productivity")).toBeInTheDocument();
    expect(screen.getByText("Reference")).toBeInTheDocument();
    expect(screen.getByText("Radix UI primitives")).toBeInTheDocument();
  });

  it("creates a collection from the dialog", () => {
    renderDashboard();

    fireEvent.click(screen.getByText("Collection").closest("button") as HTMLButtonElement);
    const input = screen.getByPlaceholderText("Marketing research");
    fireEvent.change(input, {
      target: { value: "Growth Stack" },
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(screen.getByText("Growth Stack")).toBeInTheDocument();
    expect(screen.getByText("No saved links in this collection")).toBeInTheDocument();
  });

  it("creates a workspace from the rail and switches to its default space", () => {
    renderDashboard();

    fireEvent.click(screen.getByTitle("Add workspace"));
    const input = screen.getByPlaceholderText("Product Team");
    fireEvent.change(input, { target: { value: "QA Lab" } });
    fireEvent.change(screen.getByPlaceholderText("PT"), { target: { value: "QL" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(screen.getByTitle("QA Lab")).toBeInTheDocument();
    expect(screen.getByText("QA Lab")).toBeInTheDocument();
    expect(screen.getAllByText("My Collections").length).toBeGreaterThan(0);
  });

  it("adds an item to the first visible collection group", () => {
    renderDashboard();

    fireEvent.click(screen.getByTitle("Add item to Reference"));
    const input = screen.getByPlaceholderText("Readable title");
    fireEvent.change(input, {
      target: { value: "Chrome Extensions API" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://developer.chrome.com/docs/extensions" },
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(screen.getByText("Chrome Extensions API")).toBeInTheDocument();
    expect(screen.getByText("developer.chrome.com")).toBeInTheDocument();
  });

  it("filters collections by search text and starred state", () => {
    renderDashboard();

    fireEvent.change(screen.getByPlaceholderText("Search links, tags, groups..."), {
      target: { value: "Toby" },
    });

    expect(screen.getByText("Browser Productivity")).toBeInTheDocument();
    expect(screen.queryByText("Design Systems")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search links, tags, groups..."), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Starred").closest("button") as HTMLButtonElement);

    expect(screen.getByText("Design Systems")).toBeInTheDocument();
    expect(screen.queryByText("Browser Productivity")).not.toBeInTheDocument();
  });

  it("switches spaces and view modes", () => {
    renderDashboard();

    fireEvent.click(screen.getByText("LMN Launch").closest("button") as HTMLButtonElement);
    expect(screen.getAllByText("LMN Launch").length).toBeGreaterThan(0);
    expect(screen.getByText("Phase 0 Build")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("grid view"));
    expect(screen.getByTitle("grid view")).toHaveClass("bg-primary");

    fireEvent.click(screen.getByTitle("compact view"));
    expect(screen.getByTitle("compact view")).toHaveClass("bg-primary");
  });

  it("soft deletes and restores an item through trash", () => {
    renderDashboard();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();

    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Move to trash"));
    expect(screen.queryByText("Radix UI primitives")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Trash").closest("button") as HTMLButtonElement);
    expect(screen.getAllByText("Trash").length).toBeGreaterThan(0);
    expect(screen.getByText("Radix UI primitives")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /restore/i }));
    expect(screen.getByText("Trash is empty")).toBeInTheDocument();
  });

  it("edits collections, creates groups, and edits items via dropdown menus", () => {
    renderDashboard();

    const collectionCard = screen.getByText("Design Systems").closest("article");
    expect(collectionCard).not.toBeNull();

    fireEvent.click(within(collectionCard as HTMLElement).getByTitle("Collection actions"));
    fireEvent.click(screen.getByTitle("Edit collection"));
    const collectionNameInput = screen.getByDisplayValue("Design Systems");
    fireEvent.change(collectionNameInput, { target: { value: "Design Library" } });
    fireEvent.submit(collectionNameInput.closest("form") as HTMLFormElement);
    expect(screen.getByText("Design Library")).toBeInTheDocument();

    const renamedCard = screen.getByText("Design Library").closest("article");
    expect(renamedCard).not.toBeNull();
    fireEvent.click(within(renamedCard as HTMLElement).getByTitle("Collection actions"));
    fireEvent.click(screen.getByTitle("Add group"));
    const groupInput = screen.getByPlaceholderText("General");
    fireEvent.change(groupInput, { target: { value: "Reading" } });
    fireEvent.submit(groupInput.closest("form") as HTMLFormElement);
    expect(screen.getByText("Reading")).toBeInTheDocument();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();
    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Edit item"));
    const itemInput = screen.getByDisplayValue("Radix UI primitives");
    fireEvent.change(itemInput, { target: { value: "Radix Components" } });
    fireEvent.submit(itemInput.closest("form") as HTMLFormElement);
    expect(screen.getByText("Radix Components")).toBeInTheDocument();
  });

  it("duplicates and moves items between collections via menus", () => {
    renderDashboard();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();
    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Duplicate item"));
    expect(screen.getByText("Radix UI primitives Copy")).toBeInTheDocument();

    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Move item"));
    const destination = screen.getByRole("combobox");
    fireEvent.change(destination, {
      target: { value: "collection-research:group-competitors" },
    });
    fireEvent.submit(destination.closest("form") as HTMLFormElement);

    const browserProductivity = screen.getByText("Browser Productivity").closest("article");
    expect(browserProductivity).not.toBeNull();
    expect(within(browserProductivity as HTMLElement).getByText("Radix UI primitives")).toBeInTheDocument();
  });

  it("moves items between groups in the same collection without removing them", () => {
    renderDashboard();

    const collectionCard = screen.getByText("Design Systems").closest("article");
    expect(collectionCard).not.toBeNull();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();
    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));
    fireEvent.click(screen.getByTitle("Move item"));

    const destination = screen.getByRole("combobox");
    fireEvent.change(destination, {
      target: { value: "collection-design:group-assets" },
    });
    fireEvent.submit(destination.closest("form") as HTMLFormElement);

    expect(within(collectionCard as HTMLElement).getByText("Radix UI primitives")).toBeInTheDocument();
    const assetsGroup = screen.getByText("Assets").closest("section");
    expect(assetsGroup).not.toBeNull();
    expect(within(assetsGroup as HTMLElement).getByText("Radix UI primitives")).toBeInTheDocument();
  });

  it("opens command palette and reaches secondary pages", () => {
    renderDashboard();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByText("Open settings"));
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
    expect(screen.getByText("Import / Export")).toBeInTheDocument();
    expect(screen.getByText("Team members")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Activity").closest("button") as HTMLButtonElement);
    expect(screen.getAllByText("Activity").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Public share").closest("button") as HTMLButtonElement);
    expect(screen.getByText("Public collection preview")).toBeInTheDocument();
  });

  it("opens saved links in a new tab from item actions", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderDashboard();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();

    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Open item"));

    expect(openSpy).toHaveBeenCalledWith("https://www.radix-ui.com", "_blank", "noopener,noreferrer");
    openSpy.mockRestore();
  });

  it("edits a workspace from the sidebar dropdown", () => {
    renderDashboard();

    fireEvent.click(screen.getByTitle("Workspace switcher"));
    fireEvent.click(screen.getByText("Edit workspace"));

    const nameInput = screen.getByDisplayValue("Personal Engine");
    fireEvent.change(nameInput, { target: { value: "Solo Engine" } });
    fireEvent.submit(nameInput.closest("form") as HTMLFormElement);

    expect(screen.getByText("Solo Engine")).toBeInTheDocument();
  });

  it("switches workspaces using the sidebar header dropdown", () => {
    renderDashboard();

    fireEvent.click(screen.getByTitle("Workspace switcher"));
    fireEvent.click(screen.getByText("Agency Ops"));

    expect(screen.getByText("Agency Ops")).toBeInTheDocument();
    expect(screen.getAllByText("Client Work").length).toBeGreaterThan(0);
  });

  it("validates URL on item creation and blocks invalid URLs", () => {
    renderDashboard();

    fireEvent.click(screen.getByTitle("Add item to Reference"));
    const titleInput = screen.getByPlaceholderText("Readable title");
    const urlInput = screen.getByPlaceholderText("https://example.com");

    fireEvent.change(titleInput, { target: { value: "Bad Link" } });
    fireEvent.change(urlInput, { target: { value: "not-a-valid-url" } });

    expect(
      screen.getByText("Please enter a valid URL starting with http:// or https://")
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Add item" });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(urlInput, { target: { value: "https://valid.com" } });
    expect(
      screen.queryByText("Please enter a valid URL starting with http:// or https://")
    ).not.toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows empty state with clear filters button when query matches nothing", () => {
    renderDashboard();

    fireEvent.change(screen.getByPlaceholderText("Search links, tags, groups..."), {
      target: { value: "nonexistent-query-xyz" },
    });

    expect(screen.getByText("No matching collections or items")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: "Clear search & filters" });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(screen.getByText("Design Systems")).toBeInTheDocument();
  });

  it("switches settings tabs and invites a member", () => {
    renderDashboard("/settings");

    expect(screen.getByText("Account Profile")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Team members"));
    expect(screen.getByText("Alex Chen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
    const emailInput = screen.getByPlaceholderText("colleague@example.com");
    fireEvent.change(emailInput, { target: { value: "sam@letsmarknow.com" } });
    fireEvent.submit(emailInput.closest("form") as HTMLFormElement);

    expect(screen.getByText("sam@letsmarknow.com")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("resets data from settings tab", () => {
    renderDashboard("/settings");

    fireEvent.click(screen.getByText("Data & Reset"));
    expect(screen.getByText("Data Storage & Reset")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset to demo data/i }));
    expect(screen.getAllByText("My Collections").length).toBeGreaterThan(0);
  });

  it("renders public share viewer and filters by search", () => {
    renderDashboard("/share");

    expect(screen.getByText("Public collection preview")).toBeInTheDocument();
    expect(screen.getByText("Copy mock link")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search shared links...");
    fireEvent.change(searchInput, { target: { value: "Radix" } });
    expect(screen.getByText("Radix UI primitives")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    expect(screen.getByText("No matching items found")).toBeInTheDocument();
  });

  it("opens share dialog from collection menu and saves changes", () => {
    renderDashboard();

    const collectionMenuBtn = screen.getAllByTitle("Collection actions")[0];
    fireEvent.click(collectionMenuBtn);

    const shareItem = screen.getByText("Share collection");
    expect(shareItem).toBeInTheDocument();
    fireEvent.click(shareItem);

    expect(screen.getByText(/Share.*Design Systems/i)).toBeInTheDocument();
    expect(screen.getAllByText("Public")[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(screen.queryByText(/Share.*Design Systems/i)).not.toBeInTheDocument();
  }, 60000);

  it("shows item actions dropdown with open, copy, and share links", () => {
    renderDashboard();

    const itemCard = screen.getByText("Radix UI primitives").closest(".group");
    expect(itemCard).not.toBeNull();

    fireEvent.click(within(itemCard as HTMLElement).getByTitle("Item actions"));

    expect(screen.getByText("Open original URL")).toBeInTheDocument();
    expect(screen.getByText("Copy URL")).toBeInTheDocument();
    expect(screen.getByText("Copy share link")).toBeInTheDocument();
    expect(screen.getByText("Share item")).toBeInTheDocument();
  });

  it("navigates to settings sharing tab and displays shared links", () => {
    renderDashboard("/settings");

    fireEvent.click(screen.getByText("Sharing"));
    expect(screen.getByText("Shared Links & Resources")).toBeInTheDocument();
    expect(screen.getByText("Share current workspace")).toBeInTheDocument();
  });

  it("displays share not found state for unknown slug", () => {
    renderDashboard("/share/item/unknown-nonexistent-slug-xyz");

    expect(screen.getByText("Share not found")).toBeInTheDocument();
    expect(screen.getByText(/The public link you requested does not exist/i)).toBeInTheDocument();
  });

  it("adds an item targeted directly to a group via its group header plus button", () => {
    renderDashboard();

    const addAssetsItemBtn = screen.getByTitle("Add item to Assets");
    fireEvent.click(addAssetsItemBtn);

    expect(screen.getByRole("heading", { name: "Add item to Assets" })).toBeInTheDocument();
    expect(
      screen.getByText(/Adding saved link directly to Design Systems → Assets/i)
    ).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText("Readable title");
    fireEvent.change(titleInput, { target: { value: "Tailwind UI Icons" } });
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://tailwindui.com" },
    });
    fireEvent.submit(titleInput.closest("form") as HTMLFormElement);

    expect(screen.getByText("Tailwind UI Icons")).toBeInTheDocument();
    expect(screen.getByText("tailwindui.com")).toBeInTheDocument();
  });

  it("does not render add item button in top navigation bar", () => {
    renderDashboard();

    const topBar = screen.getByRole("banner");
    expect(within(topBar).queryByText("Add item")).not.toBeInTheDocument();
    expect(within(topBar).getByText("Collection")).toBeInTheDocument();
  });

  it("does not render add item option inside group or collection actions dropdown menus", () => {
    renderDashboard();

    // Verify group options menu
    const groupActionBtns = screen.getAllByTitle("Group actions");
    fireEvent.click(groupActionBtns[0]);
    expect(screen.queryByRole("menuitem", { name: /^add item$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /edit group/i })).toBeInTheDocument();

    // Close menu by hitting escape
    fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });

    // Verify collection options menu
    const collectionActionBtns = screen.getAllByTitle("Collection actions");
    fireEvent.click(collectionActionBtns[0]);
    expect(screen.queryByRole("menuitem", { name: /^add item$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /add group/i })).toBeInTheDocument();
  });
});

