import {
  extractCleanElementLabel,
  formatDiscreteIdeImageLink,
  formatHumanActionInstruction,
  normalizeRelativePath,
  resolveEventXPath,
  resolveScreenName,
  sanitizeIdentifier,
} from "./prompt-v6-v7-builder";
import type { BugReportSummary, RecorderEvent, RecorderSession } from "./types";

export interface MarkdownReportBundle {
  aiInstructions: string;
  readme: string;
  timeline: string;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function generateAiInstructions(session: RecorderSession): string {
  const summary = session.summary;
  const title = summary?.title || "User Reported Issue";
  const desc = summary?.description || "No description provided.";
  const expected = summary?.expectedBehavior || "App operates without error.";
  const actual = summary?.actualBehavior || "Observed unexpected behavior.";
  const category = summary?.category || "Other";

  const errorBlock =
    session.errors && session.errors.length > 0
      ? session.errors
          .slice(0, 10)
          .map(
            (err) =>
              `- [${String(err.code || "E_APP_UNKNOWN")}] **${String(err.message || "")}** (Trigger: \`${String(err.triggerComponent || "system")}\`)${
                err.stackTrace ? `\n    Stack: ${String(err.stackTrace).split("\n")[0]}` : ""
              }`,
          )
          .join("\n")
      : "No runtime errors recorded during this session.";

  const reproductionSteps = session.events
    .filter((e) => e.actor === "user")
    .map((e, idx) => {
      const seq = String(idx + 1).padStart(2, "0");
      const route = e.route || session.initialRoute;
      const screenName = resolveScreenName(route);
      const cleanLabel = extractCleanElementLabel(e.targetComponent, e.description);
      const xpath = resolveEventXPath(e);
      const actionPhrase = formatHumanActionInstruction({
        eventType: e.eventType,
        cleanLabel,
        targetComponent: e.targetComponent,
        details: e.details,
      });

      const ideLink = e.hasScreenshot
        ? ` • ${formatDiscreteIdeImageLink({
            sequenceNumber: idx + 1,
            instance: e.eventType,
            what: cleanLabel,
            sessionId: session.id,
          })}`
        : "";

      return `${idx + 1}. [${formatElapsed(e.elapsedMs)}] On ${screenName} (route: \`${route}\`), ${actionPhrase} (XPath: \`${xpath}\`)${ideLink}`;
    })
    .join("\n");

  return `# AI Bug Remediation Instructions

## 1. Issue Overview
- **Title**: ${title}
- **Category**: ${category}
- **Duration**: ${formatElapsed(session.durationMs)} (${session.events.length} events)
- **Initial Route**: \`${session.initialRoute}\`
- **Final Route**: \`${session.finalRoute}\`

## 2. User Intent & Problem Statement
- **What went wrong**: ${desc}
- **Observed Behavior**: ${actual}
- **Expected Behavior**: ${expected}

## 3. Reproduction Steps (From Activity Recorder)
${reproductionSteps || "_No user interaction steps recorded._"}

## 4. Key AI Diagnostic Guidance
> [!WARNING]
> Do NOT move, copy, or reference screenshots into \`src/assets/\`, \`assets/\`, or \`public/assets/\`. All diagnostic evidence MUST remain under \`.logs/recorded-bugs/${session.id}/screenshots/\`.

- Review the attached \`timeline.md\` for the interleaved sequence of user and system events.
- Inspect \`app-context.json\` for extra app context captured with the report.
- Inspect the captured PNG files in \`screenshots/\` to see the visual state when the issue happened.
- Search the codebase for the selectors/components identified in \`events.json\`.

## 5. Active Diagnostic Errors
${errorBlock}
`;
}

export function generateReadme(session: RecorderSession): string {
  const summary = session.summary;
  const title = summary?.title || "Bug Report";

  return `# LetsMarkNow Bug Report Package

- **Title**: ${title}
- **Session ID**: \`${session.id}\`
- **Recorded At**: ${session.startedAt}
- **Total Duration**: ${formatElapsed(session.durationMs)}
- **Total Events**: ${session.events.length} (${session.events.filter((e) => e.actor === "user").length} user, ${session.events.filter((e) => e.actor === "system").length} system)
- **Screenshots Captured**: ${session.screenshots.length}

## Package Contents
- \`AI_BUG_REPORT.md\`: Self-contained prompt for AI coding assistants to diagnose and fix.
- \`timeline.md\`: Chronological user and system action log.
- \`session.json\`: Session metadata and route history.
- \`events.json\`: Granular action stream.
- \`diagnostics.json\`: Browser, display, and memory environment details.
- \`vision/\`: Active project parameters, inspection rules, and validation results.
- \`screenshots/\`: Captured visual screenshots.
`;
}

export function generateTimelineTable(
  events: readonly RecorderEvent[],
  sessionId?: string,
  baseDir?: string,
): string {
  const header = `| # | Time | Actor | Event | Component / Target | Description | Screenshot |
|---|---|---|---|---|---|---|`;

  const rows = events.map((e, idx) => {
    const seq = String(idx + 1).padStart(2, "0");
    const actorBadge = e.actor === "user" ? "**USER**" : "*SYSTEM*";
    const cleanLabel = extractCleanElementLabel(e.targetComponent, e.description);
    const what = sanitizeIdentifier(cleanLabel);
    const instance = sanitizeIdentifier(e.eventType);
    const folder = normalizeRelativePath(
      baseDir || (sessionId ? `.logs/recorded-bugs/${sessionId}` : "screenshots"),
    );
    const path = sessionId
      ? `${folder}/screenshots/${seq}_${instance}_${what}.png`
      : `${folder}/${e.screenshotId || `${seq}_${instance}_${what}`}.png`;

    const snap = e.hasScreenshot
      ? `@[${seq}_${instance}_${what}.png](file;${path})`
      : "-";

    const comp = `\`${(e.targetComponent || "N/A").replace(/\|/g, "\\|")}\``;
    const desc = (e.description || "").replace(/\|/g, "\\|");

    return `| ${idx + 1} | ${formatElapsed(e.elapsedMs)} | ${actorBadge} | ${e.eventType} | ${comp} | ${desc} | ${snap} |`;
  });

  return `# Activity Timeline Log\n\n${header}\n${rows.join("\n")}\n`;
}

export function generateAllMarkdownReports(session: RecorderSession): MarkdownReportBundle {
  return {
    aiInstructions: generateAiInstructions(session),
    readme: generateReadme(session),
    timeline: generateTimelineTable(session.events, session.id),
  };
}
