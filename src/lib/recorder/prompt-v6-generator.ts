import type {
  BugReportSummary,
  RecorderSession,
} from "./types";
import {
  formatScreenNavigationPath,
  resolveScreenName,
} from "./screen-names";
import { generateSemanticDefaultTitle } from "./recorder-store";
import {
  getWorkspaceRoot,
  resolveImageRefs,
  sanitizeSlug,
} from "./prompt-path-resolver";
import {
  type SplitDbErrorEntry,
  extractCleanElementLabel,
  formatHumanActionInstruction,
  formatScreenshotsSection,
  formatSplitDbErrors,
  formatStepInstruction,
  formatTelemetryTable,
  resolveEventXPath,
} from "./prompt-instruction-formatter";

export interface LetterlyPromptOptions {
  summary?: BugReportSummary;
  splitDbErrors?: SplitDbErrorEntry[];
  baseDir?: string;
  workspaceRoot?: string;
  isAbsolute?: boolean;
  isTimeRestricted?: boolean;
  targetTimezone?: string;
  botAgentName?: string;
}

export function generateV6LetterlyPrompt(
  session: RecorderSession,
  options?: LetterlyPromptOptions,
): string {
  const summary = options?.summary || session.summary;
  let rawTitle = summary?.title?.trim() || "";

  if (
    !rawTitle ||
    rawTitle.includes("rec-") ||
    rawTitle.startsWith("Recorded Session") ||
    rawTitle.startsWith("Recorded Issue: rec-")
  ) {
    rawTitle = generateSemanticDefaultTitle(session.initialRoute || "/");
  }

  const title = rawTitle;
  const slug = sanitizeSlug(title);
  const expected = summary?.expectedBehavior || "Expected normal operation without visual or logical glitches.";
  const actual = summary?.actualBehavior || "Unexpected defect observed during user interaction.";
  const description = summary?.description || "Session recorded with interaction steps and diagnostic evidence.";
  const baseDir = options?.baseDir;
  const workspaceRoot = getWorkspaceRoot(options?.workspaceRoot);
  const isAbsolute = options?.isAbsolute ?? true;
  const finalRoute = session.finalRoute || session.initialRoute;

  const routes = session.routeHistory && session.routeHistory.length > 0
    ? session.routeHistory
    : [session.initialRoute, finalRoute];
  const navPath = formatScreenNavigationPath(routes);

  const imageRefs = resolveImageRefs(session, baseDir, workspaceRoot, isAbsolute);
  const telemetryTable = formatTelemetryTable(session, imageRefs, baseDir, workspaceRoot, isAbsolute);
  const effectiveSplitDbErrors =
    options?.splitDbErrors && options.splitDbErrors.length > 0
      ? options.splitDbErrors
      : ((session.errors || []) as SplitDbErrorEntry[]);
  const errorBlock = formatSplitDbErrors(effectiveSplitDbErrors, {
    sessionId: session.id,
    workspaceRoot,
  });
  const screenshotsBlock = formatScreenshotsSection(imageRefs);

  const actionableItems: string[] = [
    `1. Pull the latest code (\`git pull\`) and resolve any merge conflicts so the repository is clean before starting.`,
    `2. Read the recorded timeline and screenshots first; reproduce the issue locally if possible before changing code.`,
    `3. Search the codebase for the selectors/components identified in the telemetry to locate the relevant code.`,
    `4. Use relative paths in code and commit messages; never commit absolute local paths.`,
    `5. IMPORTANT: The attached snapshot images are for learning purposes only to understand UI behavior and geometry. NEVER save, copy, move, or commit snapshot images into codebase assets (assets/, src/assets/, public/assets/). Analyze the bug, formulate your fix, and discard/forget the images.`,
    `6. Follow this repo's established data-access and error-handling patterns when writing the fix.`,
  ];

  let currentItemIndex = 7;

  session.events.forEach((evt, idx) => {
    const seqNum = evt.seqNumber ?? (idx + 1);
    const elapsed = evt.elapsedMs;
    const route = evt.route || session.initialRoute;
    const screenName = resolveScreenName(route);
    const cleanLabel = extractCleanElementLabel(evt.targetComponent, evt.description);
    const xpathVal = resolveEventXPath(evt);
    const actionPhrase = formatHumanActionInstruction({
      eventType: evt.eventType,
      cleanLabel,
      targetComponent: evt.targetComponent,
      details: evt.details,
      screenName,
      route,
    });

    const matchedRef = imageRefs.find((r) => r.sequenceNumber === seqNum);
    const evidenceLink = matchedRef
      ? `Evidence: @[${String(seqNum).padStart(2, "0")}_${matchedRef.instanceId}_${matchedRef.actionDescriptor}.png](file;${matchedRef.absolutePath}).`
      : evt.hasScreenshot
        ? `Evidence: @[${String(seqNum).padStart(2, "0")}_${evt.eventType}_${cleanLabel}.png](file;${workspaceRoot || getWorkspaceRoot()}/.logs/recorded-bugs/${session.id}/screenshots/${String(seqNum).padStart(2, "0")}_${evt.eventType}_${cleanLabel}.png).`
        : "";

    const instruction = formatStepInstruction({
      seqNumber: seqNum,
      elapsedMs: elapsed,
      screenName,
      route,
      actionPhrase,
      xpath: xpathVal,
      evidenceLink: evidenceLink ? evidenceLink.replace(/^Evidence:\s*/, "").replace(/\.$/, "") : undefined,
    });

    actionableItems.push(`${currentItemIndex}. ${instruction}`);
    currentItemIndex += 1;
  });

  if (effectiveSplitDbErrors.length > 0) {
    const errSummaries = effectiveSplitDbErrors
      .slice(0, 5)
      .map((e) => `[${e.code || "ERR"}] ${e.message || "Unknown"} (Trigger: ${e.triggerComponent || "N/A"})`)
      .join("; ");

    actionableItems.push(
      `${currentItemIndex}. Resolve the active runtime errors captured during this recording: ${errSummaries}.`,
    );

    currentItemIndex += 1;
  }

  actionableItems.push(
    `${currentItemIndex}. Commit and finalize all verified fixes with a clear message referencing "${slug}".`,
  );

  return `# ${title}: high priority instruction, non-negotiable task

${description}

**Navigation Path:** ${navPath}
**Observed Behavior:** ${actual}
**Expected Behavior:** ${expected}

## task: ${title}
## slug: ${slug}

# Actionable Items Must Follow Non-Negotiable

${actionableItems.join("\n")}

## Sequential Event Timeline & UI Telemetry

${telemetryTable}

## Visual Evidence & Diagnostic Screenshots

${screenshotsBlock}

## Active Runtime Diagnostics

${errorBlock}

## Session Reference

- **Session ID:** \`${session.id}\`
- **Backend:** this session was auto-saved to the LetsMarkNow backend (\`GET /bug-reports/sessions/${session.id}\`) with the full event timeline, screenshots and error history.

## Hand off to your AI coding assistant

Paste this prompt into your AI coding assistant together with the exported ZIP bundle (\`AI_BUG_REPORT.md\`, \`session.json\`, \`screenshots/\`). Ask it to diagnose the defect from the timeline and evidence, then review the proposed fix before committing.

## Additional Instructions

- Reproduce the issue first when possible; verify the fix against the recorded steps.
- Only add relative paths, never absolute paths, during work and in commit messages.
`;
}
