import React from "react";
import { Search } from "lucide-react";

export interface PreviousBugsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = ["all", "UiGlitch", "InspectionDefect", "CrashOrError", "Performance"];

export function PreviousBugsFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: PreviousBugsFilterBarProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3 bg-muted/60">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, session ID, route, or details..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground text-[11px] font-mono mr-1">Category:</span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                isSelected
                  ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
                  : "bg-secondary/60 text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
