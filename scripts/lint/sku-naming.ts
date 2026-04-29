#!/usr/bin/env tsx
/**
 * sku-naming — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1`):
 *   Disallows the `_annual` SKU suffix anywhere in `spec/21-app/`.
 *   Canonical period suffix is `_yearly` (W-6 lock, closed 2026-04-19).
 *   Source of truth: `10-licensing-billing/15-sku-map.md`.
 *
 * Allowlist: `scripts/lint/sku-naming.allowlist.txt` — file-level exemption for files
 * that legitimately quote `_annual` while documenting the lock (audit history,
 * closure notes, linter rule definition, template anti-pattern checklist).
 *
 * Output: `{file}:{line}:{col} [sku-naming] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/sku-naming.allowlist.txt';

// `_annual` with word boundary on the right. Left side intentionally permissive
// so we catch `pro_annual`, `team_annual`, `lifetime_pro_annual`, etc. — any SKU
// using the rejected suffix.
const FORBIDDEN_RE = /_annual\b/;

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
  if (allowlist.has(rel)) continue;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FORBIDDEN_RE);
    if (m) {
      violations.push({
        file: rel,
        line: i + 1,
        col: (m.index ?? 0) + 1,
        message: `forbidden SKU suffix "_annual" — use "_yearly" per W-6 lock (source: 10-licensing-billing/15-sku-map.md)`,
      });
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [sku-naming] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log(`sku-naming: clean`);
