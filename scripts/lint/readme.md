# `scripts/lint/` — spec-drift linter sub-checks

Source of truth for the rule set: `spec/21-app/22-infrastructure/09-ci-cd.md §2.1.1`.

This directory holds the implementations of the 18 sub-checks composing `spec-drift-linter`. Each script is a standalone TypeScript file runnable with `npx tsx scripts/lint/<name>.ts`. All scripts share the output format `{file}:{line}:{col} [{rule}] {message}` so editor jump-to-error works.

## Status

| Sub-check | Implemented | Notes |
|---|---|---|
| `endpoint-counts` | ✅ `endpoint-counts.ts` | Counter Discipline meta-rule. Shipped Session 17; rebased §7 to 171/171 in Session 18 (closed SI-025). Run with `--write` to regenerate `00-overview.md §7`. |
| `audit-cadence` | ✅ `audit-cadence.ts` | Audit Cadence meta-rule. Shipped Session 19. Validates all 18 audit files in `23-audits/`; checks required fields, enum values, ≤365d cadence, expired-open detection, status-specific requirements, one-open-per-type invariant. Currently green: 1 open (ai-readiness) / 12 closed / 5 superseded. |
| `link-check` | ⏳ | Use `lychee --offline`, no custom script needed. |
| `naming-convention` | ✅ `naming-convention.ts` | Shipped Session 20. Asserts `^\d{2}-[a-z0-9-]+\.md$`, lowercase `readme.md`, contiguous numbering. Allowlist: `naming-convention.allowlist.txt` (22 entries: 19 audit corpus files, 1 dir gap for `21-app` slot, 1 wireframes asset folder, 1 legacy root index). Currently green. |
| `role-enum` | ⏳ | |
| `error-code-casing` | ⏳ | |
| `money-units` | ✅ `money-units.ts` | Shipped Session 23. Forbids `amount_minor`, `amount_in_cents`, `priceInCents`, `discount_minor` across `spec/21-app/**/*.md`. Caught real drift on first run: `discount_minor` survived in `10-coupons-and-promotions.md:64` despite W-10's documented 2026-04-19 sweep claiming this file was clean — opened + closed SI-026 same session. Allowlist: `money-units.allowlist.txt` (8 entries: linter rule definition, W-10 closure notes, audit history, gap-analysis, template). Currently green. |
| `sku-naming` | ✅ `sku-naming.ts` | Shipped Session 24. Forbids `_annual` SKU suffix across `spec/21-app/**/*.md`. First run clean (no shippable drift) — W-6 sweep on 2026-04-19 was actually thorough, unlike W-10. Allowlist: `sku-naming.allowlist.txt` (6 entries: linter rule, 15-sku-map closure note, 3 audit history files, template). Currently green. |
| `pagination-param` | ✅ `pagination-param.ts` | Shipped Session 25. Forbids `page_size`/`pageSize` in `03-api-endpoints/**` + `05-web-app/**` only (per §2.1.1 scoping). 43 files scanned, clean — W-13 sweep on 2026-04-19 was thorough. **No allowlist needed**: the narrow scope keeps documentation references (audit history, templates) out of the rule's reach automatically. Currently green. |
| `realtime-channel-syntax` | ✅ `realtime-channel-syntax.ts` | Shipped Session 26. Forbids `<scope>:<placeholder>` angle-bracket form in realtime channel templates; canonical is `<scope>:{<scope>_id}` (curly braces). Scoped to `08-sharing-collab/**` + `04-extension/10-sync-and-offline.md` only — REST `:id` route params (171 endpoint declarations) intentionally NOT touched. 17 files scanned, clean — W-4 sweep on 2026-04-19 was thorough. **No allowlist needed** (scope-narrowing pattern from Session 25). Negative-tested against historical drift; regex catches both `collection:<collection_id>` and `item:<id>`. Currently green. |
| `storage-path` | ⏳ | |
| `env-var-naming` | ⏳ | |
| `pricing-source` | ⏳ | |
| `folder-overview` | ✅ `folder-overview.ts` | Shipped Session 22. Asserts every dir under `spec/21-app/` (excluding `templates/`, hidden, root, allowlisted) has `00-overview.md` ≥40 lines with the 5 canonical headings. First run found 3 real drift items: fixed `00-overview/00-overview.md` (heading 1 had stray suffix) and `23-audits/00-overview.md` (6 unnumbered headings → renumbered); allowlisted `03-api-endpoints/00-overview.md` (legitimate alt schema — HTTP-method index, validated by `endpoint-counts` instead). Currently green. |
| `brand-pink-anchor` | ⏳ | Requires lifting `no-implementation-mode` first to have `src/` files to scan. |
| `color-label-tokens` | ⏳ | Same — needs `src/` to exist. |
| `collection-kind-discriminator` | ⏳ | Same — needs `src/` + `migrations/`. |
| `toast-placement` | ⏳ | Same — needs `src/`. |
| `allowlist-discipline` | ✅ `allowlist-discipline.ts` | Allowlist Discipline meta-rule. Shipped Session 21. Validates header (`# linter:`, `# purpose:`, `# review-by:`), per-entry `PR:#<n> reason:<≥10 chars>` justifications, ≤50 non-comment lines, review-by window (≥today, ≤180d), and orphan-allowlist detection (filename stem must match §2.1.1 sub-check). Cross-validates against the §2.1.1 table extracted from `09-ci-cd.md` (19 known sub-checks). Currently green: 1 allowlist file (`naming-convention.allowlist.txt`). Negative-tested with 5 forced violations — all fire cleanly. |

## Conventions

- **No deps beyond `tsx`/Node stdlib** unless absolutely needed. Linters must run in CI without a heavy install.
- **Read-only by default.** A `--write` flag may regenerate auto-derived sections (e.g. `endpoint-counts --write` regenerates §7). CI never passes `--write`.
- **Standard output format:** `{file}:{line}:{col} [{rule}] {message}`. One violation per line. Empty stdout + exit 0 = clean.
- **Allowlists** (`*.allowlist.txt`) MUST conform to the Allowlist Discipline schema (§2.1.3): `# linter:`, `# purpose:`, `# review-by:` header + `PR:#<n> reason:<text>` per entry.

## Running

```sh
npx tsx scripts/lint/endpoint-counts.ts          # check
npx tsx scripts/lint/endpoint-counts.ts --write  # regenerate §7 in place (maintainer only)
```

Composite job (planned, not yet implemented): a top-level `scripts/lint/index.ts` will fan-out to all sub-checks, collect-then-report, and exit non-zero if any failed.
