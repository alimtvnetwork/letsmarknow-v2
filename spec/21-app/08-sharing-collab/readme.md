# 08 — Sharing & Collaboration

How Lets Mark Now turns private saves into shared, multi-player surfaces.

Two distinct collaboration models live here:
1. **Internal collab** — multiple Members of an Org working on the same Spaces/Collections in real time.
2. **External sharing** — exposing Collections / Groups / Items to non-Members via public links, password gates, or invite-only viewers.

## Reading order

1. `01-share-model.md` — the Share entity, scopes, link types.
2. `02-public-shares.md` — `/t/{slug}` viewer, SEO controls, indexability.
3. `03-password-shares.md` — gated viewers, brute-force defense.
4. `04-invite-only-shares.md` — per-email allowlist, magic-link auth.
5. `05-permissions-matrix.md` — what each role can do, everywhere.
6. `06-realtime-presence.md` — WebSocket presence, cursors, "editing" badges.
7. `07-comments-and-reactions.md` — Pro+ comments on Items + emoji reactions.
8. `08-notifications.md` — inbox + email + push for collab events.
9. `09-audit-log.md` — Team-tier history of who did what.
10. `10-embed-widget.md` — `<iframe>` embed of a shared Collection.
11. `11-share-analytics.md` — view counts, referrers, top items (Pro+).
12. `12-revocation-and-expiry.md` — link rotation, TTL, kill switch.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-share-model.md` | Share data model | P2 (v2 design note; v1 uses `02-data-model/07-share.md`) |
| `02-public-shares.md` | Public link viewer | P2 |
| `03-password-shares.md` | Gated viewer | P2 |
| `04-invite-only-shares.md` | Per-email viewer | P2 |
| `05-permissions-matrix.md` | Role capabilities | P0 (foundational) |
| `06-realtime-presence.md` | Live presence | P2 |
| `07-comments-and-reactions.md` | Discussion | P2 (Pro+) |
| `08-notifications.md` | Inbox / email / push | P2 |
| `09-audit-log.md` | Compliance log | P2 (Team tier) |
| `10-embed-widget.md` | Iframe embed | P2 |
| `11-share-analytics.md` | Share metrics | P2 (Pro+) |
| `12-revocation-and-expiry.md` | Lifecycle | P2 |
| `13-share-link.md` | ShareLink sub-model | P2 |
| `14-realtime-transport.md` | WebSocket/Realtime canon | P2 (transport infra) |

> **Phase legend:** P0 = MVP, P1 = v1, P2 = Collab, P3 = Mindmap/AI, P4 = Cross-browser. Source of truth: `20-roadmap/`.

## Locked rules

- **Private by default.** Every entity is private to its Org until a Share is created.
- **Server is sole authority.** Permission decisions happen server-side per request; client checks are UX hints only.
- **No public write.** Public/Password shares are read-only in v1.
- **Notes excluded by default** in shares; explicit opt-in per share.
- **One share per scope, many links.** A Collection has at most one `Share`; that Share can have multiple `ShareLink`s with different modes.
- **Revocation is instant.** Revoking a Share invalidates all links and tokens within 5 s globally (Redis bust + JWT short TTL).
- **Audit everything sensitive.** Share create/revoke, permission change, member add/remove always logged.
