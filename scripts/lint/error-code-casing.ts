#!/usr/bin/env tsx
/**
 * error-code-casing — spec-drift sub-check
 *
 * Asserts (per `03-api-endpoints/18-error-codes.md §2`):
 *   1. Every error_code is `SCREAMING_SNAKE_CASE` matching `^[A-Z][A-Z0-9_]+$`.
 *   2. Every error_code referenced anywhere in spec MUST be declared in the
 *      master catalog `03-api-endpoints/18-error-codes.md` (column-1 of any
 *      `### 3.x ...` table).
 *
 * Detection strategy:
 *   - Catalog extraction: parse `18-error-codes.md`, collect every backticked
 *     SCREAMING_SNAKE token appearing inside a `| ... |` table row in §3.
 *   - Reference scan: walk all spec/*.md, for each line that contains the
 *     anchor word `code`, `Code`, `error_code`, or `errorCode`, extract every
 *     backticked SCREAMING_SNAKE token and check it against the catalog.
 *   - Skip fenced code blocks, headings (`#`), and the catalog file itself.
 *
 * Two rules:
 *   (A) `casing` — token does not match `^[A-Z][A-Z0-9_]+$`. (Detection
 *       requires SCREAMING_SNAKE shape so this fires only on shape-borderline
 *       tokens like leading digit; kept for completeness.)
 *   (B) `unknown-code` — token is shape-correct but missing from catalog.
 *
 * Allowlist: `scripts/lint/error-code-casing.allowlist.txt` —
 *   - `<file>` (file-level): silence the file entirely.
 *   - `<file>:<TOKEN>` (per-occurrence): silence one token in one file.
 *
 * Output: `{file}:{line}:{col} [error-code-casing/{rule}] {message}`. Exit 0 = clean.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const CATALOG_PATH = 'spec/21-app/03-api-endpoints/18-error-codes.md';
const ALLOWLIST_PATH = 'scripts/lint/error-code-casing.allowlist.txt';

const SCREAMING_RE = /^[A-Z][A-Z0-9_]+$/;
// Backticked SCREAMING_SNAKE token — captures the inner word.
const BACKTICK_TOKEN_RE = /`([A-Z][A-Z0-9_]{2,})`/g;
// Anchor words that mark a line as error-code-bearing.
const CODE_ANCHOR_RE = /\b(error[_ ]?code|error\.code|error\.codes|errorCode|error code|Error code|`code`|`error_code`|"code"|"error_code")\b/;
// Tokens that are definitionally not error codes even when in code-context (HTTP method noise, env vars, header names).
const NOT_AN_ERROR_CODE = new Set([
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
  'TRUE', 'FALSE', 'NULL', 'TODO', 'TBD', 'NOTE', 'WARNING', 'INFO',
  'JSON', 'YAML', 'CSV', 'HTML', 'CSS', 'SQL', 'URL', 'URI', 'UUID', 'JWT', 'API',
  'OK', 'OAUTH', 'SSO', 'MFA', 'TLS', 'SSL', 'CDN', 'DNS', 'TTL', 'IP', 'VPC',
]);

type Violation = { file: string; line: number; col: number; rule: string; message: string };
const violations: Violation[] = [];

function loadAllowlistLines(): { files: Set<string>; pairs: Set<string> } {
  const files = new Set<string>();
  const pairs = new Set<string>();
  if (!existsSync(ALLOWLIST_PATH)) return { files, pairs };
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    const head = t.split(/\s+/)[0]; // strip "PR:#... reason:..." trailer
    if (head.includes(':')) pairs.add(head); else files.add(head);
  }
  return { files, pairs };
}
const { files: alFiles, pairs: alPairs } = loadAllowlistLines();

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (p.endsWith('.md')) yield p;
  }
}

// ── Catalog extraction ──
const catalog = new Set<string>();
{
  if (!existsSync(CATALOG_PATH)) {
    console.error(`error-code-casing: catalog file missing at ${CATALOG_PATH}`);
    process.exit(2);
  }
  const lines = readFileSync(CATALOG_PATH, 'utf8').split('\n');
  let inSection3 = false;
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^##\s+3\./.test(line) || /^###\s+3\./.test(line)) inSection3 = true;
    else if (/^##\s+\d/.test(line) && !/^##\s+3\./.test(line)) inSection3 = false;
    if (!inSection3) continue;
    if (!line.trim().startsWith('|')) continue; // table rows only
    if (line.includes('---')) continue; // skip separator
    if (/\|\s*Code\s*\|/.test(line)) continue; // skip header
    let m: RegExpExecArray | null;
    const re = new RegExp(BACKTICK_TOKEN_RE.source, 'g');
    while ((m = re.exec(line))) catalog.add(m[1]);
  }
}
if (catalog.size === 0) {
  console.error(`error-code-casing: catalog extraction returned 0 codes — check 18-error-codes.md §3 table format`);
  process.exit(2);
}

// ── Reference scan ──
let scanned = 0;
for (const path of walk(ROOT)) {
  scanned++;
  const rel = relative('.', path);
  if (alFiles.has(rel)) continue;
  // Catalog file IS the source of truth — any new token there is canonical, not a reference.
  if (rel === CATALOG_PATH) continue;
  const lines = readFileSync(path, 'utf8').split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (line.startsWith('#')) continue; // skip headings
    if (!CODE_ANCHOR_RE.test(line)) continue;
    let m: RegExpExecArray | null;
    const re = new RegExp(BACKTICK_TOKEN_RE.source, 'g');
    while ((m = re.exec(line))) {
      const tok = m[1];
      if (NOT_AN_ERROR_CODE.has(tok)) continue;
      if (alPairs.has(`${rel}:${tok}`)) continue;
      // Rule (A) casing — by construction tok matches SCREAMING_RE; keep guard for future regex relaxations.
      if (!SCREAMING_RE.test(tok)) {
        violations.push({ file: rel, line: i + 1, col: m.index + 1, rule: 'casing',
          message: `error code "${tok}" violates SCREAMING_SNAKE_CASE (^[A-Z][A-Z0-9_]+$)` });
        continue;
      }
      // Rule (B) catalog membership.
      if (!catalog.has(tok)) {
        violations.push({ file: rel, line: i + 1, col: m.index + 1, rule: 'unknown-code',
          message: `error code "${tok}" not in master catalog (03-api-endpoints/18-error-codes.md §3). Add it there first or fix the typo. (Catalog has ${catalog.size} codes.)` });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col} [error-code-casing/${v.rule}] ${v.message}`);
}

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${scanned} files; catalog size = ${catalog.size}`);
  process.exit(1);
}
console.log(`error-code-casing: clean — ${scanned} files scanned; catalog size = ${catalog.size}`);
