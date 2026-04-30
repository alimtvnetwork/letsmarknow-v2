<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: ad-hoc
status: closed
opened-on: 2026-04-29
closed-on: 2026-04-29
closed-because: 7 of 7 findings drained.
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
| SC3 | **S2** | ✅ **CLOSED Session 85.** `13-share-link.md §2` now scopes the reserved list to the `/t/{slug}` and `lmk/{org_handle}/{memorable_slug}` namespaces, clarifies that `{org_handle}` lives in a separate namespace (governed by `09-auth-accounts/`), and adds an explicit "why `new` is reserved" note pointing to the §1.4 create-redirect resolver row. | `13-share-link.md §2` |
| SC4 | **S2** | ✅ **CLOSED Session 85.** `12-revocation-and-expiry.md §12` now specifies the full `POST /v1/shares/:id/purge` contract: (a) `Idempotency-Key` required per `01-conventions.md §6`, (b) emits `share.purged` audit event written before row hard-delete commits, (c) terminates the 90-d analytics retention window early. `09-audit-log.md §3` adds the `share.purged` event row with payload schema. | `12-revocation-and-expiry.md §12`, `09-audit-log.md §3` |
| SC5 | **S2** | **Share-model file naming collision.** Folder has `01-share-model.md` flagged "v2 design note — NOT shipped in v1" while the v1 SoT lives at `02-data-model/07-share.md`. Locked Core memory rule says "Share model v1 = single-table (`02-data-model/share.md`)". The Core memory rule cites the wrong path — actual path is `02-data-model/07-share.md` (numbered prefix). `00-overview.md §9` correctly references `02-data-model/07-share.md`. Fix Core memory rule path. | `mem://index.md` Core rule (path correction); no spec-file change needed |
| SC6 | **S3** | ✅ **CLOSED Session 86.** `07-comments-and-reactions.md §2` `Reaction.emoji` row now points to §8 as SoT (20 entries — list was already enumerated; "(~30)" prose corrected to "20 entries") and notes the Free-plan `👍`-only restriction per §10. | `07-comments-and-reactions.md §2` |
| SC7 | **S3** | ✅ **CLOSED Session 86.** New §2.1 "Markdown-lite subset (locked)" enumerates supported constructs (bold, italic, inline code, strikethrough, autolink, mention, line break), explicitly lists what is NOT supported (headings, lists, blockquotes, tables, images, fenced code, raw HTML, `[label](url)` links, etc.), specifies sanitization (HTML-escape + fixed allow-list output tags + `rel="nofollow ugc noopener"` on `<a>`), and clarifies the 4 KB limit is measured on raw Markdown source UTF-8 bytes. | `07-comments-and-reactions.md §2.1` |

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
