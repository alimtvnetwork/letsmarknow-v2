import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceSettingsView } from "./WorkspaceSettingsView";
import { mockWorkspace } from "@/data/mockWorkspace";
import type { AppData } from "@/types/lmn";

describe("WorkspaceSettingsView Component", () => {
  let sampleData: AppData;
  const mockUpdateWorkspace = vi.fn();
  const mockDeleteWorkspace = vi.fn();
  const mockSwitchWorkspace = vi.fn();
  const mockDataUpdated = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    sampleData = JSON.parse(JSON.stringify(mockWorkspace));
  });

  it("renders workspace settings with workspace rename form", () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    expect(screen.getByTestId("workspace-settings-view")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-name-input")).toHaveValue("Personal Engine");
    expect(screen.getByTestId("workspace-initials-input")).toHaveValue("PE");
    expect(screen.getByTestId("save-workspace-btn")).toBeInTheDocument();
  });

  it("submits workspace rename updates", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const nameInput = screen.getByTestId("workspace-name-input");
    fireEvent.change(nameInput, { target: { value: "Renamed Engine" } });

    const saveBtn = screen.getByTestId("save-workspace-btn");
    fireEvent.click(saveBtn);

    expect(mockUpdateWorkspace).toHaveBeenCalledWith("Renamed Engine", "PE", "Pro");
  });

  it("switches to Members tab, lists members, and opens invite dialog", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const membersTabBtn = screen.getByRole("button", { name: /members & invites/i });
    fireEvent.click(membersTabBtn);

    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("Jordan Smith")).toBeInTheDocument();
    expect(screen.getByTestId("invite-member-btn")).toBeInTheDocument();

    // Open invite dialog
    fireEvent.click(screen.getByTestId("invite-member-btn"));

    await waitFor(() => {
      expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "newcollaborator@team.org" } });

    const sendBtn = screen.getByRole("button", { name: /send invitation/i });
    fireEvent.click(sendBtn);

    expect(mockDataUpdated).toHaveBeenCalled();
  });

  it("updates member role and removes member", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const membersTabBtn = screen.getByRole("button", { name: /members & invites/i });
    fireEvent.click(membersTabBtn);

    const roleSelect = screen.getByLabelText("Change role for Alex Chen");
    fireEvent.change(roleSelect, { target: { value: "Member" } });

    expect(mockDataUpdated).toHaveBeenCalled();
  });

  it("renders pending invites and allows copying invite link", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const membersTabBtn = screen.getByRole("button", { name: /members & invites/i });
    fireEvent.click(membersTabBtn);

    expect(screen.getByText("taylor@partner.org")).toBeInTheDocument();
    const copyInviteBtn = screen.getByRole("button", { name: /copy invite link/i });
    expect(copyInviteBtn).toBeInTheDocument();

    fireEvent.click(copyInviteBtn);
  });

  it("navigates to Sharing tab and configures public visibility", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const sharingTabBtn = screen.getByRole("button", { name: /sharing & visibility/i });
    fireEvent.click(sharingTabBtn);

    expect(screen.getByText("Workspace Sharing & Visibility")).toBeInTheDocument();
    expect(screen.getByText("Public Web Link")).toBeInTheDocument();

    const publicRadio = screen.getByRole("radio", { name: /public web link/i });
    fireEvent.click(publicRadio);

    const saveShareBtn = screen.getByRole("button", { name: /save visibility settings/i });
    fireEvent.click(saveShareBtn);

    expect(mockDataUpdated).toHaveBeenCalled();
  });

  it("navigates to Data tab and triggers export", async () => {
    render(
      <WorkspaceSettingsView
        data={sampleData}
        activeOrgId="org-personal"
        onUpdateWorkspace={mockUpdateWorkspace}
        onDeleteWorkspace={mockDeleteWorkspace}
        onSwitchWorkspace={mockSwitchWorkspace}
        onDataUpdated={mockDataUpdated}
      />
    );

    const dataTabBtn = screen.getByRole("button", { name: /import & export/i });
    fireEvent.click(dataTabBtn);

    expect(screen.getByText("Export Workspace Data")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download json backup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export csv spreadsheet/i })).toBeInTheDocument();
  });
});
