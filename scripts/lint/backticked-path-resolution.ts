#!/usr/bin/env tsx
/**
 * backticked-path-resolution — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1` row): every backticked
 * markdown-path string in spec/21-app prose resolves to an existing file.
 *
 * Why: link-check covers `[text](path)` markdown links, but the corpus's
 * primary cross-ref convention is backticked path strings in prose like
 * `` `06-ui-ux/01-design-tokens.md` `` (per Session 27 link-check discovery
 * note). Session 36 surfaced a dangling `02-keyboard-shortcuts.md` ref that
 * sat undetected since the Next feature was specced — proving the gap.
 *
 * What's checked:
 *   - Backtick spans containing a path that ends in `.md` (with `/` segments
 *     or as a bare basename), optionally followed by `#anchor`.
 *   - Resolution candidates (any one passing → OK):
 *       (a) relative to the referencing file's directory
 *       (b) relative to spec root (`spec/21-app/`)
 *   - Fenced code blocks (```...```) are skipped — paths inside code are
 *     illustrative, not navigational.
 *   - Markdown link bodies `[text](path)` are stripped before scanning to
 *     avoid double-reporting (link-check owns those).
 *   - Inline code that is clearly not a path (no `/`, no recognizable
 *     `.md` shape after section-stripping) is naturally not matched by the
 *     regex.
 *
 * Allowlist: `scripts/lint/backticked-path-resolution.allowlist.txt`
 *   - File-level entry (whole file): `spec/21-app/path/to/file.md`
 *   - Per-occurrence entry: `spec/21-app/path/to/file.md:`<target>``
 *
 * Output: `{file}:{line}:{col} [backticked-path-resolution] {message}`.
 * Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/backticked-path-resolution.allowlist.txt';

// Match a backtick span containing a markdown path. The path:
//   - may start with `./`, `../`, etc.
//   - may have directory segments
//   - ends in `.md`
//   - may carry an optional `#anchor`
// Excludes whitespace and additional backticks inside the span.
const RE = /`((?:\.{1,2}\/)*(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.md)(?:#[A-Za-z0-9_-]+)?`/g;

type Violation = { file: string; line: number; col: number; message: string };
const violations: Violation[] = [];

function loadAllowlist(): { files: Set<string>; pairs: Set<string> } {
  const files = new Set<string>();
  const pairs = new Set<string>();
  if (!existsSync(ALLOWLIST_PATH)) return { files, pairs };
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    // Per-occurrence entries take the form: <file>:`<target>`
    const m = t.match(/^(.+?):`([^`]+)`$/);
    if (m) pairs.add(`${m[1]}:${m[2]}`);
    else files.add(t);
  }
  return { files, pairs };
}
const allow = loadAllowlist();

function* walk(dir: string): Generator<string> {
  for (const n of readdirSync(dir).sort()) {
    if (n.startsWith('.')) continue;
    const f = join(dir, n);
    const st = statSync(f);
    if (st.isDirectory()) yield* walk(f);
    else if (n.endsWith('.md')) yield f;
  }
}

let scannedFiles = 0;
let checkedRefs = 0;

for (const path of walk(ROOT)) {
  scannedFiles++;
  const rel = relative('.', path);
  if (allow.files.has(rel)) continue;

  const fileDir = dirname(path);
  const lines = readFileSync(path, 'utf8').split('\n');

  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Strip markdown link bodies — link-check owns those.
    const stripped = line.replace(/!?\[[^\]]*\]\([^)]*\)/g, (m) => ' '.repeat(m.length));

    const re = new RegExp(RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(stripped)) !== null) {
      const target = m[1];
      checkedRefs++;
      const pairKey = `${rel}:${target}`;
      if (allow.pairs.has(pairKey)) continue;

      const candidates = [
        resolve(fileDir, target),
        resolve(ROOT, target),
      ];
      if (candidates.some((c) => existsSync(c))) continue;

      violations.push({
        file: rel,
        line: i + 1,
        col: m.index + 1,
        message: `unresolved backticked path: \`${target}\` (tried relative to file dir and spec root)`,
      });
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col} [backticked-path-resolution] ${v.message}`);
}

if (violations.length > 0) {
  console.error(
    `\n${violations.length} unresolved backticked path(s) across ${scannedFiles} files (${checkedRefs} refs checked)`,
  );
  process.exit(1);
}
console.log(
  `backticked-path-resolution: clean — ${checkedRefs} backticked paths resolved across ${scannedFiles} files`,
);
