# CI / CD

Pipelines, gates, rollback. Build once, deploy three times (dev → staging → prod).

---

## 1. Provider

GitHub Actions (workflows in `.github/workflows/`). Lovable hosting auto-deploys on tag push.

## 2. Pipelines

### 2.1 `ci.yml` — runs on every PR

Jobs (parallel):
1. **install** — restore cached `node_modules` / `bun` cache.
2. **typecheck** — `tsc --noEmit`.
3. **lint** — `eslint . --max-warnings 0`.
4. **format** — `prettier --check .`.
5. **unit** — `vitest run` (per `21-testing/`).
6. **integration** — spin up ephemeral Cloud project; run API contract tests.
7. **build** — produce `dist/` for web app, marketing, extension.
8. **bundle-scan** — grep client bundle for forbidden secret prefixes (`sk_`, `whsec_`, `re_`, …); fail on hit.
9. **a11y** — `@axe-core/cli` against built routes; fail on serious/critical.
10. **lighthouse** — perf budget on key routes (LCP < 2.5s, CLS < 0.1, TBT < 200ms).
11. **size-limit** — fail if any route's JS > 250 KB gzipped.
12. **spec-drift-linter** — see §2.1.1 below. Single composite job, fails the PR on any drift class.
13. **env-check** — `scripts/check-env.ts` validates required env vars present per environment matrix.

Gate: **all green** required to merge to `main`.

### 2.1.1 `spec-drift-linter` — anti-regression guard for the spec corpus

Purpose: lock in every W-class fix from `23-audits/audit-2026-04-19-ai-readiness-score.md`, the F-FOLDER-OVERVIEW closure from `23-audits/audit-2026-04-19-100-retrospective.md`, AND the Toby-parity invariants from SI-021 / SI-023 / SI-024 (per DoD §6 Locked rule #5) so the same drift cannot return via a future PR. Runs against `spec/21-app/**/*.md` and `src/**/*.{ts,tsx,css}` on every PR. Composite of seventeen sub-checks, each of which fails the job independently with a precise error.

| Sub-check | Tool | What it asserts | Fix-source it locks |
|---|---|---|---|
| `link-check` | `lychee --offline spec/21-app/**/*.md` | Every relative markdown link resolves to an existing file. | W-5 (broken a11y link). |
| `naming-convention` | `scripts/lint/spec-filenames.ts` | Every file under a numbered domain folder matches `^(\d{2})-[a-z0-9-]+\.md$`; folder index is exactly `readme.md`; sequence numbers are contiguous (no gaps, no duplicates). | Locked rule in `mem://index` ("File naming: `NN-name.md`"). |
| `role-enum` | `scripts/lint/role-enum.ts` | Greps `org_role`, `app_role`, `roles[]`, JWT `roles` claim, and any enum-looking SQL `CHECK` against the canonical 7-value list (`owner, admin, editor, viewer, billing, guest, system`). Any extra value or missing value fails. Allowlist file: `scripts/lint/role-enum.allowlist.txt` (must reference glossary + member.md). | W-1 + W-1 residue sweep. |
| `error-code-casing` | `scripts/lint/error-codes.ts` | Every error code emitted in spec matches `^[A-Z][A-Z0-9_]+$` AND is listed in `03-api-endpoints/18-error-codes.md`. Unknown codes fail. | W-8, F-M09, F-M10. |
| `money-units` | `scripts/lint/money-units.ts` | Disallows `amount_minor`, `amount_in_cents`, `priceInCents` anywhere in `spec/21-app/`. Only `amount_cents` permitted. | W-10. |
| `sku-naming` | `scripts/lint/sku-naming.ts` | Disallows `_annual` suffix in plan SKUs; only `_yearly` permitted. Source of truth: `10-licensing-billing/15-sku-map.md`. | W-6. |
| `pagination-param` | `scripts/lint/pagination.ts` | Disallows `page_size` and `pageSize` in any `03-api-endpoints/**` or `05-web-app/**` file. Only `limit` permitted. | W-13. |
| `realtime-channel-syntax` | `scripts/lint/channel-syntax.ts` | Channel and route templates use `{id}` placeholders, never `<id>` or `:id`. | W-4. |
| `storage-path` | `scripts/lint/storage-path.ts` | Storage paths in `22-infrastructure/**` and `11-import-export/**` match the layout declared in `12-storage-layout.md`. Bucket names allowlisted there. | W-7. |
| `env-var-naming` | `scripts/lint/env-vars.ts` | Every `process.env.*` / `import.meta.env.*` reference in spec exists in `22-infrastructure/03-env-vars.md`. Chrome Identity API exception list is allowlisted in §5 of that file. | W-12. |
| `pricing-source` | `scripts/lint/pricing.ts` | Any price string (e.g. `$5`, `$10`, `€7`) outside `10-licensing-billing/01-plans-matrix.md` must be a markdown link back to that file. | W-3. |
| `folder-overview` | `scripts/lint/folder-overview.ts` | Every directory under `spec/21-app/` (recursively, excluding hidden dirs and the root itself) MUST contain a file named exactly `00-overview.md`. The file MUST be ≥ 40 lines (proxy for "not a stub") AND MUST contain the headings `## 1. Responsibilities`, `## 2. File-by-file behaviour` (or `behavior`), `## 3. Tasks performed by this folder`, `## 4. What this folder is NOT`, `## 5. Cross-references`. Canonical template: `spec/21-app/templates/folder-overview.md`. Allowlist: `scripts/lint/folder-overview.allowlist.txt` (folders explicitly exempt — currently empty; `spec/21-app/templates/` is auto-exempt as a non-domain folder). | F-FOLDER-OVERVIEW (retrospective §8.1). |
| `brand-pink-anchor` | `scripts/lint/brand-pink.ts` | (a) `src/index.css` and `tailwind.config.ts` MUST contain a `--primary` (or `primary` HSL triple) resolving to exactly `343 79% 60%`. (b) No `.ts/.tsx/.css` file under `src/` may contain a literal hex matching `/#EC4868/i` outside `src/index.css` (token definition site). (c) No `.ts/.tsx/.css` may contain `347 81% 60%` (the rejected v1 value from Save Session paste). Allowlist: `scripts/lint/brand-pink.allowlist.txt` for documentation strings. | SI-021 + Save Session v1 reconciliation. Locked in `mem://index` Core. |
| `color-label-tokens` | `scripts/lint/color-label.ts` | (a) Any `.tsx` rendering a Item color label MUST reference `var(--color-label-{name})` or the Tailwind `bg-color-label-{name}` class — never a literal hex. (b) The token names referenced MUST be exactly the locked enum: `none, red, orange, yellow, green, teal, blue, purple, pink`. Any other name (notably `gray`, which Save Session v1 paste tried to introduce) fails. (c) `06-ui-ux/01-design-tokens.md §1.6` MUST define all 9 tokens for both light + dark themes. | SI-021. Locked in `mem://index` Core. |
| `collection-kind-discriminator` | `scripts/lint/collection-kind.ts` | (a) Any spec file that declares a Collection field MUST reference `kind` as a locked 2-value enum (`manual`, `session`); no third value permitted. (b) Any TS/SQL file under `src/` or `migrations/` that defines a `collection_kind` enum MUST list exactly those two values. (c) Conditional UI logic that gates `Restore session` / `Restore in new window` / `Re-capture from current window` MUST check `kind === 'session'`, not `captured_at != null`. (d) `Collection.kind` must never be mutated post-create (grep for assignment patterns). | SI-023. |
| `toast-placement` | `scripts/lint/toast-placement.ts` | (a) Exactly one `<Toaster />` (sonner) instance in the whole `src/` tree, mounted at app root. (b) Its `position` prop MUST resolve to `bottom-right` on desktop and `top-center` on mobile (responsive prop or two instances tied to a media-query helper, both acceptable). (c) No file passes `position="bottom-left"` or `position="top-right"` — both rejected by SI-024. (d) Any spec file under `06-ui-ux/` or `07-features/` mentioning toast placement MUST cite `06-ui-ux/11-feedback.md §2.1` rather than restating coordinates. | SI-024. |
| `endpoint-counts` | `scripts/lint/endpoint-counts.ts` | (a) Walks every table row across `03-api-endpoints/0[1-9]-*.md` … `03-api-endpoints/1[0-7]-*.md` (excludes `00-overview.md` and `18-error-codes.md`), parses the leading `METHOD /path` cell, and computes: total rows, distinct `(METHOD, path)` pairs, and per-method counts (`GET, POST, PATCH, PUT, DELETE`). (b) Re-reads `03-api-endpoints/00-overview.md §7` and asserts the printed numbers match the computed ones exactly. Off-by-one fails. (c) Asserts `distinct ≤ total` and that the difference equals the number of duplicate rows the script enumerates in its error message (so authors see *which* paths are duplicated). (d) Asserts every method bucket sum equals `total`. (e) On `--write` flag (used only by a maintainer-run script, never CI), regenerates §7 in place — CI itself runs read-only. | Counter Discipline rule (added 2026-04-29 after the 181→182 off-by-one in `00-overview.md §7`). Closes the audit gap that required manual Python sweeps. |
| `allowlist-discipline` | `scripts/lint/allowlist-discipline.ts` | Enforces the **Allowlist Discipline** meta-rule (see §2.1.3). For every file matching `scripts/lint/*.allowlist.txt`: (a) MUST start with a header block of comment lines (`#`-prefixed) declaring `# linter:` (matching one of the 16 sibling sub-check names), `# purpose:` (one-line reason this allowlist exists at all), and `# review-by:` (ISO date ≤ 180 days from today). (b) Every non-comment, non-blank line MUST be immediately preceded by a `#` comment line carrying `PR:#<number>` and `reason:<≥10 chars>`. Bare entries fail. (c) The whole file MUST be ≤ 50 non-comment lines — past that, the underlying rule is too loose and needs redesign, not more exceptions. (d) `# review-by:` dates that are in the past fail (forces quarterly re-justification). (e) Asserts every linter referenced in the §2.1.1 table either has zero allowlist file OR a compliant one — no orphan allowlists, no allowlists for sub-checks not in the table. | Allowlist Discipline meta-rule (added 2026-04-29). Prevents quiet exception-creep — the failure mode where a linter slowly becomes useless because every violation gets allowlisted instead of fixed. |

Implementation contract:
- Each linter is a standalone `ts-node` script under `scripts/lint/`.
- All scripts share a common output format: `{file}:{line}:{col} [{rule}] {message}` so editor jump-to-error works.
- Composite job runs every linter even if one fails (collect-then-report), so PR authors see all violations in one CI run.
- Allowlists live next to each linter as `*.allowlist.txt` and MUST conform to the Allowlist Discipline schema (§2.1.3). The `allowlist-discipline` sub-check enforces it.
- All scripts are pure read-only on `spec/21-app/**`; never modify files.

### 2.1.3 Allowlist Discipline (meta-rule)

Allowlists are escape hatches. Every escape hatch is a future regression unless it carries justification, an owner-of-record, and an expiry date. Without these three, "exception" silently becomes "policy" and the linter becomes decorative.

**Schema** — every file matching `scripts/lint/*.allowlist.txt` MUST follow this layout exactly:

```
# linter: <sub-check-name>            # e.g. "role-enum"; must match a row in §2.1.1
# purpose: <one-line reason this allowlist exists at all>
# review-by: <YYYY-MM-DD>             # ≤ 180 days from creation; past dates fail CI

# PR:#<number>  reason:<≥10 chars>
<allowed-value>

# PR:#<number>  reason:<≥10 chars>
<allowed-value>
```

**Hard limits:**
- ≤ 50 non-comment lines per file. Past that, the underlying rule needs redesign — not more exceptions.
- Every entry MUST cite a PR number and a reason. Bare entries (no preceding justification comment) fail.
- `# review-by:` MUST be refreshed every PR that touches the file, and re-justified at least every 180 days. Expired dates fail CI immediately (forces a deliberate re-review rather than indefinite drift).
- Removing an entry never requires justification. Adding one always does.
- An allowlist file with zero non-comment lines is fine (and preferred) — it documents intent without granting any exception.

**Why this is a meta-rule, not a regular linter rule:** the regular sub-checks lock specific invariants (role enum, brand pink, toast placement). Allowlist Discipline locks the *process* by which exceptions to those invariants get admitted. Without it, a single careless PR can permanently weaken any linter by appending one line to its allowlist. With it, every exception is auditable, time-bound, and visible in `git blame`.

**Locked in `mem://index` Core (2026-04-29).** Sibling rule to Counter Discipline — both meta-rules govern the linter system itself, not the spec content.

### 2.1.2 Pre-commit hook (developer-side)

A `.husky/pre-commit` (or equivalent) runs the same `spec-drift-linter` on staged `.md` files only (fast subset). This is advisory — CI is authoritative.

### 2.2 `deploy-dev.yml` — runs on merge to `main`

- Build + deploy web app + marketing + API to dev.
- Run smoke tests (per `21-testing/`).
- Post Slack notification with deploy URL + commit summary.

### 2.3 `deploy-staging.yml` — runs on tag `staging-vX.Y.Z`

- Build once (artifact cached).
- Deploy to staging.
- Run full e2e suite against staging.
- Run schema-migration check (forward + rollback dry-run on staging DB).
- Post Slack with link to QA checklist.
- Manual approval required to proceed.

### 2.4 `deploy-prod.yml` — runs on tag `vX.Y.Z`

- Reuse staging artifact (must be same SHA).
- Apply DB migrations (forward only; rollback plan documented in PR).
- Canary: route 10% traffic to new version for 24h.
- Auto-rollback if error rate > 2x baseline or p99 latency > 1.5x baseline for 5 consecutive minutes.
- After 24h clean, ramp to 100%.
- Tag the SHA in error reporter + analytics for release tracking.
- Publish release notes to `/changelog` (per `16-notifications-updates/01-in-app-updates-feed.md`).

### 2.5 `extension-publish.yml` — runs on tag `ext-vX.Y.Z`

- Build extension with prod env.
- Strip sourcemaps.
- Sign + zip.
- Upload to Chrome Web Store via API.
- Submit for review (manual queue per `04-extension/13-update-and-rollout.md`).

## 3. Rollback

- **Web app / marketing / API:** redeploy previous tag. Single command, < 2 min.
- **DB migrations:** every migration ships with a `down` script. Rollback within 24h is automated; beyond 24h requires data-migration plan.
- **Extension:** Chrome Web Store rollback to previous version via store dashboard; users update over next 24h.
- **Feature flag kill switch:** for in-progress launches, flip flag in admin panel; no redeploy needed.

## 4. Build secrets

Configured at workspace level in Lovable (per platform docs):
- `NPM_TOKEN` — only if private packages.
- `SENTRY_AUTH_TOKEN` (or GlitchTip) — for sourcemap upload.
- `CHROME_WEB_STORE_REFRESH_TOKEN` — for extension publish.
- `CHROME_WEB_STORE_CLIENT_ID` / `SECRET` — store API credentials.

## 5. Concurrency

- One in-flight deploy per environment; new deploys queue.
- Two PR merges within 5 min batch into one dev deploy.

## 6. Artifact retention

- Build artifacts retained 90 d.
- Deploy logs retained 1 y.
- Test results retained 30 d.

## 7. Cross-references

- Environments: `02-environments.md`
- Env vars: `03-env-vars.md`
- Build secrets: `04-secrets.md`
- Test suite location: `21-testing/` (when B4 closes)
