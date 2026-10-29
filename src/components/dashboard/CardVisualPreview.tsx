import { useState } from "react";
import type { SavedItem } from "@/types/lmn";
import { Favicon } from "./Favicon";
import { getHost } from "./helpers";
import { cn } from "@/lib/utils";
import { ExternalLink, Sparkles } from "lucide-react";

interface CardVisualPreviewProps {
  item: SavedItem;
  cardDensity?: "compact" | "normal" | "comfortable";
  className?: string;
}

const colorGradientMap: Record<string, string> = {
  yellow: "from-amber-500/20 via-amber-600/10 to-transparent",
  green: "from-emerald-500/20 via-emerald-600/10 to-transparent",
  teal: "from-teal-500/20 via-teal-600/10 to-transparent",
  blue: "from-sky-500/20 via-blue-600/10 to-transparent",
  purple: "from-purple-500/20 via-violet-600/10 to-transparent",
  pink: "from-pink-500/20 via-rose-600/10 to-transparent",
  none: "from-primary/20 via-violet-500/10 to-transparent",
};

/**
 * Derives an OpenGraph preview image URL for popular domains or custom image URLs.
 */
function getPreviewImageUrl(item: SavedItem): string | null {
  if (item.previewImageUrl) {
    return item.previewImageUrl;
  }

  const rawUrl = item.url?.trim() || "";
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();

    // 1. GitHub repo OpenGraph banner
    if (host === "github.com" || host === "www.github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && !["features", "pricing", "marketplace", "explore", "topics", "trending", "login", "signup"].includes(parts[0])) {
        const owner = parts[0];
        const repo = parts[1];
        return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
      }
    }

    // 2. YouTube video thumbnail
    if (host.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `https://img.youtube.com/vi/${v}/mqdefault.jpg`;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
  } catch {
    // Malformed URL, fallback
  }

  return null;
}

export function CardVisualPreview({
  item,
  cardDensity = "normal",
  className,
}: CardVisualPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const derivedImageUrl = !imageError ? getPreviewImageUrl(item) : null;
  const host = getHost(item.url);
  const gradient = colorGradientMap[item.color || "pink"] || colorGradientMap.none;

  const isComfortable = cardDensity === "comfortable";
  const heightClass = isComfortable ? "h-22" : "h-16";

  if (derivedImageUrl) {
    return (
      <div
        data-testid={`visual-card-preview-${item.id}`}
        className={cn(
          "relative w-full overflow-hidden rounded-t-xl bg-muted/60 border-b border-border/40 select-none group/preview",
          heightClass,
          className
        )}
      >
        <img
          src={derivedImageUrl}
          alt={item.title}
          onError={() => setImageError(true)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Floating Indicator */}
        <div className="absolute bottom-2 right-2.5 flex items-center gap-1">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground backdrop-blur-md">
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    );
  }

  // Fallback: Generative Aesthetic Brand Banner with Radial Glow
  return (
    <div
      data-testid={`visual-card-preview-${item.id}`}
      className={cn(
        "relative w-full overflow-hidden rounded-t-xl border-b border-border/40 bg-gradient-to-br select-none",
        gradient,
        heightClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)]" />
      
      {/* Brand Icon Centerpiece */}
      <div className="flex h-full w-full flex-col justify-between p-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/30 backdrop-blur-xs">
            <Favicon url={item.url} size="sm" className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {item.tags?.[0] ? `#${item.tags[0]}` : "link"}
          </span>
        </div>

        <div className="flex items-center justify-center pb-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card/80 border border-border/50 shadow-xs backdrop-blur-md">
            <Favicon url={item.url} size="sm" className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
