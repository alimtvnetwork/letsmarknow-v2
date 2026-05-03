---
audit-date: 2026-05-03
next-audit-by: 2027-05-03
audit-type: ad-hoc
status: closed
---

# Audit-152 — Sharing & Collab Sweep

**Date:** 2026-05-03 (Session 152)
**Scope:** `spec/21-app/08-sharing-collab/` — 17 files (`00-overview.md`, `01-share-model.md` … `14-realtime-transport.md`, `url-normalization.md`, `permissions-matrix.json`, `readme.md`) + `flow-diagram.mmd`.
**Trigger:** User `next`; folder never broadly audited.

## Method

- `rg` for `workspace`, hex colors, non-`/v1/` paths.
- `npx tsx scripts/lint/ulid-placeholder.ts` (post-SI-030 verifier).

## Findings

**Zero defects.**

| Check | Result |
|---|---|
| `workspace` literal | 0 |
| Hard-coded hex | 0 |
| ULID placeholders | 0 |
| Non-`/v1/` API paths | 1 hit at `04-invite-only-shares.md:37` (`GET /t/{slug}?inv=<token>`) — **legitimate**: `/t/{slug}` is the locked public share-viewer URL surface (Core memory: "random `/t/{slug}` always available"; SoT: `13-share-link.md §1.2`). Not an API path. |
| Locked share v1 = single-table | ✅ `01-share-model.md` is the v2 design note (per Core memory); v1 SoT is `02-data-model/share.md` |
| `/lmk/{org_handle}/{memorable_slug}` memorable URL | ✅ documented in `13-share-link.md §1.2 + §1.4` |

## Verifications (no defect)

- ✅ Realtime channel templates use `{id}` curly-brace form (W-4 lock).
- ✅ Role enum references match locked 7-value list.
- ✅ Reserved memorable-slugs (`lmk`, `t`, `new`, `edit`) not used as actual paths.

## Result

Folder clean. No patches required.

## Files changed

- `spec/21-app/00-conversation-log.md`
- `spec/21-app/23-audits/audit-2026-05-03-sharing-collab-sweep-152.md` (new)
