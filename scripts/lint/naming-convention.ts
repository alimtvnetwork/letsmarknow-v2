#!/usr/bin/env tsx
/**
 * naming-convention — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1`):
 *   (a) Every file under a numbered domain folder matches `^(\d{2})-[a-z0-9-]+\.md$`.
 *   (b) Folder index is exactly `readme.md` (lowercase).
 *   (c) Sequence numbers are contiguous within each folder (no gaps, no duplicates).
 *
 * Scope: `spec/21-app/` recursively. Excludes `templates/` and `.lovable/`-style hidden dirs.
 *
 * Output: `{file}:{line}:{col} [naming-convention] {message}` — one violation per line.
 * Exit 0 = clean; exit 1 = violations.
 *
 * Allowlist (`scripts/lint/naming-convention.allowlist.txt`): paths exempted from rule (a).
 * The legacy un-prefixed files `flow-diagrams-index.md` (root) and `flow-diagram.mmd`
 * (per-folder) are recognized via allowlist, not hard-coded exceptions.
 *
 * Top-level numbering note: `spec/21-app/` itself jumps 20→22 (no `21-*` folder)
 * because `21-app` IS the slot. This is intentional and the contiguity check at the
 * root level treats the missing 21 as a documented exception via allowlist.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/naming-convention.allowlist.txt';
const FILE_RE = /^(\d{2})-[a-z0-9-]+\.md$/;
const DIR_RE = /^(\d{2})-[a-z0-9-]+$/;

type Violation = { file: string; line: number; col: number; message: string };
const violations: Violation[] = [];

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const lines = readFileSync(ALLOWLIST_PATH, 'utf8').split('\n');
  const out = new Set<string>();
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    out.add(t);
  }
  return out;
}

const allowlist = loadAllowlist();

function isHidden(name: string): boolean {
  return name.startsWith('.');
}

function walk(dir: string): void {
  const entries = readdirSync(dir).sort();
  const fileNumbers = new Map<number, string>(); // num -> filename (for dup detection)
  const dirNumbers = new Map<number, string>();
  let hasReadme = false;
  let hasZeroZeroOverview = false;

  for (const name of entries) {
    const full = join(dir, name);
    const rel = relative('.', full);
    const st = statSync(full);

    if (st.isDirectory()) {
      if (isHidden(name)) continue;
      if (name === 'templates') continue; // non-domain folder
      if (allowlist.has(rel)) continue; // allowlisted non-domain folder; skip recursion + naming check
      const m = name.match(DIR_RE);
      if (m) {
        const n = parseInt(m[1], 10);
        if (dirNumbers.has(n)) {
          violations.push({
            file: rel, line: 1, col: 1,
            message: `duplicate folder sequence number ${m[1]} (also: ${dirNumbers.get(n)})`,
          });
        }
        dirNumbers.set(n, name);
      } else if (name !== 'node_modules') {
        violations.push({
          file: rel, line: 1, col: 1,
          message: `directory name "${name}" does not match ^\\d{2}-[a-z0-9-]+$`,
        });
      }
      walk(full);
      continue;
    }

    // file
    if (name === 'readme.md') { hasReadme = true; continue; }
    if (name === 'README.md' || name === 'Readme.md') {
      violations.push({
        file: rel, line: 1, col: 1,
        message: `folder index must be lowercase "readme.md", found "${name}"`,
      });
      continue;
    }

    if (allowlist.has(rel)) continue;

    const m = name.match(FILE_RE);
    if (!m) {
      // Only flag .md files; allow .mmd, .png, etc. (diagrams) silently
      if (name.endsWith('.md')) {
        violations.push({
          file: rel, line: 1, col: 1,
          message: `filename does not match ^\\d{2}-[a-z0-9-]+\\.md$`,
        });
      }
      continue;
    }

    const n = parseInt(m[1], 10);
    if (n === 0 && name === '00-overview.md') hasZeroZeroOverview = true;
    if (fileNumbers.has(n)) {
      violations.push({
        file: rel, line: 1, col: 1,
        message: `duplicate file sequence number ${m[1]} (also: ${fileNumbers.get(n)})`,
      });
    }
    fileNumbers.set(n, name);
  }

  // Contiguity check for files: sequence must be 00, 01, 02, ... with no gaps
  // (allow gaps documented in allowlist as `<dir>:gap:NN`)
  const fileNums = [...fileNumbers.keys()].sort((a, b) => a - b);
  if (fileNums.length > 0) {
    const min = fileNums[0];
    const max = fileNums[fileNums.length - 1];
    for (let i = min; i <= max; i++) {
      if (!fileNumbers.has(i)) {
        const gapKey = `${relative('.', dir)}:gap:${String(i).padStart(2, '0')}`;
        if (allowlist.has(gapKey)) continue;
        violations.push({
          file: relative('.', dir), line: 1, col: 1,
          message: `gap in file sequence: missing ${String(i).padStart(2, '0')}-* (range ${String(min).padStart(2, '0')}..${String(max).padStart(2, '0')})`,
        });
      }
    }
  }

  // Contiguity check for subdirectories
  const dirNums = [...dirNumbers.keys()].sort((a, b) => a - b);
  if (dirNums.length > 0) {
    const min = dirNums[0];
    const max = dirNums[dirNums.length - 1];
    for (let i = min; i <= max; i++) {
      if (!dirNumbers.has(i)) {
        const gapKey = `${relative('.', dir)}:dirgap:${String(i).padStart(2, '0')}`;
        if (allowlist.has(gapKey)) continue;
        violations.push({
          file: relative('.', dir), line: 1, col: 1,
          message: `gap in folder sequence: missing ${String(i).padStart(2, '0')}-* (range ${String(min).padStart(2, '0')}..${String(max).padStart(2, '0')})`,
        });
      }
    }
  }
}

walk(ROOT);

// Sort + emit
violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col} [naming-convention] ${v.message}`);
}

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log(`naming-convention: clean`);
