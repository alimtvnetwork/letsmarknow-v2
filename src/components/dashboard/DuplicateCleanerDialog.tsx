import { useState } from "react";
import { CheckCircle2, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Favicon } from "./Favicon";
import {
  type DuplicateGroup,
  countRedundantDuplicates,
} from "@/lib/duplicateCleaner";

export interface DuplicateCleanerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateGroups: DuplicateGroup[];
  onCleanDuplicates: () => void | Promise<void>;
}

export function DuplicateCleanerDialog({
  isOpen,
  onOpenChange,
  duplicateGroups,
  onCleanDuplicates,
}: DuplicateCleanerDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const redundantCount = countRedundantDuplicates(duplicateGroups);

  const handleClean = async () => {
    try {
      setIsProcessing(true);
      await onCleanDuplicates();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Duplicate Cleaner & URL Deduplicator</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {redundantCount > 0 ? (
              <>
                Found <span className="font-semibold text-foreground">{redundantCount}</span> redundant{" "}
                {redundantCount === 1 ? "duplicate" : "duplicates"} across{" "}
                <span className="font-semibold text-foreground">{duplicateGroups.length}</span>{" "}
                {duplicateGroups.length === 1 ? "saved link" : "saved links"}. The newest copy in each group is
                preserved, while older copies will be safely moved to Trash.
              </>
            ) : (
              "No duplicate links found. Your workspace is completely pristine!"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Duplicates Preview List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
          {duplicateGroups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 stroke-1" />
              <p className="font-medium text-foreground">Zero duplicates detected</p>
              <p className="text-xs">All links in your workspace are currently unique.</p>
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <div
                key={group.normalizedUrl}
                data-testid={`duplicate-group-${group.normalizedUrl}`}
                className="rounded-lg border border-border bg-card/60 p-3.5 space-y-2.5 shadow-sm"
              >
                {/* Link Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Favicon url={group.displayUrl} size="sm" className="shrink-0" />
                    <span className="font-medium text-xs text-foreground truncate" title={group.title}>
                      {group.title}
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-500 shrink-0">
                    {group.totalCount} copies
                  </span>
                </div>

                {/* URL preview */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate pl-6 font-mono">
                  <a
                    href={group.displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline hover:text-foreground truncate inline-flex items-center gap-1"
                  >
                    {group.displayUrl}
                    <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                  </a>
                </div>

                {/* Copies Breakdown */}
                <div className="space-y-1.5 pl-6 pt-1">
                  {/* Kept Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 sm:px-2.5 sm:py-1.5 text-[11px] gap-1 sm:gap-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-foreground">Keep Newest: </span>
                        <span className="text-muted-foreground">
                          {group.newestItem.collectionName} &bull; {group.newestItem.groupName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-5 sm:pl-0 sm:ml-2">
                      <span className="text-[10px] text-emerald-400 font-medium">Preserved</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        ({group.newestItem.item.addedAt || "Recent"})
                      </span>
                    </div>
                  </div>

                  {/* Duplicate Items */}
                  {group.duplicateItems.map((dup) => (
                    <div
                      key={dup.item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2 sm:px-2.5 sm:py-1.5 text-[11px] gap-1 sm:gap-0"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Trash2 className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                        <div className="truncate">
                          <span className="text-muted-foreground">Remove duplicate in </span>
                          <span className="font-medium text-foreground">
                            {dup.collectionName} &bull; {dup.groupName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-5 sm:pl-0 sm:ml-2">
                        <span className="text-[10px] text-amber-500 font-medium">To Trash</span>
                        <span className="text-[10px] text-muted-foreground/70">
                          ({dup.item.addedAt || "Older"})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            data-testid="clean-duplicates-confirm-button"
            disabled={isProcessing || duplicateGroups.length === 0}
            onClick={handleClean}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            {isProcessing ? "Cleaning..." : "Keep Newest & Clean Duplicates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
