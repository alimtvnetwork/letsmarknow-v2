#!/usr/bin/env tsx
/**
 * folder-overview — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1` row F-FOLDER-OVERVIEW):
 *   Every directory under `spec/21-app/` (recursive, excluding hidden + `templates/`) MUST contain
 *   a file named exactly `00-overview.md` with:
 *     - ≥ 40 lines (proxy for "not a stub")
 *     - The 5 required headings:
 *         `## 1. Responsibilities`
 *         `## 2. File-by-file behaviour` (or `behavior`)
 *         `## 3. Tasks performed by this folder`
 *         `## 4. What this folder is NOT`
 *         `## 5. Cross-references`
 *
 * Allowlist: `scripts/lint/folder-overview.allowlist.txt` (folders explicitly exempt).
 * `spec/21-app/templates/` is auto-exempt as a non-domain folder.
 *
 * Output: `{file}:{line}:{col} [folder-overview] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/folder-overview.allowlist.txt';
const MIN_LINES = 40;

const REQUIRED_HEADINGS: Array<{ label: string; re: RegExp }> = [
  { label: '## 1. Responsibilities', re: /^##\s+1\.\s+Responsibilities\s*$/m },
  { label: '## 2. File-by-file behaviour|behavior', re: /^##\s+2\.\s+File-by-file\s+behaviou?r\s*$/m },
  { label: '## 3. Tasks performed by this folder', re: /^##\s+3\.\s+Tasks\s+performed\s+by\s+this\s+folder\s*$/m },
  { label: '## 4. What this folder is NOT', re: /^##\s+4\.\s+What\s+this\s+folder\s+is\s+NOT\s*$/m },
  { label: '## 5. Cross-references', re: /^##\s+5\.\s+Cross-references\s*$/m },
];

type Violation = { file: string; line: number; col: number; message: string };
const violations: Violation[] = [];

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    out.add(t);
  }
  return out;
}
const allowlist = loadAllowlist();

function checkFolder(dir: string): void {
  const rel = relative('.', dir);
  if (allowlist.has(rel)) return;
  const overview = join(dir, '00-overview.md');
  if (!existsSync(overview)) {
    violations.push({ file: rel, line: 1, col: 1, message: `missing 00-overview.md` });
    return;
  }
  const txt = readFileSync(overview, 'utf8');
  const lineCount = txt.split('\n').length;
  if (lineCount < MIN_LINES) {
    violations.push({
      file: relative('.', overview), line: 1, col: 1,
      message: `00-overview.md is ${lineCount} lines (min ${MIN_LINES}) — looks like a stub`,
    });
  }
  for (const h of REQUIRED_HEADINGS) {
    if (!h.re.test(txt)) {
      violations.push({
        file: relative('.', overview), line: 1, col: 1,
        message: `missing required heading "${h.label}"`,
      });
    }
  }
}

function walk(dir: string, isRoot = false): void {
  if (!isRoot) checkFolder(dir);
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    if (name === 'templates') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
  }
}

// Root itself MUST also have an overview (it's a domain folder containing readme.md + 00-overview/ subfolder)
// Per spec wording "Every directory under spec/21-app/ (recursively, excluding hidden dirs and the root itself)",
// we exclude the root from the check.
walk(ROOT, true);

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [folder-overview] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log(`folder-overview: clean`);
