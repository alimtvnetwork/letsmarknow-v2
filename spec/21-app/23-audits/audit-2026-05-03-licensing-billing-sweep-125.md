# Audit 125 — `10-licensing-billing/` Sweep

**Date:** 2026-05-03 MYT
**Session:** 125
**Scope:** First broad sweep of all 17 spec files in `spec/21-app/10-licensing-billing/` (touched only via webhook contracts in S121).

---

## 1. Method

Drift checks against locked Core rules:

1. ULID leakage.
2. Bare "Workspace" label.
3. Role-enum drift.
4. Hard-coded hex colors.
5. Bare endpoint paths (must be `/v1/`-prefixed).
6. Cross-check billing endpoints against canonical inventory in `03-api-endpoints/00-overview.md`.

---

## 2. Findings

| Check | Result |
|-------|--------|
| ULID references | **0 hits** ✅ |
| Bare "Workspace" | **0 hits** ✅ |
| Role enum | All references use locked values (`owner`, `admin`, `billing`); `16-billing-emails.md §23` correctly cites the locked enum ✅ |
| Hard-coded hex | **0 hits** ✅ |
| Non-`/v1/` API paths | **0 hits** ✅ |
| `/settings/billing/refund` (`13-cancellations-and-refunds.md:68`) | **UI route**, not API — legitimate ✅ |
| Billing endpoint declarations | All `/v1/billing/*`, `/v1/organizations/:id/billing/*`, `/v1/me/entitlements`, `/v1/webhooks/{stripe,paddle}` present in canonical inventory §1.11/§2.13/§4.1 ✅ |

---

## 3. Patches Applied

**None.**

---

## 4. Notes

- `16-billing-emails.md` correctly enforces "only `billing` and `owner` receive billing email; `admin` is fallback when zero billing-role members" — aligns with locked enum semantics.
- `12-billing-webhooks.md` Stripe + Paddle handler contracts align with `03-api-endpoints/17-billing-webhooks.md` and the new Apple notification webhook (S121).
- `15-sku-map.md` correctly gates live SKU IDs to `owner`/`billing` only.
- `02-entitlements-engine.md` `/v1/me/entitlements` is the SoT, properly cross-referenced from `16-licenses.md` in the canonical inventory.

---

## 5. Outcome

`10-licensing-billing/` passes broad sweep clean. No spec changes. Score impact: 0.
