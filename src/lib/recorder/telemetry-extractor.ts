import {
  type BoxModelMetrics,
  type ElementGeometry,
  type ElementTelemetry,
  type StyleMetrics,
  type UiTelemetrySnapshot,
  type ViewportDistances,
  type XPathInfo,
} from "./types";
import {
  computeDeterministicXPath,
  resolveXPathStrategy,
} from "./element-xpath-resolver";
import { resolveCleanElementLabel, sanitizeText } from "./element-label-resolver";
import { isTargetInteractive } from "./hover-dedup";

export interface SpringPulseDetail {
  id: string;
  x: number;
  y: number;
  stepNumber: number;
}

export interface ComprehensiveTelemetryParams {
  target: HTMLElement;
  stepNumber: number;
  clientX?: number;
  clientY?: number;
  fromRoute: string;
  toRoute: string;
  isHoverRecorded: boolean;
}

export interface ComprehensiveTelemetryResult {
  legacyTelemetry: ElementTelemetry;
  snapshotTelemetry: UiTelemetrySnapshot;
  xpath: string;
}

export function triggerSpringAnimation(params: {
  x: number;
  y: number;
  stepNumber: number;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail: SpringPulseDetail = {
    id: `spring-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x: params.x,
    y: params.y,
    stepNumber: params.stepNumber,
  };

  window.dispatchEvent(
    new CustomEvent("cat:recorder-spring-click", {
      detail,
    }),
  );
}

export function extractComprehensiveTelemetry(
  params: ComprehensiveTelemetryParams,
): ComprehensiveTelemetryResult {
  const { target, stepNumber, fromRoute, toRoute, isHoverRecorded } = params;
  const rect = target.getBoundingClientRect();
  const computed =
    typeof window !== "undefined"
      ? window.getComputedStyle(target)
      : ({} as CSSStyleDeclaration);

  const paddingTop = parseFloat(computed.paddingTop || "0") || 0;
  const paddingRight = parseFloat(computed.paddingRight || "0") || 0;
  const paddingBottom = parseFloat(computed.paddingBottom || "0") || 0;
  const paddingLeft = parseFloat(computed.paddingLeft || "0") || 0;

  const marginTop = parseFloat(computed.marginTop || "0") || 0;
  const marginRight = parseFloat(computed.marginRight || "0") || 0;
  const marginBottom = parseFloat(computed.marginBottom || "0") || 0;
  const marginLeft = parseFloat(computed.marginLeft || "0") || 0;

  const borderWidth = parseFloat(computed.borderTopWidth || computed.borderWidth || "0") || 0;
  const borderRadius = computed.borderRadius || "0px";
  const marginStr = `${computed.marginTop || "0px"} ${computed.marginRight || "0px"} ${computed.marginBottom || "0px"} ${computed.marginLeft || "0px"}`;
  const borderStr = computed.border || `${borderWidth}px solid ${computed.borderColor || "transparent"}`;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

  const clientX =
    typeof params.clientX === "number"
      ? params.clientX
      : Math.round(rect.left + rect.width / 2);
  const clientY =
    typeof params.clientY === "number"
      ? params.clientY
      : Math.round(rect.top + rect.height / 2);

  const geometry: ElementGeometry = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    clientX,
    clientY,
  };

  const viewport: ViewportDistances = {
    distanceToViewportTop: Math.round(rect.top),
    distanceToViewportRight: Math.round(viewportWidth - rect.right),
    distanceToViewportBottom: Math.round(viewportHeight - rect.bottom),
    distanceToViewportLeft: Math.round(rect.left),
    top: Math.round(rect.top),
    right: Math.round(viewportWidth - rect.right),
    bottom: Math.round(viewportHeight - rect.bottom),
    left: Math.round(rect.left),
  };

  const boxModel: BoxModelMetrics = {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    borderWidth,
    borderRadius,
    margin: marginStr,
    border: borderStr,
  };

  const isVisible =
    computed.display !== "none" &&
    computed.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0;
  const hasPointerCursor = computed.cursor === "pointer";

  const styles: StyleMetrics = {
    color: computed.color || "",
    backgroundColor: computed.backgroundColor || "",
    borderColor: computed.borderColor || "",
    fontSize: computed.fontSize || "",
    fontWeight: computed.fontWeight || "",
    fontFamily: computed.fontFamily || "",
    cursor: computed.cursor || "",
    isVisible,
    hasPointerCursor,
  };

  const xpath = computeDeterministicXPath(target);
  const strategy = resolveXPathStrategy(target);
  const cleanLabel = resolveCleanElementLabel(target);

  const xpathInfo: XPathInfo = {
    xpath,
    fullDomPath: xpath,
    selector: target.tagName.toLowerCase(),
    strategy,
  };

  const accessibleName =
    target.getAttribute("aria-label") ||
    target.getAttribute("title") ||
    target.getAttribute("alt") ||
    "";

  const textContent = sanitizeText(target.innerText || target.textContent).slice(0, 80);
  const tagName = target.tagName.toLowerCase();
  const componentIdentifier = cleanLabel || tagName;
  const isInteractive = isTargetInteractive(target);

  const snapshotTelemetry: UiTelemetrySnapshot = {
    stepNumber,
    xpath,
    fullDomPath: xpath,
    tagName,
    textContent,
    componentIdentifier,
    geometry,
    viewport,
    boxModel,
    styles,
    xpathInfo,
    isInteractive,
    isHoverRecorded,
  };

  const legacyTelemetry: ElementTelemetry = {
    padding: {
      top: computed.paddingTop || "0px",
      right: computed.paddingRight || "0px",
      bottom: computed.paddingBottom || "0px",
      left: computed.paddingLeft || "0px",
    },
    margin: {
      top: computed.marginTop || "0px",
      right: computed.marginRight || "0px",
      bottom: computed.marginBottom || "0px",
      left: computed.marginLeft || "0px",
    },
    boundingRect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left),
    },
    distanceFromEdges: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      bottom: Math.round(viewportHeight - rect.bottom),
      right: Math.round(viewportWidth - rect.right),
    },
    componentDetails: {
      tagName,
      role: target.getAttribute("role") || "",
      accessibleName,
      textContent,
      color: computed.color || "",
      backgroundColor: computed.backgroundColor || "",
      fontSize: computed.fontSize || "",
      borderRadius,
    },
    xpath,
    navigationPath: {
      fromRoute,
      toRoute,
    },
  };

  return {
    legacyTelemetry,
    snapshotTelemetry,
    xpath,
  };
}

export function captureElementTelemetry(
  target: HTMLElement,
  fromRoute: string,
  toRoute: string,
): ElementTelemetry {
  const result = extractComprehensiveTelemetry({
    target,
    stepNumber: 0,
    fromRoute,
    toRoute,
    isHoverRecorded: false,
  });

  return result.legacyTelemetry;
}
