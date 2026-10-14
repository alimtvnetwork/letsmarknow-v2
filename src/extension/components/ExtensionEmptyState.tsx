import React from "react";
import type { LucideIcon } from "lucide-react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExtensionEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ExtensionEmptyState({
  icon: Icon = FolderPlus,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: ExtensionEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/40 p-5 text-center ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-2.5">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="mt-3 h-7 text-xs">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
