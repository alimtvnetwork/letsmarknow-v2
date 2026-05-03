---
audit-date: 2026-05-03
next-audit-by: 2027-05-03
audit-type: ad-hoc
status: closed
---

# Audit-151 — Infrastructure Sweep

**Date:** 2026-05-03 (Session 151)
**Scope:** `spec/21-app/22-infrastructure/` — 14 files + `readme.md` + `flow-diagram.mmd`.
**Trigger:** User `next`; folder never broadly audited.

## Method

- `rg` for `workspace`, hex colors, non-`/v1/` paths.
- `npx tsx scripts/lint/ulid-placeholder.ts` (post-SI-030 verifier).

## Findings

**Zero defects.** All 4 `workspace` hits are legitimate technical uses, not Toby-product references:

| File:line | Meaning | Action |
|---|---|---|
| `readme.md:42` | "Build secrets in **workspace** settings" — refers to the Lovable/CI platform workspace (build-system concept). | Allowed |
| `09-ci-cd.md:54` | `next-singleton-invariants` linter description that **bans** the phrase "per-workspace Next" in spec. Must quote it verbatim. | Allowed |
| `09-ci-cd.md:171` | "Configured at **workspace** level in Lovable" — Lovable platform UI surface name. | Allowed |
| `13-iac.md:15,244` | Terraform **workspace** — first-class Terraform CLI concept (`terraform workspace`). | Allowed |

The single `#EC4868` hit in `09-ci-cd.md:50` is inside the `brand-pink-anchor` linter description that **bans** literal hex; it must cite the value to define the ban.

## Verifications (no defect)

- ✅ Zero non-`/v1/` API paths.
- ✅ Zero ULID placeholders.
- ✅ All `workspace` mentions are technical platform/tool concepts, none refer to the Toby product hierarchy.
- ✅ The 18 lint sub-checks (incl. the new `ulid-placeholder` from Audit-148) all listed in §2.1.1.

## Result

Folder clean. No patches required.

## Files changed

- `spec/21-app/00-conversation-log.md`
- `spec/21-app/23-audits/audit-2026-05-03-infrastructure-sweep-151.md` (new)
