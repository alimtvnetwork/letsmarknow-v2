---
audit-date: 2026-05-03
next-audit-by: 2027-05-03
audit-type: ad-hoc
status: closed
---

# Audit-150 — Notifications & Updates Sweep

**Date:** 2026-05-03 (Session 150)
**Scope:** `spec/21-app/16-notifications-updates/` — 5 files (433 lines) + `flow-diagram.mmd`.
**Trigger:** User `next`; folder never broadly audited.

## Method

- `rg` for `workspace`, hex colors, non-`/v1/` paths.
- `npx tsx scripts/lint/ulid-placeholder.ts` (post-SI-030 verifier).

## Findings

| # | Sev | File | Issue | Action |
|---|---|---|---|---|
| F1 | S3 | `01-in-app-updates-feed.md:29` | Mind-map mock copy said "See your workspace as a force-directed…" — Mind-map renders a Space's tree, so "workspace" violates the Toby split (workspace ≡ Space, never Org). | Patched → "See your Space as a force-directed…" (matches `15-visualization/04-mindmap-view.md` terminology) |

## Verifications (no defect)

- ✅ Zero hex colors.
- ✅ Zero non-`/v1/` API paths.
- ✅ Zero ULID placeholders.

## Result

1 S3 patch applied. Folder clean.

## Files changed

- `spec/21-app/16-notifications-updates/01-in-app-updates-feed.md`
- `spec/21-app/00-conversation-log.md`
- `spec/21-app/23-audits/audit-2026-05-03-notifications-updates-sweep-150.md` (new)
