import type {
  AnalysisStepMetric,
  BoxModelMetrics,
  ComponentTelemetryDetails,
  ElementBoxSpacing,
  ElementDistanceInfo,
  ElementGeometry,
  ElementTelemetry,
  EventExplorerCategoryType,
  StyleMetrics,
  UiTelemetrySnapshot,
  ViewportDistances,
  XPathInfo,
  RecorderCoordinates,
} from "./telemetry-types";

export type {
  AnalysisStepMetric,
  BoxModelMetrics,
  ComponentTelemetryDetails,
  ElementBoxSpacing,
  ElementDistanceInfo,
  ElementGeometry,
  ElementTelemetry,
  EventExplorerCategoryType,
  StyleMetrics,
  UiTelemetrySnapshot,
  ViewportDistances,
  XPathInfo,
  RecorderCoordinates,
};

export enum RecorderStatusType {
  Idle = "idle",
  Recording = "recording",
  Paused = "paused",
  Stopped = "stopped",
}

export enum RecorderActorType {
  User = "user",
  System = "system",
}

export enum InspectionPhaseType {
  Preprocessing = "preprocessing",
  PatternSearch = "pattern_search",
  EdgeDetection = "edge_detection",
  DefectCheck = "defect_check",
  ValidationGating = "validation_gating",
}

export enum RecorderEventType {
  Click = "click",
  Input = "input",
  Navigation = "navigation",
  Inspection = "inspection",
  SystemLog = "system_log",
  StateChange = "state_change",
  Screenshot = "screenshot",
  UserNote = "user_note",
  Hover = "hover",
  RoiDrag = "roi_drag",
  AnalysisStep = "analysis_step",
}

export enum IssueCategoryType {
  UiGlitch = "ui_glitch",
  InspectionDefect = "inspection_defect",
  Performance = "performance",
  CrashOrError = "crash_or_error",
  WorkflowConfusion = "workflow_confusion",
  Other = "other",
}

export interface RecorderEvent {
  id: string;
  seqNumber?: number;
  timestamp: string;
  elapsedMs: number;
  actor: RecorderActorType;
  eventType: RecorderEventType;
  description: string;
  targetComponent: string;
  selector: string;
  route: string;
  screenName?: string;
  hasScreenshot: boolean;
  screenshotId?: string;
  coordinates?: RecorderCoordinates;
  xpath?: string;
  telemetry?: ElementTelemetry;
  uiTelemetry?: UiTelemetrySnapshot;
  details?: Record<string, unknown>;
}

export type InteractionEvent = RecorderEvent;

export interface CapturedScreenshot {
  id: string;
  seqNumber?: number;
  title: string;
  timestamp: string;
  elapsedMs: number;
  dataUrl: string;
  fullScreenDataUrl?: string;
  elementDataUrl?: string;
  viewportDataUrl?: string;
  source: "manual" | "step" | "canvas";
}

export interface DiagnosticSnapshot {
  id: string;
  seqNumber: number;
  title: string;
  timestamp: string;
  elapsedMs: number;
  dataUrl: string;
  fullScreenDataUrl: string;
  elementDataUrl: string;
  viewportDataUrl: string;
  source: "manual" | "step" | "canvas";
  coordinates?: RecorderCoordinates;
}

export interface BugReportSummary {
  title: string;
  description: string;
  category: IssueCategoryType;
  expectedBehavior: string;
  actualBehavior: string;
  reporterName?: string;
}

export interface RecorderSession {
  id: string;
  startedAt: string;
  stoppedAt?: string;
  durationMs: number;
  events: RecorderEvent[];
  screenshots: CapturedScreenshot[];
  routeHistory: string[];
  initialRoute: string;
  finalRoute: string;
  summary?: BugReportSummary;
  errors?: Array<Record<string, unknown>>;
  isHoverRecording?: boolean;
  isHoverRecordEnabled?: boolean;
}

export interface AddEventParams {
  seqNumber?: number;
  actor: RecorderActorType;
  eventType: RecorderEventType;
  description: string;
  targetComponent: string;
  selector: string;
  route: string;
  screenName?: string;
  hasScreenshot: boolean;
  screenshotId?: string;
  coordinates?: RecorderCoordinates;
  xpath?: string;
  telemetry?: ElementTelemetry;
  uiTelemetry?: UiTelemetrySnapshot;
  details?: Record<string, unknown>;
}

export interface AddScreenshotParams {
  seqNumber?: number;
  title: string;
  dataUrl: string;
  source: "manual" | "step" | "canvas";
  fullScreenDataUrl?: string;
  elementDataUrl?: string;
  viewportDataUrl?: string;
}

export interface AnalysisStepTelemetry {
  phase: InspectionPhaseType;
  phaseIndex: number;
  stepName: string;
  ruleId: string;
  ruleName: string;
  durationMs: number;
  isPassed: boolean;
  isGated: boolean;
  confidenceScore: number;
  metrics: AnalysisStepMetric[];
  rawDetails: Record<string, unknown>;
}

export interface RecordAnalysisStepParams {
  phase: InspectionPhaseType;
  stepName: string;
  ruleId?: string;
  ruleName?: string;
  durationMs: number;
  isPassed: boolean;
  isGated?: boolean;
  confidenceScore?: number;
  metrics?: AnalysisStepMetric[];
  screenshotTitle?: string;
  targetCanvas?: HTMLCanvasElement | null;
  rawDetails?: Record<string, unknown>;
}
