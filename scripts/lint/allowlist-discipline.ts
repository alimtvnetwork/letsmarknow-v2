#!/usr/bin/env tsx
/**
 * allowlist-discipline — spec-drift sub-check (meta-rule)
 *
 * Enforces §2.1.3 Allowlist Discipline against every `scripts/lint/*.allowlist.txt`.
 *
 * Invariants (from §2.1.1 row + §2.1.3):
 *   (a) Header MUST declare `# linter:`, `# purpose:`, `# review-by:` (any order, contiguous comment block at top).
 *   (b) `# linter:` value MUST match a sub-check name listed in §2.1.1 of `09-ci-cd.md`.
 *   (c) Every non-comment, non-blank line MUST be immediately preceded by a `#` comment carrying
 *       `PR:#<number>` AND `reason:<≥10 chars>`.
 *   (d) ≤ 50 non-comment lines per file.
 *   (e) `# review-by:` ISO date MUST be in the future AND ≤ 180 days from today.
 *   (f) No orphan allowlists: every `*.allowlist.txt` filename stem MUST match a sub-check name in §2.1.1.
 *
 * Output: `{file}:{line}:{col} [allowlist-discipline] {message}`.
 * Exit 0 = clean; exit 1 = violations.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LINT_DIR = 'scripts/lint';
const CI_CD_SPEC = 'spec/21-app/22-infrastructure/09-ci-cd.md';
const MAX_NON_COMMENT_LINES = 50;
const MAX_REVIEW_WINDOW_DAYS = 180;

type Violation = { file: string; line: number; col: number; message: string };
const violations: Violation[] = [];

function v(file: string, line: number, message: string, col = 1) {
  violations.push({ file, line, col, message });
}

/** Extract the set of valid sub-check names from the §2.1.1 table. */
function loadSubcheckNames(): Set<string> {
  const txt = readFileSync(CI_CD_SPEC, 'utf8');
  const names = new Set<string>();
  // Match table rows like: | `name` | ... |
  const rowRe = /^\|\s*`([a-z][a-z0-9-]+)`\s*\|/gm;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(txt)) !== null) {
    names.add(m[1]);
  }
  return names;
}

const subcheckNames = loadSubcheckNames();
if (subcheckNames.size === 0) {
  console.error(`could not extract sub-check names from ${CI_CD_SPEC} §2.1.1`);
  process.exit(2);
}

function parseISODate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function checkFile(path: string, basename: string) {
  const stem = basename.replace(/\.allowlist\.txt$/, '');

  // (f) orphan check
  if (!subcheckNames.has(stem)) {
    v(path, 1, `orphan allowlist: filename stem "${stem}" does not match any sub-check in §2.1.1 table of ${CI_CD_SPEC}`);
    return;
  }

  const lines = readFileSync(path, 'utf8').split('\n');

  // Walk leading contiguous comment block as the "header"
  let headerEnd = 0;
  while (headerEnd < lines.length && (lines[headerEnd].trim().startsWith('#') || lines[headerEnd].trim() === '')) {
    if (lines[headerEnd].trim() === '') break; // header ends at first blank line
    headerEnd++;
  }
  const header = lines.slice(0, headerEnd);

  // (a) required header keys
  const headerText = header.join('\n');
  const linterMatch = headerText.match(/^#\s*linter:\s*(\S+)\s*$/m);
  const purposeMatch = headerText.match(/^#\s*purpose:\s*(.+\S)\s*$/m);
  const reviewMatch = headerText.match(/^#\s*review-by:\s*(\S+)\s*$/m);

  if (!linterMatch) v(path, 1, `header missing "# linter: <name>"`);
  if (!purposeMatch) v(path, 1, `header missing "# purpose: <one-line reason>"`);
  if (!reviewMatch) v(path, 1, `header missing "# review-by: YYYY-MM-DD"`);

  // (b) linter name matches stem AND is in §2.1.1
  if (linterMatch) {
    const declared = linterMatch[1];
    if (declared !== stem) {
      v(path, 1, `header "# linter: ${declared}" does not match filename stem "${stem}"`);
    }
    if (!subcheckNames.has(declared)) {
      v(path, 1, `header "# linter: ${declared}" is not a sub-check in §2.1.1`);
    }
  }

  // (e) review-by window
  if (reviewMatch) {
    const d = parseISODate(reviewMatch[1]);
    if (!d) {
      v(path, 1, `"# review-by: ${reviewMatch[1]}" is not a valid YYYY-MM-DD date`);
    } else {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const days = daysBetween(today, d);
      if (days < 0) {
        v(path, 1, `"# review-by: ${reviewMatch[1]}" is in the past (${-days} days ago) — re-justify and bump`);
      } else if (days > MAX_REVIEW_WINDOW_DAYS) {
        v(path, 1, `"# review-by: ${reviewMatch[1]}" is ${days} days out (max ${MAX_REVIEW_WINDOW_DAYS}) — too far in future`);
      }
    }
  }

  // (c) per-entry justification check + (d) non-comment line cap
  let nonCommentCount = 0;
  for (let i = headerEnd; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (t === '' || t.startsWith('#')) continue;
    nonCommentCount++;

    // Find the most recent preceding non-blank line (must be a comment with PR + reason)
    let j = i - 1;
    while (j >= 0 && lines[j].trim() === '') j--;
    if (j < headerEnd || !lines[j].trim().startsWith('#')) {
      v(path, i + 1, `entry "${t}" has no preceding "# PR:#<n> reason:<text>" comment`);
      continue;
    }
    const c = lines[j];
    const prMatch = c.match(/PR:#(\d+)/);
    const reasonMatch = c.match(/reason:\s*(.+\S)\s*$/);
    if (!prMatch) {
      v(path, j + 1, `justification comment for "${t}" missing "PR:#<number>"`);
    }
    if (!reasonMatch) {
      v(path, j + 1, `justification comment for "${t}" missing "reason:<text>"`);
    } else if (reasonMatch[1].trim().length < 10) {
      v(path, j + 1, `justification reason for "${t}" is ${reasonMatch[1].trim().length} chars (min 10)`);
    }
  }

  // (d) cap
  if (nonCommentCount > MAX_NON_COMMENT_LINES) {
    v(path, 1, `${nonCommentCount} non-comment lines exceeds cap of ${MAX_NON_COMMENT_LINES} — rule needs redesign, not more exceptions`);
  }
}

// Walk scripts/lint/ for *.allowlist.txt
if (!existsSync(LINT_DIR)) {
  console.error(`${LINT_DIR} does not exist`);
  process.exit(2);
}

const files = readdirSync(LINT_DIR).filter(f => f.endsWith('.allowlist.txt')).sort();

if (files.length === 0) {
  console.log(`allowlist-discipline: clean (no allowlist files yet — schema dormant)`);
  process.exit(0);
}

for (const f of files) {
  checkFile(join(LINT_DIR, f), f);
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const x of violations) {
  console.log(`${x.file}:${x.line}:${x.col} [allowlist-discipline] ${x.message}`);
}
if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${files.length} allowlist file(s)`);
  process.exit(1);
}
console.log(`allowlist-discipline: clean — ${files.length} allowlist file(s) validated against ${subcheckNames.size} known sub-checks`);
