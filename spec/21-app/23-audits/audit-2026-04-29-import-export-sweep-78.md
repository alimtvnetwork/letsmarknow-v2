<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (2 of 8 closed)
opened-on: 2026-04-29
scope: 11-import-export/ folder — status enum coherence, US/UK spelling, rate-limit SoT alignment, dedup_mode enum, idempotency rules, GDPR-export field naming
-->

# Audit — Import & Export Sweep (Session 78)

**Date:** 2026-04-29 (Session 78, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 12 markdown files in `spec/21-app/11-import-export/`, cross-checked against `03-api-endpoints/15-import-export.md` (canonical endpoint contracts), `03-api-endpoints/01-conventions.md` (envelope + idempotency rules), `09-auth-accounts/13-rate-limit-values.md` (rate-limit SoT), and the just-locked LB1 closure (`canceled` US spelling locked).
**Reason:** First audit of this folder. Adjacent to LB1 closure (Session 75 unified `canceled` US) — high-leverage moment to find UK-spelling drift folder-wide.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| IE1 | **S1** | ✅ **CLOSED Session 79.** Replaced UK `cancelled`/`Cancelled` with US `canceled` in `03-import-pipeline.md` (lines 112, 170) and `06-large-imports.md` (lines 79, 105). Verified `rg 'cancelled\|Cancelled' spec/21-app/11-import-export/` → CLEAN. | `03-import-pipeline.md`; `06-large-imports.md` |
| IE2 | **S1** | ✅ **CLOSED Session 79.** Removed competing `import_state=…` enum from `03-import-pipeline.md` line 98 + 112 (now reference canonical top-level `status` from `15-import-export.md` line 250). Reframed `06-large-imports.md §3` checkpoint chain as **internal worker `phase` sub-states** under top-level `status=running`, not a competing top-level enum. Wire enum unchanged. | `03-import-pipeline.md`; `06-large-imports.md` |
| IE3 | **S2** | **Email-in rate-limit drift between folders.** `08-email-in.md §7` table lists "Pro: 100 emails/24h, 5 MB; Team: 1,000 emails/24h, 10 MB". `09-auth-accounts/13-rate-limit-values.md §5` lists `POST /v1/webhooks/email-in` at "60 / min" per-org address — a per-minute API gateway limit, not a per-plan daily quota. The two limits are not contradictory but BOTH are presented as authoritative without cross-reference. The `08-email-in.md` table needs a one-line "API gateway also enforces 60/min per inbound address (`09-auth-accounts/13-rate-limit-values.md §5`)" and the auth-accounts file needs to acknowledge the daily plan quotas live in `08-email-in.md`. | `08-email-in.md §7`; `09-auth-accounts/13-rate-limit-values.md §5` |
| IE4 | **S2** | **API/webhook rate-limit table drift between folders.** `07-webhooks-and-api-imports.md §4` declares its own table: Pro 60 read/min, Team 600 read + 60 write/min, Enterprise custom. `09-auth-accounts/13-rate-limit-values.md` is supposed to be the SoT for all plan-tier rate limits and does not contain these values. Either fold the API-token bucket values into `13-rate-limit-values.md` and reference from `07-webhooks-and-api-imports.md`, or explicitly mark `07-webhooks-and-api-imports.md §4` as the SoT for API-token tier limits and have `13-rate-limit-values.md` link out. Pick one. | `07-webhooks-and-api-imports.md §4`; `09-auth-accounts/13-rate-limit-values.md` |
| IE5 | **S2** | **`dedup_mode` field used in telemetry without a declared enum.** `03-import-pipeline.md` line 167 (`import.commit_started { dedup_mode }`) and `05-mapping-and-dedup.md` line 146 (`import.dedup_summary { …, mode }`) reference `dedup_mode` as a telemetry property but no file enumerates the allowed values. `11-dedup-algorithm.md` describes the algorithm but does not declare `dedup_mode` as an enum. Add an explicit enum (likely `merge \| skip \| import_anyway` based on §90 telemetry hints) to `05-mapping-and-dedup.md` or `11-dedup-algorithm.md`, then have the canonical commit endpoint (`03-api-endpoints/15-import-export.md POST /v1/imports/:id/commit`) reference it. | `05-mapping-and-dedup.md` or `11-dedup-algorithm.md`; cross-link from `03-import-pipeline.md` and `15-import-export.md` |
| IE6 | **S2** | **Idempotency-Key contract underspecified.** `07-webhooks-and-api-imports.md §5` says "stored 24h; replay returns prior response" but the canonical convention at `03-api-endpoints/01-conventions.md` should be the SoT. `03-import-pipeline.md §87` separately says "Idempotency-Key (UUID, client-generated) prevents double-commit" with no TTL or storage semantics. `09-gdpr-export.md §36` says "Idempotency-Key auto-set per Account per 24h". Three different specifications of one mechanism. Verify `03-api-endpoints/01-conventions.md` declares the canonical contract; if so, replace local prose with a one-line cross-reference. If not, this is a missing spec and needs writing once and referencing thrice. | `07-webhooks-and-api-imports.md §5`; `03-import-pipeline.md §87`; `09-gdpr-export.md §36` |
| IE7 | **S3** | **GDPR export bundle filename casing inconsistency.** `09-gdpr-export.md §4` mixes `account.json`, `billing.json` (lowercase) with `organizations/<org_slug>/` (lowercase) but `README.md` (uppercase). Pick one convention. README.md is the standard convention for repo-style bundles and should stay uppercase, but a one-line note explaining "All data files lowercase; README.md keeps standard uppercase per convention" prevents future drift. | `09-gdpr-export.md §4` |
| IE8 | **S3** | **`webhook_token` vs `account_token` vs `migration-token` naming.** `07-webhooks-and-api-imports.md §63` uses `:webhook_token`, `10-migration-out.md §88` uses `{account_token}` (curly braces, not colon), `10-migration-out.md §88` prose says "migration-token". Three styles for path tokens. Canonical convention at `03-api-endpoints/01-conventions.md` should specify `:param` style only. Normalize `{account_token}` → `:account_token`. | `10-migration-out.md §88` |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | IE1 + IE2 | Two **S1** — same root cause (status enum drift). Touches 2 files + cross-links to `15-import-export.md`. |
| Following | IE3 + IE4 + IE5 + IE6 | Four **S2** — rate-limit SoT consolidation + enum/contract cross-references. Touches `07-webhooks-and-api-imports.md`, `08-email-in.md`, `09-auth-accounts/13-rate-limit-values.md`, dedup files, `01-conventions.md`. |
| Following | IE7 + IE8 | Two **S3** polish — single session. |

Total estimated: 3 sessions to fully drain.

---

## 3. Files NOT deeply audited (spot-checked only)

- `00-overview.md`, `01-formats.md`, `02-importers.md`, `04-export-pipeline.md`, `10-migration-out.md`, `11-dedup-algorithm.md`, `flow-diagram.mmd`, `readme.md` — read for keyword matches only (status enum, spelling, money fields, role names, endpoint declarations).

## 4. Cross-references

- Canonical import/export endpoints SoT: `03-api-endpoints/15-import-export.md`.
- Canonical status enum line: `03-api-endpoints/15-import-export.md` line 250.
- Canonical rate-limit SoT: `09-auth-accounts/13-rate-limit-values.md`.
- LB1 closure (US spelling locked): `audit-2026-04-29-licensing-billing-sweep-74.md` LB1.
- API conventions (idempotency, envelope): `03-api-endpoints/01-conventions.md`.
- Last closed audit: `audit-2026-04-29-licensing-billing-sweep-74.md` (10/10).
