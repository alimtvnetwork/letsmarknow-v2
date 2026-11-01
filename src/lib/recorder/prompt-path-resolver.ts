import type { CapturedScreenshot, RecorderSession } from "./types";

export interface PromptImageRef {
  sequenceNumber: number;
  instanceId: string;
  actionDescriptor: string;
  absolutePath: string;
  relativePath?: string;
  dataUrl?: string;
  fullScreenPath?: string;
  elementCropPath?: string;
}

export interface DiscreteIdeImageLinkParams {
  sequenceNumber: number;
  instance: string;
  what: string;
  sessionId: string;
  baseDir?: string;
  workspaceRoot?: string;
  isAbsolute?: boolean;
}

export function sanitizeIdentifier(text: string): string {
  const sanitized = text
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return sanitized || "item";
}

export function sanitizeSlug(title: string): string {
  const withoutPrefix = title
    .toLowerCase()
    .replace(/^(\d{1,3}[-_.\s]+)+/, "");

  const cleaned = withoutPrefix
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return cleaned || "task";
}

export function normalizeRelativePath(rawPath: string): string {
  return rawPath
    .replace(/\\/g, "/")
    .replace(/^[a-zA-Z]:[\/\\]/, "")
    .replace(/^\/+/, "");
}

/**
 * Resolves the current workspace/repository root.
 *
 * LetsMarkNow port: this code always runs in the browser, where there is no
 * local workspace root, so it returns "" unless an explicit root is passed.
 * (cat-my-v12 probed process.env.PWD / process.cwd() / window globals here —
 * that Windows/desktop logic is intentionally removed.)
 */
export function getWorkspaceRoot(explicitRoot?: string): string {
  if (explicitRoot && explicitRoot.trim().length > 0) {
    return explicitRoot.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  }

  return "";
}

/**
 * Resolves the task database path.
 *
 * LetsMarkNow port: sessions are persisted to the LetsMarkNow backend, not a
 * local SQLite file. Kept as a documented no-op returning a relative name so
 * prompt templates can still reference the concept.
 */
export function getAppDbPath(dbName = "task.db"): string {
  return dbName;
}

/**
 * Converts any relative or partial path to a clean forward-slash path.
 *
 * LetsMarkNow port: the old Windows drive-letter/backslash absolutization is
 * removed — browser code has no local disk to resolve against.
 */
export function ensureAbsoluteWindowsPath(p: string, workspaceRoot?: string): string {
  const clean = (p || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  const root = getWorkspaceRoot(workspaceRoot);

  if (root && !clean.startsWith(root)) {
    return `${root}/${clean}`.replace(/\/+/g, "/");
  }

  return clean;
}

/**
 * Converts an absolute or partial path back to a clean relative forward-slash Git path.
 */
export function toRelativeWorkspacePath(p: string, workspaceRoot?: string): string {
  if (!p) {
    return "";
  }

  const clean = p.trim().replace(/\\/g, "/");
  const root = getWorkspaceRoot(workspaceRoot);

  if (!root) {
    return clean.replace(/^\.\//, "").replace(/^\/+/, "");
  }

  const rootPosix = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const rootWithoutDrive = rootPosix.replace(/^[A-Za-z]:/, "");

  if (clean.toLowerCase().startsWith(rootPosix.toLowerCase())) {
    return clean.slice(rootPosix.length).replace(/^\/+/, "");
  }

  if (rootWithoutDrive && clean.toLowerCase().startsWith(rootWithoutDrive.toLowerCase())) {
    return clean.slice(rootWithoutDrive.length).replace(/^\/+/, "");
  }

  return clean.replace(/^\.\//, "");
}

export function formatDiscreteIdeImageLink(params: DiscreteIdeImageLinkParams): string {
  const seq = String(params.sequenceNumber).padStart(2, "0");
  const instance = sanitizeIdentifier(params.instance || "snap");
  const what = sanitizeIdentifier(params.what || "target");
  const fileName = `${seq}_${instance}_${what}.png`;

  const folder = (params.baseDir
    ? ensureAbsoluteWindowsPath(params.baseDir)
    : ensureAbsoluteWindowsPath(`.logs/recorded-bugs/${params.sessionId}`, params.workspaceRoot)
  ).replace(/\\/g, "/").replace(/\/+$/, "");
  const absPath = `${folder}/screenshots/${fileName}`;
  const relPath = `.logs/recorded-bugs/${params.sessionId}/screenshots/${fileName}`;
  const targetPath = params.isAbsolute === false ? relPath : absPath;

  return `@[${fileName}](file;${targetPath})`;
}

export function formatDiagnosticEvidenceLink(
  snapTitle: string,
  index: number,
  eventType: string,
  sessionId: string,
  baseDir?: string,
  workspaceRoot?: string,
  isAbsolute?: boolean,
): string {
  const seq = String(index + 1).padStart(2, "0");
  const instance = sanitizeIdentifier(eventType || "snap");
  const desc = sanitizeIdentifier(snapTitle || `step_${seq}`);
  const safeFileName = `${seq}_${instance}_${desc}.png`;

  const folder = (baseDir
    ? ensureAbsoluteWindowsPath(baseDir)
    : ensureAbsoluteWindowsPath(`.logs/recorded-bugs/${sessionId}`, workspaceRoot)
  ).replace(/\\/g, "/").replace(/\/+$/, "");
  const absPath = `${folder}/screenshots/${safeFileName}`;
  const relPath = `.logs/recorded-bugs/${sessionId}/screenshots/${safeFileName}`;
  const targetPath = isAbsolute === false ? relPath : absPath;

  return `@[${safeFileName}](file;${targetPath})`;
}

export function formatIdeImageLink(ref: PromptImageRef): string {
  const seq = String(ref.sequenceNumber).padStart(2, "0");
  const instance = sanitizeIdentifier(ref.instanceId || "inst01");
  const desc = sanitizeIdentifier(ref.actionDescriptor || "snapshot");
  const fileName = `${seq}_${instance}_${desc}.png`;

  const absPath = ensureAbsoluteWindowsPath(ref.absolutePath || ref.relativePath || fileName)
    .replace(/\\/g, "/");

  return `@[${fileName}](file;${absPath})`;
}

export function resolveImageRefs(
  session: RecorderSession,
  baseDir?: string,
  workspaceRoot?: string,
  isAbsolute?: boolean,
): PromptImageRef[] {
  const sessionId =
    session.id ||
    (session as unknown as { session_id?: string }).session_id ||
    (session as unknown as { sessionId?: string }).sessionId ||
    "session";
  const isAbs = isAbsolute ?? true;
  const folder = (baseDir
    ? ensureAbsoluteWindowsPath(baseDir)
    : ensureAbsoluteWindowsPath(`.logs/recorded-bugs/${sessionId}`, workspaceRoot)
  ).replace(/\\/g, "/").replace(/\/+$/, "");

  return session.screenshots.map((snap, idx) => {
    const seq = snap.seqNumber ?? (idx + 1);
    const seqStr = String(seq).padStart(2, "0");
    const instance = sanitizeIdentifier(snap.source || "inst01");
    const desc = sanitizeIdentifier(snap.title || `step_${seqStr}`);
    const fileName = `${seqStr}_${instance}_${desc}.png`;
    const relPath = `.logs/recorded-bugs/${sessionId}/screenshots/${fileName}`;
    const absPath = `${folder}/screenshots/${fileName}`;

    const fullScreenPath = `${folder}/screenshots/${seqStr}_fullscreen_${desc}.png`;
    const elementCropPath = `${folder}/screenshots/${seqStr}_element_${desc}.png`;

    return {
      sequenceNumber: seq,
      instanceId: instance,
      actionDescriptor: desc,
      absolutePath: isAbs ? absPath : relPath,
      relativePath: relPath,
      dataUrl: snap.dataUrl,
      fullScreenPath,
      elementCropPath,
    };
  });
}
