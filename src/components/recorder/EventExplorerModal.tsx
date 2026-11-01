import React, { useMemo, useState } from "react";
import {
  ListTree,
  Search,
  X,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Camera,
  Activity,
  Layers,
  MousePointer,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useRecorderStore } from "@/lib/recorder/recorder-store";
import { RecorderEventType, type RecorderEvent } from "@/lib/recorder/types";

export type EventExplorerCategoryType =
  | "all"
  | "error"
  | "analysis"
  | "recording"
  | "simulation"
  | "interaction";

export interface EventExplorerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCategory?: EventExplorerCategoryType;
}

export function EventExplorerModal({
  isOpen,
  onClose,
  initialCategory = "all",
}: EventExplorerModalProps): React.JSX.Element | null {
  const session = useRecorderStore((s) => s.session);
  const isStoreOpen = useRecorderStore((s) => s.isEventExplorerOpen);
  const storeClose = useRecorderStore((s) => s.closeEventExplorer);
  const isModalOpen = isOpen !== undefined ? isOpen : isStoreOpen;
  const handleModalClose = onClose || storeClose;

  const [selectedCategory, setSelectedCategory] =
    useState<EventExplorerCategoryType>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [snapshotViewMode, setSnapshotViewMode] = useState<"fullScreen" | "viewport">("fullScreen");

  const events = useMemo(() => {
    if (!session || !Array.isArray(session.events)) {
      return [];
    }

    return session.events;
  }, [session]);

  const categoryCounts = useMemo(() => {
    const counts: Record<EventExplorerCategoryType, number> = {
      all: events.length,
      error: 0,
      analysis: 0,
      recording: 0,
      simulation: 0,
      interaction: 0,
    };

    for (const evt of events) {
      if (
        evt.eventType === RecorderEventType.SystemLog ||
        (evt.eventType as string) === "error" ||
        evt.description.toLowerCase().includes("error") ||
        Boolean(evt.details?.error)
      ) {
        counts.error += 1;
      } else if (
        evt.eventType === RecorderEventType.AnalysisStep ||
        evt.eventType === RecorderEventType.Inspection ||
        evt.description.toLowerCase().includes("phase")
      ) {
        counts.analysis += 1;
      } else if (
        evt.eventType === RecorderEventType.Screenshot ||
        evt.eventType === RecorderEventType.UserNote ||
        evt.hasScreenshot
      ) {
        counts.recording += 1;
      } else if (
        evt.eventType === RecorderEventType.StateChange ||
        evt.description.toLowerCase().includes("simulation")
      ) {
        counts.simulation += 1;
      } else {
        counts.interaction += 1;
      }
    }

    return counts;
  }, [events]);

  const eventStepNumberMap = useMemo(() => {
    const map = new Map<string, number>();

    events.forEach((evt, idx) => {
      const stepNum = typeof evt.details?.stepNumber === "number" ? evt.details.stepNumber : idx + 1;
      map.set(evt.id, stepNum);
    });

    return map;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return events.filter((evt) => {
      // Category Filter
      let isCategoryMatch = true;

      if (selectedCategory === "error") {
        isCategoryMatch =
          evt.eventType === RecorderEventType.SystemLog ||
          (evt.eventType as string) === "error" ||
          evt.description.toLowerCase().includes("error") ||
          Boolean(evt.details?.error);
      } else if (selectedCategory === "analysis") {
        isCategoryMatch =
          evt.eventType === RecorderEventType.AnalysisStep ||
          evt.eventType === RecorderEventType.Inspection ||
          evt.description.toLowerCase().includes("phase");
      } else if (selectedCategory === "recording") {
        isCategoryMatch =
          evt.eventType === RecorderEventType.Screenshot ||
          evt.eventType === RecorderEventType.UserNote ||
          evt.hasScreenshot;
      } else if (selectedCategory === "simulation") {
        isCategoryMatch =
          evt.eventType === RecorderEventType.StateChange ||
          evt.description.toLowerCase().includes("simulation");
      } else if (selectedCategory === "interaction") {
        isCategoryMatch =
          evt.eventType !== RecorderEventType.SystemLog &&
          (evt.eventType as string) !== "error" &&
          evt.eventType !== RecorderEventType.AnalysisStep &&
          evt.eventType !== RecorderEventType.Inspection &&
          evt.eventType !== RecorderEventType.StateChange &&
          !evt.description.toLowerCase().includes("phase");
      }

      if (!isCategoryMatch) {
        return false;
      }

      // Search Query Filter
      if (query.length > 0) {
        const stepNum = eventStepNumberMap.get(evt.id) ?? 1;
        const stepBadgeStr = `step #${String(stepNum).padStart(2, "0")}`.toLowerCase();
        const stepPlainStr = `step ${stepNum}`.toLowerCase();
        const stepHashStr = `#${stepNum}`;

        const descMatch = evt.description.toLowerCase().includes(query);
        const compMatch = (evt.targetComponent || "").toLowerCase().includes(query);
        const routeMatch = (evt.route || "").toLowerCase().includes(query);
        const typeMatch = evt.eventType.toLowerCase().includes(query);
        const idMatch = (evt.id || "").toLowerCase().includes(query);
        const stepMatch =
          stepBadgeStr.includes(query) ||
          stepPlainStr.includes(query) ||
          stepHashStr.includes(query) ||
          String(stepNum) === query;

        return descMatch || compMatch || routeMatch || typeMatch || idMatch || stepMatch;
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, eventStepNumberMap]);

  const activeEvent = useMemo(() => {
    if (!selectedEventId) {
      return filteredEvents[0] || null;
    }

    return events.find((e) => e.id === selectedEventId) || filteredEvents[0] || null;
  }, [events, filteredEvents, selectedEventId]);

  const activeStepNumber = useMemo(() => {
    if (!activeEvent) {
      return 1;
    }

    return eventStepNumberMap.get(activeEvent.id) ?? 1;
  }, [activeEvent, eventStepNumberMap]);

  if (!isModalOpen) {
    return null;
  }

  const handleCopyJson = () => {
    if (!activeEvent) {
      return;
    }

    navigator.clipboard.writeText(JSON.stringify(activeEvent, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const categories: Array<{
    id: EventExplorerCategoryType;
    label: string;
    color: string;
  }> = [
    { id: "all", label: "All", color: "text-primary border-primary/40 bg-primary/10" },
    { id: "error", label: "Errors", color: "text-destructive border-destructive/40 bg-destructive/10" },
    { id: "analysis", label: "Analysis", color: "text-primary border-primary/40 bg-primary/10" },
    { id: "recording", label: "Recording", color: "text-primary border-primary/40 bg-primary/10" },
    { id: "simulation", label: "Simulation", color: "text-primary border-primary/40 bg-primary/10" },
    { id: "interaction", label: "Interactions", color: "text-primary border-primary/40 bg-primary/10" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Event Explorer"
      data-recorder-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="flex h-[88vh] w-full max-w-6xl flex-col rounded-2xl border border-border bg-popover text-foreground shadow-xl overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
              <ListTree className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider uppercase text-primary font-mono">
                  Event Explorer // Timeline & Diagnostics
                </h2>
                <span className="rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
                  {session?.id ?? "local-session"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Audit fine-grained interaction phases, events, and captured error stack traces
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            aria-label="Close Event Explorer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id];

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? `${cat.color}`
                      : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[260px] max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search descriptions, selectors, routes..."
              className="w-full rounded-xl border border-input bg-background py-1.5 pl-9 pr-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Main Split Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Event Stream Timeline */}
          <div className="w-1/2 border-r border-border overflow-y-auto p-4 space-y-2 bg-popover">
            {filteredEvents.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  No events found matching category or search query
                </p>
              </div>
            ) : (
              filteredEvents.map((evt, idx) => {
                const isSelected = activeEvent?.id === evt.id;
                const stepNumber = eventStepNumberMap.get(evt.id) ?? idx + 1;
                const isError =
                  evt.eventType === RecorderEventType.SystemLog ||
                  (evt.eventType as string) === "error" ||
                  evt.description.toLowerCase().includes("error");
                const isAnalysis =
                  evt.eventType === RecorderEventType.AnalysisStep ||
                  evt.description.toLowerCase().includes("phase");

                return (
                  <div
                    key={evt.id || idx}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-card/40 hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/30 font-mono">
                          Step #{String(stepNumber).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" />
                          <span>
                            {new Date(evt.timestamp).toISOString().substring(11, 23)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                          isError
                            ? "bg-destructive/10 text-destructive border border-destructive/30"
                            : isAnalysis
                              ? "bg-secondary/80 text-secondary-foreground border border-border"
                              : "bg-secondary/80 text-secondary-foreground"
                        }`}
                      >
                        {evt.eventType}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground line-clamp-2">
                      {evt.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {evt.targetComponent || evt.selector || "system"}
                      </span>
                      {evt.hasScreenshot && (
                        <span className="flex items-center gap-1 text-primary">
                          <Camera className="h-3 w-3" />
                          <span>Snap</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Detailed Event Inspector */}
          <div className="w-1/2 flex flex-col overflow-y-auto p-5 bg-muted/40">
            {activeEvent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      Step #{String(activeStepNumber).padStart(2, "0")} // {activeEvent.id}
                    </h3>
                    <p className="text-xs text-muted-foreground">{activeEvent.route || "/"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-mono text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span className="text-primary">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Screenshot Card if available */}
                {activeEvent.screenshotId && (() => {
                  const snap = session?.screenshots.find((s) => s.id === activeEvent.screenshotId);
                  const activeSnapUrl =
                    snapshotViewMode === "viewport"
                      ? snap?.viewportDataUrl || snap?.dataUrl
                      : snap?.fullScreenDataUrl || snap?.dataUrl;
                  const hasDualViews = Boolean(snap?.fullScreenDataUrl && snap?.viewportDataUrl);

                  return (
                    <div className="rounded-xl border border-border bg-card/40 p-3">
                      <div className="flex items-center justify-between text-xs font-mono text-foreground mb-2">
                        <span className="flex items-center gap-1 text-primary">
                          <Camera className="h-3.5 w-3.5" />
                          <span>Visual Snapshot Attachment</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {hasDualViews && (
                            <div className="flex items-center rounded border border-border bg-secondary/60 p-0.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setSnapshotViewMode("fullScreen")}
                                className={`rounded px-1.5 py-0.5 transition ${
                                  snapshotViewMode === "fullScreen"
                                    ? "bg-primary/20 text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Full Screen
                              </button>
                              <button
                                type="button"
                                onClick={() => setSnapshotViewMode("viewport")}
                                className={`rounded px-1.5 py-0.5 transition ${
                                  snapshotViewMode === "viewport"
                                    ? "bg-primary/20 text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Inspection Viewport
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (activeSnapUrl) {
                                setPreviewScreenshotUrl(activeSnapUrl);
                              }
                            }}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Enlarge</span>
                          </button>
                        </div>
                      </div>

                      {activeSnapUrl ? (
                        <img
                          src={activeSnapUrl}
                          alt="Event Snapshot"
                          className="max-h-56 w-full object-contain rounded-lg border border-border bg-black/40"
                        />
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          Snapshot data stored in session archive
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Telemetry Key Attributes */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg border border-border bg-card/40 p-2.5">
                    <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                      Actor & Event Type
                    </span>
                    <span className="text-foreground font-semibold">
                      {activeEvent.actor} :: {activeEvent.eventType}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border bg-card/40 p-2.5">
                    <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                      Target Component
                    </span>
                    <span className="text-primary truncate block">
                      {activeEvent.targetComponent || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Raw JSON Payload */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Raw Telemetry Payload
                  </span>
                  <pre className="max-h-80 overflow-auto rounded-xl border border-border bg-background p-3 text-[11px] font-mono text-foreground leading-relaxed">
                    {JSON.stringify(activeEvent, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground font-mono">
                Select an event from the stream to inspect details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarge Snapshot Modal */}
      {previewScreenshotUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewScreenshotUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-6 backdrop-blur-lg"
        >
          <div className="relative max-h-full max-w-5xl rounded-2xl border border-border bg-popover p-2 shadow-xl">
            <button
              type="button"
              onClick={() => setPreviewScreenshotUrl(null)}
              className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewScreenshotUrl}
              alt="Full Preview"
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
