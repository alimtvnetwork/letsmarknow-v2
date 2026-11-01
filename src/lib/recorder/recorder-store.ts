import { create } from "zustand";
import { toast } from "sonner";
import {
  type AddEventParams,
  type AddScreenshotParams,
  type BugReportSummary,
  type CapturedScreenshot,
  IssueCategoryType,
  type RecorderEvent,
  type RecorderSession,
  RecorderStatusType,
} from "./types";
import { useErrorStore } from "./error-history";
import { saveBugSession } from "./recorder-repository";
import {
  createEmptySession,
  generateSemanticDefaultTitle,
  generateSemanticSessionId,
} from "./session-factory";

export { createEmptySession, generateSemanticDefaultTitle, generateSemanticSessionId };

interface RecorderStoreState {
  status: RecorderStatusType;
  isRecording: boolean;
  isPaused: boolean;
  isExportModalOpen: boolean;
  isPreviousBugsOpen: boolean;
  isEventExplorerOpen: boolean;
  isHoverRecording: boolean;
  isHoverRecordEnabled: boolean;
  hoverTargetsCache: Set<string>;
  hasEvents: boolean;
  hasScreenshots: boolean;
  session: RecorderSession | null;
  elapsedSec: number;

  startRecording: (initialRoute?: string) => void;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  openEventExplorer: () => void;
  closeEventExplorer: () => void;
  setEventExplorerOpen: (isOpen: boolean) => void;
  openPreviousBugs: () => void;
  closePreviousBugs: () => void;
  setPreviousBugsOpen: (isOpen: boolean) => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  setExportModalOpen: (isOpen: boolean) => void;
  toggleHoverRecord: () => void;
  toggleHoverRecording: () => void;
  setHoverRecordEnabled: (isEnabled: boolean) => void;
  setHoverRecording: (isEnabled: boolean) => void;
  hasRecordedHover: (key: string) => boolean;
  markHoverRecorded: (key: string) => void;
  clearHoverTargetsCache: () => void;
  addEvent: (params: AddEventParams) => void;
  addScreenshot: (params: AddScreenshotParams) => string;
  setSummary: (summary: BugReportSummary) => void;
  tickElapsed: () => void;
}

export const useRecorderStore = create<RecorderStoreState>((set, get) => ({
  status: RecorderStatusType.Idle,
  isRecording: false,
  isPaused: false,
  isExportModalOpen: false,
  isPreviousBugsOpen: false,
  isEventExplorerOpen: false,
  isHoverRecording: false,
  isHoverRecordEnabled: false,
  hoverTargetsCache: new Set<string>(),
  hasEvents: false,
  hasScreenshots: false,
  session: null,
  elapsedSec: 0,

  startRecording: (initialRoute = window.location.pathname) => {
    const session = createEmptySession(initialRoute);

    set({
      status: RecorderStatusType.Recording,
      isRecording: true,
      isPaused: false,
      isExportModalOpen: false,
      isPreviousBugsOpen: false,
      isHoverRecording: false,
      isHoverRecordEnabled: false,
      hoverTargetsCache: new Set<string>(),
      hasEvents: false,
      hasScreenshots: false,
      session,
      elapsedSec: 0,
    });
  },

  stopRecording: async (): Promise<string | null> => {
    const current = get().session;

    if (!current) {
      return null;
    }

    const stoppedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(current.startedAt).getTime();
    const finalRoute = window.location.pathname;

    const activeErrors = useErrorStore.getState().history.map((err) => ({
      id: err.id,
      code: err.code,
      message: err.message,
      level: err.level,
      correlationId: err.correlationId,
      triggerComponent: err.triggerComponent,
      stackTrace: err.stackTrace,
      createdAt: err.createdAt,
      details: err.details,
    }));

    const stoppedSession: RecorderSession = {
      ...current,
      stoppedAt,
      durationMs,
      finalRoute,
      errors: activeErrors,
      isHoverRecording: get().isHoverRecordEnabled,
      isHoverRecordEnabled: get().isHoverRecordEnabled,
    };

    set({
      status: RecorderStatusType.Stopped,
      isRecording: false,
      isPaused: false,
      isExportModalOpen: false,
      session: stoppedSession,
    });

    let savedSessionId = stoppedSession.id;

    try {
      const summary = stoppedSession.summary || {
        title: generateSemanticDefaultTitle(stoppedSession.initialRoute),
        category: IssueCategoryType.UiGlitch,
        description: `LetsMarkNow session recorded on ${stoppedSession.initialRoute}`,
        expectedBehavior: "Expected normal operation without visual or logical defects.",
        actualBehavior: "Captured interactions and diagnostic snapshots.",
      };

      savedSessionId = await saveBugSession({
        sessionId: stoppedSession.id,
        title: summary.title,
        category: summary.category,
        description: summary.description,
        expectedBehavior: summary.expectedBehavior,
        actualBehavior: summary.actualBehavior,
        initialRoute: stoppedSession.initialRoute,
        finalRoute: stoppedSession.finalRoute,
        durationMs: stoppedSession.durationMs,
        events: stoppedSession.events,
        screenshots: stoppedSession.screenshots.map((snap) => ({
          title: snap.title,
          dataUrl: snap.dataUrl,
          source: snap.source,
        })),
        errors: stoppedSession.errors,
      });
    } catch (err) {
      console.warn("Failed to auto-persist bug session to LetsMarkNow backend:", err);
    }

    const eventCount = stoppedSession.events.length;
    toast.success(
      `Recording stopped. Session saved (#${savedSessionId}) with ${eventCount} events and diagnostic snapshots.`,
    );

    return savedSessionId;
  },

  pauseRecording: () => {
    if (!get().isRecording) {
      return;
    }

    set({
      status: RecorderStatusType.Paused,
      isPaused: true,
    });
  },

  resumeRecording: () => {
    const { session } = get();

    if (!session) {
      return;
    }

    const updatedSession = { ...session };
    delete updatedSession.stoppedAt;

    set({
      status: RecorderStatusType.Recording,
      isRecording: true,
      isPaused: false,
      isExportModalOpen: false,
      session: updatedSession,
    });
  },

  cancelRecording: () => {
    set({
      status: RecorderStatusType.Idle,
      isRecording: false,
      isPaused: false,
      isExportModalOpen: false,
      isPreviousBugsOpen: false,
      isEventExplorerOpen: false,
      isHoverRecording: false,
      isHoverRecordEnabled: false,
      hoverTargetsCache: new Set<string>(),
      hasEvents: false,
      hasScreenshots: false,
      session: null,
      elapsedSec: 0,
    });
  },

  openEventExplorer: () => {
    set({ isEventExplorerOpen: true });
  },

  closeEventExplorer: () => {
    set({ isEventExplorerOpen: false });
  },

  setEventExplorerOpen: (isOpen: boolean) => {
    set({ isEventExplorerOpen: isOpen });
  },

  openPreviousBugs: () => {
    set({ isPreviousBugsOpen: true });
  },

  closePreviousBugs: () => {
    set({ isPreviousBugsOpen: false });
  },

  setPreviousBugsOpen: (isOpen: boolean) => {
    set({ isPreviousBugsOpen: isOpen });
  },

  openExportModal: () => {
    const { session } = get();

    if (!session) {
      set({ session: createEmptySession(window.location.pathname) });
    }

    set({ isExportModalOpen: true });
  },

  closeExportModal: () => {
    set({ isExportModalOpen: false });
  },

  setExportModalOpen: (isOpen: boolean) => {
    if (isOpen && !get().session) {
      set({ session: createEmptySession(window.location.pathname) });
    }

    set({ isExportModalOpen: isOpen });
  },

  hasRecordedHover: (key: string) => {
    return get().hoverTargetsCache.has(key);
  },

  markHoverRecorded: (key: string) => {
    const updated = new Set(get().hoverTargetsCache);
    updated.add(key);
    set({ hoverTargetsCache: updated });
  },

  clearHoverTargetsCache: () => {
    set({ hoverTargetsCache: new Set<string>() });
  },

  toggleHoverRecord: () => {
    const current = get().isHoverRecordEnabled;
    const next = !current;

    set({ isHoverRecordEnabled: next, isHoverRecording: next });
  },

  toggleHoverRecording: () => {
    get().toggleHoverRecord();
  },

  setHoverRecordEnabled: (isEnabled: boolean) => {
    set({ isHoverRecordEnabled: isEnabled, isHoverRecording: isEnabled });
  },

  setHoverRecording: (isEnabled: boolean) => {
    get().setHoverRecordEnabled(isEnabled);
  },

  addEvent: (params: AddEventParams) => {
    const { session, isRecording, isPaused } = get();

    if (!isRecording || isPaused || !session) {
      return;
    }

    const timestamp = new Date().toISOString();
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    const id = `evt-${Date.now()}-${session.events.length + 1}`;
    const seqNumber = params.seqNumber ?? (session.events.length + 1);

    const newEvent: RecorderEvent = {
      ...params,
      seqNumber,
      selector: params.selector ?? "",
      id,
      timestamp,
      elapsedMs,
    };

    const hasRoute = session.routeHistory.includes(params.route);
    const updatedRoutes = hasRoute ? session.routeHistory : [...session.routeHistory, params.route];

    set({
      hasEvents: true,
      session: {
        ...session,
        events: [...session.events, newEvent],
        routeHistory: updatedRoutes,
        finalRoute: params.route,
      },
    });
  },

  addScreenshot: (params: AddScreenshotParams): string => {
    const { session } = get();

    if (!session) {
      return "";
    }

    const timestamp = new Date().toISOString();
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    const id = `snap-${Date.now()}-${session.screenshots.length + 1}`;
    const seqNumber = params.seqNumber ?? (session.screenshots.length + 1);

    const newScreenshot: CapturedScreenshot = {
      ...params,
      seqNumber,
      id,
      timestamp,
      elapsedMs,
    };

    set({
      hasScreenshots: true,
      session: {
        ...session,
        screenshots: [...session.screenshots, newScreenshot],
      },
    });

    return id;
  },

  setSummary: (summary: BugReportSummary) => {
    const { session } = get();

    if (!session) {
      return;
    }

    set({
      session: {
        ...session,
        summary,
      },
    });
  },

  tickElapsed: () => {
    const { isRecording, isPaused, elapsedSec } = get();

    if (!isRecording || isPaused) {
      return;
    }

    set({ elapsedSec: elapsedSec + 1 });
  },
}));
