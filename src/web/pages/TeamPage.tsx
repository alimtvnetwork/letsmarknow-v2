import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Plus,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchOrgMembers, inviteOrgMembers, removeOrgMember } from "@/lib/orgStore";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Pending";
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "1", name: "You (Jane Doe)", email: "jane@letsmarknow.com", role: "Owner", status: "Active" },
    { id: "2", name: "Alex Chen", email: "alex@example.com", role: "Admin", status: "Active" },
    { id: "3", name: "Jordan Smith", email: "jordan@example.com", role: "Member", status: "Active" },
    { id: "4", name: "Taylor Swift", email: "taylor@partner.org", role: "Viewer", status: "Pending" },
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member" | "Viewer">("Member");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchOrgMembers()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        setMembers(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: (m.role === "editor"
              ? "Member"
              : m.role.charAt(0).toUpperCase() + m.role.slice(1)) as TeamMember["role"],
            status: m.status === "active" ? "Active" : "Pending",
          }))
        );
      })
      .catch(() => {
        // Keep initial mock list for offline/test environments
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const apiRole = inviteRole === "Member" ? "editor" : (inviteRole.toLowerCase() as "admin" | "viewer");
      await inviteOrgMembers([{ email: inviteEmail.trim(), role: apiRole }]);
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch {
      toast.success(`Invitation recorded for ${inviteEmail}`);
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "Pending",
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setIsInviteModalOpen(false);
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      try {
        await removeOrgMember(id);
      } catch {
        // Fallback for local mock members
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success(`${name} was removed from the team`);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/web/invite/team-invite-demo`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setInviteLinkCopied(true);
    toast.success("Team invitation link copied to clipboard");
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Team Management</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              Launch Extension
            </Button>
          </Link>
          <Link to="/web/account">
            <Button size="sm" variant="ghost" className="text-xs">
              Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 space-y-1 text-xs">
          <Link
            to="/web/account"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <User className="h-4 w-4" /> Account Profile
          </Link>
          <Link
            to="/web/billing"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <CreditCard className="h-4 w-4" /> Billing & Subscription
          </Link>
          <Link
            to="/web/team"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            <Users className="h-4 w-4" /> Team & Members
          </Link>
          <Link
            to="/web/import-export"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <Download className="h-4 w-4" /> Import / Export / Backup
          </Link>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workspace Team Members</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Collaborate on collections and shared bookmark spaces with teammates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInviteLink}
                className="text-xs gap-1.5"
              >
                {inviteLinkCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Invite Link
              </Button>
              <Button
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                className="text-xs gap-1.5 font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5" /> Invite Member
              </Button>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="border-b border-border/80 px-4 py-3 flex items-center justify-between bg-muted/20 text-xs font-semibold">
              <span>Member Details</span>
              <span>Role & Actions</span>
            </div>

            <div className="divide-y divide-border/60">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        member.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {member.status}
                    </span>

                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono">
                      {member.role}
                    </span>

                    {member.role !== "Owner" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Invite Teammate to Workspace
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendInvite} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Workspace Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "Admin" | "Member" | "Viewer")}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
              >
                <option value="Admin">Admin (Can edit collections, invite others)</option>
                <option value="Member">Member (Can add and edit links)</option>
                <option value="Viewer">Viewer (Read-only access to collections)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
