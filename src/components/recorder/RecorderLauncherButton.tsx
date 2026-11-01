import React from "react";
import { ChevronDown, Circle, Download, History, Pause, Play, Radio, Square } from "lucide-react";
import { useRecorderStore } from "@/lib/recorder/recorder-store";
import { cn } from "@/lib/utils";

function formatTimer(sec: number): string {
  const min = Math.floor(sec / 60);
  const remaining = sec % 60;

  return `${String(min).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export function RecorderLauncherButton(): React.JSX.Element {
  const isRecording = useRecorderStore((s) => s.isRecording);
  const isPaused = useRecorderStore((s) => s.isPaused);
  const elapsedSec = useRecorderStore((s) => s.elapsedSec);
  const startRecording = useRecorderStore((s) => s.startRecording);
  const stopRecording = useRecorderStore((s) => s.stopRecording);
  const pauseRecording = useRecorderStore((s) => s.pauseRecording);
  const resumeRecording = useRecorderStore((s) => s.resumeRecording);
  const openExportModal = useRecorderStore((s) => s.openExportModal);
  const openPreviousBugs = useRecorderStore((s) => s.openPreviousBugs);

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      {/* Button 1: Recording Controller */}
      {isRecording ? (
        <div className="inline-flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 p-0.5">
          {/* Status Badge */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold uppercase tracking-wider font-mono",
              isPaused
                ? "bg-secondary text-secondary-foreground border border-border"
                : "border border-destructive/40 text-destructive animate-pulse",
            )}
          >
            {isPaused ? (
              <Play className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
            ) : (
              <Circle className="h-2.5 w-2.5 fill-destructive text-destructive animate-ping" />
            )}
            <span>
              {isPaused ? `PAUSED ${formatTimer(elapsedSec)}` : `REC ${formatTimer(elapsedSec)}`}
            </span>
          </div>

          {/* Pause / Resume Inline Control */}
          <button
            type="button"
            onClick={isPaused ? resumeRecording : pauseRecording}
            title={isPaused ? "Resume Recording" : "Pause Recording"}
            aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
            className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isPaused ? (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </button>

          {/* Stop Inline Control */}
          <button
            type="button"
            onClick={() => void stopRecording()}
            title="Stop Recording"
            aria-label="Stop Recording"
            className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Square className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => startRecording()}
          title="Record Activity & Bug Report"
          aria-label="Start Bug Recorder"
          className="flex shrink-0 items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          <Radio className="h-3.5 w-3.5 text-destructive" />
          <span>Record Bug</span>
        </button>
      )}

      {/* Button 2: Export Suite (Always Visible) */}
      <button
        type="button"
        onClick={openExportModal}
        title="Export Suite (ZIP, Prompts, Telemetry)"
        aria-label="Export Bug Report"
        className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
      >
        <ChevronDown className="h-3 w-3" />
        <Download className="h-3 w-3" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Button 3: Previous Bugs (Always Visible) */}
      <button
        type="button"
        onClick={openPreviousBugs}
        title="Browse and export historical bug sessions"
        aria-label="Previous Bugs"
        className="flex shrink-0 items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        <History className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Previous Bugs</span>
      </button>
    </div>
  );
}
