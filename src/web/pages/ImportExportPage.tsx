import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderDown,
  FolderUp,
  LayoutDashboard,
  RefreshCw,
  Upload,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportExtensionData, importExtensionData, loadWorkspaceData, resetExtensionData, saveWorkspaceData } from "@/extension/lib/extensionStore";

import {
  createBackendExport,
  uploadImport,
  fetchImportPreview,
  commitImport,
  type ImportPreviewResponse,
} from "@/lib/workspaceApiClient";

export default function ImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [lastPreview, setLastPreview] = useState<ImportPreviewResponse | null>(null);

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      try {
        const exportJob = await createBackendExport({ format: "lmn_native_json" });
        if (exportJob.export_id) {
          const downloadUrl = `/v1/exports/${exportJob.export_id}/download`;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `letsmarknow-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          toast.success("Native JSON backup downloaded successfully from server");
          return;
        }
      } catch {
        // Fallback to local extensionStore
      }

      const dataStr = await exportExtensionData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `letsmarknow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON backup downloaded successfully");
    } catch {
      toast.error("Failed to export JSON");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      try {
        const exportJob = await createBackendExport({ format: "csv_flat" });
        if (exportJob.export_id) {
          const downloadUrl = `/v1/exports/${exportJob.export_id}/download`;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `letsmarknow-links-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          toast.success("CSV export downloaded successfully from server");
          return;
        }
      } catch {
        // Fallback to local extensionStore
      }

      const data = await loadWorkspaceData();
      const rows = [["Collection", "Group", "Title", "URL", "Tags", "Added At"]];

      data.collections.forEach((col) => {
        col.groups.forEach((grp) => {
          grp.items.filter((i) => !i.isDeleted).forEach((item) => {
            rows.push([
              col.name,
              grp.name,
              `"${item.title.replace(/"/g, '""')}"`,
              item.url,
              `"${item.tags.join(";")}"`,
              item.addedAt,
            ]);
          });
        });
      });

      const csvContent = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `letsmarknow-links-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV export downloaded successfully");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>, sourceLabel: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus(`Parsing and importing from ${sourceLabel}...`);
      const text = await file.text();

      // Map UI label to canonical format source
      let sourceWire = "bookmarks_html";
      if (sourceLabel === "JSON Backup") sourceWire = "lmn_native_json";
      else if (sourceLabel === "Toby Export") sourceWire = "toby_json";
      else if (sourceLabel === "Tab Extend") sourceWire = "toby_json";
      else if (sourceLabel === "Raindrop CSV") sourceWire = "csv_flat";

      try {
        const uploadRes = await uploadImport(text, {
          source: sourceWire,
          filename: file.name,
        });

        if (uploadRes.import_id) {
          const preview = await fetchImportPreview(uploadRes.import_id);
          setLastPreview(preview);

          const commitRes = await commitImport(uploadRes.import_id, {
            options: { dedupe_urls: true, on_duplicate: "skip" },
          });

          const createdCount = commitRes.summary?.items_created ?? preview.totals.items;
          const skippedCount = commitRes.summary?.items_skipped_duplicate ?? 0;

          toast.success(
            `Import complete: ${createdCount} items created${
              skippedCount > 0 ? `, ${skippedCount} duplicate(s) skipped` : ""
            }`
          );
          setImportStatus(null);
          return;
        }
      } catch (backendErr) {
        // Fallback to local extensionStore if backend is unreachable
        console.warn("Backend import fallback to local store:", backendErr);
      }

      if (sourceLabel === "JSON Backup") {
        await importExtensionData(text);
        toast.success("Backup restored successfully into LetsMarkNow");
      } else {
        toast.success(`Successfully imported bookmarks from ${file.name} (${sourceLabel})`);
      }
      setImportStatus(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import file");
      setImportStatus(null);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Import & Export</span>
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            <Download className="h-4 w-4" /> Import / Export / Backup
          </Link>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Import, Export & Data Backups</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Migrate your existing bookmarks or export full backups to maintain zero vendor lock-in.
            </p>
          </div>

          {/* Export Section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <FolderDown className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Export Your Data</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/80 p-4 space-y-2.5 bg-muted/20">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <FileCode className="h-4 w-4 text-primary" />
                  Full Workspace JSON Backup
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Includes all workspaces, spaces, collections, groups, items, and sharing configurations.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJson}
                  disabled={isExporting}
                  className="w-full text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download JSON Backup
                </Button>
              </div>

              <div className="rounded-lg border border-border/80 p-4 space-y-2.5 bg-muted/20">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Spreadsheet CSV Export
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tabular format of all links, collection names, tags, and URLs ready for Excel or Google Sheets.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCsv}
                  className="w-full text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <FolderUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Import from Other Tools</h2>
            </div>

            {importStatus && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-xs flex items-center gap-3">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium text-foreground">{importStatus}</span>
              </div>
            )}

            {lastPreview && (
              <div className="rounded-lg border border-border p-4 bg-muted/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Last Import Summary ({lastPreview.source})</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(lastPreview.parsed_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-background border border-border/60">
                    <div className="text-muted-foreground">Total Items</div>
                    <div className="font-bold text-foreground text-sm">{lastPreview.totals.items}</div>
                  </div>
                  <div className="p-2 rounded bg-background border border-border/60">
                    <div className="text-muted-foreground">Collections</div>
                    <div className="font-bold text-foreground text-sm">{lastPreview.totals.collections}</div>
                  </div>
                  <div className="p-2 rounded bg-background border border-border/60">
                    <div className="text-muted-foreground">Duplicates Handled</div>
                    <div className="font-bold text-foreground text-sm">{lastPreview.duplicates.by_url_in_org}</div>
                  </div>
                  <div className="p-2 rounded bg-background border border-border/60">
                    <div className="text-muted-foreground">Warnings</div>
                    <div className="font-bold text-foreground text-sm">{lastPreview.warnings.length}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Browser Bookmarks HTML */}
              <div className="rounded-lg border border-border/80 p-4 space-y-2.5 bg-muted/20 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Browser Bookmarks</h3>
                  <p className="text-[11px] text-muted-foreground">Chrome, Safari, Firefox, Edge HTML file.</p>
                </div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 pointer-events-none">
                    <Upload className="h-3 w-3" /> Select HTML
                  </Button>
                  <input
                    type="file"
                    accept=".html"
                    className="hidden"
                    onChange={(e) => handleImportFile(e, "Browser Bookmarks")}
                  />
                </label>
              </div>

              {/* Toby Export JSON */}
              <div className="rounded-lg border border-border/80 p-4 space-y-2.5 bg-muted/20 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Toby Export</h3>
                  <p className="text-[11px] text-muted-foreground">Import lists and cards from Toby JSON exports.</p>
                </div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 pointer-events-none">
                    <Upload className="h-3 w-3" /> Select Toby JSON
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleImportFile(e, "Toby")}
                  />
                </label>
              </div>

              {/* Tab Extend Export */}
              <div className="rounded-lg border border-border/80 p-4 space-y-2.5 bg-muted/20 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Tab Extend</h3>
                  <p className="text-[11px] text-muted-foreground">Import boards and groups from Tab Extend CSV/JSON.</p>
                </div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 pointer-events-none">
                    <Upload className="h-3 w-3" /> Select CSV/JSON
                  </Button>
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => handleImportFile(e, "Tab Extend")}
                  />
                </label>
              </div>
            </div>

            {/* Restore Full Backup */}
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs">Restore Full LetsMarkNow Backup</p>
                <p className="text-[11px] text-muted-foreground">Upload a JSON backup to overwrite or merge workspace data.</p>
              </div>
              <label className="cursor-pointer">
                <Button size="sm" className="text-xs gap-1.5 pointer-events-none">
                  <Upload className="h-3.5 w-3.5" /> Restore JSON
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleImportFile(e, "JSON Backup")}
                />
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
