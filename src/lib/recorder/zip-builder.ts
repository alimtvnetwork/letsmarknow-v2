import JSZip from "jszip";
import { getExtraReportContext } from "./report-context";
import { generateAllMarkdownReports } from "./report-generator";
import type { BugReportSummary, CapturedScreenshot, RecorderSession } from "./types";

export interface ExportZipResult {
  isSuccess: boolean;
  filename: string;
  blobSize: number;
  downloadPath: string;
  extractionCommand: string;
  aiInstructions: string;
}

function getDiagnostics(): Record<string, unknown> {
  const isBrowser = typeof window !== "undefined";

  return {
    userAgent: isBrowser ? window.navigator.userAgent : "nodejs",
    screenResolution: isBrowser ? `${window.screen.width}x${window.screen.height}` : "unknown",
    viewportSize: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : "unknown",
    language: isBrowser ? window.navigator.language : "en-US",
    timestamp: new Date().toISOString(),
  };
}

function getAppContext(): Record<string, unknown> {
  // Extension point: LetsMarkNow has no vision-editor stores; extra context
  // can be wired in via report-context.ts.
  return getExtraReportContext();
}

function attachScreenshots(zip: JSZip, screenshots: readonly CapturedScreenshot[]): void {
  const folder = zip.folder("screenshots");

  if (!folder) {
    return;
  }

  for (const shot of screenshots) {
    if (shot.dataUrl) {
      const base64Data = shot.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      folder.file(`${shot.id}.png`, base64Data, { base64: true });
    }

    if (shot.viewportDataUrl && shot.viewportDataUrl !== shot.dataUrl) {
      const base64Viewport = shot.viewportDataUrl.replace(/^data:image\/\w+;base64,/, "");
      folder.file(`${shot.id}_viewport.png`, base64Viewport, { base64: true });
    }
  }
}

function buildFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  return `letsmark-bug-report-${stamp}.zip`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function exportSessionToZip(
  session: RecorderSession,
  summary?: BugReportSummary,
): Promise<ExportZipResult> {
  const fullSession: RecorderSession = {
    ...session,
    summary: summary ?? session.summary,
  };

  const zip = new JSZip();
  const reports = generateAllMarkdownReports(fullSession);

  zip.file("AI_BUG_REPORT.md", reports.aiInstructions);
  zip.file("README.md", reports.readme);
  zip.file("timeline.md", reports.timeline);
  zip.file("session.json", JSON.stringify(fullSession, null, 2));
  zip.file("events.json", JSON.stringify(fullSession.events, null, 2));
  zip.file("diagnostics.json", JSON.stringify(getDiagnostics(), null, 2));
  zip.file("app-context.json", JSON.stringify(getAppContext(), null, 2));

  attachScreenshots(zip, fullSession.screenshots);

  const filename = buildFilename();
  const blob = await zip.generateAsync({ type: "blob" });

  triggerBrowserDownload(blob, filename);

  const downloadPath = `Downloads/${filename}`;
  const extractionCommand = `Unzip "${filename}" into your bug-reports folder, then review AI_BUG_REPORT.md.`;
  const aiInstructions = `Share AI_BUG_REPORT.md and session.json with your AI coding assistant to diagnose and resolve this defect.`;

  const clipboardPayload = [
    `# Bug Report Archive: ${filename}`,
    `Archive Path: ${downloadPath}`,
    "",
    "## PowerShell Extraction Command:",
    extractionCommand,
    "",
    "## AI Execution Directive:",
    aiInstructions,
  ].join("\n");

  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      void navigator.clipboard.writeText(clipboardPayload);
    } catch {
      // Ignore clipboard restrictions in non-interactive/unfocused environments
    }
  }

  return {
    isSuccess: true,
    filename,
    blobSize: blob.size,
    downloadPath,
    extractionCommand,
    aiInstructions,
  };
}
