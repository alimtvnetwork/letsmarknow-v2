import { useState } from "react";
import { Globe } from "lucide-react";

import { cn } from "@/lib/utils";

import { getFaviconUrl, getHost } from "./helpers";

interface FaviconProps {
  url: string;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function Favicon({
  url,
  className,
  fallbackClassName,
  size = "sm",
}: FaviconProps) {
  const [hasError, setHasError] = useState(false);
  const faviconUrl = getFaviconUrl(url);
  const host = getHost(url);

  const dimensionClasses = {
    sm: "h-4 w-4 min-w-4",
    md: "h-5 w-5 min-w-5",
    lg: "h-6 w-6 min-w-6",
  }[size];

  if (!faviconUrl || hasError) {
    return (
      <div
        data-testid="favicon-fallback"
        className={cn(
          "flex shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground",
          dimensionClasses,
          fallbackClassName
        )}
        title={host}
      >
        <Globe className="h-2.5 w-2.5 opacity-70" />
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={host}
      loading="lazy"
      onError={() => setHasError(true)}
      className={cn(
        "shrink-0 rounded object-contain bg-background/40",
        dimensionClasses,
        className
      )}
      title={host}
    />
  );
}
