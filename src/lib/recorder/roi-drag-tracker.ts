import { useRecorderStore } from "./recorder-store";
import { captureDualSnapshots } from "./screenshot-service";
import { computeDeterministicXPath } from "./element-xpath-resolver";
import { resolveScreenName } from "./screen-names";
import {
  type AddEventParams,
  RecorderActorType,
  RecorderEventType,
} from "./types";

let lastRoiDragEndTime = 0;
let lastRoiDragTarget: HTMLElement | null = null;

export function getLastRoiDragEndTime(): number {
  return lastRoiDragEndTime;
}

export function setLastRoiDragEndTime(timestamp: number): void {
  lastRoiDragEndTime = timestamp;
}

export function notifyRoiDragEnd(target: HTMLElement | null = null): void {
  lastRoiDragEndTime = Date.now();
  lastRoiDragTarget = target;
}

export interface RoiBoxCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoiDragStartParams {
  action: "move" | "resize";
  roi: RoiBoxCoordinates;
  element?: HTMLElement | null;
  handle?: string | null;
}

export interface RoiDragEndParams {
  action: "move" | "resize";
  startRoi: RoiBoxCoordinates;
  endRoi: RoiBoxCoordinates;
  element?: HTMLElement | null;
  handle?: string | null;
}

export function recordRoiDragStart(params: RoiDragStartParams): void {
  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused) {
    return;
  }

  const { action, roi, element, handle } = params;
  const roundedX = Math.round(roi.x);
  const roundedY = Math.round(roi.y);
  const roundedW = Math.round(roi.width);
  const roundedH = Math.round(roi.height);

  const handleSuffix = handle ? ` via ${handle} handle` : "";
  const description = `User began ${action === "resize" ? `resizing ROI${handleSuffix}` : "moving ROI"} at [x:${roundedX}, y:${roundedY}, w:${roundedW}, h:${roundedH}]`;
  const xpath = element ? computeDeterministicXPath(element) : "/canvas[roi]";
  const seqNumber = (store.session?.events.length ?? 0) + 1;

  const snapshot = captureDualSnapshots({
    title: description,
    source: "canvas",
    targetElement: element || undefined,
    coordinates: { x: roundedX, y: roundedY },
    seqNumber,
  });

  const screenshotId = store.addScreenshot({
    title: description,
    dataUrl: snapshot.dataUrl,
    fullScreenDataUrl: snapshot.fullScreenDataUrl,
    elementDataUrl: snapshot.elementDataUrl,
    viewportDataUrl: snapshot.viewportDataUrl,
    source: "canvas",
    seqNumber,
  });

  const currentRoute = typeof window !== "undefined" ? window.location.pathname : "/";
  const screenName = resolveScreenName(currentRoute);

  const eventParams: AddEventParams = {
    seqNumber,
    actor: RecorderActorType.User,
    eventType: RecorderEventType.RoiDrag,
    description,
    targetComponent: `ROI Box (${action})`,
    selector: xpath,
    route: currentRoute,
    screenName,
    hasScreenshot: Boolean(screenshotId),
    screenshotId: screenshotId || undefined,
    coordinates: { x: roundedX, y: roundedY },
    xpath,
    details: {
      action,
      phase: "start",
      screenName,
      handle: handle || null,
      roi: {
        x: roundedX,
        y: roundedY,
        width: roundedW,
        height: roundedH,
      },
    },
  };

  store.addEvent(eventParams);
}

export function recordRoiDragEnd(params: RoiDragEndParams): void {
  notifyRoiDragEnd(params.element || null);

  const store = useRecorderStore.getState();

  if (!store.isRecording || store.isPaused) {
    return;
  }

  const { action, startRoi, endRoi, element, handle } = params;
  const dx = Math.round(endRoi.x - startRoi.x);
  const dy = Math.round(endRoi.y - startRoi.y);
  const dw = Math.round(endRoi.width - startRoi.width);
  const dh = Math.round(endRoi.height - startRoi.height);

  let explanation = "";

  if (action === "resize") {
    explanation = `ROI resized by Δw=${dw >= 0 ? `+${dw}` : dw}px, Δh=${dh >= 0 ? `+${dh}` : dh}px (from ${Math.round(startRoi.width)}x${Math.round(startRoi.height)} to ${Math.round(endRoi.width)}x${Math.round(endRoi.height)})`;
  } else {
    explanation = `ROI moved by Δx=${dx >= 0 ? `+${dx}` : dx}px, Δy=${dy >= 0 ? `+${dy}` : dy}px (from [${Math.round(startRoi.x)}, ${Math.round(startRoi.y)}] to [${Math.round(endRoi.x)}, ${Math.round(endRoi.y)}])`;
  }

  const description = `User completed ${action} ROI: ${explanation}`;
  const xpath = element ? computeDeterministicXPath(element) : "/canvas[roi]";
  const seqNumber = (store.session?.events.length ?? 0) + 1;

  const snapshot = captureDualSnapshots({
    title: description,
    source: "canvas",
    targetElement: element || undefined,
    coordinates: { x: Math.round(endRoi.x), y: Math.round(endRoi.y) },
    seqNumber,
  });

  const screenshotId = store.addScreenshot({
    title: description,
    dataUrl: snapshot.dataUrl,
    fullScreenDataUrl: snapshot.fullScreenDataUrl,
    elementDataUrl: snapshot.elementDataUrl,
    viewportDataUrl: snapshot.viewportDataUrl,
    source: "canvas",
    seqNumber,
  });

  const currentRoute = typeof window !== "undefined" ? window.location.pathname : "/";
  const screenName = resolveScreenName(currentRoute);

  const eventParams: AddEventParams = {
    seqNumber,
    actor: RecorderActorType.User,
    eventType: RecorderEventType.RoiDrag,
    description,
    targetComponent: `ROI Box (${action})`,
    selector: xpath,
    route: currentRoute,
    screenName,
    hasScreenshot: Boolean(screenshotId),
    screenshotId: screenshotId || undefined,
    coordinates: { x: Math.round(endRoi.x), y: Math.round(endRoi.y) },
    xpath,
    details: {
      action,
      phase: "end",
      screenName,
      handle: handle || null,
      startRoi: {
        x: Math.round(startRoi.x),
        y: Math.round(startRoi.y),
        width: Math.round(startRoi.width),
        height: Math.round(startRoi.height),
      },
      endRoi: {
        x: Math.round(endRoi.x),
        y: Math.round(endRoi.y),
        width: Math.round(endRoi.width),
        height: Math.round(endRoi.height),
      },
      delta: { dx, dy, dw, dh },
      explanation,
    },
  };

  store.addEvent(eventParams);
}
