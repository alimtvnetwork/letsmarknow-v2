import { clearHoverDeduplicationCache } from "./hover-dedup";
import { handleClickEvent } from "./interceptor-click";
import {
  handleInputEvent,
  handleIntelligentHover,
  recordSystemEvent,
  resetInterceptorState,
} from "./interceptor-handlers";
import { describeElement } from "./element-descriptor";

export {
  resolveScreenName,
} from "./screen-names";

export {
  resolveCleanElementLabel,
  sanitizeText,
  toTitleCase,
} from "./element-label-resolver";

export {
  computeDeterministicXPath,
  computeElementXPath,
  resolveXPathStrategy,
} from "./element-xpath-resolver";

export {
  extractComprehensiveTelemetry,
  captureElementTelemetry,
  triggerSpringAnimation,
} from "./telemetry-extractor";

export {
  getLastRoiDragEndTime,
  setLastRoiDragEndTime,
  notifyRoiDragEnd,
  recordRoiDragStart,
  recordRoiDragEnd,
} from "./roi-drag-tracker";

export {
  captureManualScreenshotWithNote,
  recordSystemEvent,
} from "./interceptor-handlers";

export { describeElement } from "./element-descriptor";

export type {
  RoiBoxCoordinates,
  RoiDragStartParams,
  RoiDragEndParams,
} from "./roi-drag-tracker";

export type {
  SpringPulseDetail,
  ComprehensiveTelemetryParams,
  ComprehensiveTelemetryResult,
} from "./telemetry-extractor";

let isInterceptionActive = false;
let cleanupHandlers: (() => void) | null = null;

export function startGlobalInterception(): void {
  if (isInterceptionActive || typeof window === "undefined") {
    return;
  }

  isInterceptionActive = true;
  clearHoverDeduplicationCache();

  const handleWindowError = (event: ErrorEvent) => {
    recordSystemEvent(`Runtime Error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    recordSystemEvent(`Unhandled Promise Rejection: ${String(event.reason)}`);
  };

  window.addEventListener("click", handleClickEvent, true);
  window.addEventListener("mouseover", handleIntelligentHover, true);
  window.addEventListener("change", handleInputEvent, true);
  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  cleanupHandlers = () => {
    window.removeEventListener("click", handleClickEvent, true);
    window.removeEventListener("mouseover", handleIntelligentHover, true);
    window.removeEventListener("change", handleInputEvent, true);
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);

    resetInterceptorState();
  };
}

export function stopGlobalInterception(): void {
  if (!isInterceptionActive) {
    return;
  }

  isInterceptionActive = false;
  resetInterceptorState();

  if (cleanupHandlers) {
    cleanupHandlers();
    cleanupHandlers = null;
  }
}

export { recordAnalysisStep } from "./analysis-telemetry";
