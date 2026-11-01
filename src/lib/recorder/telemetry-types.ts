export interface RecorderCoordinates {
  x: number;
  y: number;
}

export interface ElementDistanceInfo {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ElementGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  clientX: number;
  clientY: number;
}

export interface ViewportDistances {
  distanceToViewportTop: number;
  distanceToViewportRight: number;
  distanceToViewportBottom: number;
  distanceToViewportLeft: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BoxModelMetrics {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  borderWidth: number;
  borderRadius: string;
  margin: string;
  border: string;
}

export interface StyleMetrics {
  color: string;
  backgroundColor: string;
  borderColor: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  cursor: string;
  isVisible: boolean;
  hasPointerCursor: boolean;
}

export interface XPathInfo {
  xpath: string;
  fullDomPath: string;
  selector: string;
  strategy: "automation-id" | "id" | "tour" | "testid" | "structural";
}

export interface UiTelemetrySnapshot {
  stepNumber: number;
  xpath: string;
  fullDomPath: string;
  tagName: string;
  textContent: string;
  componentIdentifier: string;
  geometry: ElementGeometry;
  viewport: ViewportDistances;
  boxModel: BoxModelMetrics;
  styles: StyleMetrics;
  xpathInfo: XPathInfo;
  isInteractive: boolean;
  isHoverRecorded: boolean;
}

export interface ElementBoxSpacing {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface ComponentTelemetryDetails {
  tagName: string;
  role: string;
  accessibleName: string;
  textContent: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  borderRadius: string;
}

export interface ElementTelemetry {
  padding: ElementBoxSpacing;
  margin: ElementBoxSpacing;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  distanceFromEdges: ElementDistanceInfo;
  componentDetails: ComponentTelemetryDetails;
  xpath: string;
  navigationPath: {
    fromRoute: string;
    toRoute: string;
  };
}

export type EventExplorerCategoryType =
  | "all"
  | "error"
  | "analysis"
  | "recording"
  | "simulation"
  | "interaction";

export interface AnalysisStepMetric {
  metricName: string;
  metricValue: number;
  unit: string;
  threshold: number;
  isPassed: boolean;
}
