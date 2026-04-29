#!/usr/bin/env tsx
/**
 * next-singleton-invariants — spec-drift sub-check
 *
 * Asserts (per `07-features/17-next-queue.md §2` and
 * `02-data-model/03-collection.md` Invariants 10–13):
 *
 *   1. The Collection-`kind` enum, wherever spec'd in plain text, MUST list
 *      exactly the three locked values `manual`, `session`, `next` — never
 *      a stale 2-value enum like `enum(manual|session)`.
 *   2. The NextItem `source_kind` enum MUST contain the locked 5 values:
 *      `collection`, `browser_tab`, `manual`, `session`, `bulk` — and no
 *      other values may appear in `source_kind` enum-shaped declarations.
 *   3. UI copy MUST use the locked verb "Add to Next" — forbidden synonyms:
 *      "Add to To-do", "Save for later", "Bookmark for Next", "Add to Todo",
 *      "Save to Next list".
 *   4. Any prose declaring Next's scope MUST say "per-Account" or
 *      "per Account" (cross-Org by design). The phrase "per-workspace Next"
 *      / "per-Org Next" / "Next per Space" is forbidden — they describe a
 *      rejected v0 model.
 *   5. Channel templates referring to Next MUST use
 *      `account:{account_id}:next` (curly W-4 form) — bare `next:<...>` or
 *      `next-list:{...}` channel forms are forbidden.
 *
 * Scope: `spec/21-app/**` (entire spec corpus — Next invariants are
 * cross-cutting).
 *
 * Allowlist: `scripts/lint/next-singleton-invariants.allowlist.txt` —
 * file-level exemptions (audit history, conversation log).
 *
 * Output: `{file}:{line}:{col} [next-singleton-invariants] {message}`.
 * Exit 0 = clean; non-zero on any violation.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/next-singleton-invariants.allowlist.txt';

// (1) Stale Collection.kind enum — must include `next`.
//     Catches: enum(manual|session) and `manual`|`session` lacking `next`.
const STALE_KIND_RE = /\benum\(\s*`?manual`?\s*\\?\|\s*`?session`?\s*\)(?!\s*\\?\|\s*`?next`?)/g;

// (2) NextItem source_kind enum drift — declared values must match locked 5.
//     Pattern: source_kind ... enum( ... ) — flag if any value ∉ locked set.
const LOCKED_SOURCE_KINDS = new Set(['collection', 'browser_tab', 'manual', 'session', 'bulk']);
const SOURCE_KIND_DECL_RE = /source_kind[^|]*\benum\(([^)]+)\)/g;

// (3) Forbidden UI verb synonyms.
const FORBIDDEN_VERBS = [
  'Add to To-do',
  'Add to Todo',
  'Save for later',
  'Bookmark for Next',
  'Save to Next list',
  'Add to Toby Next', // per spec §5 E6 we use "Add to Next" verbatim
];

// (4) Forbidden scope phrases.
const FORBIDDEN_SCOPE = [
  'per-workspace Next',
  'per-Org Next',
  'per-Organization Next',
  'Next per Space',
  'Next per Org',
  'Next per Workspace',
];

// (5) Forbidden Next channel templates (must be account:{account_id}:next).
const BAD_NEXT_CHANNEL_RE = /\b(next:\{[^}]+\}|next-list:\{[^}]+\}|workspace:\{[^}]+\}:next)/g;

type Violation = { file: string; line: number; col: number; rule: string; message: string };
const violations: Violation[] = [];

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    // Allowlist Discipline schema: "<path> PR:#<n> reason:<text>" — first token is the path.
    out.add(t.split(/\s+/)[0]);
  }
  return out;
}
const allowlist = loadAllowlist();

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

let scanned = 0;
for (const path of walk(ROOT)) {
  scanned++;
  const rel = relative('.', path);
  if (allowlist.has(rel)) continue;
  const lines = readFileSync(path, 'utf8').split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;

    // Rule 1
    let m: RegExpExecArray | null;
    const r1 = new RegExp(STALE_KIND_RE.source, 'g');
    while ((m = r1.exec(line))) {
      violations.push({ file: rel, line: i + 1, col: m.index + 1, rule: 'kind-enum-stale',
        message: `Collection.kind enum is missing \`next\` — locked enum is enum(manual|session|next)` });
    }

    // Rule 2
    const r2 = new RegExp(SOURCE_KIND_DECL_RE.source, 'g');
    while ((m = r2.exec(line))) {
      const values = m[1].split(/[|,\\]+/).map(v => v.replace(/[`\s]/g, '')).filter(Boolean);
      const bad = values.filter(v => !LOCKED_SOURCE_KINDS.has(v));
      if (bad.length > 0) {
        violations.push({ file: rel, line: i + 1, col: m.index + 1, rule: 'source-kind-drift',
          message: `NextItem.source_kind contains non-locked values [${bad.join(', ')}] — locked: collection, browser_tab, manual, session, bulk` });
      }
    }

    // Rule 3
    for (const verb of FORBIDDEN_VERBS) {
      const idx = line.indexOf(verb);
      if (idx >= 0) {
        violations.push({ file: rel, line: i + 1, col: idx + 1, rule: 'verb-synonym',
          message: `forbidden synonym "${verb}" — use locked verb "Add to Next"` });
      }
    }

    // Rule 4
    for (const phrase of FORBIDDEN_SCOPE) {
      const idx = line.indexOf(phrase);
      if (idx >= 0) {
        violations.push({ file: rel, line: i + 1, col: idx + 1, rule: 'scope-drift',
          message: `forbidden scope phrase "${phrase}" — Next is per-Account, cross-Org by design (07-features/17-next-queue.md §2)` });
      }
    }

    // Rule 5
    const r5 = new RegExp(BAD_NEXT_CHANNEL_RE.source, 'g');
    while ((m = r5.exec(line))) {
      violations.push({ file: rel, line: i + 1, col: m.index + 1, rule: 'channel-drift',
        message: `forbidden Next realtime channel "${m[0]}" — canonical is \`account:{account_id}:next\`` });
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col} [next-singleton-invariants/${v.rule}] ${v.message}`);
}

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${scanned} files`);
  process.exit(1);
}
console.log(`next-singleton-invariants: clean — ${scanned} files scanned`);
