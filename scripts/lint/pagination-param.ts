#!/usr/bin/env tsx
/**
 * pagination-param — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1`):
 *   Disallows `page_size` and `pageSize` in any `spec/21-app/03-api-endpoints/**` or
 *   `spec/21-app/05-web-app/**` file. Only `limit` permitted.
 *
 * Locks W-13 (closed 2026-04-19; `limit` locked in `01-conventions.md` §5;
 * `page_size` alias withdrawn after fixing `05-web-app/10-activity-feed.md`).
 *
 * Allowlist: `scripts/lint/pagination-param.allowlist.txt` — file-level exemption.
 *
 * Output: `{file}:{line}:{col} [pagination-param] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCOPED_DIRS = [
  'spec/21-app/03-api-endpoints',
  'spec/21-app/05-web-app',
];
const ALLOWLIST_PATH = 'scripts/lint/pagination-param.allowlist.txt';

const FORBIDDEN: Array<{ term: string; re: RegExp }> = [
  { term: 'page_size', re: /\bpage_size\b/ },
  { term: 'pageSize', re: /\bpageSize\b/ },
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
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walkFiles(full);
    else if (name.endsWith('.md')) yield full;
  }
}

let scannedFiles = 0;
for (const root of SCOPED_DIRS) {
  for (const path of walkFiles(root)) {
    scannedFiles++;
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
            message: `forbidden pagination param "${f.term}" — use "limit" per W-13 lock (source: 03-api-endpoints/01-conventions.md §5)`,
          });
        }
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [pagination-param] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${scannedFiles} scoped files`);
  process.exit(1);
}
console.log(`pagination-param: clean — ${scannedFiles} files scanned across 03-api-endpoints/ + 05-web-app/`);
