# Audit-145 — Information Architecture Sweep

**Date:** 2026-05-03 (Session 145)
**Scope:** `spec/21-app/01-information-architecture/` — 4 files (`00-overview.md`, `01-hierarchy.md`, `readme.md`, `flow-diagram.mmd`).
**Trigger:** User `next` command; folder never broadly audited.

## Method

- `rg` for `workspace`, `ULID`, hard-coded hex colors.
- `rg` for non-`/v1/` API paths.
- Manual read of all 4 files for hierarchy-rule integrity.

## Findings

| # | Severity | File | Issue | Action |
|---|---|---|---|---|
| F1 | S3 | `readme.md:17` | Quick-reference tree labelled Organization as "(workspace bubble)" — violates locked Toby split rule (workspace = Space, not Organization). | **Patched** → "(left-rail bubble)" (neutral, matches `01-hierarchy.md:17`). |
| F2 | — | `00-overview.md:50` | "workspace-search" is a legitimate filename reference to `14-search/03-workspace-search.md`. | Allowed (file name). |

## Verifications (no defect)

- ✅ Zero ULID references.
- ✅ Zero hard-coded hex colors.
- ✅ Zero non-`/v1/` API paths.
- ✅ Hierarchy levels (Account → Org → Space → Collection → Group → Item) consistent across all files.
- ✅ Identifier rule §3.8 explicitly states UUIDv7 — matches Core memory.

## Result

1 S3 patch applied. Folder is clean.

## Files changed

- `spec/21-app/01-information-architecture/readme.md` (1 line)
- `spec/21-app/00-conversation-log.md` (append entry)
- `spec/21-app/23-audits/audit-2026-05-03-information-architecture-sweep-145.md` (new)
