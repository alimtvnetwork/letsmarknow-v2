import { useRecorderStore } from "./recorder-store";
import { captureDualSnapshots } from "./screenshot-service";
import {
  type AddEventParams,
  RecorderActorType,
  RecorderEventType,
} from "./types";
import { resolveInteractiveTarget } from "./hover-dedup";
import { resolveScreenName } from "./screen-names";
import { computeDeterministicXPath } from "./element-xpath-resolver";
import {
  extractComprehensiveTelemetry,
  triggerSpringAnimation,
} from "./telemetry-extractor";
import { getLastRoiDragEndTime } from "./roi-drag-tracker";
import { describeElement, isRecorderUiElement } from "./element-descriptor";

let lastClickTarget: HTMLElement | null = null;
let lastClickTimestamp = 0;
let lastClickCoords = { x: 0, y: 0 };
let lastClickXPath = "";

export function resetClickTracker(): void {
  lastClickTarget = null;
  lastClickTimestamp = 0;
  lastClickCoords = { x: 0, y: 0 };
  lastClickXPath = "";
}

export function handleClickEvent(e: MouseEvent): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused) {
    return;
  }

  const rawTarget = e.target as HTMLElement | null;

  if (!rawTarget) {
    return;
  }

  if (isRecorderUiElement(rawTarget)) {
    return;
  }

  const now = Date.now();
  const isPhantomAfterRoi = now - getLastRoiDragEndTime() < 350;

  if (isPhantomAfterRoi) {
    return;
  }

  const target = resolveInteractiveTarget(rawTarget);

  if (isRecorderUiElement(target)) {
    return;
  }

  const timeDelta = now - lastClickTimestamp;
  const isWithinDebounceWindow = timeDelta < 250;

  if (isWithinDebounceWindow) {
    const isSameTarget = target === lastClickTarget;
    const distance = Math.hypot(e.clientX - lastClickCoords.x, e.clientY - lastClickCoords.y);
    const isNearbyClick = distance < 10;

    const isCurrentInput = target.tagName.toLowerCase() === "input";
    const isLastLabel = lastClickTarget?.tagName.toLowerCase() === "label";
    const hasLabelAssociation = Boolean(
      isCurrentInput &&
      isLastLabel &&
      lastClickTarget &&
      ((lastClickTarget.getAttribute("for") && lastClickTarget.getAttribute("for") === target.id) ||
        lastClickTarget.contains(target)),
    );

    const isCurrentLabel = target.tagName.toLowerCase() === "label";
    const isLastInput = lastClickTarget?.tagName.toLowerCase() === "input";
    const hasReverseLabelAssociation = Boolean(
      isCurrentLabel &&
      isLastInput &&
      lastClickTarget &&
      ((target.getAttribute("for") && target.getAttribute("for") === lastClickTarget.id) ||
        target.contains(lastClickTarget)),
    );

    if (isSameTarget || isNearbyClick || hasLabelAssociation || hasReverseLabelAssociation) {
      return;
    }
  }

  const xpath = computeDeterministicXPath(target);

  if (isWithinDebounceWindow && xpath === lastClickXPath) {
    return;
  }

  lastClickTarget = target;
  lastClickTimestamp = now;
  lastClickCoords = { x: e.clientX, y: e.clientY };
  lastClickXPath = xpath;

  const { targetComponent, selector, description } = describeElement(target);
  const fromRoute = store.session?.finalRoute || window.location.pathname;
  const toRoute = window.location.pathname;
  const screenName = resolveScreenName(toRoute);
  const stepSequenceNumber = (store.session?.events.length ?? 0) + 1;

  triggerSpringAnimation({
    x: Math.round(e.clientX),
    y: Math.round(e.clientY),
    stepNumber: stepSequenceNumber,
  });

  const { legacyTelemetry, snapshotTelemetry, xpath: extractedXPath } = extractComprehensiveTelemetry({
    target,
    stepNumber: stepSequenceNumber,
    clientX: Math.round(e.clientX),
    clientY: Math.round(e.clientY),
    fromRoute,
    toRoute,
    isHoverRecorded: false,
  });

  const snapshot = captureDualSnapshots({
    title: description,
    source: "manual",
    targetElement: target,
    coordinates: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
    seqNumber: stepSequenceNumber,
    quality: 0.6,
  });

  const screenshotId = store.addScreenshot({
    title: description,
    dataUrl: snapshot.dataUrl,
    fullScreenDataUrl: snapshot.fullScreenDataUrl,
    elementDataUrl: snapshot.elementDataUrl,
    viewportDataUrl: snapshot.viewportDataUrl,
    source: "manual",
    seqNumber: stepSequenceNumber,
  });

  const effectiveXPath = extractedXPath || xpath;

  const eventParams: AddEventParams = {
    seqNumber: stepSequenceNumber,
    actor: RecorderActorType.User,
    eventType: RecorderEventType.Click,
    description,
    targetComponent,
    selector,
    route: toRoute,
    screenName,
    hasScreenshot: Boolean(screenshotId),
    screenshotId: screenshotId || undefined,
    coordinates: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
    xpath: effectiveXPath,
    telemetry: legacyTelemetry,
    uiTelemetry: snapshotTelemetry,
    details: {
      stepSequenceNumber,
      screenName,
      telemetry: legacyTelemetry,
      uiTelemetry: snapshotTelemetry,
      xpath: effectiveXPath,
    },
  };

  store.addEvent(eventParams);

  window.setTimeout(() => {
    const updatedRoute = window.location.pathname;

    if (updatedRoute !== toRoute) {
      legacyTelemetry.navigationPath.toRoute = updatedRoute;
    }
  }, 100);
}
