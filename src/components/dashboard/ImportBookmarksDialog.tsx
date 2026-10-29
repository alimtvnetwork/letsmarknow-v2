import { useState, useRef } from "react";
import { Bookmark, CheckCircle2, Chrome, FileUp, FolderInput, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AppData, Space } from "@/types/lmn";
import {
  getBrowserBookmarkTree,
  importBookmarksToWorkspace,
  parseHtmlBookmarks,
} from "@/lib/bookmarkImport";
import { toast } from "sonner";

interface ImportBookmarksDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  activeSpaceId: string;
  spaces: Space[];
  onImportComplete: (nextData: AppData) => void;
}

export function ImportBookmarksDialog({
  isOpen,
  onOpenChange,
  data,
  activeSpaceId,
  spaces,
  onImportComplete,
}: ImportBookmarksDialogProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(activeSpaceId);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    collectionCount: number;
    itemCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetSpaceId = selectedSpaceId || activeSpaceId || spaces[0]?.id;
  const targetSpace = spaces.find((s) => s.id === targetSpaceId);

  const handleBrowserImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const tree = await getBrowserBookmarkTree();
      const result = importBookmarksToWorkspace(data, targetSpaceId, tree);

      if (result.importedItemCount === 0) {
        toast.info("No bookmarks found to import.");
        setIsImporting(false);
        return;
      }

      onImportComplete(result.nextData);
      setImportResult({
        collectionCount: result.importedCollectionCount,
        itemCount: result.importedItemCount,
      });
      toast.success(
        `Imported ${result.importedItemCount} bookmarks across ${result.importedCollectionCount} collections!`
      );
    } catch (err: any) {
      console.error("Bookmark import error:", err);
      toast.error(err?.message || "Failed to import bookmarks.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const nodes = parseHtmlBookmarks(content);
        const result = importBookmarksToWorkspace(data, targetSpaceId, nodes);

        if (result.importedItemCount === 0) {
          toast.warning("No valid bookmarks were found in the uploaded file.");
          setIsImporting(false);
          return;
        }

        onImportComplete(result.nextData);
        setImportResult({
          collectionCount: result.importedCollectionCount,
          itemCount: result.importedItemCount,
        });
        toast.success(
          `Successfully imported ${result.importedItemCount} bookmarks into ${result.importedCollectionCount} collections!`
        );
      } catch (err: any) {
        console.error("HTML bookmarks parsing error:", err);
        toast.error("Failed to parse bookmark file format.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card/95 border-border/80 backdrop-blur-md shadow-obsidian">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-500/20 border border-sky-500/30 text-sky-400 mb-2">
            <Bookmark className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Import Chrome & Browser Bookmarks
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Instantly migrate your browser bookmark folders and links into LetsMarkNow collections.
          </DialogDescription>
        </DialogHeader>

        {importResult ? (
          <div className="py-6 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Import Complete!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Successfully migrated <span className="font-semibold text-foreground">{importResult.itemCount} bookmarks</span> into{" "}
              <span className="font-semibold text-foreground">{importResult.collectionCount} new collections</span> inside space{" "}
              <span className="font-semibold text-primary">{targetSpace?.name || "your space"}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            {/* Target Space Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Destination Space:</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {spaces.length} spaces available
                </span>
              </label>
              <select
                data-testid="import-destination-space-select"
                value={targetSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Click Native Chrome Import Button */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Chrome className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold text-sky-300">
                  1-Click Direct Browser Import
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-sky-300">
                  <Sparkles className="h-2.5 w-2.5" /> Instant
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Automatically reads your active Chrome Bookmarks Bar and imports all folders into organized collections.
              </p>
              <Button
                type="button"
                data-testid="import-browser-bookmarks-button"
                onClick={handleBrowserImport}
                disabled={isImporting}
                className="w-full h-8 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-2xs cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Importing bookmarks...
                  </>
                ) : (
                  <>
                    <FolderInput className="h-3.5 w-3.5 mr-1.5" />
                    Import from Browser Bookmarks
                  </>
                )}
              </Button>
            </div>

            {/* HTML File Upload Fallback */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Or upload exported HTML file
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Exported from Safari, Firefox, Brave, or Chrome (bookmarks.html).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="import-bookmarks-file-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <FileUp className="h-3.5 w-3.5 mr-1.5" />
                Select bookmarks.html file
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-border/40">
          <Button
            type="button"
            variant={importResult ? "default" : "ghost"}
            size="sm"
            onClick={handleClose}
            className="text-xs"
          >
            {importResult ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
