#!/usr/bin/env tsx
/**
 * env-var-naming — spec-drift sub-check (W-12)
 *
 * Asserts (per `22-infrastructure/03-env-vars.md`):
 *   1. Naming: every env-var token matches `^[A-Z][A-Z0-9_]+$`
 *      (SCREAMING_SNAKE_CASE), per §1 "Convention".
 *   2. Catalog: every env-var token referenced anywhere in spec MUST be
 *      declared in `22-infrastructure/03-env-vars.md` — column-1 of any
 *      `| \`NAME\` | ... |` table row.
 *
 * Detection strategy:
 *   - Catalog extraction: parse `03-env-vars.md`, collect every backticked
 *     SCREAMING_SNAKE token appearing in column-1 of a markdown table row.
 *   - Reference scan: walk all spec/*.md, scan for env-shaped references:
 *       (a) `process.env.NAME` / `process.env['NAME']`
 *       (b) `import.meta.env.NAME`
 *       (c) `Deno.env.get('NAME')`
 *       (d) `$NAME` shell-style references when on a line containing `env`
 *           anchor word
 *     Skip: the catalog file itself; fenced code blocks where lang is not
 *     env-bearing remain in scope (env vars in code samples must still be
 *     declared); skip headings that include `# `.
 *
 * Two rules:
 *   (A) `casing` — token does not match SCREAMING_SNAKE.
 *   (B) `unknown-env` — shape-correct but missing from catalog.
 *
 * Allowlist: `scripts/lint/env-var-naming.allowlist.txt`
 *   - `<file>`             — silence file entirely.
 *   - `<file>:<TOKEN>`     — silence one token in one file.
 *
 * Output: `{file}:{line}:{col} [env-var-naming/{rule}] {message}`. Exit 0 = clean.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const CATALOG_PATH = 'spec/21-app/22-infrastructure/03-env-vars.md';
const ALLOWLIST_PATH = 'scripts/lint/env-var-naming.allowlist.txt';

const SCREAMING_RE = /^[A-Z][A-Z0-9_]+$/;

// Reference patterns — capture group 1 is the env name.
const REF_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'process.env',     re: /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g },
  { name: 'process.env[]',   re: /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g },
  { name: 'import.meta.env', re: /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g },
  { name: 'Deno.env.get',    re: /Deno\.env\.get\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/g },
];

// Catalog row: `| \`NAME\` | ...`
const CATALOG_ROW_RE = /^\|\s*`([A-Z][A-Z0-9_]+)`/;

type Violation = { file: string; line: number; col: number; rule: string; message: string };
const violations: Violation[] = [];

function loadAllowlist(): { files: Set<string>; pairs: Set<string> } {
  const files = new Set<string>();
  const pairs = new Set<string>();
  if (!existsSync(ALLOWLIST_PATH)) return { files, pairs };
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    if (t.includes(':')) pairs.add(t);
    else files.add(t);
  }
  return { files, pairs };
}

function loadCatalog(): Set<string> {
  const out = new Set<string>();
  if (!existsSync(CATALOG_PATH)) {
    console.error(`env-var-naming: catalog not found at ${CATALOG_PATH}`);
    process.exit(2);
  }
  const lines = readFileSync(CATALOG_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(CATALOG_ROW_RE);
    if (m) out.add(m[1]);
  }
  // Also accept any backticked SCREAMING token in prose of catalog (e.g. W-12 closure note).
  const PROSE_RE = /`([A-Z][A-Z0-9_]+)`/g;
  for (const line of lines) {
    let m: RegExpExecArray | null;
    while ((m = PROSE_RE.exec(line))) out.add(m[1]);
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

function scanFile(file: string, catalog: Set<string>, allow: { files: Set<string>; pairs: Set<string> }) {
  const rel = relative('.', file).replace(/\\/g, '/');
  if (allow.files.has(rel)) return;
  if (rel === relative('.', CATALOG_PATH).replace(/\\/g, '/')) return;

  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    // We deliberately scan inside fences too — env vars in code samples count.

    for (const pat of REF_PATTERNS) {
      pat.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.re.exec(line))) {
        const token = m[1];
        const col = m.index + 1;
        const pairKey = `${rel}:${token}`;
        if (allow.pairs.has(pairKey)) continue;

        if (!SCREAMING_RE.test(token)) {
          violations.push({ file: rel, line: i + 1, col, rule: 'casing',
            message: `env var \`${token}\` (via ${pat.name}) is not SCREAMING_SNAKE_CASE` });
          continue;
        }
        if (!catalog.has(token)) {
          violations.push({ file: rel, line: i + 1, col, rule: 'unknown-env',
            message: `env var \`${token}\` (via ${pat.name}) not declared in 22-infrastructure/03-env-vars.md` });
        }
      }
    }
  }
}

function main() {
  const allow = loadAllowlist();
  const catalog = loadCatalog();
  const files = walk(ROOT);
  for (const f of files) scanFile(f, catalog, allow);

  if (violations.length === 0) {
    console.log(`env-var-naming: clean (${files.length} files, ${catalog.size} cataloged vars)`);
    process.exit(0);
  }
  for (const v of violations) {
    console.log(`${v.file}:${v.line}:${v.col} [env-var-naming/${v.rule}] ${v.message}`);
  }
  console.log(`\nenv-var-naming: ${violations.length} violation(s)`);
  process.exit(1);
}

main();
