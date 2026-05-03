#!/usr/bin/env tsx
/**
 * ulid-placeholder — spec-drift sub-check
 *
 * Bans ULID-shaped placeholders (`01J...`, `01H...`, `01K...` etc — Crockford
 * base32 starting with `01[A-Z]`) anywhere in `spec/21-app/`. Locked Core rule:
 * "Identifiers: UUIDv7 everywhere. Never ULID."
 *
 * Canonical placeholder is the UUIDv7 stub `0190a4f1-6c5e-7c2a-9b3f-1234567890ab`.
 *
 * Allowlist (`scripts/lint/ulid-placeholder.allowlist.txt`):
 *   - audit reports that *describe* the violation (`23-audits/`)
 *   - the issue tracker rows that catalogue it (`13-spec-issues/02-current-issues.md`)
 *   - the conversation log historical entries
 *   - the spec-issue-tracker memory mirror
 *
 * Output: `{file}:{line} [ulid-placeholder] {message}`
 * Exit 0 = clean; exit 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/ulid-placeholder.allowlist.txt';
// Matches ULID placeholders like `"01J..."` or `[01J...]` — must be preceded by
// a quote, bracket, paren, comma, space, or line start so ISO timestamps such
// as `"2026-04-01T..."` are not flagged (the `-` before `01T` would otherwise match `\b`).
const PATTERN = /(^|["'\[\(,\s])01[A-HJ-NP-Z]\.{3}/;

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  return new Set(
    readFileSync(ALLOWLIST_PATH, 'utf8')
      .split('\n')
      .map((l) => l.split('#')[0].trim())
      .filter(Boolean),
  );
}

const allowlist = loadAllowlist();
let violations = 0;

function walk(dir: string): void {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
      continue;
    }
    if (!name.endsWith('.md') && !name.endsWith('.mmd')) continue;
    if (allowlist.has(p)) continue;
    const lines = readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (PATTERN.test(line)) {
        console.log(`${p}:${i + 1} [ulid-placeholder] ULID-shaped placeholder forbidden; use UUIDv7 stub \`0190a4f1-6c5e-7c2a-9b3f-1234567890ab\``);
        violations++;
      }
    });
  }
}

walk(ROOT);
process.exit(violations > 0 ? 1 : 0);
