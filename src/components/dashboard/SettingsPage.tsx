import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Globe2,
  Key,
  Laptop,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Share2,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  Collection,
  Organization,
  SavedItem,
  ShareSettings,
  ShareTargetType,
  Space,
} from "@/types/lmn";
import { getSharePath, getShareUrl } from "@/lib/shareLinks";
import { InviteMemberDialog } from "./ManageDialogs";
import { useAuth } from "@/lib/authStore";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Pending";
}

const initialMembers: TeamMember[] = [
  { id: "1", name: "You", email: "user@letsmarknow.com", role: "Owner", status: "Active" },
  { id: "2", name: "Alex Chen", email: "alex@example.com", role: "Admin", status: "Active" },
  { id: "3", name: "Jordan Smith", email: "jordan@example.com", role: "Member", status: "Active" },
];

export function SettingsPage({
  activeOrganization,
  organizations = [],
  spaces = [],
  collections = [],
  shareSettings = [],
  allActiveItems,
  activeItems,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onResetData,
  onExportData,
  onDisableShare,
  onOpenShareDialog,
  defaultTab = "profile",
}: {
  activeOrganization: Organization;
  organizations?: Organization[];
  spaces?: Space[];
  collections?: Collection[];
  shareSettings?: ShareSettings[];
  allActiveItems: number;
  activeItems: SavedItem[];
  onUpdateWorkspace?: (name: string, initials: string, plan: string) => void;
  onDeleteWorkspace?: (orgId: string) => void;
  onResetData?: () => void;
  onExportData?: () => void;
  onDisableShare?: (targetType: ShareTargetType, targetId: string) => void;
  onOpenShareDialog?: (targetType: ShareTargetType, targetId: string, targetName: string) => void;
  defaultTab?: string;
}) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [profileName, setProfileName] = useState(session?.name || "Workspace Owner");
  const [profileEmail, setProfileEmail] = useState(session?.email || "owner@letsmarknow.com");
  const [profileTimezone, setProfileTimezone] = useState("UTC");

  const [wsName, setWsName] = useState(activeOrganization.name);
  const [wsInitials, setWsInitials] = useState(activeOrganization.initials);
  const [wsPlan, setWsPlan] = useState(activeOrganization.plan);

  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [badgeCountEnabled, setBadgeCountEnabled] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile saved successfully");
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    onUpdateWorkspace?.(wsName.trim(), wsInitials.trim(), wsPlan);
    toast.success("Workspace settings updated");
  };

  const handleInvite = (email: string, role: string) => {
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: email.split("@")[0],
      email,
      role: role as TeamMember["role"],
      status: "Pending",
    };
    setMembers((prev) => [...prev, newMember]);
    toast.success(`Invitation sent to ${email}`);
  };

  const handleDownloadExport = () => {
    if (onExportData) {
      onExportData();
      return;
    }
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      organization: activeOrganization,
      spaces,
      collections,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `letsmarknow-${activeOrganization.name.toLowerCase().replace(/\s+/g, "-")}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Workspace JSON archive downloaded");
  };

  const handleMockImport = () => {
    toast.success("Imported 12 bookmarks into Inbox space");
  };

  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <section className="min-h-0 flex-1 overflow-auto p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace & Preferences
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger
            value="profile"
            className="text-xs"
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="workspace"
            className="text-xs"
            onClick={() => setActiveTab("workspace")}
          >
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Workspace
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="text-xs"
            onClick={() => setActiveTab("members")}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Team members
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="text-xs"
            onClick={() => setActiveTab("billing")}
          >
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="import-export"
            className="text-xs"
            onClick={() => setActiveTab("import-export")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import / Export
          </TabsTrigger>
          <TabsTrigger
            value="sharing"
            className="text-xs"
            onClick={() => setActiveTab("sharing")}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Sharing
          </TabsTrigger>
          <TabsTrigger
            value="data-reset"
            className="text-xs"
            onClick={() => setActiveTab("data-reset")}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Data & Reset
          </TabsTrigger>
          <TabsTrigger
            value="extension"
            className="text-xs"
            onClick={() => setActiveTab("extension")}
          >
            <Laptop className="mr-1.5 h-3.5 w-3.5" />
            Extension
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Account Profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your personal display name, email, and preferences.
            </p>
            <form onSubmit={handleSaveProfile} className="mt-5 max-w-lg space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-tz">Timezone</Label>
                <select
                  id="profile-tz"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={profileTimezone}
                  onChange={(e) => setProfileTimezone(e.target.value)}
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="EST">America/New_York (EST)</option>
                  <option value="PST">America/Los_Angeles (PST)</option>
                  <option value="GMT">Europe/London (GMT)</option>
                </select>
              </div>
              <Button type="submit">Save profile</Button>
            </form>
          </div>
        </TabsContent>

        {/* WORKSPACE TAB */}
        <TabsContent value="workspace" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Workspace Configuration</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure name, initials, and organization tier for {activeOrganization.name}.
            </p>
            <form onSubmit={handleSaveWorkspace} className="mt-5 max-w-lg space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input
                  id="ws-name"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Product Team"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ws-initials">Initials / Shortcode</Label>
                <Input
                  id="ws-initials"
                  maxLength={3}
                  value={wsInitials}
                  onChange={(e) => setWsInitials(e.target.value.toUpperCase())}
                  placeholder="PT"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ws-plan">Tier</Label>
                <select
                  id="ws-plan"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={wsPlan}
                  onChange={(e) => setWsPlan(e.target.value)}
                >
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Team">Team</option>
                </select>
              </div>
              <Button type="submit">Save workspace</Button>
            </form>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Spaces</p>
              <p className="mt-1 text-2xl font-bold">{spaces.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Collections</p>
              <p className="mt-1 text-2xl font-bold">{collections.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Active items</p>
              <p className="mt-1 text-2xl font-bold">{allActiveItems}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Workspace Access & Sharing</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create public or member-only links to share this entire workspace with collaborators.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onOpenShareDialog?.("workspace", activeOrganization.id, activeOrganization.name)
                }
                className="gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share workspace
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Deleting a workspace removes all its spaces and collections from local state.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-4"
              disabled={organizations.length <= 1}
              onClick={() => onDeleteWorkspace?.(activeOrganization.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete workspace
            </Button>
            {organizations.length <= 1 && (
              <p className="mt-2 text-xs text-muted-foreground">
                You cannot delete the only remaining workspace.
              </p>
            )}
          </div>
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Team members</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Collaborate across collections and share link management.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Invite member
              </Button>
            </div>

            <div className="mt-5 rounded-lg border border-border divide-y divide-border">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {member.role}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        member.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                features: ["Up to 3 spaces", "100 saved links", "Standard search"],
              },
              {
                name: "Pro",
                price: "$8/mo",
                features: [
                  "Unlimited spaces & links",
                  "Public share pages",
                  "Browser extension pairing",
                  "Command palette shortcuts",
                ],
              },
              {
                name: "Team",
                price: "$16/mo",
                features: [
                  "Everything in Pro",
                  "Multi-seat collaboration",
                  "Role-based permissions",
                  "Audit activity log",
                ],
              },
            ].map((plan) => {
              const isCurrent = activeOrganization.plan.toLowerCase() === plan.name.toLowerCase();
              return (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-lg border p-5 flex flex-col justify-between transition",
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{plan.name}</h3>
                      {isCurrent && (
                        <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold">{plan.price}</p>
                    <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    size="sm"
                    className="mt-6"
                    onClick={() => {
                      if (isCurrent) {
                        toast.info(`Already on ${plan.name} plan`);
                      } else {
                        onUpdateWorkspace?.(activeOrganization.name, activeOrganization.initials, plan.name);
                        toast.success(`Switched to ${plan.name} plan`);
                      }
                    }}
                  >
                    {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* IMPORT / EXPORT TAB */}
        <TabsContent value="import-export" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Import / Export</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfer bookmarks and saved links into or out of LetsMarkNow without lock-in.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <Upload className="h-5 w-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold">Import Bookmarks</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Simulate importing standard browser HTML export or CSV links into your active Inbox.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleMockImport}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import bookmarks
                </Button>
              </div>

              <div className="rounded-lg border border-border p-4">
                <Download className="h-5 w-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold">Export JSON Archive</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Download a full backup of all your spaces, collections, groups, and tags as JSON.
                </p>
                <Button size="sm" className="mt-4" onClick={handleDownloadExport}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SHARING TAB */}
        <TabsContent value="sharing" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Shared Links & Resources</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  View and govern all active public and member access links across workspaces, spaces,
                  collections, groups, and bookmarks.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onOpenShareDialog?.("workspace", activeOrganization.id, activeOrganization.name)
                }
                className="gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share current workspace
              </Button>
            </div>

            {shareSettings.length > 0 ? (
              <div className="mt-5 divide-y divide-border rounded-lg border border-border overflow-hidden">
                {shareSettings.map((share) => {
                  const shareUrl = getShareUrl(share.targetType, share.publicSlug);
                  return (
                    <div
                      key={share.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            {share.targetType}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                              share.visibility === "public"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : share.visibility === "members"
                                  ? "bg-sky-500/15 text-sky-400"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {share.visibility}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            /{share.publicSlug}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created {share.createdAt} · Permission:{" "}
                          <span className="font-medium text-foreground">{share.permission}</span>
                          {share.allowCopy && " · Copying enabled"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => {
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(shareUrl).catch(() => {});
                            }
                            toast.success("Share link copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() =>
                            navigate(getSharePath(share.targetType, share.publicSlug))
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview
                        </Button>
                        {onDisableShare && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              onDisableShare(share.targetType, share.targetId);
                              toast.success("Share access disabled");
                            }}
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
                <Share2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">No shared links created</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the share action on any workspace, space, collection, group, or bookmark to
                  generate public links.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* DATA & RESET TAB */}
        <TabsContent value="data-reset" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Data Storage & Reset</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              All workspace data is currently stored in your browser's local storage.
            </p>
            <div className="mt-5 space-y-4 max-w-lg">
              <div className="rounded-lg border border-border p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Workspaces:</span>
                  <span className="font-semibold">{organizations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Spaces:</span>
                  <span className="font-semibold">{spaces.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Collections:</span>
                  <span className="font-semibold">{collections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saved Items:</span>
                  <span className="font-semibold">{allActiveItems}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onResetData?.();
                    toast.success("Demo data restored");
                  }}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Reset to demo data
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Restores default mock workspaces, spaces, and collections.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* EXTENSION TAB */}
        <TabsContent value="extension" className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Extension Preferences</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure how the upcoming LetsMarkNow Chrome & Firefox extension syncs with this web app.
            </p>
            <div className="mt-5 space-y-4 max-w-lg text-xs">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Key className="h-4 w-4 text-primary" />
                  Quick-Save Shortcut
                </div>
                <p className="text-muted-foreground">
                  Use <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Alt + S</kbd> or{" "}
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Cmd + Shift + L</kbd> to save
                  the active browser tab directly to LetsMarkNow.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-semibold text-foreground">Show Extension Badge</p>
                  <p className="text-muted-foreground">
                    Display badge count on browser toolbar for items saved today.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={badgeCountEnabled}
                  onChange={(e) => {
                    setBadgeCountEnabled(e.target.checked);
                    toast.success(
                      `Badge count ${e.target.checked ? "enabled" : "disabled"}`
                    );
                  }}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInvite}
      />
    </section>
  );
}
