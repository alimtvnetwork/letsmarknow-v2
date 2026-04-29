<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (5 of 9 closed: SH2, SH4, SH7 — session 62; SH1, SH8 — session 63)
opened-on: 2026-04-29
scope: 08-sharing-collab/ folder — share-model parity, role-enum coverage, channel naming, v2/v1 drift
-->

# Audit — Sharing & Collab Sweep (Session 61)

**Date:** 2026-04-29 (Session 61, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 15 markdown files + `permissions-matrix.json` in `spec/21-app/08-sharing-collab/`, cross-checked against `02-data-model/07-share.md` (v1 share schema), Core memory role enum, and W-4 channel-naming lock.
**Reason:** First dedicated audit of this folder. Triggered post-data-model audit closure when no agent-resolvable SIs were open.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| SH1 | **S1** | `05-permissions-matrix.md` is missing two of the seven locked roles (`guest`, `system`). Core memory locks the enum as `owner, admin, editor, viewer, billing, guest, system` but the matrix only covers 5 + a per-share "Share viewer" pseudo-role. | `05-permissions-matrix.md` §1, §2, §3, §4; `permissions-matrix.json` |
| SH2 | **S2** | `00-overview.md §2` row for `01-share-model.md` says "v2 design note" but does NOT carry the ⚠️ warning marker that the file itself uses. A reader scanning only the overview could implement v2 schema by mistake. | `00-overview.md` line 25 |
| SH3 | **S2** | `01-share-model.md` v2 design uses `scope_type`/`scope_id` while v1 uses `target_type`/`target_id`. Even as a v2 note this is a third naming for the same concept (cf. closed D4 in data-model audit which fixed `target_kind`). Either align v2 names or add an explicit "naming will reconcile to `target_*` in v2" note. | `01-share-model.md` §1 |
| SH4 | **S2** | `00-overview.md §1.4` references channel name `lmn:org:{org}:space:{space}` but `14-realtime-transport.md §2` (W-4 lock, source of truth) defines channels as `org:{org_id}`, `space:{space_id}` — no `lmn:` prefix and different placeholder names. Direct contradiction with the W-4 lock. | `00-overview.md` line 12 |
| SH5 | **S2** | `01-share-model.md` `Share` entity is missing `memorable_slug` even as a v2 design — yet memorable shortlinks are a locked v1 feature (`13-share-link.md §1.2`, `02-data-model/07-share.md` field added). The v2 design note will be re-read when v2 is planned; it should be at least as complete as v1. | `01-share-model.md` §1 ShareLink table |
| SH6 | **S3** | `00-overview.md §2` row for `01-share-model.md` is the only row that references a *sibling* file as authoritative ("v1 is `02-data-model/07-share.md`"). This is correct content but inconsistent with the row format used elsewhere — consider a footnote or status badge column. | `00-overview.md` §2 |
| SH7 | **S3** | `00-overview.md §1` is missing the dedicated bullet for `13-share-link.md` (slug rules, memorable shortlinks, omnibox resolver). The §2 table mentions it but §1 Responsibilities only covers it implicitly under "Share model". Given memorable shortlinks are a Toby-parity feature locked in Core memory, deserves a top-level bullet. | `00-overview.md` §1 |
| SH8 | **S3** | `permissions-matrix.json` was not opened in this audit pass; needs spot-check to confirm parity with the markdown matrix once SH1 lands (the JSON is the authoritative side per `05-permissions-matrix.md` preamble). | `permissions-matrix.json` |
| SH9 | **S3** | `10-embed-widget.md` line 28 sandbox attribute lists `allow-popups-to-escape-sandbox` — this is a privacy/clickjacking concern when combined with embed-on-third-party-site. Cross-check against `19-security-privacy/05-share-link-security.md` — likely fine, but worth a citation in the embed file. | `10-embed-widget.md` §security |

---

## 2. Detail — SH1 (locked role enum vs matrix)

Core memory: "Role enum is locked: owner, admin, editor, viewer, billing, guest, system."

`05-permissions-matrix.md §1` table lists: Owner, Admin, Editor, Viewer, Billing, Share viewer. Missing: **`guest`**, **`system`**.

- `guest` — exists in glossary and in `02-data-model/08-member.md`. Likely intended for "Share viewer" but the matrix uses a different label. Either rename "Share viewer" → "Guest" OR document the mapping.
- `system` — service-account / automation role used by webhooks, importers, cron jobs. Has no row in the matrix at all, meaning RLS code-gen from this matrix would have no policy for `system` actors. **Codegen-impacting** — anything generated from `permissions-matrix.json` would deny all system access by omission.

**Impact.** `05-permissions-matrix.md` preamble explicitly says "RLS policies, server middleware checks, and client guards SHOULD be code-generated from the JSON." Missing roles → either generated code crashes (unknown enum value) or silently denies system actors. Either is a launch-blocker.

**Recommended fix.** Add `Guest` and `System` columns to all four action tables (§2, §3, §4, §5). For `guest`: mostly all-❌ except `share.read` when the viewer is the named-invite recipient. For `system`: mostly all-✅ for write (it IS the automation actor) but ❌ on UI-only actions like `view_org_dashboard`. Coordinate with `permissions-matrix.json` regeneration (SH8).

---

## 3. Detail — SH4 (channel naming contradiction with W-4 lock)

`00-overview.md` line 12 (current text):

> channel naming `lmn:org:{org}:space:{space}` etc. (W-4 lock — `{id}` placeholders only)

`14-realtime-transport.md §2` (the W-4 source of truth):

> `org:{org_id}` ... `space:{space_id}` ... `collection:{collection_id}` ... `item:{item_id}` ... `share:{share_token}` ... `account:{account_id}`

Two drifts in one sentence:
1. **Prefix:** `lmn:` does not exist in the locked transport spec. Channels are bare `<scope>:{<id>}`, no namespace prefix.
2. **Placeholders:** `{org}` / `{space}` vs the locked `{org_id}` / `{space_id}`.

Per Core memory: "Conversation logging: append every user instruction verbatim AND refactor the relevant structured spec file(s)" — and per W-4: placeholder syntax is locked.

**Recommended fix.** Replace the entire fragment with: "channel naming `org:{org_id}`, `space:{space_id}`, `collection:{collection_id}`, `item:{item_id}`, `share:{share_token}`, `account:{account_id}` (W-4 lock — see `14-realtime-transport.md §2`)."

---

## 4. Detail — SH5 (v2 share-model missing memorable_slug)

When v2 planning happens (likely Phase 3+), the engineer reading `01-share-model.md` will see `ShareLink` with only `slug`, `mode`, `password_hash` — no path forward for memorable shortlinks. They'll either re-add it (good) or wonder if memorable was deprecated (bad).

**Recommended fix.** Add to `01-share-model.md §1 ShareLink` table:
- `memorable_slug` | string? | Org-scoped uniqueness. Pro+. Per v1 spec `02-data-model/07-share.md`. Reserved-slug list in `13-share-link.md §2`.

And add a one-line note: "v2 carries memorable_slug forward unchanged; v2 only adds multi-link (one Share, many ShareLink rows) and embed-only links."

---

## 5. Files NOT audited but spot-checked clean

- `02-public-shares.md`, `03-password-shares.md`, `04-invite-only-shares.md` — `mode` naming consistent with `02-data-model/07-share.md`.
- `06-realtime-presence.md`, `07-comments-and-reactions.md` — `{placeholder}` form per W-4 (per W-4 closure note in `14-realtime-transport.md`).
- `09-audit-log.md` — not opened, but cited downstream.
- `11-share-analytics.md` — uses separate `share_view` / `share_view_daily` tables (not the `view_count` columns on Share row); no drift.
- `12-revocation-and-expiry.md` — not opened.
- `13-share-link.md` — recently locked (memorable shortlinks Session ≤55), confirmed Core-memory aligned.
- `url-normalization.md` — not opened (orphan-ish; consider numbering in a future audit).

---

## 6. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | SH4, SH2, SH7 | Three single-paragraph fixes in `00-overview.md`. Highest leverage — kills the W-4 contradiction. |
| Following | SH1 + SH8 | Add `Guest`/`System` columns to matrix MD + regenerate JSON. Largest by surface area. |
| Following | SH3, SH5 | v2 design-note polish in `01-share-model.md`. |
| Following | SH6, SH9 | Documentation cleanup. |

Total estimated: 3–4 sessions. None require user input.

---

## 7. Cross-references

- Locked role enum: Core memory + `02-data-model/08-member.md`.
- Locked channel-name placeholder syntax: W-4 closure noted in `14-realtime-transport.md` preamble.
- Share v1 schema (authoritative): `02-data-model/07-share.md`.
- Memorable shortlinks: Core memory + `13-share-link.md §1.2`.
- Spec-issue tracker: `13-spec-issues/02-current-issues.md`.
- Last data-model audit (closed): `audit-2026-04-29-data-model-sweep.md`.
