import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Shield,
  Sliders,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function WebSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Personal Engine");
  const [emailDigest, setEmailDigest] = useState(true);
  const [shareNotifications, setShareNotifications] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Web settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Web Settings</span>
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            <Shield className="h-4 w-4" /> Web Portal Settings
          </Link>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Web Portal Settings</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure global cloud settings, notification preferences, and workspace metadata.
            </p>
          </div>

          <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold border-b border-border/60 pb-3">Workspace Preferences</h2>
              <div className="space-y-1.5 text-xs max-w-md">
                <Label className="text-xs">Default Workspace Name</Label>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-semibold border-b border-border/60 pb-3">Email & Notifications</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Weekly Activity Digest</p>
                    <p className="text-[11px] text-muted-foreground">Receive a weekly summary of saved links and active sessions.</p>
                  </div>
                  <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Share Link Access Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Get notified when a public collection receives views or shares.</p>
                  </div>
                  <Switch checked={shareNotifications} onCheckedChange={setShareNotifications} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 flex justify-end">
              <Button type="submit" size="sm" className="text-xs">
                Save Preferences
              </Button>
            </div>
          </form>

          {/* Quick link to Extension Preferences */}
          <div className="rounded-xl border border-primary/25 bg-card/60 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-xs text-foreground">Browser Extension Settings</h3>
              <p className="text-[11px] text-muted-foreground">
                Tab capture behaviors, keyboard shortcuts, and local storage options are managed inside the extension tab.
              </p>
            </div>
            <Link to="/?view=settings">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 shrink-0">
                <ExternalLink className="h-3.5 w-3.5" /> Extension Settings
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
