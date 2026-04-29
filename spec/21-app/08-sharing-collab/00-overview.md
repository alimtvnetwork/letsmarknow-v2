# 00 — Sharing & Collaboration Folder Overview

> **Purpose.** Define how users **share content beyond their own account** and how multiple users can **collaborate inside an Org**. This folder owns the share model, share audiences (public, password, invite-only), the permissions matrix, real-time presence, comments and reactions, notifications, audit log, embed widget, share analytics, and revocation/expiry.

---

## 1. Responsibilities

1. **Share model.** v1 is a **single-table** model (`02-data-model/07-share.md`). The richer multi-table v2 design lives here as a *design note only*, not a contradiction.
2. **Audiences.** Public link, password-protected link, invite-only (named users).
3. **Permissions matrix.** Role × action × target → allow/deny. Source of truth for RLS policies and API guards.
4. **Real-time.** Presence, comments, reactions over Supabase Realtime (W-2 lock); channel naming `org:{org_id}`, `space:{space_id}`, `collection:{collection_id}`, `item:{item_id}`, `share:{share_token}`, `account:{account_id}` (W-4 lock — see `14-realtime-transport.md §2`).
5. **Notifications.** Email + in-app toasts for share invites, comments, role changes.
6. **Audit log.** What gets logged, where it surfaces, retention.
7. **Embed widget.** Iframe-able read-only viewer for shared Collections.
8. **Share analytics.** Per-share view count, last viewed, country histogram (privacy-preserving).
9. **Revocation & expiry.** Hard revoke, time-based expiry, password rotation effect.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-share-model.md` | v2 design note (multi-table). v1 is `02-data-model/07-share.md`. |
| `02-public-shares.md` | Anonymous read; cookie-less except for view-mode preference; rate limit. |
| `03-password-shares.md` | Argon2id-hashed password; unlock cookie; rotation rules. |
| `04-invite-only-shares.md` | Named-user invites via email; token hash; expiry. |
| `05-permissions-matrix.md` | Authoritative role × action table. Backed by `permissions-matrix.json`. |
| `06-realtime-presence.md` | Who's currently viewing a Collection; cursor/selection broadcast. |
| `07-comments-and-reactions.md` | Threaded comments per Item; emoji reactions; mention notifications. |
| `08-notifications.md` | In-app inbox + email triggers; opt-out per category. |
| `09-audit-log.md` | What gets logged (share created, password changed, member role changed). |
| `10-embed-widget.md` | Iframe contract for embedding a Collection on third-party sites. |
| `11-share-analytics.md` | View counts, anonymised geography; aggregation interval. |
| `12-revocation-and-expiry.md` | Hard revoke, scheduled expiry, expired-link UX. |
| `13-share-link.md` | Slug shape, character set, length, collision handling. |
| `14-realtime-transport.md` | Supabase Realtime channels; W-4 channel-naming lock; subscribe/unsubscribe lifecycle. |
| `permissions-matrix.json` | Machine-readable mirror of `05-permissions-matrix.md`. |

---

## 3. Tasks performed by this folder

- **Lock the share row format** for v1 (one table; v2 is a design note).
- **Lock the role × action permission matrix** that RLS and edge functions enforce.
- **Define the realtime transport** and channel naming convention (W-2, W-4).
- **Define notification triggers** that the email provider (`22-infrastructure/11-email-provider.md`) sends.
- **Define embed widget security** so a third-party iframe cannot escape its sandbox.

---

## 4. What this folder is NOT

- **Not the share row schema.** That is `02-data-model/07-share.md`.
- **Not the share-viewer page.** That is `05-web-app/14-share-viewer.md`.
- **Not the auth model.** Identity and sessions live in `09-auth-accounts/`.

---

## 5. Cross-references

- Share row schema (v1): `02-data-model/07-share.md`.
- Share viewer page: `05-web-app/14-share-viewer.md`.
- Realtime infra: `22-infrastructure/01-hosting.md` §Realtime.
- Share-link security: `19-security-privacy/05-share-link-security.md`.
- Email triggers: `22-infrastructure/11-email-provider.md`.
