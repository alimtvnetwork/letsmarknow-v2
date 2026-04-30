<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: closed (8 of 8 closed, 2026-04-29)
opened-on: 2026-04-29
scope: 11-import-export/ folder — status enum coherence, US/UK spelling, rate-limit SoT alignment, dedup_mode enum, idempotency rules, GDPR-export field naming
-->

# Audit — Import & Export Sweep (Session 78)

**Date:** 2026-04-29 (Session 78, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 12 markdown files in `spec/21-app/11-import-export/`, cross-checked against `03-api-endpoints/15-import-export.md` (canonical endpoint contracts), `03-api-endpoints/01-conventions.md` (envelope + idempotency rules), `09-auth-accounts/13-rate-limit-values.md` (rate-limit SoT), and the just-locked LB1 closure (`canceled` US spelling locked).
**Reason:** First audit of this folder. Adjacent to LB1 closure (Session 75 unified `canceled` US) — high-leverage moment to find UK-spelling drift folder-wide.

> **CLOSED 2026-04-29 (Session 81).** All 8 findings resolved across Sessions 79–81.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| IE1 | **S1** | ✅ **CLOSED Session 79.** Replaced UK `cancelled`/`Cancelled` with US `canceled` in `03-import-pipeline.md` (lines 112, 170) and `06-large-imports.md` (lines 79, 105). Verified `rg 'cancelled\|Cancelled' spec/21-app/11-import-export/` → CLEAN. | `03-import-pipeline.md`; `06-large-imports.md` |
| IE2 | **S1** | ✅ **CLOSED Session 79.** Removed competing `import_state=…` enum from `03-import-pipeline.md` line 98 + 112 (now reference canonical top-level `status` from `15-import-export.md` line 250). Reframed `06-large-imports.md §3` checkpoint chain as **internal worker `phase` sub-states** under top-level `status=running`, not a competing top-level enum. Wire enum unchanged. | `03-import-pipeline.md`; `06-large-imports.md` |
| IE3 | **S2** | ✅ **CLOSED Session 80.** Added explicit "Two limits stack" preamble to `08-email-in.md §7` cross-referencing the `60/min` gateway limit; added a back-reference row to `09-auth-accounts/13-rate-limit-values.md §1` cross-ref table delegating plan-tier daily quotas to email-in spec. | `08-email-in.md §7`; `09-auth-accounts/13-rate-limit-values.md` |
| IE4 | **S2** | ✅ **CLOSED Session 80.** Marked `07-webhooks-and-api-imports.md §4` explicitly as **SoT for API-token tier rate buckets** (Pro/Team/Enterprise); added back-reference row in `13-rate-limit-values.md §1` cross-ref table delegating those values. Generic class limits in `01-conventions.md §8` remain orthogonal. | `07-webhooks-and-api-imports.md §4`; `09-auth-accounts/13-rate-limit-values.md` |
| IE5 | **S2** | ✅ **CLOSED Session 80.** Declared canonical `dedup_mode` telemetry enum (`skip \| merge \| allow`) in `11-dedup-algorithm.md §6` with explicit distinction from the wire-level `on_duplicate` enum (`skip \| overwrite \| create_new \| merge_tags`) on `POST /v1/imports/:id/commit`. Cross-referenced from `03-import-pipeline.md §14` and `05-mapping-and-dedup.md §12`. | `11-dedup-algorithm.md` |
| IE6 | **S2** | ✅ **CLOSED Session 80.** Verified `03-api-endpoints/01-conventions.md §6` is canonical Idempotency-Key SoT (UUID, 24h TTL, body-mismatch → `400 IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY`). Replaced local prose in `03-import-pipeline.md §7`, `07-webhooks-and-api-imports.md §5`, and `09-gdpr-export.md §3` with cross-references to §6. GDPR case noted as server-synthesized variant. | `03-import-pipeline.md`; `07-webhooks-and-api-imports.md`; `09-gdpr-export.md` |
| IE7 | **S3** | ✅ **CLOSED Session 81.** Added explicit filename-convention note to `09-gdpr-export.md §4`: all data files lowercase; `README.md` keeps standard uppercase per repo-bundle convention. | `09-gdpr-export.md §4` |
| IE8 | **S3** | ✅ **CLOSED Session 81.** Normalized `{account_token}` → `:account_token` in `10-migration-out.md §88` with explicit reference to `:param` convention SoT in `03-api-endpoints/01-conventions.md`. `:webhook_token` already conformed. | `10-migration-out.md §88` |

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
