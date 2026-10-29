import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  AppData,
  Organization,
  PendingInvite,
  SharePermission,
  ShareSettings,
  ShareVisibility,
  TeamMember,
} from "@/types/lmn";
import { openWebAccount } from "../lib/browserApi";
import { slugify } from "@/lib/shareLinks";

export interface WorkspaceSettingsViewProps {
  data: AppData;
  activeOrgId: string;
  initialTab?: "general" | "members" | "sharing" | "data";
  onUpdateWorkspace: (name: string, initials: string, plan: string) => Promise<void> | void;
  onDeleteWorkspace?: (orgId: string) => Promise<void> | void;
  onSwitchWorkspace: (orgId: string) => void;
  onDataUpdated: (nextData: AppData) => Promise<void> | void;
  onNavigateToTab?: (page: string) => void;
}

export function WorkspaceSettingsView({
  data,
  activeOrgId,
  initialTab,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onSwitchWorkspace,
  onDataUpdated,
  onNavigateToTab,
}: WorkspaceSettingsViewProps) {
  const activeOrg: Organization = useMemo(() => {
    return (
      data.organizations.find((o) => o.id === activeOrgId) ||
      data.organizations[0] || {
        id: "org-default",
        name: "My Workspace",
        initials: "MW",
        plan: "Free",
      }
    );
  }, [data.organizations, activeOrgId]);

  const [activeTab, setActiveTab] = useState<"general" | "members" | "sharing" | "data">(initialTab ?? "general");

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form states for workspace rename
  const [nameInput, setNameInput] = useState(activeOrg.name);
  const [initialsInput, setInitialsInput] = useState(activeOrg.initials);
  const [planInput, setPlanInput] = useState(activeOrg.plan || "Free");
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if activeOrg changes
  React.useEffect(() => {
    setNameInput(activeOrg.name);
    setInitialsInput(activeOrg.initials);
    setPlanInput(activeOrg.plan || "Free");
  }, [activeOrg]);

  // Workspace members & pending invites
  const members: TeamMember[] = useMemo(() => {
    const list = data.members || [];
    return list.filter((m) => !m.organizationId || m.organizationId === activeOrg.id);
  }, [data.members, activeOrg.id]);

  const pendingInvites: PendingInvite[] = useMemo(() => {
    const list = data.pendingInvites || [];
    return list.filter((inv) => inv.organizationId === activeOrg.id);
  }, [data.pendingInvites, activeOrg.id]);

  // Invite modal state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member" | "Viewer">("Member");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Sharing state
  const existingShare: ShareSettings | undefined = useMemo(() => {
    return data.shareSettings?.find(
      (s) => s.targetType === "workspace" && s.targetId === activeOrg.id
    );
  }, [data.shareSettings, activeOrg.id]);

  const [visibility, setVisibility] = useState<ShareVisibility>(
    existingShare?.visibility || "members"
  );
  const [permission, setPermission] = useState<SharePermission>(
    existingShare?.permission || "view"
  );
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  // Import state
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // 1. Workspace Rename Submit
  const handleSaveWorkspaceInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }

    await onUpdateWorkspace(nameInput.trim(), initialsInput.trim(), planInput);
    setIsSaved(true);
    toast.success("Workspace settings updated successfully");
    setTimeout(() => setIsSaved(false), 2000);
  };

  // 2. Member Management
  const handleChangeMemberRole = async (memberId: string, newRole: TeamMember["role"]) => {
    const updatedMembers = (data.members || []).map((m) =>
      m.id === memberId ? { ...m, role: newRole } : m
    );
    const nextData: AppData = { ...data, members: updatedMembers };
    await onDataUpdated(nextData);
    toast.success("Member role updated");
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      const updatedMembers = (data.members || []).filter((m) => m.id !== memberId);
      const nextData: AppData = { ...data, members: updatedMembers };
      await onDataUpdated(nextData);
      toast.success(`${memberName} removed from workspace`);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    const token = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newInvite: PendingInvite = {
      id: `invite-${Date.now()}`,
      organizationId: activeOrg.id,
      email: cleanEmail,
      role: inviteRole,
      token,
      createdAt: "Just now",
    };

    const nextData: AppData = {
      ...data,
      pendingInvites: [...(data.pendingInvites || []), newInvite],
    };

    await onDataUpdated(nextData);
    setInviteEmail("");
    setIsInviteDialogOpen(false);
    toast.success(`Invitation created for ${cleanEmail}`);
  };

  const handleCancelInvite = async (inviteId: string) => {
    const updatedInvites = (data.pendingInvites || []).filter((inv) => inv.id !== inviteId);
    const nextData: AppData = { ...data, pendingInvites: updatedInvites };
    await onDataUpdated(nextData);
    toast.success("Invitation cancelled");
  };

  const handleCopyInviteLink = (token: string, inviteId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const inviteUrl = `${origin}/web/invite/${token}`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setCopiedInviteId(inviteId);
    toast.success("Invite acceptance link copied to clipboard");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        setCopiedInviteId(null);
      }
    }, 2000);
  };

  // 3. Sharing & Visibility
  const handleSaveShareSettings = async () => {
    const existing = data.shareSettings || [];
    const publicSlug = slugify(activeOrg.name) || activeOrg.id;
    let nextShares: ShareSettings[];

    const foundIdx = existing.findIndex(
      (s) => s.targetType === "workspace" && s.targetId === activeOrg.id
    );

    const newSetting: ShareSettings = {
      id: existingShare?.id || `share-${Date.now()}`,
      targetType: "workspace",
      targetId: activeOrg.id,
      visibility,
      permission,
      publicSlug,
      allowCopy: true,
      createdAt: existingShare?.createdAt || "Just now",
    };

    if (foundIdx >= 0) {
      nextShares = [...existing];
      nextShares[foundIdx] = newSetting;
    } else {
      nextShares = [...existing, newSetting];
    }

    const nextData: AppData = { ...data, shareSettings: nextShares };
    await onDataUpdated(nextData);
    toast.success("Workspace sharing visibility saved");
  };

  const handleCopyWorkspacePublicUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const slug = existingShare?.publicSlug || slugify(activeOrg.name);
    const url = `${origin}/web/share/${slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedShareUrl(true);
    toast.success("Workspace public share link copied");
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  // 4. Data Export & Backups
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `letsmarknow-${activeOrg.name.toLowerCase().replace(/\s+/g, "-")}-backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Full workspace backup downloaded");
  };

  const handleExportCsv = () => {
    const activeSpaceIds = new Set(
      data.spaces.filter((s) => s.organizationId === activeOrg.id).map((s) => s.id)
    );
    const activeCollections = data.collections.filter((c) => activeSpaceIds.has(c.spaceId));

    const rows = [
      ["Title", "URL", "Description", "Tags", "Collection", "Group"],
      ...activeCollections.flatMap((c) =>
        c.groups.flatMap((g) =>
          g.items.map((i) => [
            `"${(i.title || "").replace(/"/g, '""')}"`,
            `"${(i.url || "").replace(/"/g, '""')}"`,
            `"${(i.description || "").replace(/"/g, '""')}"`,
            `"${i.tags.join(";")}"`,
            `"${c.name.replace(/"/g, '""')}"`,
            `"${g.name.replace(/"/g, '""')}"`,
          ])
        )
      ),
    ];

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `letsmarknow-${activeOrg.name.toLowerCase().replace(/\s+/g, "-")}-bookmarks.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Bookmarks CSV exported successfully");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.organizations)) {
        await onDataUpdated(parsed as AppData);
        setImportStatus("Import successful! Workspace restored from backup.");
        toast.success("Workspace JSON restored");
      } else {
        setImportStatus("Invalid file format. Please upload a valid LetsMarkNow JSON file.");
        toast.error("Invalid file structure");
      }
    } catch {
      setImportStatus("Failed to parse file. Please verify it is a valid JSON file.");
      toast.error("Failed to parse import file");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div
      data-testid="workspace-settings-view"
      className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6"
    >
      {/* Top Header & Workspace Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
              {activeOrg.initials || "WS"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {activeOrg.name}
                </h1>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {activeOrg.plan || "Free"} Plan
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage workspace settings, team members, pending invites, visibility, and data.
              </p>
            </div>
          </div>
        </div>

        {/* Switch Workspace Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Switch:</span>
          <select
            value={activeOrg.id}
            onChange={(e) => onSwitchWorkspace(e.target.value)}
            aria-label="Switch active workspace"
            className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary"
          >
            {data.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.plan || "Free"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs overflow-x-auto whitespace-nowrap scrollbar-none pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors shrink-0",
            activeTab === "general"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          Workspace Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors shrink-0",
            activeTab === "members"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Members & Invites ({members.length + pendingInvites.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sharing")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors shrink-0",
            activeTab === "sharing"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe2 className="h-3.5 w-3.5" />
          Sharing & Visibility
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors shrink-0",
            activeTab === "data"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Import & Export
        </button>
      </div>

      {/* TAB 1: GENERAL WORKSPACE SETTINGS */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Rename & Workspace Identity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update the display name, icon badge initials, and subscription tier for this workspace.
              </p>
            </div>

            <form onSubmit={handleSaveWorkspaceInfo} className="space-y-4 max-w-lg pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="ws-name" className="text-xs font-medium">
                  Workspace Name
                </Label>
                <Input
                  id="ws-name"
                  data-testid="workspace-name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Acme Corp Research"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ws-initials" className="text-xs font-medium">
                    Badge Initials (2-3 Chars)
                  </Label>
                  <Input
                    id="ws-initials"
                    data-testid="workspace-initials-input"
                    value={initialsInput}
                    onChange={(e) => setInitialsInput(e.target.value.toUpperCase())}
                    maxLength={3}
                    placeholder="AC"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ws-plan" className="text-xs font-medium">
                    Subscription Tier
                  </Label>
                  <select
                    id="ws-plan"
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro Cloud</option>
                    <option value="Team">Team Collaboration</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  data-testid="save-workspace-btn"
                  className="gap-1.5 text-xs font-medium"
                >
                  {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
                  {isSaved ? "Saved!" : "Save Workspace Changes"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openWebAccount("/web/billing")}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage Billing on Web
                </Button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Delete Workspace */}
          {onDeleteWorkspace && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-destructive">Danger Zone: Delete Workspace</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete &ldquo;{activeOrg.name}&rdquo; and all associated spaces and collections.
                    This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={data.organizations.length <= 1}
                  onClick={() => onDeleteWorkspace(activeOrg.id)}
                  className="text-xs font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete This Workspace
                </Button>
                {data.organizations.length <= 1 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    You cannot delete your only workspace. Create another workspace first.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS & INVITES */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Workspace Members ({members.length})</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Collaborators who can view or organize bookmarks inside &ldquo;{activeOrg.name}&rdquo;.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setIsInviteDialogOpen(true)}
              data-testid="invite-member-btn"
              className="gap-1.5 text-xs font-semibold"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs divide-y divide-border/60">
            {members.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No members found for this workspace.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{member.name}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[10px] font-medium border",
                            member.role === "Owner"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : member.role === "Admin"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  {/* Member Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {member.role !== "Owner" ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeMemberRole(member.id, e.target.value as TeamMember["role"])
                          }
                          aria-label={`Change role for ${member.name}`}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                          <option value="Viewer">Viewer</option>
                        </select>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic pr-2">
                        Workspace Creator
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pending Invitations Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending Invitations ({pendingInvites.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Recipients can accept their invite on the web portal even without the extension installed.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden">
              {pendingInvites.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No pending invitations. Click &ldquo;Invite Member&rdquo; above to invite teammates.
                </div>
              ) : (
                pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-500">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{inv.email}</span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                            Invited as {inv.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Created: {inv.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyInviteLink(inv.token, inv.id)}
                        className="h-7 text-[11px] gap-1"
                      >
                        {copiedInviteId === inv.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy Invite Link
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHARING & VISIBILITY */}
      {activeTab === "sharing" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs max-w-2xl">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Workspace Sharing & Visibility</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure who can discover, view, or contribute to this workspace.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                  visibility === "private"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Private
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Only members explicitly added to this workspace can access its bookmarks.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                  visibility === "members"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="members"
                  checked={visibility === "members"}
                  onChange={() => setVisibility("members")}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Workspace Members Only
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Accessible to all confirmed members and teammates in your organization.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                  visibility === "public"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" />
                    Public Web Link
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Anyone with the public link can browse collections without an account or extension.
                  </p>
                </div>
              </label>
            </div>

            {visibility === "public" && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                <span className="text-[11px] font-semibold text-foreground">Public Workspace Link:</span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"}/web/share/${existingShare?.publicSlug || slugify(activeOrg.name)}`}
                    className="h-8 text-xs font-mono bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyWorkspacePublicUrl}
                    className="h-8 text-xs gap-1 shrink-0"
                  >
                    {copiedShareUrl ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy Link
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button size="sm" onClick={handleSaveShareSettings} className="gap-1.5 text-xs font-semibold">
                <Save className="h-3.5 w-3.5" />
                Save Visibility Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT, EXPORT & BACKUPS */}
      {activeTab === "data" && (
        <div className="space-y-6 max-w-2xl">
          {/* Export card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Export Workspace Data</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download your collections and bookmarks for offline backups or spreadsheet analysis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="sm" onClick={handleExportJson} className="gap-1.5 text-xs font-semibold">
                <Download className="h-3.5 w-3.5" />
                Download JSON Backup
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                className="gap-1.5 text-xs font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV Spreadsheet
              </Button>
            </div>
          </div>

          {/* Import card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Import Backup</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restore a previously saved LetsMarkNow workspace backup JSON file.
              </p>
            </div>

            <div className="pt-2">
              <Label
                htmlFor="import-workspace-file"
                className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs font-medium text-foreground">Choose a JSON backup file to upload</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Supports .json workspace backups</span>
                <input
                  id="import-workspace-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </Label>

              {importStatus && (
                <p className="text-xs text-primary font-medium mt-3 text-center">{importStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Dialog Modal */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSendInvite}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Invite Team Member
              </DialogTitle>
              <DialogDescription className="text-xs">
                Invite a colleague to collaborate in &ldquo;{activeOrg.name}&rdquo;. They can accept via web link.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs font-medium">
                  Email Address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  autoFocus
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-role" className="text-xs font-medium">
                  Role & Permissions
                </Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "Admin" | "Member" | "Viewer")}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Admin">Admin (can manage spaces, collections, and members)</option>
                  <option value="Member">Member (can add, edit, and move bookmarks)</option>
                  <option value="Viewer">Viewer (read-only access)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsInviteDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
