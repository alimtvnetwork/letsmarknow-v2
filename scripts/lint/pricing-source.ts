#!/usr/bin/env tsx
/**
 * pricing-source — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1`):
 *   Every price string (e.g. `$5`, `$48/yr`, `$79 one-time`, `$9/seat/mo`) MUST
 *   appear ONLY in `spec/21-app/10-licensing-billing/01-plans-matrix.md`. Any
 *   other file that needs to reference pricing must link back to the matrix
 *   instead of restating numbers — otherwise drift between sources is inevitable.
 *
 * Locks: W-3 (price single-source-of-truth).
 *
 * Detection: regex `/\$\d+(?:\.\d+)?(?:\/(?:seat\/)?(?:mo|yr|month|year))?\b/`
 *   plus `/\$\d+\s+one-time\b/`. Case-sensitive. Word-bounded right side.
 *
 * Allowlist (`scripts/lint/pricing-source.allowlist.txt`): file paths exempted.
 *   Typical entries: audit history files that quote prices when documenting W-3
 *   closure, conversation log (verbatim user instructions), and the matrix
 *   itself (implicitly — it's the source).
 *
 * Output: `{file}:{line}:{col} [pricing-source] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const SOURCE_OF_TRUTH = 'spec/21-app/10-licensing-billing/01-plans-matrix.md';
const ALLOWLIST_PATH = 'scripts/lint/pricing-source.allowlist.txt';

// Detection limited to *plan-shaped* prices: must carry a billing-cadence suffix
// (`/mo`, `/yr`, `/month`, `/year`, optional `seat/`) OR the `one-time` qualifier.
// Bare amounts (`$10`, `$50`) are out-of-scope — they may be coupon examples,
// fraud thresholds, or illustrative scenarios unrelated to plan SoT.
const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'recurring price', re: /\$\d+(?:\.\d+)?\/(?:seat\/)?(?:mo|yr|month|year)\b/g },
  { name: 'one-time price', re: /\$\d+(?:\.\d+)?\s+one-time\b/g },
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

function* walkFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walkFiles(full);
    else if (name.endsWith('.md')) yield full;
  }
}

for (const path of walkFiles(ROOT)) {
  const rel = relative('.', path);
  if (rel === SOURCE_OF_TRUTH) continue; // matrix is the source — exempt
  if (allowlist.has(rel)) continue;
  const lines = readFileSync(path, 'utf8').split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue; // ASCII wireframes / code blocks may show illustrative prices
    // Skip lines that are clearly link-references back to the matrix
    if (/01-plans-matrix\.md/.test(lines[i])) continue;
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = p.re.exec(lines[i])) !== null) {
        violations.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          message: `${p.name} "${m[0]}" must live only in 10-licensing-billing/01-plans-matrix.md — link to it instead (W-3 lock)`,
        });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [pricing-source] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log(`pricing-source: clean`);
