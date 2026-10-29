import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Check,
  Download,
  ExternalLink,
  FolderInput,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { AppData, ExtensionPreferences } from "@/types/lmn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  exportExtensionData,
  importExtensionData,
  loadPreferences,
  loadWorkspaceData,
  resetExtensionData,
  savePreferences,
  saveWorkspaceData,
} from "../lib/extensionStore";
import { openWebDashboard } from "../lib/browserApi";
import { getBrowserBookmarkTree, importBookmarksToWorkspace } from "@/lib/bookmarkImport";

export interface ExtensionSettingsViewProps {
  onDataUpdated?: (newData: AppData) => void;
  onOpenWorkspaceSettings?: () => void;
}

export function ExtensionSettingsView({
  onDataUpdated,
  onOpenWorkspaceSettings,
}: ExtensionSettingsViewProps) {
  const [data, setData] = useState<AppData | null>(null);
  const [prefs, setPrefs] = useState<ExtensionPreferences | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      const [workspaceData, storedPrefs] = await Promise.all([
        loadWorkspaceData(),
        loadPreferences(),
      ]);
      setData(workspaceData);
      setPrefs(storedPrefs);
    }
    load();
  }, []);

  if (!data || !prefs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await savePreferences(prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportData = async () => {
    const jsonStr = await exportExtensionData();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `letsmarknow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const updatedData = await importExtensionData(text);
      setData(updatedData);
      setImportSuccess(true);
      if (onDataUpdated) onDataUpdated(updatedData);
      setTimeout(() => setImportSuccess(false), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse import file";
      setImportError(message);
    } finally {
      e.target.value = "";
    }
  };

  const handleResetData = async () => {
    const demoData = await resetExtensionData();
    setData(demoData);
    setIsResetConfirming(false);
    if (onDataUpdated) onDataUpdated(demoData);
  };

  // Spaces for default workspace
  const availableSpaces = data.spaces.filter(
    (s) => !prefs.defaultOrganizationId || s.organizationId === prefs.defaultOrganizationId
  );
  // Collections for default space
  const availableCollections = data.collections.filter(
    (c) => !prefs.defaultSpaceId || c.spaceId === prefs.defaultSpaceId
  );
  const activeCol = availableCollections.find((c) => c.id === prefs.defaultCollectionId);
  const availableGroups = activeCol ? activeCol.groups : [];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Extension Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure default capture behavior, tab management options, and local extension storage.
        </p>
      </div>

      {/* Workspace & Members Navigation Banner */}
      {onOpenWorkspaceSettings && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">Manage Workspace & Members</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Rename workspace, invite team members, adjust roles, configure shared visibility, and export data.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onOpenWorkspaceSettings}
            data-testid="open-workspace-settings-from-prefs-btn"
            className="text-xs font-semibold shrink-0"
          >
            Workspace Settings
          </Button>
        </div>
      )}

      {/* Default Destinations Card */}
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          Default Capture Destination
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Default Workspace</label>
            <select
              value={prefs.defaultOrganizationId || ""}
              onChange={(e) =>
                setPrefs({ ...prefs, defaultOrganizationId: e.target.value || undefined })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">(Auto-detect first)</option>
              {data.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Default Space</label>
            <select
              value={prefs.defaultSpaceId || ""}
              onChange={(e) => setPrefs({ ...prefs, defaultSpaceId: e.target.value || undefined })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">(Auto-detect first)</option>
              {availableSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Default Collection</label>
            <select
              value={prefs.defaultCollectionId || ""}
              onChange={(e) =>
                setPrefs({ ...prefs, defaultCollectionId: e.target.value || undefined })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">(Auto-detect first)</option>
              {availableCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Default Group</label>
            <select
              value={prefs.defaultGroupId || ""}
              onChange={(e) => setPrefs({ ...prefs, defaultGroupId: e.target.value || undefined })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">(Auto-detect first)</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Behavior Toggles */}
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          Capture & Browser Behavior
        </h2>

        <div className="space-y-3.5 divide-y divide-border/40">
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <label htmlFor="pref-open-full" className="text-xs font-medium text-foreground">
                Open Full Extension Tab After Save
              </label>
              <p className="text-[11px] text-muted-foreground">
                Automatically opens the dashboard tab whenever you save a link or session.
              </p>
            </div>
            <Switch
              id="pref-open-full"
              checked={!!prefs.openFullTabAfterSave}
              onCheckedChange={(checked) => setPrefs({ ...prefs, openFullTabAfterSave: checked })}
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <label htmlFor="pref-close-tabs" className="text-xs font-medium text-foreground">
                Close Tabs After Save
              </label>
              <p className="text-[11px] text-muted-foreground">
                Automatically closes the browser tabs from your window once they are safely saved.
              </p>
            </div>
            <Switch
              id="pref-close-tabs"
              checked={!!prefs.closeTabsAfterSave}
              onCheckedChange={(checked) => setPrefs({ ...prefs, closeTabsAfterSave: checked })}
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <label htmlFor="pref-notifications" className="text-xs font-medium text-foreground">
                Show Success Notifications
              </label>
              <p className="text-[11px] text-muted-foreground">
                Display a brief notification badge when bookmarks are saved.
              </p>
            </div>
            <Switch
              id="pref-notifications"
              checked={!!prefs.showSuccessNotification}
              onCheckedChange={(checked) =>
                setPrefs({ ...prefs, showSuccessNotification: checked })
              }
            />
          </div>

          {/* Quick Surface Preference */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-foreground">
                Preferred Quick Capture Surface
              </label>
              <p className="text-[11px] text-muted-foreground">
                Choose whether clicking the extension icon opens the popup or Chrome side panel.
              </p>
            </div>
            <select
              value={prefs.preferredQuickSurface || "popup"}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  preferredQuickSurface: e.target.value as "popup" | "side-panel",
                })
              }
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
            >
              <option value="popup">Quick Popup (Default)</option>
              <option value="side-panel">Chrome Side Panel</option>
            </select>
          </div>

          {/* Theme Preference */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-foreground">Appearance Theme</label>
              <p className="text-[11px] text-muted-foreground">
                Customize extension UI color mode.
              </p>
            </div>
            <select
              value={prefs.theme || "dark"}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  theme: e.target.value as "system" | "dark" | "light",
                })
              }
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
            >
              <option value="dark">Dark (Recommended)</option>
              <option value="light">Light</option>
              <option value="system">Follow System</option>
            </select>
          </div>
        </div>

        {/* Web Portal Link & Shortcuts */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-foreground">Web Account & Billing</p>
            <p className="text-[11px] text-muted-foreground">Manage subscriptions, team members, and invoices on the web.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openWebDashboard("http://localhost:5173/web/account")}
            className="h-8 text-xs shrink-0 gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Web Account
          </Button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            size="sm"
            onClick={() => handleSavePreferences()}
            className="h-8 text-xs font-medium"
          >
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                Preferences Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 1-Click Chrome Bookmarks Migration */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              1-Click Chrome Bookmarks Import
            </h2>
            <p className="text-xs text-muted-foreground">
              Directly import your Chrome browser bookmarks bar and folders into your workspace collections.
            </p>
          </div>
          <Button
            size="sm"
            data-testid="settings-import-chrome-bookmarks-btn"
            onClick={async () => {
              if (!data) return;
              try {
                const targetSpaceId = prefs?.defaultSpaceId || data.spaces[0]?.id;
                const tree = await getBrowserBookmarkTree();
                const result = importBookmarksToWorkspace(data, targetSpaceId, tree);
                if (result.importedItemCount === 0) {
                  toast.info("No bookmarks found to import.");
                  return;
                }
                await saveWorkspaceData(result.nextData);
                setData(result.nextData);
                onDataUpdated?.(result.nextData);
                toast.success(
                  `Imported ${result.importedItemCount} bookmarks across ${result.importedCollectionCount} collections!`
                );
              } catch (err: any) {
                toast.error(err?.message || "Failed to import bookmarks");
              }
            }}
            className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white shrink-0 cursor-pointer"
          >
            <FolderInput className="h-3.5 w-3.5 mr-1.5" />
            Import Browser Bookmarks
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          Local Storage & Data Management
        </h2>

        {importError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
            <Check className="h-4 w-4 shrink-0" />
            <span>Data imported and synchronized successfully!</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={handleExportData} className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Local Data (JSON)
          </Button>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
            <Upload className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Import Local Data
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {!isResetConfirming ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsResetConfirming(true)}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset Demo Data
            </Button>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-destructive font-medium">Reset all extension data?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleResetData}
                className="h-7 text-xs"
              >
                Yes, Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsResetConfirming(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
