import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestinationPicker } from "./DestinationPicker";
import { mockWorkspace } from "@/data/mockWorkspace";

describe("DestinationPicker", () => {
  it("renders workspace, space, collection, and group selectors", () => {
    const org = mockWorkspace.organizations[0];
    const space = mockWorkspace.spaces[0];
    const col = mockWorkspace.collections[0];
    const grp = col.groups[0];

    render(
      <DestinationPicker
        organizations={mockWorkspace.organizations}
        spaces={mockWorkspace.spaces}
        collections={mockWorkspace.collections}
        selectedOrganizationId={org.id}
        selectedSpaceId={space.id}
        selectedCollectionId={col.id}
        selectedGroupId={grp.id}
        onSelectOrganization={vi.fn()}
        onSelectSpace={vi.fn()}
        onSelectCollection={vi.fn()}
        onSelectGroup={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateGroup={vi.fn()}
      />
    );

    expect(screen.getByTestId("destination-org-select")).toBeInTheDocument();
    expect(screen.getByTestId("destination-space-select")).toBeInTheDocument();
    expect(screen.getByTestId("destination-collection-select")).toBeInTheDocument();
    expect(screen.getByTestId("destination-group-select")).toBeInTheDocument();
  });

  it("triggers selection callbacks on change", () => {
    const onSelectOrg = vi.fn();
    const onSelectSpace = vi.fn();
    const onSelectCol = vi.fn();
    const onSelectGrp = vi.fn();

    render(
      <DestinationPicker
        organizations={mockWorkspace.organizations}
        spaces={mockWorkspace.spaces}
        collections={mockWorkspace.collections}
        selectedOrganizationId={mockWorkspace.organizations[0].id}
        selectedSpaceId={mockWorkspace.spaces[0].id}
        selectedCollectionId={mockWorkspace.collections[0].id}
        selectedGroupId={mockWorkspace.collections[0].groups[0].id}
        onSelectOrganization={onSelectOrg}
        onSelectSpace={onSelectSpace}
        onSelectCollection={onSelectCol}
        onSelectGroup={onSelectGrp}
        onCreateCollection={vi.fn()}
        onCreateGroup={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId("destination-org-select"), {
      target: { value: mockWorkspace.organizations[0].id },
    });
    expect(onSelectOrg).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("destination-collection-select"), {
      target: { value: mockWorkspace.collections[0].id },
    });
    expect(onSelectCol).toHaveBeenCalled();
  });

  it("calls onCreateCollection and onCreateGroup callbacks", () => {
    const onCreateCol = vi.fn();
    const onCreateGrp = vi.fn();

    render(
      <DestinationPicker
        organizations={mockWorkspace.organizations}
        spaces={mockWorkspace.spaces}
        collections={mockWorkspace.collections}
        selectedOrganizationId={mockWorkspace.organizations[0].id}
        selectedSpaceId={mockWorkspace.spaces[0].id}
        selectedCollectionId={mockWorkspace.collections[0].id}
        selectedGroupId={mockWorkspace.collections[0].groups[0].id}
        onSelectOrganization={vi.fn()}
        onSelectSpace={vi.fn()}
        onSelectCollection={vi.fn()}
        onSelectGroup={vi.fn()}
        onCreateCollection={onCreateCol}
        onCreateGroup={onCreateGrp}
      />
    );

    const newButtons = screen.getAllByRole("button", { name: /new/i });
    expect(newButtons.length).toBeGreaterThan(0);

    fireEvent.click(newButtons[0]);
    expect(onCreateCol).toHaveBeenCalled();

    fireEvent.click(newButtons[1]);
    expect(onCreateGrp).toHaveBeenCalled();
  });
});
