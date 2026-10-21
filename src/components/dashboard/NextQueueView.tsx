import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bookmark,
  ExternalLink,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  Radio,
  X,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchNextQueue,
  addToNextQueue,
  updateNextQueueItem,
  removeNextQueueItem,
  clearCompletedNextQueue,
  subscribeNextQueueSSE,
  type BackendNextItem,
} from "@/lib/workspaceApiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NextQueueViewProps {
  className?: string;
  onNavigateDashboard?: () => void;
}

export function NextQueueView({ className }: NextQueueViewProps) {
  const [items, setItems] = useState<BackendNextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTipDismissed, setIsTipDismissed] = useState(() => {
    try {
      return localStorage.getItem("lmn_next_tip_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const [flashItemId, setFlashItemId] = useState<string | null>(null);

  // Load items from API or local fallback
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchNextQueue({ includeDone: true });
      if (res && Array.isArray(res.items)) {
        setItems(res.items);
      }
    } catch (err) {
      console.warn("Failed to load Next queue from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Subscribe to Server-Sent Events (SSE) for realtime sync across devices
  useEffect(() => {
    const unsubscribeSSE = subscribeNextQueueSSE(
      (event) => {
        setIsLiveConnected(true);
        if (event.type === "next.item.added" && event.data.item) {
          const newItem = event.data.item;
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === newItem.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = newItem;
              return updated;
            }
            return [...prev, newItem].sort((a, b) => a.position - b.position);
          });
        } else if (event.type === "next.item.updated" && event.data.item) {
          const updatedItem = event.data.item;
          setItems((prev) =>
            prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
          );
        } else if (event.type === "next.item.removed" && event.data.itemId) {
          const removedId = event.data.itemId;
          setItems((prev) => prev.filter((i) => i.id !== removedId));
        }
      },
      () => {
        setIsLiveConnected(false);
      }
    );

    // Also listen for extension runtime broadcast messages
    const handleRuntimeMessage = (message: any) => {
      if (message?.type === "NEXT_ITEM_ADDED" && message.payload) {
        loadItems();
      } else if (message?.type === "NEXT_ITEM_UPDATED" && message.payload) {
        loadItems();
      } else if (message?.type === "NEXT_ITEM_REMOVED") {
        loadItems();
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    }

    return () => {
      unsubscribeSSE();
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      }
    };
  }, [loadItems]);

  const openCount = useMemo(() => items.filter((i) => !i.isDone).length, [items]);
  const completedCount = useMemo(() => items.filter((i) => i.isDone).length, [items]);

  const displayedItems = useMemo(() => {
    let list = [...items];
    if (hideCompleted) {
      list = list.filter((i) => !i.isDone);
    }
    return list.sort((a, b) => a.position - b.position);
  }, [items, hideCompleted]);

  // Canonical Add to Next action (E4 manual paste or input)
  const handleAddToNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    let targetUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      setIsSubmitting(true);
      const res = await addToNextQueue({
        url: targetUrl,
        title: titleInput.trim() || undefined,
        source_kind: "manual",
      });

      if (res.data) {
        const item = res.data;
        setItems((prev) => {
          const existingIdx = prev.findIndex((i) => i.id === item.id);
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = item;
            return next;
          }
          return [...prev, item].sort((a, b) => a.position - b.position);
        });

        toast.success(res.message || "Added to Next");
        setUrlInput("");
        setTitleInput("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add to Next");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDone = async (item: BackendNextItem) => {
    const nextDone = !item.isDone;
    // Optimistic local update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isDone: nextDone } : i))
    );

    try {
      await updateNextQueueItem(item.id, { is_done: nextDone });
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isDone: item.isDone } : i))
      );
      toast.error("Failed to update status");
    }
  };

  const handleRemove = async (item: BackendNextItem) => {
    // Optimistic delete
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      await removeNextQueueItem(item.id);
      toast.success("Removed from Next");
    } catch (err) {
      loadItems();
      toast.error("Failed to remove item");
    }
  };

  const handleClearCompleted = async () => {
    if (completedCount === 0) return;
    setItems((prev) => prev.filter((i) => !i.isDone));

    try {
      const res = await clearCompletedNextQueue();
      toast.success(`Cleared ${res.deleted_count} completed item(s)`);
    } catch (err) {
      loadItems();
      toast.error("Failed to clear completed items");
    }
  };

  const handleOpenCurrentTab = (url: string) => {
    window.location.href = url;
  };

  const handleOpenNewTab = (id: string, url: string) => {
    setFlashItemId(id);
    setTimeout(() => setFlashItemId(null), 300);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDismissTip = () => {
    setIsTipDismissed(true);
    try {
      localStorage.setItem("lmn_next_tip_dismissed", "true");
    } catch {}
  };

  return (
    <div
      data-testid="next-queue-view"
      className={cn("flex flex-1 flex-col overflow-y-auto p-4 md:p-8", className)}
    >
      <div className="mx-auto w-full max-w-[720px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bookmark className="h-5 w-5 fill-primary/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Next
                  </h1>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      openCount > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                    data-testid="next-open-count-badge"
                  >
                    {openCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toby Next helps you move forward by turning open tabs into a clear, focused to-do list.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                title={isLiveConnected ? "Realtime sync active" : "Syncing with workspace"}
              >
                <Radio
                  className={cn(
                    "h-3 w-3",
                    isLiveConnected
                      ? "animate-pulse text-emerald-500"
                      : "text-muted-foreground"
                  )}
                />
                <span className="hidden sm:inline">
                  {isLiveConnected ? "Realtime Live" : "Sync Ready"}
                </span>
              </div>

              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear completed
                </Button>
              )}
            </div>
          </div>

          {/* Dismissible Tip */}
          {!isTipDismissed && (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Tip:</strong> You can view Next from the extension menu or press{" "}
                  <kbd className="rounded bg-background/80 px-1 py-0.5 text-[10px] font-mono border">
                    Cmd/Ctrl+Shift+N
                  </kbd>{" "}
                  on any open tab.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismissTip}
                className="ml-2 text-muted-foreground hover:text-foreground"
                title="Dismiss tip"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Input Form: "Add to Next" */}
        <form onSubmit={handleAddToNext} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Paste URL to add to Next queue..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="h-10 text-sm pl-3 pr-2"
              />
            </div>
            <Input
              type="text"
              placeholder="Title (optional)"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="h-10 text-sm sm:w-48"
            />
            <Button
              type="submit"
              disabled={!urlInput.trim() || isSubmitting}
              className="h-10 shrink-0 font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add to Next
            </Button>
          </div>
        </form>

        {/* Filter controls */}
        {items.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {openCount} open &bull; {completedCount} completed
            </span>
            <button
              type="button"
              onClick={() => setHideCompleted((prev) => !prev)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {hideCompleted ? "Show completed items" : "Hide completed"}
            </button>
          </div>
        )}

        {/* List Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-xs">Loading Next queue...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Bookmark className="h-6 w-6 fill-primary/20" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Your Next queue is clear
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Move &ldquo;later&rdquo; tabs into Next, then close them. Return to work exactly where you left off.
            </p>
          </div>
        ) : openCount === 0 && completedCount > 0 ? (
          /* All-done state */
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <h3 className="text-base font-semibold text-foreground">
              You&apos;re all caught up!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All items in your Next queue have been completed.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCompleted}
              className="mt-4 text-xs"
            >
              Clear completed items
            </Button>
          </div>
        ) : null}

        {/* Items List */}
        {displayedItems.length > 0 && (
          <div className="space-y-2">
            {displayedItems.map((item) => {
              const isFlashing = flashItemId === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`next-item-row-${item.id}`}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors",
                    isFlashing ? "bg-primary/10 border-primary" : "bg-card/70 hover:bg-card",
                    item.isDone && "opacity-60 bg-muted/30"
                  )}
                >
                  {/* Left: Checkbox + Favicon + Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      aria-label={`Mark ${item.titleSnapshot} as ${item.isDone ? "incomplete" : "complete"}`}
                      checked={item.isDone}
                      onChange={() => handleToggleDone(item)}
                      className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />

                    {item.faviconUrlSnapshot ? (
                      <img
                        src={item.faviconUrlSnapshot}
                        alt=""
                        className="h-4 w-4 shrink-0 rounded object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium leading-tight",
                          item.isDone
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                        title={item.titleSnapshot}
                      >
                        {item.titleSnapshot}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground/80 mt-0.5">
                        {item.urlSnapshot}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Open in same tab (→) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenCurrentTab(item.urlSnapshot)}
                      title="Open in same tab (→)"
                      aria-label="Open in same tab"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {/* Open in new tab (↗) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenNewTab(item.id, item.urlSnapshot)}
                      title="Open in new background tab (↗)"
                      aria-label="Open in new background tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    {/* Remove from Next */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                      onClick={() => handleRemove(item)}
                      title="Remove from Next"
                      aria-label="Remove from Next"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
