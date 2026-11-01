import { useRecorderStore } from "./recorder-store";
import { captureDualSnapshots } from "./screenshot-service";
import {
  type AddEventParams,
  RecorderActorType,
  RecorderEventType,
} from "./types";
import {
  cancelPendingHover,
  clearHoverDeduplicationCache,
  computeHoverDeduplicationKey,
  getHoverDebounceTimer,
  getLastHoverTimestamp,
  hasRecordedHoverTarget,
  isTargetInteractive,
  markHoverTargetAsRecorded,
  resolveInteractiveTarget,
  setHoverDebounceTimer,
  setLastHoverTimestamp,
} from "./hover-dedup";
import { resolveScreenName } from "./screen-names";
import { sanitizeText } from "./element-label-resolver";
import { computeDeterministicXPath } from "./element-xpath-resolver";
import { extractComprehensiveTelemetry } from "./telemetry-extractor";
import { describeElement, isRecorderUiElement } from "./element-descriptor";
import { notifyRoiDragEnd, setLastRoiDragEndTime } from "./roi-drag-tracker";
import { resetClickTracker } from "./interceptor-click";

export function resetInterceptorState(): void {
  resetClickTracker();
  setLastRoiDragEndTime(0);
  notifyRoiDragEnd(null);
  cancelPendingHover();
  clearHoverDeduplicationCache();
}

export function handleInputEvent(e: Event): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused) {
    return;
  }

  const rawTarget = e.target as HTMLInputElement | HTMLSelectElement | null;

  if (!rawTarget) {
    return;
  }

  if (isRecorderUiElement(rawTarget)) {
    return;
  }

  const target = rawTarget;
  const placeholder = "placeholder" in target ? target.placeholder : "";
  const rawName = target.name || placeholder || target.getAttribute("aria-label") || "Input Field";
  const cleanName = sanitizeText(rawName).replace(/"/g, "'");
  const rawVal = target.type === "password" ? "******" : String(target.value).slice(0, 50);
  const cleanVal = sanitizeText(rawVal).replace(/"/g, "'");
  const xpath = computeDeterministicXPath(target);
  const currentRoute = window.location.pathname;
  const screenName = resolveScreenName(currentRoute);
  const seqNumber = (store.session?.events.length ?? 0) + 1;

  const eventParams: AddEventParams = {
    seqNumber,
    actor: RecorderActorType.User,
    eventType: RecorderEventType.Input,
    description: `Input "${cleanVal}" into ${cleanName}`,
    targetComponent: `<${target.tagName.toLowerCase()} name="${cleanName}">`,
    selector: target.name ? `[name='${target.name}']` : target.tagName.toLowerCase(),
    route: currentRoute,
    screenName,
    hasScreenshot: false,
    xpath,
    details: { name: cleanName, value: cleanVal, xpath, screenName },
  };

  store.addEvent(eventParams);
}

export function recordSystemEvent(description: string, details?: Record<string, unknown>): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused) {
    return;
  }

  const currentRoute = window.location.pathname;
  const screenName = resolveScreenName(currentRoute);
  const seqNumber = (store.session?.events.length ?? 0) + 1;

  store.addEvent({
    seqNumber,
    actor: RecorderActorType.System,
    eventType: RecorderEventType.StateChange,
    description,
    targetComponent: "System / Background",
    selector: "system",
    route: currentRoute,
    screenName,
    hasScreenshot: false,
    details: {
      ...details,
      screenName,
    },
  });
}

export function captureManualScreenshotWithNote(title = "Manual Snapshot"): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording) {
    return;
  }

  const seqNumber = (store.session?.screenshots.length ?? 0) + 1;
  const snap = captureDualSnapshots({ title, source: "manual", seqNumber });
  const screenshotId = store.addScreenshot({
    title,
    dataUrl: snap.dataUrl,
    fullScreenDataUrl: snap.fullScreenDataUrl,
    elementDataUrl: snap.elementDataUrl,
    viewportDataUrl: snap.viewportDataUrl,
    source: "manual",
    seqNumber,
  });

  const currentRoute = window.location.pathname;
  const screenName = resolveScreenName(currentRoute);

  store.addEvent({
    seqNumber: (store.session?.events.length ?? 0) + 1,
    actor: RecorderActorType.User,
    eventType: RecorderEventType.Screenshot,
    description: `User captured screen snapshot: "${title}"`,
    targetComponent: "Screen Canvas / Viewport",
    selector: "canvas",
    route: currentRoute,
    screenName,
    hasScreenshot: true,
    screenshotId,
    details: {
      screenName,
    },
  });
}

export function handleIntelligentHover(e: MouseEvent): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused || !store.isHoverRecordEnabled) {
    return;
  }

  const rawTarget = e.target as HTMLElement | null;

  if (!rawTarget) {
    return;
  }

  if (isRecorderUiElement(rawTarget)) {
    return;
  }

  if (!isTargetInteractive(rawTarget)) {
    return;
  }

  const target = resolveInteractiveTarget(rawTarget);

  if (isRecorderUiElement(target)) {
    return;
  }

  const xpath = computeDeterministicXPath(target);

  if (!xpath) {
    return;
  }

  const currentRoute = window.location.pathname;
  const dedupKey = computeHoverDeduplicationKey({ route: currentRoute, xpath });

  if (hasRecordedHoverTarget(dedupKey) || store.hasRecordedHover(dedupKey)) {
    return;
  }

  const clientX = e.clientX;
  const clientY = e.clientY;
  const activeTimer = getHoverDebounceTimer();

  if (activeTimer !== null) {
    window.clearTimeout(activeTimer);
    setHoverDebounceTimer(null);
  }

  const timer = window.setTimeout(() => {
    const currentStore = useRecorderStore.getState();

    if (
      !currentStore.isRecording ||
      currentStore.isPaused ||
      !currentStore.isHoverRecordEnabled
    ) {
      return;
    }

    const now = Date.now();

    if (now - getLastHoverTimestamp() < 250) {
      return;
    }

    if (hasRecordedHoverTarget(dedupKey) || currentStore.hasRecordedHover(dedupKey)) {
      return;
    }

    markHoverTargetAsRecorded(dedupKey);
    currentStore.markHoverRecorded(dedupKey);
    setLastHoverTimestamp(now);

    const { targetComponent, selector } = describeElement(target);
    const fromRoute = currentStore.session?.finalRoute || window.location.pathname;
    const toRoute = window.location.pathname;
    const screenName = resolveScreenName(toRoute);
    const stepNumber = (currentStore.session?.events.length ?? 0) + 1;

    const { legacyTelemetry, snapshotTelemetry } = extractComprehensiveTelemetry({
      target,
      stepNumber,
      clientX: Math.round(clientX),
      clientY: Math.round(clientY),
      fromRoute,
      toRoute,
      isHoverRecorded: true,
    });

    const hoverDescription = `Hovered over ${targetComponent}`;

    const snapshot = captureDualSnapshots({
      title: hoverDescription,
      source: "manual",
      targetElement: target,
      coordinates: { x: Math.round(clientX), y: Math.round(clientY) },
      seqNumber: stepNumber,
      quality: 0.6,
    });

    const screenshotId = currentStore.addScreenshot({
      title: hoverDescription,
      dataUrl: snapshot.dataUrl,
      fullScreenDataUrl: snapshot.fullScreenDataUrl,
      elementDataUrl: snapshot.elementDataUrl,
      viewportDataUrl: snapshot.viewportDataUrl,
      source: "manual",
      seqNumber: stepNumber,
    });

    const eventParams: AddEventParams = {
      seqNumber: stepNumber,
      actor: RecorderActorType.User,
      eventType: RecorderEventType.Hover,
      description: hoverDescription,
      targetComponent,
      selector,
      route: toRoute,
      screenName,
      hasScreenshot: Boolean(screenshotId),
      screenshotId: screenshotId || undefined,
      coordinates: { x: Math.round(clientX), y: Math.round(clientY) },
      xpath,
      telemetry: legacyTelemetry,
      uiTelemetry: snapshotTelemetry,
      details: {
        hoverTrigger: "intelligent_hover_dedup",
        dedupKey,
        screenName,
        telemetry: legacyTelemetry,
        uiTelemetry: snapshotTelemetry,
        xpath,
      },
    };

    currentStore.addEvent(eventParams);
  }, 250);

  setHoverDebounceTimer(timer);
}
