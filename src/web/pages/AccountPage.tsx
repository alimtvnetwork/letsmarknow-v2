import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Chrome,
  CreditCard,
  Download,
  ExternalLink,
  Key,
  Laptop,
  LayoutDashboard,
  LogOut,
  Shield,
  Smartphone,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const [name, setName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane@letsmarknow.com");
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Connected browsers/devices list
  const [connectedDevices, setConnectedDevices] = useState([
    { id: "1", name: "Chrome on macOS (Work MacBook)", lastActive: "Active now", isCurrent: true },
    { id: "2", name: "Edge on Windows 11 (Home Desktop)", lastActive: "Yesterday at 6:45 PM", isCurrent: false },
    { id: "3", name: "Brave on Ubuntu Linux (ThinkPad)", lastActive: "3 days ago", isCurrent: false },
  ]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    toast.success("Account profile updated successfully");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRemoveDevice = (id: string) => {
    setConnectedDevices((prev) => prev.filter((d) => d.id !== id));
    toast.success("Device disconnected successfully");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Account Portal</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              Launch Extension Tab
            </Button>
          </Link>
          <Link to="/web/login">
            <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <Users className="h-4 w-4" /> Team & Members
          </Link>
          <Link
            to="/web/import-export"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <Download className="h-4 w-4" /> Import / Export / Backup
          </Link>
          <Link
            to="/web/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors"
          >
            <Shield className="h-4 w-4" /> Web Portal Settings
          </Link>

          <div className="pt-6 border-t border-border mt-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] space-y-2">
              <p className="font-semibold text-primary">Looking for your bookmarks?</p>
              <p className="text-muted-foreground">The saved-link organizer lives inside the extension main page.</p>
              <Link to="/">
                <Button size="sm" className="w-full h-7 text-xs">Open Extension</Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your personal credentials, authentication, and connected browser extensions.
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold border-b border-border/60 pb-3">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" className="text-xs gap-1.5">
                {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : null}
                Save Changes
              </Button>
            </div>
          </form>

          {/* Password & Authentication Placeholder */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Key className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Security & Password</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <Input type="password" placeholder="••••••••••••" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input type="password" placeholder="Enter new password" className="h-9 text-xs" />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Two-factor authentication (2FA) is enabled.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Password update requested")}
                className="text-xs"
              >
                Update Password
              </Button>
            </div>
          </div>

          {/* Connected Browsers & Devices Placeholder */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Chrome className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Connected Browsers & Devices</h2>
              </div>
              <span className="text-xs text-muted-foreground">{connectedDevices.length} registered</span>
            </div>

            <div className="divide-y divide-border/60">
              {connectedDevices.map((device) => (
                <div key={device.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {device.name}
                        {device.isCurrent && (
                          <span className="rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 text-[10px] font-mono">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{device.lastActive}</p>
                    </div>
                  </div>

                  {!device.isCurrent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveDevice(device.id)}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently delete your LetsMarkNow web account, subscription, and cloud shares. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be reversed.")) {
                  toast.success("Account deletion requested");
                }
              }}
              className="text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Account
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
