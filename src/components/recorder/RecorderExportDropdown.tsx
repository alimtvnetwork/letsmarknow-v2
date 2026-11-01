import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Download,
  FileCode,
  FileJson,
  Bot,
  Mail,
  HardDrive,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useErrorStore } from "@/lib/recorder/error-history";
import { KeyboardKeyType } from "@/lib/recorder/keyboard";
import { exportSessionToZip } from "@/lib/recorder/zip-builder";
import { saveBugSession } from "@/lib/recorder/recorder-repository";
import {
  generateV6LetterlyPrompt,
  generateV7LetterlyPrompt,
} from "@/lib/recorder/prompt-v6-v7-builder";
import type { BugReportSummary, RecorderSession } from "@/lib/recorder/types";

export interface RecorderExportDropdownProps {
  session: RecorderSession;
  summary: BugReportSummary;
  onOpenEmailModal: () => void;
  onPrimaryClick?: () => void;
  className?: string;
  isCompact?: boolean;
  placement?: "top" | "bottom";
}

interface DropdownItem {
  id: string;
  label: string;
  sublabel: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  action: () => Promise<void> | void;
  isLoading: boolean;
}

export function RecorderExportDropdown({
  session,
  summary,
  onOpenEmailModal,
  onPrimaryClick,
  className = "",
  isCompact = false,
  placement = "top",
}: RecorderExportDropdownProps): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isSavingBackend, setIsSavingBackend] = useState(false);
  const [isCopyingPrompt, setIsCopyingPrompt] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }

      setIsDropdownOpen(false);
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const executeItemAction = async (item: DropdownItem): Promise<void> => {
    try {
      await item.action();
    } finally {
      setIsDropdownOpen(false);
    }
  };

  const handleExportZip = async (): Promise<void> => {
    setIsExportingZip(true);

    try {
      toast.info("Generating ZIP bundle with snapshots and telemetry...");
      const result = await exportSessionToZip(session, summary);

      const clipboardPayload = [
        `# Bug Report Archive: ${result.filename}`,
        `Archive: ${result.downloadPath}`,
        "",
        "## AI Execution Directive:",
        result.aiInstructions,
      ].join("\n");

      try {
        await navigator.clipboard.writeText(clipboardPayload);
        toast.success("ZIP exported! Archive details copied to clipboard.");
      } catch {
        toast.success(`ZIP exported to ${result.filename}!`);
      }
    } catch (err) {
      toast.error(`ZIP export failed: ${String(err)}`);
    } finally {
      setIsExportingZip(false);
      setIsDropdownOpen(false);
    }
  };

  const handleSaveBackend = async (): Promise<{ isSaved: boolean; sessionId?: string }> => {
    setIsSavingBackend(true);

    try {
      const sessionId = await saveBugSession({
        sessionId: session.id,
        title: summary.title || session.id,
        category: summary.category,
        description: summary.description,
        expectedBehavior: summary.expectedBehavior,
        actualBehavior: summary.actualBehavior,
        initialRoute: session.initialRoute,
        finalRoute: session.finalRoute,
        durationMs: session.durationMs,
        events: session.events,
        screenshots: session.screenshots.map((snap) => ({
          title: snap.title,
          dataUrl: snap.dataUrl,
          source: snap.source,
        })),
        errors: session.errors ?? [],
      });

      toast.success(
        `Saved bug report and ${session.screenshots.length} snapshots to backend (session ${sessionId}).`,
      );

      return { isSaved: true, sessionId };
    } catch (err) {
      toast.error(
        `Failed to persist bug report to backend: ${err instanceof Error ? err.message : String(err)}`,
      );

      return { isSaved: false };
    } finally {
      setIsSavingBackend(false);
      setIsDropdownOpen(false);
    }
  };

  const handleCopyPromptV6 = async (): Promise<void> => {
    setIsCopyingPrompt(true);

    try {
      await handleSaveBackend();

      const splitDbErrors = useErrorStore.getState().history;
      const promptText = generateV6LetterlyPrompt(session, {
        summary,
        splitDbErrors,
        workspaceRoot: "",
        isAbsolute: true,
      });

      await navigator.clipboard.writeText(promptText);
      toast.success("Copied AI Bug-Fix Prompt (V6) to clipboard!");
    } catch {
      toast.info("V6 Prompt generated (clipboard write restricted)");
    } finally {
      setIsCopyingPrompt(false);
      setIsDropdownOpen(false);
    }
  };

  const handleCopyPromptV7 = async (): Promise<void> => {
    setIsCopyingPrompt(true);

    try {
      await handleSaveBackend();

      const splitDbErrors = useErrorStore.getState().history;
      const promptText = generateV7LetterlyPrompt(session, {
        summary,
        splitDbErrors,
        workspaceRoot: "",
        isAbsolute: true,
      });

      await navigator.clipboard.writeText(promptText);
      toast.success("Copied AI Bug-Fix Prompt (V7) to clipboard!");
    } catch {
      toast.info("V7 Prompt generated (clipboard write restricted)");
    } finally {
      setIsCopyingPrompt(false);
      setIsDropdownOpen(false);
    }
  };

  const handleOpenEmail = (): void => {
    setIsDropdownOpen(false);
    onOpenEmailModal();
  };

  const handleCopySessionJson = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(session, null, 2));
      toast.success("Copied full session JSON to clipboard!");
    } catch {
      toast.info("Clipboard write restricted in this context.");
    } finally {
      setIsDropdownOpen(false);
    }
  };

  const items: DropdownItem[] = [
    {
      id: "zip",
      label: "Export ZIP Bundle",
      sublabel: "Download archive with snapshots & JSON",
      shortcut: "Ctrl+Z",
      icon: Download,
      iconColor: "text-primary",
      action: handleExportZip,
      isLoading: isExportingZip,
    },
    {
      id: "v6",
      label: "Copy as Prompt (V6)",
      sublabel: "Structured bug-fix prompt with timeline & evidence",
      shortcut: "Ctrl+6",
      icon: FileCode,
      iconColor: "text-primary",
      action: handleCopyPromptV6,
      isLoading: isCopyingPrompt,
    },
    {
      id: "v7",
      label: "Copy as Prompt (V7)",
      sublabel: "Extended prompt with operating mode & diagnostics",
      shortcut: "Ctrl+7",
      icon: Bot,
      iconColor: "text-primary",
      action: handleCopyPromptV7,
      isLoading: isCopyingPrompt,
    },
    {
      id: "email",
      label: "Direct Email",
      sublabel: "Dispatch bug report directly to engineering",
      shortcut: "Ctrl+E",
      icon: Mail,
      iconColor: "text-primary",
      action: handleOpenEmail,
      isLoading: false,
    },
    {
      id: "backend",
      label: "Save to Backend",
      sublabel: "Persist session to the LetsMarkNow backend",
      shortcut: "Ctrl+S",
      icon: HardDrive,
      iconColor: "text-primary",
      action: async () => {
        await handleSaveBackend();
      },
      isLoading: isSavingBackend,
    },
    {
      id: "json",
      label: "Copy Session JSON",
      sublabel: "Full recorded session payload as JSON",
      shortcut: "Ctrl+J",
      icon: FileJson,
      iconColor: "text-primary",
      action: handleCopySessionJson,
      isLoading: false,
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (!isDropdownOpen) {
      if (KeyboardKeyType.isEnterOrSpace(e.key) || KeyboardKeyType.isArrowDown(e.key)) {
        e.preventDefault();
        setIsDropdownOpen(true);
        setActiveIndex(0);
      }

      return;
    }

    if (KeyboardKeyType.isEscape(e.key)) {
      e.preventDefault();
      setIsDropdownOpen(false);

      return;
    }

    if (KeyboardKeyType.isArrowDown(e.key)) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);

      return;
    }

    if (KeyboardKeyType.isArrowUp(e.key)) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);

      return;
    }

    if (KeyboardKeyType.isEnterOrSpace(e.key)) {
      e.preventDefault();
      const currentItem = items[activeIndex];

      if (currentItem) {
        void executeItemAction(currentItem);
      }
    }
  };

  const placementClasses = placement === "bottom"
    ? "top-full mt-2"
    : "bottom-full mb-2";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center ${className}`}
    >
      <div className="inline-flex items-center rounded-lg shadow-sm">
        <button
          type="button"
          onClick={onPrimaryClick || handleExportZip}
          disabled={isExportingZip}
          title="Quick Export: ZIP Archive"
          className={`flex items-center gap-1.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-l-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 ${
            isCompact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"
          }`}
        >
          {isExportingZip ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
          ) : (
            <Download className="h-3.5 w-3.5 text-primary-foreground" />
          )}
          <span>{isExportingZip ? "Exporting..." : isCompact ? "Export ZIP" : "Download ZIP"}</span>
        </button>

        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Choose Export Format"
          className={`border-l border-primary-foreground/20 bg-primary text-primary-foreground hover:bg-primary/90 rounded-r-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
            isCompact ? "p-1" : "p-1.5"
          }`}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isDropdownOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`absolute right-0 ${placementClasses} w-[360px] max-h-[min(380px,80vh)] overflow-y-auto scrollbar-thin rounded-xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl z-[10070] animate-in fade-in zoom-in-95`}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1 flex items-center justify-between">
            <span>Unified Export Suite</span>
            <span className="text-[9px] text-muted-foreground font-mono">{items.length} options</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isSelected = activeIndex === index;

              return (
                <button
                  key={item.id}
                  role="menuitem"
                  type="button"
                  onClick={() => void executeItemAction(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  disabled={item.isLoading}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors disabled:opacity-50 ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Icon className={`h-4 w-4 ${item.iconColor} shrink-0`} />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {item.sublabel}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border bg-muted/60">
                    {item.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
