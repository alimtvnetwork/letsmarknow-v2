import { RecorderEventType } from "./types";
import {
  ROUTE_SCREEN_NAMES,
  resolveScreenName,
} from "./screen-names";

export {
  type SplitDbErrorEntry,
  type SplitDbErrorSummary,
  type FormatSplitDbErrorsOptions,
  formatScreenshotsSection,
  formatSplitDbErrors,
  formatTelemetryTable,
} from "./prompt-table-formatter";

export {
  isDynamicId,
  resolveEventXPath,
} from "./prompt-xpath-resolver";

export interface HumanActionInstructionParams {
  eventType: string;
  cleanLabel: string;
  targetComponent?: string;
  details?: Record<string, unknown>;
  screenName?: string;
  route?: string;
}

export interface FormatStepInstructionParams {
  seqNumber: number;
  elapsedMs: number;
  screenName: string;
  route: string;
  actionPhrase: string;
  xpath: string;
  evidenceLink?: string;
}

export function extractCleanElementLabel(
  rawTarget?: string | null,
  description?: string,
): string {
  if (!rawTarget || rawTarget === "unknown") {
    if (description) {
      const descMatch = description.match(
        /(?:clicked|hovered|entered|dragged)\s+(?:on\s+)?(?:the\s+)?(?:button\s+|input\s+|element\s+)?["']?([^"']+)["']?/i,
      );

      if (descMatch && descMatch[1]) {
        return descMatch[1].replace(/\s+button$/i, "").trim();
      }
    }

    return "Element";
  }

  const autoNameMatch = rawTarget.match(/\[data-automation-name=['"]([^'"]+)['"]\]/);

  if (autoNameMatch && autoNameMatch[1].trim()) {
    return autoNameMatch[1].trim().slice(0, 40);
  }

  const strippedTags = rawTarget.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const isNoisyDiv = /^div\s+/i.test(strippedTags) && strippedTags.split(/\s+/).length > 2;
  const textWithoutBrackets = strippedTags.replace(/\[[^\]]+\]/g, "").trim();
  const quotedMatch = textWithoutBrackets.match(/["']([^"']+)["']/);

  if (quotedMatch && quotedMatch[1].trim().length > 0 && !/^\d+$/.test(quotedMatch[1].trim())) {
    return quotedMatch[1].trim().slice(0, 30);
  }

  const labelBeforeBracket = textWithoutBrackets
    .replace(/\s*\([^)]*\)\s*/g, "")
    .replace(/^Button\s+/i, "")
    .replace(/\s+Button$/i, "")
    .trim();

  if (labelBeforeBracket && !/^\d+$/.test(labelBeforeBracket) && !isNoisyDiv) {
    return labelBeforeBracket.slice(0, 30);
  }

  const autoMatch = rawTarget.match(/\[data-automation-id=['"]([^'"]+)['"]\]/);

  if (autoMatch) {
    return autoMatch[1]
      .replace(/^(?:btn|link|card|cell|panel|screen)-/i, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .slice(0, 40);
  }

  const testIdMatch = rawTarget.match(/\[data-(?:testid|tour)=['"]([^'"]+)['"]\]/);

  if (testIdMatch) {
    return testIdMatch[1].replace(/[-_]+/g, " ").trim().slice(0, 30);
  }

  const anyQuoted = strippedTags.match(/["']([^"']+)["']/);

  if (anyQuoted && anyQuoted[1].trim().length > 0 && !/^\d+$/.test(anyQuoted[1].trim())) {
    return anyQuoted[1].trim().slice(0, 30);
  }

  if (description) {
    const descMatch = description.match(
      /(?:clicked|hovered|entered|dragged)\s+(?:on\s+)?(?:the\s+)?(?:button\s+|input\s+|element\s+)?["']?([^"']+)["']?/i,
    );

    if (descMatch && descMatch[1]) {
      const extracted = descMatch[1].replace(/\s+button$/i, "").trim();

      if (extracted.length > 0 && !/^\d+$/.test(extracted)) {
        return extracted.slice(0, 30);
      }
    }
  }

  if (!isNoisyDiv) {
    const cleanTarget = strippedTags
      .replace(/^Button\s+/i, "")
      .replace(/\s+Button$/i, "")
      .slice(0, 30)
      .trim();

    if (cleanTarget && !/^\d+$/.test(cleanTarget)) {
      return cleanTarget;
    }
  }

  const classMatch = rawTarget.match(/class=["']([^'"]+)["']/);

  if (classMatch && classMatch[1].trim()) {
    const cls = classMatch[1].trim();

    if (!isNoisyDiv && !/^\d+$/.test(cls)) {
      return cls.slice(0, 30);
    }
  }

  return "Element";
}

export function resolveComponentType(
  targetComponent?: string,
  cleanLabel?: string,
): string {
  const combined = `${targetComponent || ""} ${cleanLabel || ""}`.toLowerCase();

  if (combined.includes("button") || combined.includes("btn")) {
    return "button";
  }

  if (combined.includes("input") || combined.includes("field") || combined.includes("text")) {
    return "input field";
  }

  if (combined.includes("tab")) {
    return "tab";
  }

  if (combined.includes("checkbox") || combined.includes("check")) {
    return "checkbox";
  }

  if (combined.includes("switch") || combined.includes("toggle")) {
    return "toggle";
  }

  if (combined.includes("select") || combined.includes("dropdown")) {
    return "dropdown";
  }

  if (combined.includes("link")) {
    return "link";
  }

  if (combined.includes("roi") || combined.includes("handle") || combined.includes("region")) {
    return "region handle";
  }

  return "element";
}

export function stripTrailingNoun(label: string, noun: string): string {
  const nounLower = noun.toLowerCase();
  const labelLower = label.toLowerCase();

  if (labelLower.endsWith(` ${nounLower}`)) {
    return label.slice(0, -(nounLower.length + 1)).trim();
  }

  if (labelLower.endsWith(nounLower)) {
    const trimmed = label.slice(0, -nounLower.length).trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return label;
}

export function formatHumanActionInstruction(params: HumanActionInstructionParams): string {
  const { eventType, cleanLabel, targetComponent, details, screenName, route } = params;
  const lowerType = (eventType || "").toLowerCase();
  const rawComponentType = resolveComponentType(targetComponent, cleanLabel);

  if (
    lowerType === RecorderEventType.Navigation ||
    lowerType === "navigation" ||
    lowerType === "nav"
  ) {
    const targetRoute =
      (details?.toRoute as string) ||
      (details?.route as string) ||
      route;

    const resolvedScreen =
      screenName ||
      (targetRoute ? resolveScreenName(targetRoute) : "") ||
      (cleanLabel && cleanLabel !== "Element"
        ? (ROUTE_SCREEN_NAMES[cleanLabel] ? resolveScreenName(cleanLabel) : cleanLabel)
        : "Home Hub");

    return `navigate to '${resolvedScreen}'`;
  }

  const normalizedLabel = stripTrailingNoun(cleanLabel, rawComponentType);

  if (lowerType === "click") {
    return `click on the '${normalizedLabel}' ${rawComponentType}`;
  }

  if (lowerType === "input" || lowerType === "change") {
    const value = (details?.value as string) || "";

    if (value) {
      return `enter "${value}" into the '${normalizedLabel}' input field`;
    }

    return `enter text into the '${normalizedLabel}' field`;
  }

  if (lowerType === "roi_drag") {
    const handle = (details?.handle as string) || "boundary";

    return `drag ${handle} of the '${normalizedLabel}' region`;
  }

  if (lowerType === "hover") {
    return `hover over the '${normalizedLabel}' element`;
  }

  return `interact with '${normalizedLabel}'`;
}

export function formatStepInstruction(params: FormatStepInstructionParams): string {
  const seq = `#${String(params.seqNumber).padStart(2, "0")}`;
  const elapsed = `+${params.elapsedMs}ms`;
  const evidencePart = params.evidenceLink ? ` Evidence: ${params.evidenceLink}.` : "";

  return `${seq} (${elapsed}): On ${params.screenName} (route: \`${params.route}\`), ${params.actionPhrase} (XPath: \`${params.xpath}\`).${evidencePart}`;
}

export function formatRouteNavigationPath(routes: readonly string[]): string {
  if (!routes || routes.length === 0) {
    return "From /";
  }

  const filtered = routes.filter((r) => Boolean(r && r.trim()));

  if (filtered.length === 0) {
    return "From /";
  }

  if (filtered.length === 1) {
    return `From ${filtered[0]}`;
  }

  return `From ${filtered.join(" -> ")}`;
}
