import React, { useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  Check,
  Clock,
  Download,
  FileCode,
  FileText,
  FileSpreadsheet,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { exportSessionToZip } from "@/lib/recorder/zip-builder";
import {
  fetchBugSessionDetail,
  type BugSessionDetail,
  type BugSessionSummary,
} from "@/lib/recorder/recorder-repository";
import {
  generateV6LetterlyPrompt,
  generateV7LetterlyPrompt,
} from "@/lib/recorder/prompt-v6-v7-builder";
import type {
  BugReportSummary,
  CapturedScreenshot,
  IssueCategoryType,
  RecorderEvent,
  RecorderSession,
} from "@/lib/recorder/types";

export interface BugSessionCardProps {
  item: BugSessionSummary;
  onOpenEmail: (item: BugSessionSummary) => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function toDate(value: string | number | null | undefined): Date | null {
  if (!value && value !== 0) {
    return null;
  }

  if (typeof value === "string") {
    const d = new Date(value);

    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Numeric fallback: the backend may return epoch seconds or milliseconds.
  return new Date(value > 1e12 ? value : value * 1000);
}

function formatTimestamp(value: string | number | null | undefined): string {
  const d = toDate(value);

  if (!d) {
    return "-";
  }

  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "inspectiondefect":
    case "inspection_defect":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "crashorerror":
    case "crash_or_error":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "performance":
      return "bg-secondary/80 text-secondary-foreground border-border";
    case "workflowconfusion":
    case "workflow_confusion":
      return "bg-secondary/80 text-secondary-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/30";
  }
}

function downloadFile(filename: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildSessionFromDetail(
  item: BugSessionSummary,
  detail: BugSessionDetail | null,
): RecorderSession {
  const screenshots: CapturedScreenshot[] = (detail?.screenshots ?? []).map((s, idx) => {
    const seq = s.seqNumber ?? idx + 1;

    return {
      id: s.id || `snap-${seq}`,
      seqNumber: seq,
      title: s.title || `Snapshot ${seq}`,
      timestamp: new Date().toISOString(),
      elapsedMs: 0,
      dataUrl: s.dataUrl || "",
      source: (s.source === "step" || s.source === "canvas" ? s.source : "manual") as CapturedScreenshot["source"],
    };
  });

  return {
    id: item.sessionId,
    startedAt: (toDate(item.createdAt) ?? new Date()).toISOString(),
    stoppedAt: toDate(item.persistedAt)?.toISOString(),
    durationMs: item.durationMs,
    events: (detail?.events ?? []) as RecorderEvent[],
    screenshots,
    routeHistory: [item.initialRoute, item.finalRoute || item.initialRoute],
    initialRoute: item.initialRoute,
    finalRoute: item.finalRoute || item.initialRoute,
    summary: {
      title: item.title,
      category: item.category as IssueCategoryType,
      description: item.description || "",
      expectedBehavior: item.expectedBehavior || "",
      actualBehavior: item.actualBehavior || "",
    },
  };
}

export function BugSessionCard({ item, onOpenEmail }: BugSessionCardProps): React.JSX.Element {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isCopiedV6, setIsCopiedV6] = useState(false);
  const [isCopiedV7, setIsCopiedV7] = useState(false);

  const handleExportZip = async () => {
    setIsExportingZip(true);

    try {
      const detail = await fetchBugSessionDetail(item.sessionId);
      const reconstructed = buildSessionFromDetail(item, detail);

      await exportSessionToZip(reconstructed);
      toast.success(`Exported ${item.sessionId} to ZIP`);
    } catch {
      toast.error("Failed to export ZIP");
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const mdContent = `# Bug Report: ${item.title}

Session: ${item.sessionId}
Route: ${item.initialRoute}${item.finalRoute && item.finalRoute !== item.initialRoute ? ` → ${item.finalRoute}` : ""}
Duration: ${formatDuration(item.durationMs)} · Events: ${item.eventCount} · Screenshots: ${item.screenshotCount} · Errors: ${item.errorCount}

${item.description || ""}

## Expected
${item.expectedBehavior || "N/A"}

## Actual
${item.actualBehavior || "N/A"}
`;

      downloadFile(`${item.sessionId}-report.md`, mdContent, "text/markdown;charset=utf-8");
      toast.success("Downloaded Markdown report");
    } catch {
      toast.error("Failed to export Markdown report");
    }
  };

  const handleExportJson = async () => {
    try {
      const detail = await fetchBugSessionDetail(item.sessionId);
      const jsonContent = JSON.stringify(detail || item, null, 2);

      downloadFile(`${item.sessionId}-session.json`, jsonContent, "application/json;charset=utf-8");
      toast.success("Downloaded JSON dump");
    } catch {
      toast.error("Failed to export JSON dump");
    }
  };

  const handleCopyV6 = async () => {
    try {
      const detail = await fetchBugSessionDetail(item.sessionId);
      const reconstructed = buildSessionFromDetail(item, detail);
      const content = generateV6LetterlyPrompt(reconstructed, {
        summary: reconstructed.summary,
        workspaceRoot: "",
        isAbsolute: true,
      });

      await navigator.clipboard.writeText(content);
      setIsCopiedV6(true);
      toast.success("Copied AI Bug-Fix Prompt (V6) to clipboard");
      setTimeout(() => setIsCopiedV6(false), 2000);
    } catch {
      toast.error("Failed to copy V6 prompt");
    }
  };

  const handleCopyV7 = async () => {
    try {
      const detail = await fetchBugSessionDetail(item.sessionId);
      const reconstructed = buildSessionFromDetail(item, detail);
      const content = generateV7LetterlyPrompt(reconstructed, {
        summary: reconstructed.summary,
        workspaceRoot: "",
        isAbsolute: true,
      });

      await navigator.clipboard.writeText(content);
      setIsCopiedV7(true);
      toast.success("Copied AI Bug-Fix Prompt (V7) to clipboard");
      setTimeout(() => setIsCopiedV7(false), 2000);
    } catch {
      toast.error("Failed to copy V7 prompt");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 hover:bg-card/70 transition group">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Metadata */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(
                item.category,
              )}`}
            >
              {item.category}
            </span>
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition">
              {item.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">{item.sessionId}</span>
            <span>•</span>
            <span>{formatTimestamp(item.createdAt)}</span>
            <span>•</span>
            <span className="text-foreground">
              Route: <code className="text-primary">{item.initialRoute}</code>
              {item.finalRoute && item.finalRoute !== item.initialRoute && (
                <> → <code className="text-primary">{item.finalRoute}</code></>
              )}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-mono text-secondary-foreground border border-border">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(item.durationMs)}</span>
            </span>
            <span className="flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-mono text-secondary-foreground border border-border">
              <span>📋</span>
              <span>{item.eventCount} events</span>
            </span>
            <span className="flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-mono text-secondary-foreground border border-border">
              <Camera className="h-3 w-3" />
              <span>{item.screenshotCount} snapshots</span>
            </span>
            {item.errorCount > 0 && (
              <span className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-mono text-destructive border border-destructive/30">
                <AlertTriangle className="h-3 w-3" />
                <span>{item.errorCount} errors</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Suite: ZIP, MD, JSON, V6, V7, Email */}
        <div className="flex flex-wrap md:flex-col items-center md:items-end gap-1.5 shrink-0 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleExportZip()}
              disabled={isExportingZip}
              title="Export complete session ZIP archive"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition disabled:opacity-50"
            >
              {isExportingZip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-primary" />}
              <span>ZIP</span>
            </button>

            <button
              type="button"
              onClick={() => void handleExportMarkdown()}
              title="Download Markdown bug report"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>MD</span>
            </button>

            <button
              type="button"
              onClick={() => void handleExportJson()}
              title="Download JSON session dump"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              <span>JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleCopyV6()}
              title="Copy V6 AI Bug-Fix Prompt to clipboard"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              {isCopiedV6 ? <Check className="h-3.5 w-3.5 text-primary" /> : <FileCode className="h-3.5 w-3.5 text-primary" />}
              <span>V6</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyV7()}
              title="Copy V7 Autonomous Prompt to clipboard"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              {isCopiedV7 ? <Check className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
              <span>V7</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenEmail(item)}
              title="Deliver session report and snapshots via Email"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
