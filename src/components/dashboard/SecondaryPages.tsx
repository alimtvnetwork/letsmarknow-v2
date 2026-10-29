import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileClock,
  Globe2,
  Lock,
  Receipt,
  Search,
  Share2,
  Tag,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppData, Collection, Organization, SavedItem } from "@/types/lmn";
import { resolveShare } from "@/lib/shareLinks";
import { colorLabelClasses, getHost } from "./helpers";
import { Favicon } from "./Favicon";

export function ActivityPage({ collections }: { collections: Collection[] }) {
  const events = useMemo(
    () =>
      collections.flatMap((collection) =>
        collection.groups.flatMap((group) =>
          group.items.map((item) => ({
            id: `${collection.id}-${group.id}-${item.id}`,
            title: item.title,
            url: item.url,
            meta: `${collection.name} / ${group.name}`,
            time: item.addedAt,
            isDeleted: item.isDeleted,
          }))
        )
      ),
    [collections]
  );

  return (
    <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      <PageHeader eyebrow="Workspace audit log" title="Activity" />
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {events.length ? (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3.5 sm:p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-primary",
                    event.isDeleted ? "bg-destructive/15 text-destructive" : "bg-primary/15"
                  )}
                >
                  <FileClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Favicon url={event.url} size="sm" className="shrink-0" />
                    <h3 className="truncate text-sm font-semibold">
                      {event.isDeleted ? "Deleted" : "Saved"} {event.title}
                    </h3>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{event.meta}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 pl-12 sm:pl-0">{event.time}</span>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </div>
        )}
      </div>
    </section>
  );
}

export function PublicSharePage({
  organization,
  collections,
  shareId,
  data,
  targetType,
  slug,
  onNavigateDashboard,
}: {
  organization: Organization;
  collections: Collection[];
  shareId?: string;
  data?: AppData;
  targetType?: string;
  slug?: string;
  onNavigateDashboard?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fallbackData: AppData = useMemo(
    () =>
      data || {
        organizations: [organization],
        spaces: [],
        collections,
      },
    [data, organization, collections]
  );

  const resolved = useMemo(
    () => resolveShare(fallbackData, targetType, slug || shareId),
    [fallbackData, targetType, slug, shareId]
  );

  const allItems = resolved.items;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allItems.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = !selectedTag || item.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [allItems, searchQuery, selectedTag]);

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // NOT FOUND STATE
  if (resolved.status === "not_found") {
    return (
      <section className="min-h-0 flex-1 overflow-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
          <Search className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Share not found</h1>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          The public link you requested does not exist, has expired, or was removed by the owner.
        </p>
        {onNavigateDashboard && (
          <Button onClick={onNavigateDashboard} variant="outline" size="sm" className="mt-5">
            Return to Dashboard
          </Button>
        )}
      </section>
    );
  }

  // PRIVATE STATE
  if (resolved.status === "private") {
    return (
      <section className="min-h-0 flex-1 overflow-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">This share is private</h1>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          The owner has restricted access to this {resolved.targetType || "content"}. You must be
          granted permission to view these bookmarks.
        </p>
        {onNavigateDashboard && (
          <Button onClick={onNavigateDashboard} variant="outline" size="sm" className="mt-5">
            Return to Dashboard
          </Button>
        )}
      </section>
    );
  }

  const title = resolved.targetName || organization.name;
  const description =
    resolved.targetDescription || "Curated bookmarks and reference links shared from LetsMarkNow.";

  return (
    <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            <span>
              Public {resolved.targetType ? `${resolved.targetType} ` : ""}preview
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="self-start sm:self-auto shrink-0"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy mock link
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {resolved.targetType === "item" && resolved.singleItem ? (
            <article className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Favicon url={resolved.singleItem.url} size="lg" className="mt-1" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">{resolved.singleItem.title}</h2>
                    <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                      {getHost(resolved.singleItem.url)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    window.open(resolved.singleItem?.url, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="gap-1.5 shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open link
                </Button>
              </div>

              {resolved.singleItem.description && (
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {resolved.singleItem.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[11px] font-medium capitalize",
                    colorLabelClasses[resolved.singleItem.color]
                  )}
                >
                  {resolved.singleItem.color}
                </span>
                {resolved.singleItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
                {resolved.singleItem.collectionName && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {resolved.singleItem.collectionName} / {resolved.singleItem.groupName}
                  </span>
                )}
              </div>
            </article>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shared links..."
                    className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition",
                        !selectedTag
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      All ({allItems.length})
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium transition",
                          selectedTag === tag
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredItems.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredItems.map((item) => (
                    <article
                      key={item.id}
                      className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Favicon url={item.url} size="sm" />
                            <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                              {item.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            title="Open link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs font-mono text-muted-foreground">
                          {getHost(item.url)}
                        </p>
                        {item.description && (
                          <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.2 text-[10px] font-medium capitalize",
                            colorLabelClasses[item.color]
                          )}
                        >
                          {item.color}
                        </span>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.2 text-[10px] text-muted-foreground"
                          >
                            <Tag className="h-2 w-2" />
                            {tag}
                          </span>
                        ))}
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {item.groupName}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Search className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">No matching items found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try searching for something else or clearing the tag filter.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Share Details</h3>
            </div>
            <div className="text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Workspace:</span>
                <span className="font-medium text-foreground">
                  {resolved.workspaceName || organization.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-medium text-foreground capitalize">
                  {resolved.targetType || "Collection"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-emerald-400">Public (Read-only)</span>
              </div>
              <div className="flex justify-between">
                <span>Items visible:</span>
                <span className="font-medium text-foreground">{filteredItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Access:</span>
                <span className="font-medium text-foreground">Anyone with link</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <h4 className="text-xs font-semibold uppercase">Security Note</h4>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              This viewer is read-only. Trashed links and unpublished spaces are never exposed to
              visitors.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function ImportExportPanel({
  items,
  onImportMock,
  onExportMock,
}: {
  items: SavedItem[];
  onImportMock?: () => void;
  onExportMock?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Upload className="mb-3 h-5 w-5 text-primary" />
      <h2 className="text-base font-semibold">Import / Export</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Migrate links using CSV, browser bookmark HTML, or full workspace JSON archives.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          size="sm"
          onClick={
            onImportMock ??
            (() => {
              toast.success("Bookmarks imported into Inbox");
            })
          }
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import bookmarks
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={
            onExportMock ??
            (() => {
              toast.success("Workspace exported to JSON");
            })
          }
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}

export function TeamBillingPanel({
  onInviteMock,
  onUpgradeMock,
}: {
  onInviteMock?: () => void;
  onUpgradeMock?: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <Users className="mb-3 h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Team members</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Invite teammates, assign roles, and manage workspace permissions.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={
            onInviteMock ??
            (() => {
              toast.info("Open members tab in Settings to invite teammates");
            })
          }
        >
          Manage members
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <Receipt className="mb-3 h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Billing & Plans</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Upgrade workspace tiers, manage payment methods, and download invoices.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={
            onUpgradeMock ??
            (() => {
              toast.info("Open billing tab in Settings to change plan");
            })
          }
        >
          View plans
        </Button>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold md:text-3xl">{title}</h1>
    </div>
  );
}
