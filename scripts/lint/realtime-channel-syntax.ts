#!/usr/bin/env tsx
/**
 * realtime-channel-syntax — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1` row + W-4 audit):
 *   Realtime channel/topic templates use `{id}` placeholders, never `<id>`.
 *   Canonical form: `<scope>:{<scope>_id}` — e.g. `collection:{collection_id}`,
 *   `item:{item_id}`, `org:{org_id}`. The `<...>` angle-bracket form is forbidden.
 *
 * Scope: `spec/21-app/08-sharing-collab/**` (the realtime/presence/comments folder)
 * AND `spec/21-app/04-extension/10-sync-and-offline.md` (the extension's realtime
 * transport reference). The §2.1.1 rule says "channel and route templates" — REST
 * route templates legitimately use `:id` (171 canonical endpoint declarations rely
 * on it), so the `:id` half of the original W-4 rule applies to channel templates
 * only, which this linter enforces by scoping to realtime files. The `<id>` half
 * is unambiguously forbidden everywhere a channel template appears.
 *
 * Detected pattern: a channel-context string like `<scope>:<placeholder>` where the
 * placeholder is wrapped in angle brackets. Examples it catches:
 *   - `collection:<collection_id>`
 *   - `item:<id>`
 *   - `org:<org_id>`
 *
 * Also catches bare `<id>` / `<some_id>` placeholders inside backticked channel-name
 * strings like `` `account:<account_id>` `` even when surrounding context is prose.
 *
 * Allowlist: `scripts/lint/realtime-channel-syntax.allowlist.txt` — file-level
 * exemption (audit history files that quote the forbidden pattern).
 *
 * Output: `{file}:{line}:{col} [realtime-channel-syntax] {message}`. Exit 0 = clean.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCOPED_PATHS = [
  'spec/21-app/08-sharing-collab',
  'spec/21-app/04-extension/10-sync-and-offline.md',
];
const ALLOWLIST_PATH = 'scripts/lint/realtime-channel-syntax.allowlist.txt';

// Pattern: a lowercase scope word, colon, then an angle-bracketed placeholder.
// E.g. `collection:<collection_id>`, `item:<id>`, `org:<org_id>`.
// Anchored with word boundary on the left to avoid catching arbitrary `<` in prose.
const CHANNEL_ANGLE_RE = /\b([a-z][a-z_]*):<([a-z_][a-z0-9_]*)>/g;

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

function* walkFiles(target: string): Generator<string> {
  if (!existsSync(target)) return;
  const st = statSync(target);
  if (st.isFile()) {
    if (target.endsWith('.md')) yield target;
    return;
  }
  for (const name of readdirSync(target).sort()) {
    if (name.startsWith('.')) continue;
    yield* walkFiles(join(target, name));
  }
}

let scannedFiles = 0;
for (const root of SCOPED_PATHS) {
  for (const path of walkFiles(root)) {
    scannedFiles++;
    const rel = relative('.', path);
    if (allowlist.has(rel)) continue;
    const lines = readFileSync(path, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m: RegExpExecArray | null;
      const re = new RegExp(CHANNEL_ANGLE_RE.source, 'g');
      while ((m = re.exec(line)) !== null) {
        violations.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          message: `forbidden channel-template syntax "${m[0]}" — use "${m[1]}:{${m[2]}}" with curly braces per W-4 lock (source: 00-overview/02-glossary.md channel naming convention)`,
        });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [realtime-channel-syntax] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${scannedFiles} scoped files`);
  process.exit(1);
}
console.log(`realtime-channel-syntax: clean — ${scannedFiles} files scanned`);
