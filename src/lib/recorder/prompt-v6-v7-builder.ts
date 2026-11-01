import type {
  BugReportSummary,
  RecorderSession,
} from "./types";
import {
  ROUTE_SCREEN_NAMES,
  resolveScreenName,
  formatScreenNavigationPath,
} from "./screen-names";
import {
  type DiscreteIdeImageLinkParams,
  type PromptImageRef,
  ensureAbsoluteWindowsPath,
  formatDiagnosticEvidenceLink,
  formatDiscreteIdeImageLink,
  formatIdeImageLink,
  getAppDbPath,
  getWorkspaceRoot,
  normalizeRelativePath,
  resolveImageRefs,
  sanitizeIdentifier,
  sanitizeSlug,
  toRelativeWorkspacePath,
} from "./prompt-path-resolver";
import {
  type FormatSplitDbErrorsOptions,
  type FormatStepInstructionParams,
  type HumanActionInstructionParams,
  type SplitDbErrorEntry,
  type SplitDbErrorSummary,
  extractCleanElementLabel,
  formatHumanActionInstruction,
  formatRouteNavigationPath,
  formatScreenshotsSection,
  formatSplitDbErrors,
  formatStepInstruction,
  formatTelemetryTable,
  isDynamicId,
  resolveComponentType,
  resolveEventXPath,
  stripTrailingNoun,
} from "./prompt-instruction-formatter";
import {
  type LetterlyPromptOptions,
  generateV6LetterlyPrompt,
} from "./prompt-v6-generator";
import { generateV7LetterlyPrompt } from "./prompt-v7-generator";

export {
  ROUTE_SCREEN_NAMES,
  resolveScreenName,
  formatScreenNavigationPath,
  ensureAbsoluteWindowsPath,
  formatDiagnosticEvidenceLink,
  formatDiscreteIdeImageLink,
  formatIdeImageLink,
  getAppDbPath,
  getWorkspaceRoot,
  normalizeRelativePath,
  resolveImageRefs,
  sanitizeIdentifier,
  sanitizeSlug,
  toRelativeWorkspacePath,
  extractCleanElementLabel,
  formatHumanActionInstruction,
  formatRouteNavigationPath,
  formatScreenshotsSection,
  formatSplitDbErrors,
  formatStepInstruction,
  formatTelemetryTable,
  isDynamicId,
  resolveComponentType,
  resolveEventXPath,
  stripTrailingNoun,
  generateV6LetterlyPrompt,
  generateV7LetterlyPrompt,
};

export type {
  DiscreteIdeImageLinkParams,
  PromptImageRef,
  FormatSplitDbErrorsOptions,
  FormatStepInstructionParams,
  HumanActionInstructionParams,
  SplitDbErrorEntry,
  SplitDbErrorSummary,
  LetterlyPromptOptions,
};

export type PromptOptions = LetterlyPromptOptions;
export type RecordingSession = RecorderSession;

export enum LetterlyPromptVersion {
  V6 = "V6",
  V7 = "V7",
}

export interface PromptBuilderParams {
  session: RecorderSession;
  options?: LetterlyPromptOptions;
  summary?: BugReportSummary;
  splitDbErrors?: SplitDbErrorEntry[];
  baseDir?: string;
  workspaceRoot?: string;
  isAbsolute?: boolean;
  isTimeRestricted?: boolean;
  targetTimezone?: string;
  botAgentName?: string;
}

export interface BuildPromptParams {
  version: LetterlyPromptVersion;
  session: RecorderSession;
  options?: PromptOptions;
}

export const buildV6LetterlyPrompt = generateV6LetterlyPrompt;
export const buildV7LetterlyPrompt = generateV7LetterlyPrompt;

export const buildV6Prompt = (params: PromptBuilderParams): string => {
  return generateV6LetterlyPrompt(params.session, {
    summary: params.summary || params.options?.summary,
    splitDbErrors: params.splitDbErrors || params.options?.splitDbErrors,
    baseDir: params.baseDir || params.options?.baseDir,
    isTimeRestricted: params.isTimeRestricted || params.options?.isTimeRestricted,
    targetTimezone: params.targetTimezone || params.options?.targetTimezone,
    botAgentName: params.botAgentName || params.options?.botAgentName,
  });
};

export const buildV7Prompt = (params: PromptBuilderParams): string => {
  return generateV7LetterlyPrompt(params.session, {
    summary: params.summary || params.options?.summary,
    splitDbErrors: params.splitDbErrors || params.options?.splitDbErrors,
    baseDir: params.baseDir || params.options?.baseDir,
    isTimeRestricted: params.isTimeRestricted || params.options?.isTimeRestricted,
    targetTimezone: params.targetTimezone || params.options?.targetTimezone,
    botAgentName: params.botAgentName || params.options?.botAgentName,
  });
};
