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
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Link2,
  AlertTriangle,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, type BackendHealthResponse } from "@/lib/apiClient";
import {
  fetchBackendLinkHealthStats,
  triggerBackendLinkHealth,
  triggerBackendFaviconFetch,
  listBackendJobs,
  type BackendJob,
  type LinkHealthStats,
} from "@/lib/workspaceApiClient";

export default function WebSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Personal Engine");
  const [emailDigest, setEmailDigest] = useState(true);
  const [shareNotifications, setShareNotifications] = useState(true);
  const [backendStatus, setBackendStatus] = useState<{
    loading: boolean;
    data: BackendHealthResponse | null;
    error: string | null;
  }>({ loading: false, data: null, error: null });

  const [linkHealthStats, setLinkHealthStats] = useState<LinkHealthStats | null>(null);
  const [linkHealthLoading, setLinkHealthLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [jobsList, setJobsList] = useState<BackendJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const loadJobsAndStats = async () => {
    try {
      setJobsLoading(true);
      const [stats, jobs] = await Promise.all([
        fetchBackendLinkHealthStats().catch(() => null),
        listBackendJobs({ limit: 10 }).catch(() => []),
      ]);
      if (stats) setLinkHealthStats(stats);
      if (jobs) setJobsList(jobs);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleTriggerLinkHealth = async () => {
    setLinkHealthLoading(true);
    try {
      const res = await triggerBackendLinkHealth();
      toast.success(
        `Link health check completed: ${res.result_summary?.ok_count ?? 0} ok, ${res.result_summary?.broken_count ?? 0} broken`
      );
      await loadJobsAndStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run link health check";
      toast.error(msg);
    } finally {
      setLinkHealthLoading(false);
    }
  };

  const handleTriggerFaviconFetch = async () => {
    setFaviconLoading(true);
    try {
      const res = await triggerBackendFaviconFetch({ force_refresh: true });
      toast.success(
        `Favicon fetch runner completed: ${res.result_summary?.favicons_resolved ?? 0} resolved`
      );
      await loadJobsAndStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh favicons";
      toast.error(msg);
    } finally {
      setFaviconLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setBackendStatus({ loading: true, data: null, error: null });
    try {
      const data = await api.checkHealth();
      setBackendStatus({ loading: false, data, error: null });
      toast.success(`Connected to backend v${data.version}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cannot reach backend";
      setBackendStatus({ loading: false, data: null, error: msg });
      toast.error(`Backend offline: ${msg}`);
    }
  };

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
        {/* Navigation Sidebar / Mobile Nav Bar */}
        <aside className="md:col-span-1 text-xs flex flex-col">
          <nav className="flex md:flex-col overflow-x-auto gap-1.5 pb-2 md:pb-0 whitespace-nowrap scrollbar-none shrink-0">
            <Link
              to="/web/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <User className="h-4 w-4" /> Account Profile
            </Link>
            <Link
              to="/web/billing"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <CreditCard className="h-4 w-4" /> Billing & Subscription
            </Link>
            <Link
              to="/web/team"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <Users className="h-4 w-4" /> Team & Members
            </Link>
            <Link
              to="/web/import-export"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <Download className="h-4 w-4" /> Import / Export / Backup
            </Link>
            <Link
              to="/web/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shrink-0"
            >
              <Shield className="h-4 w-4" /> Web Portal Settings
            </Link>
          </nav>
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

          {/* Backend API Engine Connectivity */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Backend Engine Connectivity</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testBackendConnection}
                disabled={backendStatus.loading}
                className="gap-1.5 text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${backendStatus.loading ? "animate-spin" : ""}`} />
                Test Connection
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">API Base URL</span>
                <p className="font-mono text-xs truncate">http://localhost:3000/v1</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  {backendStatus.data ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected (200 OK)</span>
                    </>
                  ) : backendStatus.error ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-semibold text-rose-600 dark:text-rose-400">Offline</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Untested (click test)</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">API Version</span>
                <p className="font-medium text-xs">
                  {backendStatus.data ? `v${backendStatus.data.version} (${backendStatus.data.environment})` : "—"}
                </p>
              </div>
            </div>

            {backendStatus.error && (
              <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md p-2">
                Connection check failed: {backendStatus.error}. Make sure the backend server is running on port 3000 (`npm run dev:backend`).
              </p>
            )}

            {backendStatus.data && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
                ✓ Successfully reached backend at {backendStatus.data.timestamp} (Uptime: {backendStatus.data.uptimeSeconds}s). Ready for Step 2.
              </p>
            )}
          </div>

          {/* Link Health & Background Tasks (Step 15) */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold">Link Health & Background Tasks</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Audit bookmarks for dead links/timeouts and resolve site favicons via DuckDuckGo privacy proxy.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerFaviconFetch}
                  disabled={faviconLoading}
                  className="gap-1.5 text-xs h-8"
                >
                  {faviconLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  Refresh Favicons
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleTriggerLinkHealth}
                  disabled={linkHealthLoading}
                  className="gap-1.5 text-xs h-8"
                >
                  {linkHealthLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  Audit Link Health
                </Button>
              </div>
            </div>

            {/* Health Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Total Bookmarks</span>
                <p className="font-semibold text-sm">{linkHealthStats?.total_items ?? "—"}</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Healthy</span>
                <p className="font-semibold text-sm text-emerald-500">
                  {linkHealthStats?.healthy ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Broken Links</span>
                <p className="font-semibold text-sm text-rose-500">
                  {linkHealthStats?.broken ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Redirects</span>
                <p className="font-semibold text-sm text-amber-500">
                  {linkHealthStats?.redirects ?? "—"}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Last Audited</span>
                <p className="font-mono text-[11px] text-muted-foreground truncate">
                  {linkHealthStats?.last_checked_at
                    ? new Date(linkHealthStats.last_checked_at).toLocaleTimeString()
                    : "Not yet checked"}
                </p>
              </div>
            </div>

            {/* Recent Jobs List */}
            {jobsList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground">Recent Async Jobs</span>
                <div className="space-y-1.5">
                  {jobsList.slice(0, 3).map((job) => (
                    <div
                      key={job.job_id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{job.kind.replace("_", " ")}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {job.job_id.slice(0, 8)}…
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            job.status === "succeeded"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : job.status === "failed"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {job.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {job.progress.percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
