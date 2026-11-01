import React from "react";
import type { CapturedScreenshot, RecorderEvent } from "@/lib/recorder/types";

interface RecorderTimelinePreviewProps {
  events: readonly RecorderEvent[];
  screenshots: readonly CapturedScreenshot[];
}

export function RecorderTimelinePreview({
  events,
  screenshots,
}: RecorderTimelinePreviewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2.5">
      {screenshots.length > 0 && (
        <div>
          <span className="block mb-1 text-xs font-semibold text-foreground">
            Captured Screenshots ({screenshots.length})
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {screenshots.map((s) => (
              <div
                key={s.id}
                className="relative shrink-0 rounded border border-border overflow-hidden w-24 h-16 bg-black"
              >
                <img src={s.dataUrl} alt={s.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] text-white truncate">
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="block mb-1 text-xs font-semibold text-foreground">
          Recorded Steps & Timeline ({events.length} actions)
        </span>
        <div className="max-h-36 overflow-y-auto rounded border border-border bg-muted/40 p-2 text-[11px] font-mono flex flex-col gap-1">
          {events.map((e, idx) => (
            <div key={e.id} className="flex items-center gap-2 text-foreground">
              <span className="text-muted-foreground w-5 text-right">{idx + 1}.</span>
              <span
                className={e.actor === "user" ? "text-primary font-semibold" : "text-muted-foreground"}
              >
                [{e.actor.toUpperCase()}]
              </span>
              <span className="text-muted-foreground truncate flex-1">{e.description}</span>
              <span className="text-muted-foreground text-[10px]">{Math.floor(e.elapsedMs / 1000)}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
