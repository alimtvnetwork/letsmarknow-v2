import React, { useState } from "react";
import {
  X,
  Send,
  Settings,
  CheckCircle2,
  AlertCircle,
  ListTree,
  Loader2,
} from "lucide-react";
import { useRecorderStore } from "@/lib/recorder/recorder-store";
import { IssueCategoryType, type BugReportSummary } from "@/lib/recorder/types";
import { sendTelegramMessage } from "@/lib/recorder/telegram-service";
import { getBackendBaseUrl } from "@/lib/recorder/backend-url";
import { RecorderSummaryForm } from "./RecorderSummaryForm";
import { RecorderTimelinePreview } from "./RecorderTimelinePreview";
import { TelegramSettingsModal } from "./TelegramSettingsModal";
import { RecorderExportDropdown } from "./RecorderExportDropdown";
import { RecorderEmailModal } from "./RecorderEmailModal";

export function RecorderExportModal(): React.JSX.Element | null {
  const isExportModalOpen = useRecorderStore((s) => s.isExportModalOpen);
  const session = useRecorderStore((s) => s.session);
  const cancelRecording = useRecorderStore((s) => s.cancelRecording);
  const resumeRecording = useRecorderStore((s) => s.resumeRecording);
  const openEventExplorer = useRecorderStore((s) => s.openEventExplorer);

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    isSuccess: boolean;
    message: string;
  } | null>(null);

  const [isSendingBugReport, setIsSendingBugReport] = useState(false);
  const [bugReportStatus, setBugReportStatus] = useState<{
    isSuccess: boolean;
    message: string;
  } | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [summary, setSummary] = useState<BugReportSummary>({
    title: "",
    description: "",
    category: IssueCategoryType.UiGlitch,
    expectedBehavior: "",
    actualBehavior: "",
  });

  if (!isExportModalOpen || !session) {
    return null;
  }

  const handleSendTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(null);

    const messageText = `*LetsMarkNow Bug Report*
*Title:* ${summary.title || "Untitled Bug"}
*Category:* ${summary.category}
*Route:* \`${session.initialRoute}\`
*Events:* ${session.events.length} | *Screenshots:* ${session.screenshots.length}

*Expected:*
${summary.expectedBehavior || "N/A"}

*Actual:*
${summary.actualBehavior || "N/A"}`;

    try {
      const result = await sendTelegramMessage(messageText);
      setTelegramStatus(result);

      if (result.isSuccess) {
        window.setTimeout(() => {
          cancelRecording();
        }, 1500);
      }
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleSendBugReport = async () => {
    const baseUrl = getBackendBaseUrl();

    if (baseUrl === null) {
      setBugReportStatus({
        isSuccess: false,
        message:
          "Backend is not connected — configure VITE_API_URL or bugReportApiUrl to send bug reports.",
      });

      return;
    }

    setIsSendingBugReport(true);
    setBugReportStatus(null);

    try {
      const messageParts = [
        summary.description,
        `Expected: ${summary.expectedBehavior || "N/A"}`,
        `Actual: ${summary.actualBehavior || "N/A"}`,
      ].filter((part) => part.length > 0);

      const res = await fetch(`${baseUrl}/bug-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: session.id,
          title: summary.title || "Untitled Bug",
          category: summary.category,
          description: messageParts.join("\n\n") || undefined,
          expectedBehavior: summary.expectedBehavior || undefined,
          actualBehavior: summary.actualBehavior || undefined,
          initialRoute: session.initialRoute,
          finalRoute: session.finalRoute || session.initialRoute,
          durationMs: session.durationMs,
          events: session.events,
          screenshots: session.screenshots.map((snap) => ({
            title: snap.title,
            dataUrl: snap.dataUrl,
            source: snap.source,
          })),
          errors: session.errors ?? [],
        }),
      });

      if (!res.ok) {
        let detail = `POST /bug-reports -> ${res.status}`;

        try {
          const errBody = (await res.json()) as {
            Errors?: Array<{ Message?: string }>;
            Status?: { Message?: string };
          };
          detail = errBody.Errors?.[0]?.Message ?? errBody.Status?.Message ?? detail;
        } catch {
          // Keep HTTP status detail
        }

        setBugReportStatus({ isSuccess: false, message: detail });

        return;
      }

      setBugReportStatus({
        isSuccess: true,
        message: "Bug report saved to the LetsMarkNow backend. You can still download ZIP or copy prompts.",
      });
    } catch (err) {
      setBugReportStatus({
        isSuccess: false,
        message: err instanceof Error ? err.message : "Failed to send bug report.",
      });
    } finally {
      setIsSendingBugReport(false);
    }
  };

  return (
    <>
      <div
        data-recorder-modal="true"
        className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div className="relative w-full max-w-xl max-h-[90vh] rounded-xl border border-border bg-popover p-5 shadow-2xl flex flex-col text-foreground animate-in fade-in zoom-in-95">
          <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Export Activity & Bug Report</h2>
              <p className="text-xs text-muted-foreground">
                Unified multi-action export suite: ZIP, V6/V7 prompts, email, and cloud dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(true)}
                title="Configure Telegram Bot"
                className="flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-3.5 w-3.5 text-primary" />
                <span>Telegram Setup</span>
              </button>

              <button
                type="button"
                onClick={resumeRecording}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <RecorderSummaryForm summary={summary} onChange={setSummary} />

            <RecorderTimelinePreview events={session.events} screenshots={session.screenshots} />

            {telegramStatus ? (
              <div
                className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                  telegramStatus.isSuccess
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "border border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {telegramStatus.isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{telegramStatus.message}</span>
              </div>
            ) : null}

            {bugReportStatus ? (
              <div
                className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                  bugReportStatus.isSuccess
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "border border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {bugReportStatus.isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{bugReportStatus.message}</span>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between border-t border-border pt-3 mt-4 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resumeRecording}
                className="rounded border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
              >
                Resume Recording
              </button>

              <button
                type="button"
                onClick={cancelRecording}
                className="rounded px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                Discard
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openEventExplorer}
                title="Explore and Filter All Recorded Events (Antigravity Tools Pattern)"
                className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                <ListTree className="h-3.5 w-3.5" />
                <span>Events</span>
              </button>

              <button
                type="button"
                disabled={isSendingTelegram}
                onClick={handleSendTelegram}
                title="Send directly to Telegram chat"
                className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSendingTelegram ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Telegram</span>
              </button>

              <button
                type="button"
                disabled={isSendingBugReport}
                onClick={handleSendBugReport}
                title="Send bug report directly to backend (POST /bug-reports)"
                className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSendingBugReport ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Bug Report</span>
              </button>

              {/* Multi-Action Export Dropdown: ZIP, V6, V7, Email, Backend, Session JSON */}
              <RecorderExportDropdown
                session={session}
                summary={summary}
                placement="top"
                onOpenEmailModal={() => setIsEmailModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <RecorderEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        session={session}
        summary={summary}
      />

      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </>
  );
}
