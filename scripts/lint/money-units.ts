#!/usr/bin/env tsx
/**
 * money-units — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1`):
 *   Disallows `amount_minor`, `amount_in_cents`, `priceInCents`, `discount_minor`
 *   anywhere in `spec/21-app/`. Only `amount_cents` (and prefixed variants like
 *   `unit_amount_cents`, `discount_cents`, `tax_cents`) is permitted.
 *
 * Locks: W-10 (closed 2026-04-19; sweep across 6 files in 10-licensing-billing/).
 *
 * Allowlist (`scripts/lint/money-units.allowlist.txt`): file paths exempted from rule
 * (typically audit history files that legitimately quote the forbidden terms when
 * documenting the closure of W-10, and template files that list them as anti-patterns).
 *
 * Output: `{file}:{line}:{col} [money-units] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/money-units.allowlist.txt';

// Forbidden terms with word-boundary matching. Case-sensitive — `priceInCents` is
// camelCase JS-style which is itself a smell against snake_case API convention.
const FORBIDDEN: Array<{ term: string; re: RegExp }> = [
  { term: 'amount_minor', re: /\bamount_minor\b/ },
  { term: 'amount_in_cents', re: /\bamount_in_cents\b/ },
  { term: 'priceInCents', re: /\bpriceInCents\b/ },
  { term: 'discount_minor', re: /\bdiscount_minor\b/ },
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
    if (st.isDirectory()) {
      yield* walkFiles(full);
    } else if (name.endsWith('.md')) {
      yield full;
    }
  }
}

for (const path of walkFiles(ROOT)) {
  const rel = relative('.', path);
  if (allowlist.has(rel)) continue;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const f of FORBIDDEN) {
      const m = lines[i].match(f.re);
      if (m) {
        violations.push({
          file: rel,
          line: i + 1,
          col: (m.index ?? 0) + 1,
          message: `forbidden money-unit term "${f.term}" — use "amount_cents" + explicit "currency" field per W-10 lock (see 03-api-endpoints/01-conventions.md §9)`,
        });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [money-units] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log(`money-units: clean`);
