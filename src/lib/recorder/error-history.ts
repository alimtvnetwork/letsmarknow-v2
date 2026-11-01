/**
 * Minimal error-history store for the bug recorder (LetsMarkNow port).
 *
 * Replaces cat-my-v12's `@/lib/stores/errorStore`. Keeps the same drop-in
 * shape (`useErrorStore` with a `history` array) so the ported recorder code
 * needs no further changes, but strips all cat-my-v12 diagnostics plumbing.
 */
import { create } from "zustand";

export interface ErrorHistoryEntry {
  id: string;
  code: string;
  message: string;
  level: string;
  correlationId?: string;
  triggerComponent?: string;
  stackTrace?: string;
  createdAt: number;
  details?: unknown;
}

interface ErrorHistoryState {
  history: ErrorHistoryEntry[];
  addError: (entry: Partial<ErrorHistoryEntry> & { message: string }) => void;
  clearErrors: () => void;
}

const MAX_HISTORY = 200;

export const useErrorStore = create<ErrorHistoryState>((set) => ({
  history: [],
  addError: (entry) =>
    set((state) => ({
      history: [
        ...state.history.slice(-(MAX_HISTORY - 1)),
        {
          id: entry.id || `err-${Date.now()}-${state.history.length}`,
          code: entry.code || "ERR_UNKNOWN",
          message: entry.message,
          level: entry.level || "error",
          correlationId: entry.correlationId,
          triggerComponent: entry.triggerComponent,
          stackTrace: entry.stackTrace,
          createdAt: entry.createdAt ?? Date.now(),
          details: entry.details,
        },
      ],
    })),
  clearErrors: () => set({ history: [] }),
}));

/**
 * Starts capturing `window` errors and unhandled promise rejections into the
 * error-history store. Call once (e.g. from ActivityRecorderRoot) and use the
 * returned teardown to stop.
 */
export function startErrorCapture(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onError = (event: ErrorEvent) => {
    useErrorStore.getState().addError({
      code: "WINDOW_ERROR",
      message: event.message || "Uncaught window error",
      level: "error",
      triggerComponent: "window.onerror",
      stackTrace: event.error?.stack,
      details: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";

    useErrorStore.getState().addError({
      code: "UNHANDLED_REJECTION",
      message,
      level: "error",
      triggerComponent: "window.onunhandledrejection",
      stackTrace: reason instanceof Error ? reason.stack : undefined,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
