#!/usr/bin/env tsx
/**
 * storage-path — spec-drift sub-check (W-7)
 *
 * Asserts (per `22-infrastructure/12-storage-layout.md §1, §2, §7`):
 *   1. Bucket inventory: every storage-bucket reference inside scoped
 *      directories must name one of the 10 canonical buckets in §1.
 *   2. No legacy prefix: forbid the `lmn-<bucket>` form for any bucket
 *      that exists in canonical inventory (W-7 closure: prefix dropped
 *      from bucket names; retained for client-side identifiers, which
 *      live outside scope).
 *
 * Scope (per §2.1.1):
 *   - `spec/21-app/22-infrastructure/**`
 *   - `spec/21-app/11-import-export/**`
 *   The canonical layout file itself + the cdn-storage historical note
 *   carry W-7 closure quotes; allowlisted file-level.
 *
 * Detection strategy:
 *   - Catalog: parse `12-storage-layout.md §1` table column-1 for the
 *     10 canonical bucket names.
 *   - Reference scan: for each scoped .md file, find:
 *       (a) backticked bucket-path tokens: `` `<bucket>/...` `` or
 *           bare `` `<bucket>` `` where the bucket has the bucket-shape
 *           (lowercase + hyphen, no slashes embedded in the name).
 *       (b) the legacy form `lmn-<word>` anywhere — flag if `<word>`
 *           collides with a canonical bucket (e.g. `lmn-imports`).
 *   - Skip: fenced code blocks, headings, the catalog file, allowlist.
 *
 * Two rules:
 *   (A) `unknown-bucket` — backticked path starts with a token that
 *       looks like a bucket name (`^[a-z][a-z0-9-]+/`) but isn't in
 *       canonical inventory.
 *   (B) `legacy-prefix` — `lmn-<bucket>` form where `<bucket>` is
 *       canonical (e.g. `lmn-imports`, `lmn-og-images`).
 *
 * Allowlist: `scripts/lint/storage-path.allowlist.txt`
 *   - `<file>`             — silence file entirely.
 *   - `<file>:<TOKEN>`     — silence one token in one file.
 *
 * Output: `{file}:{line}:{col} [storage-path/{rule}] {message}`. Exit 0 = clean.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const CATALOG_PATH = 'spec/21-app/22-infrastructure/12-storage-layout.md';
const SCOPED_DIRS = [
  'spec/21-app/22-infrastructure',
  'spec/21-app/11-import-export',
];
const ALLOWLIST_PATH = 'scripts/lint/storage-path.allowlist.txt';

// Catalog row: `| \`bucket-name\` | ...`
const CATALOG_ROW_RE = /^\|\s*`([a-z][a-z0-9-]+)`\s*\|/;
// Bucket-shaped path inside backticks: `bucket-name/...`
const PATH_REF_RE = /`([a-z][a-z0-9-]+)\/[^`]*`/g;
// Legacy lmn- bucket form: `lmn-foo/...` or bare `lmn-foo`
const LEGACY_RE = /`?(lmn-[a-z0-9-]+)(?:\/|`|\b)/g;

// Tokens that look like bucket prefixes but are NOT buckets — common path
// roots that legitimately appear in spec.
const NOT_A_BUCKET = new Set([
  'spec', 'src', 'scripts', 'public', 'node_modules', 'dist', 'build',
  'docs', 'tests', 'app', 'api', 'web', 'extension', 'mem',
  'http', 'https', 'mailto', 'tel',
  'package', 'tsconfig', 'vite', 'tailwind', 'postcss',
  'github', 'lovable', 'release', 'releases',
  'YYYY', 'MM', 'DD', // path templates
  'org-assets-cdn', // hypothetical hyphenated misreads
]);

type Violation = { file: string; line: number; col: number; rule: string; message: string };
const violations: Violation[] = [];

function loadAllowlist(): { files: Set<string>; pairs: Set<string> } {
  const files = new Set<string>();
  const pairs = new Set<string>();
  if (!existsSync(ALLOWLIST_PATH)) return { files, pairs };
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = raw.split(/\s+PR:/)[0].trim();
    if (!t || t.startsWith('#')) continue;
    if (t.includes(':')) pairs.add(t);
    else files.add(t);
  }
  return { files, pairs };
}

function loadCatalog(): Set<string> {
  const out = new Set<string>();
  if (!existsSync(CATALOG_PATH)) {
    console.error(`storage-path: catalog not found at ${CATALOG_PATH}`);
    process.exit(2);
  }
  const lines = readFileSync(CATALOG_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(CATALOG_ROW_RE);
    if (m) out.add(m[1]);
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
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
    if (inFence) continue;
    if (/^#{1,6}\s/.test(line)) continue;

    // Rule B: legacy lmn- prefix collisions.
    LEGACY_RE.lastIndex = 0;
    let lm: RegExpExecArray | null;
    while ((lm = LEGACY_RE.exec(line))) {
      const token = lm[1]; // e.g. lmn-imports
      const tail = token.slice(4); // imports
      if (!catalog.has(tail) && tail !== 'og-images') continue;
      const pairKey = `${rel}:${token}`;
      if (allow.pairs.has(pairKey)) continue;
      const col = lm.index + 1;
      violations.push({
        file: rel, line: i + 1, col, rule: 'legacy-prefix',
        message: `legacy bucket form \`${token}\` — W-7 dropped the lmn- prefix; canonical name is \`${tail === 'og-images' ? 'share-snapshots' : tail}\``,
      });
    }

    // Rule A: backticked bucket-shaped path with unknown bucket.
    PATH_REF_RE.lastIndex = 0;
    let pm: RegExpExecArray | null;
    while ((pm = PATH_REF_RE.exec(line))) {
      const token = pm[1];
      if (NOT_A_BUCKET.has(token)) continue;
      if (catalog.has(token)) continue;
      // Skip date-shaped first segments (audit-archive uses `2026/04/19/...`)
      if (/^\d{4}$/.test(token)) continue;
      // Skip path templates with placeholder roots
      if (token.startsWith('lmn-')) continue; // handled by Rule B
      const pairKey = `${rel}:${token}`;
      if (allow.pairs.has(pairKey)) continue;
      const col = pm.index + 1;
      violations.push({
        file: rel, line: i + 1, col, rule: 'unknown-bucket',
        message: `path \`${pm[0].slice(1, -1)}\` starts with \`${token}\` which is not in canonical bucket inventory (12-storage-layout.md §1)`,
      });
    }
  }
}

function main() {
  const allow = loadAllowlist();
  const catalog = loadCatalog();
  const files: string[] = [];
  for (const d of SCOPED_DIRS) walk(d, files);
  for (const f of files) scanFile(f, catalog, allow);

  if (violations.length === 0) {
    console.log(`storage-path: clean (${files.length} files in scope, ${catalog.size} cataloged buckets)`);
    process.exit(0);
  }
  for (const v of violations) {
    console.log(`${v.file}:${v.line}:${v.col} [storage-path/${v.rule}] ${v.message}`);
  }
  console.log(`\nstorage-path: ${violations.length} violation(s)`);
  process.exit(1);
}

main();
