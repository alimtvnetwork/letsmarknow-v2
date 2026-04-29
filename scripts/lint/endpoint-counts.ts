#!/usr/bin/env -S npx tsx
/**
 * endpoint-counts — sub-check of `spec-drift-linter`.
 *
 * Spec: spec/21-app/22-infrastructure/09-ci-cd.md §2.1.1 row `endpoint-counts`.
 * Meta-rule: Counter Discipline (§2.1.1 + mem://index Core).
 *
 * What this asserts:
 *   (a) Walks every table row across `spec/21-app/03-api-endpoints/0[1-9]-*.md` …
 *       `1[0-7]-*.md`, excluding `00-overview.md` and `18-error-codes.md`.
 *       Each row's first cell carries either `METHOD /path` or `| METHOD | `/path`...`.
 *   (b) Re-reads `spec/21-app/03-api-endpoints/00-overview.md §7` and asserts the
 *       printed totals (rows + distinct, per-method) match the computed ones exactly.
 *   (c) Asserts `distinct ≤ total` and lists which paths are duplicated.
 *   (d) Asserts every method bucket sum equals `total`.
 *   (e) On `--write`, regenerates §7 in place. CI runs WITHOUT --write (read-only).
 *
 * Output format: `{file}:{line}:{col} [endpoint-counts] {message}`
 * Exit code: 0 = clean, 1 = drift detected.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RULE = 'endpoint-counts';
const ROOT = 'spec/21-app/03-api-endpoints';
const OVERVIEW = join(ROOT, '00-overview.md');
const EXCLUDE = new Set(['00-overview.md', '18-error-codes.md']);

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const;
type Method = typeof METHODS[number];

type Row = { method: Method; path: string; file: string; line: number };
type Errors = string[];

// --- 1. Discover per-domain endpoint files (02-*.md … 23-*.md). ---
// Excludes 00-overview.md (the index), 01-conventions.md (pure prose),
// 18-error-codes.md (no endpoints declared), and non-numbered files.
function discoverFiles(): string[] {
  const all = readdirSync(ROOT).filter((f) => /^\d{2}-.*\.md$/.test(f) && !EXCLUDE.has(f));
  // 01-conventions has no endpoints; skip explicitly to avoid noise.
  const inRange = all.filter((f) => f !== '01-conventions.md');
  return inRange.sort().map((f) => join(ROOT, f));
}

// --- 2. Parse every endpoint declaration. ---
// Three accepted shapes (all appear in the corpus, see SI-025 for the audit):
//   1. Backtick-header line:        `` `POST /v1/auth/signup` ``  (most common, 161 of 171)
//   2. Markdown header:             `### POST /v1/items`           (used in some sub-sections)
//   3. Table-row inline:            `| GET /v1/items | … |`        (used sparingly)
//   4. Table-row split-cell:        `| GET | \`/v1/items\` | …`    (used in 00-overview.md only — excluded)
const ROW_BACKTICK = /^`(GET|POST|PATCH|PUT|DELETE)\s+(\/v1\/[^\s`]+)`\s*$/;
const ROW_HEADER = /^#{2,4}\s+(GET|POST|PATCH|PUT|DELETE)\s+(\/v1\/[^\s]+)\s*$/;
const ROW_INLINE = /^\|\s*(GET|POST|PATCH|PUT|DELETE)\s+(\/v1\/[^\s|`]+)\s*\|/;

function parseRows(file: string): Row[] {
  const lines = readFileSync(file, 'utf8').split('\n');
  const rows: Row[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = ROW_BACKTICK.exec(line) ?? ROW_HEADER.exec(line) ?? ROW_INLINE.exec(line);
    if (!m) continue;
    rows.push({ method: m[1] as Method, path: m[2], file, line: i + 1 });
  }
  return rows;
}

// --- 3. Compute totals + duplicates. ---
type Computed = {
  total: number;
  distinct: number;
  perMethod: Record<Method, { rows: number; distinct: number }>;
  duplicates: { method: Method; path: string; occurrences: { file: string; line: number }[] }[];
};

function compute(allRows: Row[]): Computed {
  const perMethod = Object.fromEntries(
    METHODS.map((m) => [m, { rows: 0, distinct: 0 }]),
  ) as Computed['perMethod'];

  const seenByMethod = Object.fromEntries(METHODS.map((m) => [m, new Map<string, Row[]>()])) as Record<
    Method,
    Map<string, Row[]>
  >;

  for (const r of allRows) {
    perMethod[r.method].rows++;
    const bucket = seenByMethod[r.method];
    if (!bucket.has(r.path)) bucket.set(r.path, []);
    bucket.get(r.path)!.push(r);
  }
  for (const m of METHODS) perMethod[m].distinct = seenByMethod[m].size;

  const duplicates: Computed['duplicates'] = [];
  for (const m of METHODS) {
    for (const [path, occ] of seenByMethod[m]) {
      if (occ.length > 1) {
        duplicates.push({
          method: m,
          path,
          occurrences: occ.map(({ file, line }) => ({ file, line })),
        });
      }
    }
  }

  const total = allRows.length;
  const distinct = METHODS.reduce((s, m) => s + perMethod[m].distinct, 0);
  return { total, distinct, perMethod, duplicates };
}

// --- 4. Parse §7 of 00-overview.md (the table we must match). ---
type Published = {
  total: number;
  distinct: number;
  perMethod: Record<Method, { rows: number; distinct: number }>;
  tableStart: number; // line number of `| Method | Rows | Distinct |`
  tableEnd: number;   // line number of the **Total** row
};

function parsePublished(): Published | null {
  const lines = readFileSync(OVERVIEW, 'utf8').split('\n');
  let inSection7 = false;
  let tableStart = -1;
  const perMethod = Object.fromEntries(
    METHODS.map((m) => [m, { rows: 0, distinct: 0 }]),
  ) as Published['perMethod'];
  let total = 0;
  let distinct = 0;
  let tableEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^## 7\.\s/.test(line)) inSection7 = true;
    if (!inSection7) continue;
    if (/^\| Method \| Rows \| Distinct \|/.test(line)) {
      tableStart = i + 1;
      continue;
    }
    if (tableStart < 0) continue;
    const mTotal = /^\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|/.exec(line);
    if (mTotal) {
      total = +mTotal[1];
      distinct = +mTotal[2];
      tableEnd = i + 1;
      break;
    }
    const mRow = /^\|\s*(GET|POST|PATCH|PUT|DELETE)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/.exec(line);
    if (mRow) {
      const method = mRow[1] as Method;
      perMethod[method] = { rows: +mRow[2], distinct: +mRow[3] };
    }
  }

  if (tableStart < 0 || tableEnd < 0) return null;
  return { total, distinct, perMethod, tableStart, tableEnd };
}

// --- 5. Compare; emit errors in the standard format. ---
function compare(c: Computed, p: Published): Errors {
  const errs: Errors = [];
  const at = (col: number, msg: string) => errs.push(`${OVERVIEW}:${p.tableStart}:${col} [${RULE}] ${msg}`);

  if (c.total !== p.total) at(1, `total drift: §7 says ${p.total}, computed ${c.total}`);
  if (c.distinct !== p.distinct) at(1, `distinct drift: §7 says ${p.distinct}, computed ${c.distinct}`);

  for (const m of METHODS) {
    const pm = p.perMethod[m];
    const cm = c.perMethod[m];
    if (pm.rows !== cm.rows) at(1, `${m} rows drift: §7 says ${pm.rows}, computed ${cm.rows}`);
    if (pm.distinct !== cm.distinct)
      at(1, `${m} distinct drift: §7 says ${pm.distinct}, computed ${cm.distinct}`);
  }

  // Invariant (c): distinct ≤ total, and the gap = number of duplicate rows.
  const dupCount = c.duplicates.reduce((s, d) => s + (d.occurrences.length - 1), 0);
  if (c.distinct > c.total) errs.push(`${OVERVIEW}:1:1 [${RULE}] invariant violated: distinct (${c.distinct}) > total (${c.total})`);
  const expectedGap = c.total - c.distinct;
  if (dupCount !== expectedGap) {
    errs.push(
      `${OVERVIEW}:1:1 [${RULE}] duplicate-count mismatch: total-distinct=${expectedGap} but enumerated ${dupCount} duplicate row(s)`,
    );
  }
  for (const d of c.duplicates) {
    const where = d.occurrences.map((o) => `${o.file}:${o.line}`).join(', ');
    errs.push(`${OVERVIEW}:1:1 [${RULE}] duplicate \`${d.method} ${d.path}\` at: ${where}`);
  }

  // Invariant (d): per-method row sum == total.
  const sumRows = METHODS.reduce((s, m) => s + c.perMethod[m].rows, 0);
  if (sumRows !== c.total)
    errs.push(`${OVERVIEW}:1:1 [${RULE}] internal: per-method row sum ${sumRows} ≠ total ${c.total}`);

  return errs;
}

// --- 6. Optional --write mode: regenerate §7 in place. ---
function regenerate(c: Computed): void {
  const lines = readFileSync(OVERVIEW, 'utf8').split('\n');
  const p = parsePublished();
  if (!p) throw new Error('cannot regenerate: §7 table not found');
  const newTable = [
    '| Method | Rows | Distinct |',
    '|---|---|---|',
    ...METHODS.map((m) => `| ${m} | ${c.perMethod[m].rows} | ${c.perMethod[m].distinct} |`),
    `| **Total** | **${c.total}** | **${c.distinct}** |`,
  ];
  const before = lines.slice(0, p.tableStart - 1);
  const after = lines.slice(p.tableEnd);
  writeFileSync(OVERVIEW, [...before, ...newTable, ...after].join('\n'));
}

// --- 7. Main. ---
function main() {
  const write = process.argv.includes('--write');
  const files = discoverFiles();
  const allRows = files.flatMap(parseRows);
  const computed = compute(allRows);

  if (write) {
    regenerate(computed);
    console.log(`[${RULE}] wrote §7: total=${computed.total} distinct=${computed.distinct}`);
    return;
  }

  const published = parsePublished();
  if (!published) {
    console.error(`${OVERVIEW}:1:1 [${RULE}] §7 endpoint-counts table not found`);
    process.exit(1);
  }

  const errs = compare(computed, published);
  if (errs.length === 0) {
    console.log(
      `[${RULE}] OK — ${files.length} files, ${computed.total} rows, ${computed.distinct} distinct, ${computed.duplicates.length} duplicate path(s)`,
    );
    return;
  }
  for (const e of errs) console.error(e);
  process.exit(1);
}

main();
