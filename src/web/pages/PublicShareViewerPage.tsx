import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  Chrome,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockWorkspace } from "@/data/mockWorkspace";
import { resolveShare, type ResolvedShare, type ResolvedShareItem } from "@/lib/shareLinks";
import { Favicon } from "@/components/dashboard/Favicon";
import { getHost } from "@/components/dashboard/helpers";
import { fetchPublicShareContents } from "@/lib/workspaceApiClient";
import type { AppData } from "@/types/lmn";

export default function PublicShareViewerPage() {
  const params = useParams();
  const shareId = params.shareId || params.slug || "public-share-demo";
  const targetType = params.targetType;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remoteShare, setRemoteShare] = useState<ResolvedShare | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // Load data from localStorage or fallback mock
  const data: AppData = useMemo(() => {
    try {
      const raw = localStorage.getItem("lmn_workspace_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data?.collections?.length) return parsed.data;
      }
    } catch {
      // fallback
    }
    return mockWorkspace;
  }, []);

  const localResolved = useMemo(() => {
    const res = resolveShare(data, targetType, shareId);
    if (res.status === "not_found" && shareId === "public-share-demo") {
      // Graceful fallback to first public share or collection for previews/demos
      return resolveShare(data);
    }
    return res;
  }, [data, targetType, shareId]);

  // If not found in local workspace and not demo, try fetching from backend API
  useEffect(() => {
    if (localResolved.status !== "not_found" || shareId === "public-share-demo") return;
    let active = true;
    setLoadingRemote(true);

    fetchPublicShareContents(shareId)
      .then((contents) => {
        if (!active) return;
        const items: ResolvedShareItem[] = [];
        contents.groups?.forEach((g) => {
          g.items?.forEach((i) => {
            items.push({
              id: i.id,
              title: i.title,
              url: i.url,
              description: i.description || "",
              faviconUrl: i.favicon_url || undefined,
              tags: i.tags || [],
              groupName: g.name,
              collectionName: contents.target?.name || contents.target?.title,
              groupId: g.id,
              position: i.position || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as ResolvedShareItem);
          });
        });
        contents.items?.forEach((i) => {
          items.push({
            id: i.id,
            title: i.title,
            url: i.url,
            description: i.description || "",
            faviconUrl: i.favicon_url || undefined,
            tags: i.tags || [],
            collectionName: contents.target?.name || contents.target?.title,
            position: i.position || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ResolvedShareItem);
        });

        setRemoteShare({
          status: "found",
          targetName: contents.target?.name || contents.target?.title || "Shared Collection",
          targetDescription: contents.target?.description || undefined,
          items,
        });
      })
      .catch(() => {
        // Fall back to not_found state
      })
      .finally(() => {
        if (active) setLoadingRemote(false);
      });

    return () => {
      active = false;
    };
  }, [shareId, localResolved.status]);

  const resolved = remoteShare || localResolved;

  const allItems = resolved.items;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !selectedTag || item.tags.includes(selectedTag);
      return matchesQuery && matchesTag;
    });
  }, [allItems, searchQuery, selectedTag]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // 0. Loading Remote State
  if (loadingRemote) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 animate-pulse">
          <Globe2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-base font-semibold">Loading shared collection...</h2>
        <p className="mt-1 text-xs text-muted-foreground">Fetching public bookmarks from LetsMarkNow</p>
      </div>
    );
  }

  // 1. Not Found State
  if (resolved.status === "not_found") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <header className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
          <Link to="/web" className="font-bold text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs">L</span>
            LetsMarkNow
          </Link>
          <Link to="/web/download">
            <Button size="sm" className="gap-1.5 text-xs"><Chrome className="h-3.5 w-3.5" /> Add to Chrome</Button>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Share not found</h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            The public bookmark collection you requested does not exist, has expired, or was removed by the owner.
          </p>
          <Link to="/web" className="mt-6">
            <Button variant="outline" size="sm" className="text-xs">
              Go to LetsMarkNow Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Private State
  if (resolved.status === "private") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <header className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
          <Link to="/web" className="font-bold text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs">L</span>
            LetsMarkNow
          </Link>
          <Link to="/web/download">
            <Button size="sm" className="gap-1.5 text-xs"><Chrome className="h-3.5 w-3.5" /> Add to Chrome</Button>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">This share is private</h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            The owner has restricted access to this collection. You must be invited to this workspace to view these bookmarks.
          </p>
          <Link to="/web/login" className="mt-6">
            <Button size="sm" className="text-xs">
              Sign In to Request Access
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = resolved.targetName || "Shared Collection";
  const description =
    resolved.targetDescription || "Curated reference links and bookmarks shared via LetsMarkNow.";

  return (
    <div
      data-testid="public-share-page"
      className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20"
    >
      {/* Top Banner with Extension CTA */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">
            Save links directly from your browser in 1 click with the LetsMarkNow extension.
          </span>
        </div>
        <Link to="/web/download" className="hidden sm:inline-block">
          <Button size="sm" className="h-6 text-[11px] px-2.5 font-semibold gap-1 shadow-xs">
            <Chrome className="h-3 w-3" /> Add to Chrome
          </Button>
        </Link>
      </div>

      {/* Main Header */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/web" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
              L
            </div>
            <span className="font-bold text-base tracking-tight">LetsMarkNow</span>
          </Link>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            Public Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 text-xs gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Link
          </Button>
          <Link to="/web/download">
            <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold">
              <Chrome className="h-3.5 w-3.5" /> Install Extension
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Viewer Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-10 space-y-8">
        {/* Collection Hero */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            <span>Shared {resolved.targetType ? `${resolved.targetType} ` : ""}Collection</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shared links, titles, or tags..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[11px] mr-1">Tags:</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                  !selectedTag ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({allItems.length})
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                    selectedTag === t ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Links Grid / List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No bookmarks found matching your search.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Favicon url={item.url} size="md" className="mt-0.5" />
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {getHost(item.url)}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted/60 px-1.5 py-0.2 text-[10px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> Open Link
                    </Button>
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>Curated and shared with LetsMarkNow &bull; The primary browser extension daily workspace.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link to="/web" className="hover:text-foreground">About LetsMarkNow</Link>
          <Link to="/web/download" className="hover:text-foreground">Install Extension</Link>
          <Link to="/web/login" className="hover:text-foreground">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
