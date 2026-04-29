#!/usr/bin/env -S npx tsx
/**
 * audit-cadence — sub-check of `spec-drift-linter`.
 *
 * Spec: spec/21-app/22-infrastructure/09-ci-cd.md §2.1.4 (Audit Cadence meta-rule).
 * Backfilled ground truth: Session 15 (2026-04-29) — all 18 audit files carry the
 * mandatory metadata block.
 *
 * What this asserts:
 *   (a) Every `spec/21-app/23-audits/audit-*.md` MUST start with an HTML-comment
 *       metadata block declaring `audit-date`, `next-audit-by`, `audit-type`,
 *       `status`. `supersedes:` / `superseded-by:` required when status=superseded.
 *       `closed-on:` + `closed-because:` required when status=closed.
 *   (b) `next-audit-by` ≤ 365 days after `audit-date`.
 *   (c) At most ONE audit per `audit-type` may carry `status: open` at a time.
 *   (d) `status: open` audits whose `next-audit-by` is in the past fail.
 *   (e) `audit-type` MUST be one of the 7-value enum:
 *       ai-readiness | endpoint-sweep | glossary | parity | retrospective | post-fix | ad-hoc
 *   (f) `audit.md` (legacy) and `readme.md` are exempt; only `audit-*.md` is enforced.
 *
 * Output format: `{file}:{line}:{col} [audit-cadence] {message}`
 * Exit code: 0 = clean, 1 = drift detected.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RULE = 'audit-cadence';
const ROOT = 'spec/21-app/23-audits';
const FILE_RE = /^audit-\d{4}-\d{2}-\d{2}.*\.md$/;
const TYPES = new Set([
  'ai-readiness', 'endpoint-sweep', 'glossary', 'parity',
  'retrospective', 'post-fix', 'ad-hoc',
] as const);
type AuditType = typeof TYPES extends Set<infer T> ? T : never;
const STATUSES = new Set(['open', 'closed', 'superseded'] as const);

type Meta = {
  file: string;
  'audit-date'?: string;
  'next-audit-by'?: string;
  'audit-type'?: string;
  status?: string;
  supersedes?: string;
  'superseded-by'?: string;
  'closed-on'?: string;
  'closed-because'?: string;
  blockStartLine: number; // 1-indexed
};

const META_RE = /^<!--\s*\n([\s\S]*?)\n-->/;

function parseMeta(file: string): { meta: Meta | null; errs: string[] } {
  const content = readFileSync(file, 'utf8');
  const m = META_RE.exec(content);
  if (!m) {
    return {
      meta: null,
      errs: [`${file}:1:1 [${RULE}] missing metadata block — must start with <!-- audit-date: ... --> per §2.1.4`],
    };
  }
  const meta: Meta = { file, blockStartLine: 1 };
  for (const line of m[1].split('\n')) {
    const kv = /^([a-z-]+):\s*(.+?)\s*$/.exec(line);
    if (!kv) continue;
    (meta as any)[kv[1]] = kv[2];
  }
  return { meta, errs: [] };
}

function daysBetween(a: string, b: string): number {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

const TODAY = new Date().toISOString().slice(0, 10); // CI clock

function validateOne(meta: Meta): string[] {
  const errs: string[] = [];
  const at = (msg: string) => errs.push(`${meta.file}:${meta.blockStartLine}:1 [${RULE}] ${msg}`);

  // Required fields
  for (const k of ['audit-date', 'next-audit-by', 'audit-type', 'status'] as const) {
    if (!meta[k]) at(`missing required field \`${k}\``);
  }
  if (errs.length) return errs;

  // Enum validation
  if (!TYPES.has(meta['audit-type'] as any)) {
    at(`invalid audit-type "${meta['audit-type']}" — must be one of: ${[...TYPES].join(', ')}`);
  }
  if (!STATUSES.has(meta.status as any)) {
    at(`invalid status "${meta.status}" — must be one of: ${[...STATUSES].join(', ')}`);
  }

  // Date validation
  const ad = meta['audit-date']!;
  const nb = meta['next-audit-by']!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ad)) at(`audit-date "${ad}" not in YYYY-MM-DD format`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nb)) at(`next-audit-by "${nb}" not in YYYY-MM-DD format`);
  if (errs.length) return errs;

  const window = daysBetween(ad, nb);
  if (window < 0) at(`next-audit-by (${nb}) is BEFORE audit-date (${ad})`);
  if (window > 365) at(`cadence too long: ${window}d (max 365). Re-audit on a shorter schedule.`);

  // Status-specific requirements
  if (meta.status === 'open') {
    if (TODAY > nb) {
      at(`status=open but next-audit-by (${nb}) is in the past (today=${TODAY}) — re-audit, close, or mark superseded`);
    }
  }
  if (meta.status === 'superseded') {
    if (!meta['superseded-by'] && !meta['supersedes']) {
      at(`status=superseded requires \`superseded-by:\` (or legacy \`supersedes:\`) pointing at the replacement file`);
    }
  }
  if (meta.status === 'closed') {
    if (!meta['closed-on']) at(`status=closed requires \`closed-on: YYYY-MM-DD\``);
    if (!meta['closed-because'] || meta['closed-because'].length < 10) {
      at(`status=closed requires \`closed-because:\` (≥10 chars)`);
    }
  }

  return errs;
}

function validateUniqueOpenPerType(metas: Meta[]): string[] {
  const errs: string[] = [];
  const opens = new Map<string, Meta[]>();
  for (const m of metas) {
    if (m.status !== 'open') continue;
    const t = m['audit-type']!;
    if (!opens.has(t)) opens.set(t, []);
    opens.get(t)!.push(m);
  }
  for (const [type, files] of opens) {
    if (files.length > 1) {
      const list = files.map((f) => f.file).join(', ');
      for (const f of files) {
        errs.push(`${f.file}:${f.blockStartLine}:1 [${RULE}] multiple open audits for type "${type}": ${list} — only one may be open at a time`);
      }
    }
  }
  return errs;
}

function main() {
  const files = readdirSync(ROOT).filter((f) => FILE_RE.test(f)).sort();
  const allErrs: string[] = [];
  const metas: Meta[] = [];

  for (const fn of files) {
    const path = join(ROOT, fn);
    const { meta, errs } = parseMeta(path);
    allErrs.push(...errs);
    if (meta) {
      const valErrs = validateOne(meta);
      allErrs.push(...valErrs);
      if (valErrs.length === 0) metas.push(meta);
    }
  }

  allErrs.push(...validateUniqueOpenPerType(metas));

  if (allErrs.length === 0) {
    const byType = new Map<string, { open: number; closed: number; superseded: number }>();
    for (const m of metas) {
      const t = m['audit-type']!;
      if (!byType.has(t)) byType.set(t, { open: 0, closed: 0, superseded: 0 });
      (byType.get(t)! as any)[m.status!]++;
    }
    const summary = [...byType.entries()]
      .map(([t, c]) => `${t}=${c.open}o/${c.closed}c/${c.superseded}s`)
      .join(' ');
    console.log(`[${RULE}] OK — ${files.length} audit files validated. ${summary}`);
    return;
  }

  for (const e of allErrs) console.error(e);
  process.exit(1);
}

main();
