import type { RecorderSession } from "./types";
import {
  type PromptImageRef,
  formatDiscreteIdeImageLink,
  formatIdeImageLink,
  ensureAbsoluteWindowsPath,
  sanitizeIdentifier,
} from "./prompt-path-resolver";
import {
  extractCleanElementLabel,
  resolveEventXPath,
} from "./prompt-instruction-formatter";

export interface SplitDbErrorEntry {
  code?: string;
  message?: string;
  triggerComponent?: string;
  correlationId?: string;
  stackTrace?: string;
  stackTraceSnippet?: string;
}

export type SplitDbErrorSummary = SplitDbErrorEntry;

export interface FormatSplitDbErrorsOptions {
  sessionId?: string;
  workspaceRoot?: string;
  dbPath?: string;
}

function escapeTableCell(text: string | null | undefined): string {
  if (!text) {
    return "-";
  }

  return text.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").trim();
}

export function formatTelemetryTable(
  session: RecorderSession,
  imageRefs: PromptImageRef[],
  baseDir?: string,
  workspaceRoot?: string,
  isAbsolute?: boolean,
): string {
  if (session.events.length === 0) {
    return "_No user interaction events recorded in this session._";
  }

  const rows = session.events.map((evt, idx) => {
    const stepNum = evt.seqNumber ?? (idx + 1);
    const seq = `#${String(stepNum).padStart(2, "0")}`;
    const elapsed = `${evt.elapsedMs}ms`;
    const targetComp = escapeTableCell(evt.targetComponent || "N/A");
    const actionTarget = `${evt.eventType.toUpperCase()} on \`${targetComp}\``;

    const nav = evt.telemetry?.navigationPath
      ? `${evt.telemetry.navigationPath.fromRoute} -> ${evt.telemetry.navigationPath.toRoute}`
      : `${session.initialRoute} -> ${evt.route || session.finalRoute || session.initialRoute}`;

    const xpathVal = resolveEventXPath(evt);
    const escapedXpath = `\`${escapeTableCell(xpathVal)}\``;

    let coordsAndDist = "-";

    if (evt.coordinates) {
      coordsAndDist = `(${evt.coordinates.x}, ${evt.coordinates.y})`;
    }

    if (evt.telemetry?.distanceFromEdges) {
      const d = evt.telemetry.distanceFromEdges;
      coordsAndDist += ` [T:${d.top} R:${d.right} B:${d.bottom} L:${d.left}]`;
    }

    let boxAndPad = "-";

    if (evt.telemetry?.boundingRect) {
      const b = evt.telemetry.boundingRect;
      boxAndPad = `${b.width}x${b.height}`;
    }

    if (evt.telemetry?.padding) {
      const p = evt.telemetry.padding;
      boxAndPad += ` (pad: ${p.top}/${p.right}/${p.bottom}/${p.left})`;
    }

    let colors = "-";

    if (evt.telemetry?.componentDetails) {
      const c = evt.telemetry.componentDetails;
      colors = `${c.color || "-"} / ${c.backgroundColor || "-"}`;
    }

    let snapshotLink = "-";

    if (evt.hasScreenshot) {
      const cleanLabel = extractCleanElementLabel(evt.targetComponent, evt.description);
      const matchedRef = imageRefs.find((r) => r.sequenceNumber === stepNum);

      if (matchedRef) {
        snapshotLink = formatIdeImageLink(matchedRef);
      } else {
        snapshotLink = formatDiscreteIdeImageLink({
          sequenceNumber: stepNum,
          instance: evt.eventType,
          what: cleanLabel,
          sessionId: session.id,
          baseDir,
          workspaceRoot,
          isAbsolute,
        });
      }
    }

    return `| ${seq} | ${elapsed} | ${actionTarget} | \`${escapeTableCell(nav)}\` | ${escapedXpath} | ${escapeTableCell(coordsAndDist)} | ${escapeTableCell(boxAndPad)} | ${escapeTableCell(colors)} | ${snapshotLink} |`;
  });

  return [
    "| Step | Elapsed | Action & Target | Navigation | XPath | Coordinates & Distance | Box & Padding | Text / Bg Color | Snapshot Link |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

export function formatScreenshotsSection(imageRefs: PromptImageRef[]): string {
  if (imageRefs.length === 0) {
    return "> No visual snapshots recorded for this session.";
  }

  const lines = imageRefs.map((ref) => {
    const seq = `#${String(ref.sequenceNumber).padStart(2, "0")}`;
    const ideLink = formatIdeImageLink(ref);

    if (ref.fullScreenPath && ref.elementCropPath) {
      const desc = sanitizeIdentifier(ref.actionDescriptor || "snapshot");
      const fullLink = `@[${String(ref.sequenceNumber).padStart(2, "0")}_fullscreen_${desc}.png](file;${ref.fullScreenPath})`;
      const cropLink = `@[${String(ref.sequenceNumber).padStart(2, "0")}_element_${desc}.png](file;${ref.elementCropPath})`;

      return `- **Snapshot ${seq}**: ${ideLink}\n    - Full-Screen Viewport: ${fullLink}\n    - Element Crop (12px Margin): ${cropLink}`;
    }

    return `- **Snapshot ${seq}**: ${ideLink} (Descriptor: \`${ref.actionDescriptor}\`)`;
  });

  return lines.join("\n");
}

export function formatSplitDbErrors(
  errors?: SplitDbErrorEntry[],
  options?: FormatSplitDbErrorsOptions,
): string {
  const root = ensureAbsoluteWindowsPath("", options?.workspaceRoot).replace(/\\/g, "/").replace(/\/+$/, "");
  const sessionId = options?.sessionId || "session";
  const absMetaPath = `${root}/.logs/recorded-bugs/${sessionId}/metadata.json`;
  const absErrPath = `${root}/.logs/recorded-bugs/${sessionId}/errors.json`;

  const headers = [
    `- **Session Diagnostics**: persisted to the LetsMarkNow backend (bug-reports/${sessionId})`,
    `- **Session Telemetry & Error Artifact**: @[metadata.json](file;${absMetaPath})`,
    `- **Session Error Log**: @[errors.json](file;${absErrPath})`,
    "",
  ];

  if (!errors || errors.length === 0) {
    return [
      ...headers,
      "> [OK] No runtime errors logged during this recording.",
    ].join("\n");
  }

  const items = errors.slice(0, 10).map((err, idx) => {
    const code = err.code || "E_APP_UNKNOWN";
    const msg = err.message || "Unknown error";
    const comp = err.triggerComponent || "Unspecified";
    const corr = err.correlationId ? ` (Correlation: \`${err.correlationId}\`)` : "";
    const rawStack = err.stackTraceSnippet || err.stackTrace;
    const stack = rawStack ? `\n    Stack: \`${rawStack.split("\n")[0].trim()}\`` : "";

    return `${idx + 1}. [${code}] **${msg}** (Trigger: \`${comp}\`)${corr}${stack}`;
  });

  return [...headers, ...items].join("\n");
}
