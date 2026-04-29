#!/usr/bin/env tsx
/**
 * role-enum — spec-drift sub-check
 *
 * Asserts (per Core memory rule + `17-admin-org/03-roles.md §1`):
 *   The Member.role / org_role enum is LOCKED to exactly 7 values:
 *     owner, admin, editor, viewer, billing, guest, system
 *
 * Two rule families:
 *
 *   (A) Role-shaped enum declarations (`enum(... owner ... admin ...)`) MUST
 *       contain exactly the 7 locked values — no more, no fewer, no
 *       reordering required but spelling/casing locked.
 *
 *   (B) Forbidden synonym/foreign role names anywhere in spec prose:
 *       superadmin, super-admin, super_admin, moderator, contributor,
 *       maintainer, reader, collaborator, manager, member-only.
 *       (`Member` itself is the entity, not a role — distinct.)
 *
 * Detection heuristic for (A): match a parenthesised list that contains
 * `owner` AND `admin` (the strongest tell of a role enum). Then split
 * tokens, compare to locked set.
 *
 * Scope: `spec/21-app/**`.
 *
 * Allowlist: `scripts/lint/role-enum.allowlist.txt` — file-level
 * exemptions (audit history, conversation log, glossary's own forbidden
 * synonym list if/when it grows one).
 *
 * Output: `{file}:{line}:{col} [role-enum/{rule}] {message}`. Exit 0 = clean.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/role-enum.allowlist.txt';

const LOCKED = new Set(['owner', 'admin', 'editor', 'viewer', 'billing', 'guest', 'system']);

// (A) parenthesised list containing both `owner` and `admin` — high-confidence role enum.
//     Captures the inside of the outermost parens. Stops at first `)`.
const ROLE_ENUM_RE = /enum\(([^)]*\bowner\b[^)]*\badmin\b[^)]*|[^)]*\badmin\b[^)]*\bowner\b[^)]*)\)/gi;

// (B) Forbidden synonyms — match as whole words (case-insensitive).
const FORBIDDEN_SYNONYMS = [
  'superadmin', 'super-admin', 'super_admin',
  'moderator', 'contributor', 'maintainer',
  'collaborator', 'reader-role', 'manager-role',
];

type Violation = { file: string; line: number; col: number; rule: string; message: string };
const violations: Violation[] = [];

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
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

    // (A) role enum drift
    let m: RegExpExecArray | null;
    const r = new RegExp(ROLE_ENUM_RE.source, 'gi');
    while ((m = r.exec(line))) {
      // Tokenize: strip backticks, escapes, whitespace; split on |
      const tokens = m[1]
        .replace(/[`\\]/g, '')
        .split(/\s*\|\s*/)
        .map(t => t.trim())
        .filter(Boolean);
      const tokenSet = new Set(tokens.map(t => t.toLowerCase()));
      const missing = [...LOCKED].filter(v => !tokenSet.has(v));
      const extra = [...tokenSet].filter(v => !LOCKED.has(v));
      if (missing.length === 0 && extra.length === 0) continue;
      const parts: string[] = [];
      if (missing.length) parts.push(`missing [${missing.join(', ')}]`);
      if (extra.length) parts.push(`extra [${extra.join(', ')}]`);
      violations.push({
        file: rel, line: i + 1, col: m.index + 1, rule: 'enum-drift',
        message: `role enum drift — ${parts.join('; ')}. Locked 7-value enum: owner|admin|editor|viewer|billing|guest|system (Core memory + 17-admin-org/03-roles.md §1)`,
      });
    }

    // (B) forbidden synonyms — only fire when the synonym sits in a role-system
    // context. Generic English uses ("human contributor", "open-source
    // maintainer", "collaborator slots") are not role-system drift. Anchor:
    // the same line must contain a role-context word ("role", "Role", "RLS",
    // "permission", "permissions", "auth.role", "has_role", "role enum").
    const ROLE_CONTEXT_RE = /\b(role|Role|RLS|permission|permissions|auth\.role|has_role|role enum|org_role)\b/;
    if (!ROLE_CONTEXT_RE.test(line)) continue;
    for (const syn of FORBIDDEN_SYNONYMS) {
      const re = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'gi');
      let mm: RegExpExecArray | null;
      while ((mm = re.exec(line))) {
        violations.push({
          file: rel, line: i + 1, col: mm.index + 1, rule: 'foreign-role',
          message: `foreign role name "${mm[0]}" appears in a role-system context — locked role enum is owner|admin|editor|viewer|billing|guest|system. Adding a new role requires updating glossary + 02-data-model/08-member.md + 17-admin-org/03-roles.md together.`,
        });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col} [role-enum/${v.rule}] ${v.message}`);
}

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s) across ${scanned} files`);
  process.exit(1);
}
console.log(`role-enum: clean — ${scanned} files scanned`);
