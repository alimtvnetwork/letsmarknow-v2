<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (3 of 7 closed)
opened-on: 2026-04-29
scope: 08-sharing-collab/ folder — rate-limit SoT splits, reserved-slug list collisions, share-model v1/v2 invariant integrity, endpoint cross-references, idempotency on revoke/purge
-->

# Audit — Sharing & Collab Sweep (Session 83)

**Date:** 2026-04-29 (Session 83, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 17 markdown files + `permissions-matrix.json` in `spec/21-app/08-sharing-collab/`, cross-checked against `03-api-endpoints/02-public-share-viewer.md` + `03-api-endpoints/10-shares.md` (canonical endpoints), `09-auth-accounts/13-rate-limit-values.md §4` (rate-limit SoT), `02-data-model/07-share.md` (v1 row schema), `01-conventions.md §6` (Idempotency-Key SoT).
**Reason:** First audit of this folder. High surface area (sharing is core to the product; multi-file with permissions matrix + share-link reserved-slug list + realtime + analytics).

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| SC1 | **S1** | ✅ **CLOSED Session 84.** Replaced numeric prose in `03-password-shares.md §4` with cross-reference to `13-rate-limit-values.md §4` SoT (10/15min per slug; 5/15min per IP; 100/24h slug lockout). Removed conflicting `50 attempts / 15 min / slug` line. | `03-password-shares.md §4` |
| SC2 | **S1** | ✅ **CLOSED Session 84.** Replaced blanket "60 req/min per share" in `02-public-shares.md §7` with explicit cross-reference to `13-rate-limit-values.md §4` two-tier SoT (`/t/:slug` 60/min, `/items` 120/min, `/comments` 10/min). | `02-public-shares.md §7` |
| SC5 | **S2** | ✅ **CLOSED Session 83.** Core memory rule path corrected from `02-data-model/share.md` → `02-data-model/07-share.md` and `08-sharing-collab/share-model.md` → `08-sharing-collab/01-share-model.md`. | `mem://index.md` |
| SC3 | **S2** | **Reserved-slug list collision with `org_handle` segment.** `13-share-link.md §2` reserves `org` as a top-level path slug. But the memorable-share URL surface is `/lmk/{org_handle}/{memorable_slug}` — `org_handle` is user-chosen and lives in a different namespace (Org-scoped, not under `/t/`). The reserved list is for the random `/t/{slug}` namespace only; should be made explicit. Additionally, `13-share-link.md §1.4` says `/lmk/new?slug=...` is the create-redirect target, but `new` IS in the §1.4 reserved memorable-slug list (`lmk`, `t`, `new`, `edit`) — internal use is fine but worth a one-line note that `new` is reserved precisely BECAUSE it's the create-redirect endpoint (so users can't claim `lmk/{org}/new` and shadow it). | `13-share-link.md §2` + §1.4 |
| SC4 | **S2** | **`POST /v1/shares/:id/purge` referenced but not in audit-trail / idempotency contract.** `12-revocation-and-expiry.md §95` references `POST /v1/shares/:id/purge` (declared in `10-shares.md §171`) but the folder file does NOT specify: (a) requires `Idempotency-Key` per `01-conventions.md §6`, (b) emits which audit event, (c) interacts with the 90-day analytics retention. Add cross-references; `09-audit-log.md` should list a `share.purged` event row. Same root cause as IE6 (idempotency contract scattered). | `12-revocation-and-expiry.md §10`; `09-audit-log.md` |
| SC5 | **S2** | **Share-model file naming collision.** Folder has `01-share-model.md` flagged "v2 design note — NOT shipped in v1" while the v1 SoT lives at `02-data-model/07-share.md`. Locked Core memory rule says "Share model v1 = single-table (`02-data-model/share.md`)". The Core memory rule cites the wrong path — actual path is `02-data-model/07-share.md` (numbered prefix). `00-overview.md §9` correctly references `02-data-model/07-share.md`. Fix Core memory rule path. | `mem://index.md` Core rule (path correction); no spec-file change needed |
| SC6 | **S3** | **`Reaction.emoji` "one of allowed set (~30)" is not enumerated.** `07-comments-and-reactions.md §34` declares the field but does not list the 30 emojis or pin a SoT. For codegen and cross-platform consistency (extension + web + mobile), the allowed set must be enumerated once. Mirrors IE5 (dedup_mode enum was undeclared). | `07-comments-and-reactions.md §2` |
| SC7 | **S3** | **`Comment.body` "Markdown-lite" is undefined.** `07-comments-and-reactions.md §22` declares "Markdown-lite, 4 KB" but never enumerates which Markdown subset is supported (bold? italic? links? code? mentions?). `@mention` syntax is mentioned in §45 but not formally part of the Markdown-lite contract. Lock the supported subset. | `07-comments-and-reactions.md §2` (or new §X) |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | SC1 + SC2 | Two **S1** — same root cause (rate-limit SoT split). One file each + cross-link to `13-rate-limit-values.md`. Trivial. |
| Following | SC3 + SC4 + SC5 | Three **S2** — reserved-slug clarification + purge contract + memory path fix. Touches `13-share-link.md`, `12-revocation-and-expiry.md`, `09-audit-log.md`, and `mem://index.md`. |
| Following | SC6 + SC7 | Two **S3** polish — emoji enum + Markdown-lite subset. Single session. |

Total estimated: 3 sessions to fully drain.

---

## 3. Files NOT deeply audited (spot-checked only)

`04-invite-only-shares.md`, `05-permissions-matrix.md`, `06-realtime-presence.md`, `08-notifications.md`, `10-embed-widget.md`, `11-share-analytics.md`, `14-realtime-transport.md`, `url-normalization.md`, `flow-diagram.mmd`, `readme.md` — read for keyword matches only (status enum, spelling, money fields, role names, endpoint declarations, UUID/ULID, rate-limit references). No drift detected on those passes.

## 4. Cross-references

- Share endpoints SoT: `03-api-endpoints/10-shares.md` + `02-public-share-viewer.md`.
- Rate-limit SoT: `09-auth-accounts/13-rate-limit-values.md §4`.
- Share row v1 SoT: `02-data-model/07-share.md`.
- Idempotency contract SoT: `03-api-endpoints/01-conventions.md §6`.
- Reserved-slug list SoT: `08-sharing-collab/13-share-link.md §2`.
- Last closed audit: `audit-2026-04-29-import-export-sweep-78.md` (8/8).
