# 08 — Sharing & Collaboration

How Lets Mark Now turns private saves into shared, multi-player surfaces.

Two distinct collaboration models live here:
1. **Internal collab** — multiple Members of an Org working on the same Spaces/Collections in real time.
2. **External sharing** — exposing Collections / Groups / Items to non-Members via public links, password gates, or invite-only viewers.

## Reading order

1. `share-model.md` — the Share entity, scopes, link types.
2. `public-shares.md` — `/t/{slug}` viewer, SEO controls, indexability.
3. `password-shares.md` — gated viewers, brute-force defense.
4. `invite-only-shares.md` — per-email allowlist, magic-link auth.
5. `permissions-matrix.md` — what each role can do, everywhere.
6. `realtime-presence.md` — WebSocket presence, cursors, "editing" badges.
7. `comments-and-reactions.md` — Pro+ comments on Items + emoji reactions.
8. `notifications.md` — inbox + email + push for collab events.
9. `audit-log.md` — Team-tier history of who did what.
10. `embed-widget.md` — `<iframe>` embed of a shared Collection.
11. `share-analytics.md` — view counts, referrers, top items (Pro+).
12. `revocation-and-expiry.md` — link rotation, TTL, kill switch.

## Files

| File | Purpose |
|---|---|
| `share-model.md` | Share data model |
| `public-shares.md` | Public link viewer |
| `password-shares.md` | Gated viewer |
| `invite-only-shares.md` | Per-email viewer |
| `permissions-matrix.md` | Role capabilities |
| `realtime-presence.md` | Live presence |
| `comments-and-reactions.md` | Discussion |
| `notifications.md` | Inbox / email / push |
| `audit-log.md` | Compliance log |
| `embed-widget.md` | Iframe embed |
| `share-analytics.md` | Share metrics |
| `revocation-and-expiry.md` | Lifecycle |

## Locked rules

- **Private by default.** Every entity is private to its Org until a Share is created.
- **Server is sole authority.** Permission decisions happen server-side per request; client checks are UX hints only.
- **No public write.** Public/Password shares are read-only in v1.
- **Notes excluded by default** in shares; explicit opt-in per share.
- **One share per scope, many links.** A Collection has at most one `Share`; that Share can have multiple `ShareLink`s with different modes.
- **Revocation is instant.** Revoking a Share invalidates all links and tokens within 5 s globally (Redis bust + JWT short TTL).
- **Audit everything sensitive.** Share create/revoke, permission change, member add/remove always logged.
