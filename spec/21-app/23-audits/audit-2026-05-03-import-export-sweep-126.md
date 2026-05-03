# Audit 126 — `11-import-export/` Sweep

**Date:** 2026-05-03 MYT
**Session:** 126
**Scope:** First broad sweep of all 12 spec files in `spec/21-app/11-import-export/`.

---

## 1. Method

Drift checks against locked Core rules:

1. ULID leakage.
2. Bare "Workspace" label.
3. Hard-coded hex.
4. Bare endpoint paths (must be `/v1/`-prefixed).
5. Cross-check import/export endpoints against canonical inventory.

---

## 2. Findings

| Check | Result |
|-------|--------|
| ULID references | **0 hits** ✅ |
| Bare "Workspace" | **0 hits** ✅ |
| Hard-coded hex | **0 hits** ✅ |
| Non-`/v1/` paths | **0 hits** ✅ |
| Endpoint inventory cross-check | All 11 unique paths present in `03-api-endpoints/00-overview.md` ✅ |

Endpoints verified:
`/v1/imports`, `/v1/imports/upload`, `/v1/imports/:id/parse`, `/v1/imports/:id/status`, `/v1/imports/:id/preview`, `/v1/imports/:id/commit`, `/v1/exports`, `/v1/bulk/items`, `/v1/webhooks/inbound/:webhook_token`, `/v1/me/gdpr-export`, `/v1/exports/lmn-json/:account_token`.

---

## 3. Patches Applied

**None.**

---

## 4. Notes

- `09-gdpr-export.md` `/v1/me/gdpr-export` properly distinct from Org-level `/v1/organizations/:id/data-export` (per S118 auth-accounts pass).
- `10-migration-out.md` `/v1/exports/lmn-json/:account_token` (token-based, no bearer) correctly flagged as a migration-out path.
- `07-webhooks-and-api-imports.md` `/v1/webhooks/inbound/:webhook_token` aligns with billing webhook signature/dedupe pattern.
- `11-dedup-algorithm.md` references `/v1/imports/:id/commit` consistently with `03-import-pipeline.md`.

---

## 5. Outcome

`11-import-export/` passes broad sweep clean. No spec changes. Score impact: 0.
