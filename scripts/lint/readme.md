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
| `money-units` | ⏳ | |
| `sku-naming` | ⏳ | |
| `pagination-param` | ⏳ | |
| `realtime-channel-syntax` | ⏳ | |
| `storage-path` | ⏳ | |
| `env-var-naming` | ⏳ | |
| `pricing-source` | ⏳ | |
| `folder-overview` | ⏳ | |
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
