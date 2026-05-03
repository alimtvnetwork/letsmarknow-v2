# Audit 124 — `02-data-model/` Broad Sweep

**Date:** 2026-05-03 MYT
**Session:** 124
**Scope:** First broad sweep of all 14 spec files + `templates/` in `spec/21-app/02-data-model/`.

---

## 1. Method

Drift checks against locked Core rules:

1. ULID leakage (UUIDv7 only).
2. Bare "Workspace" label (must split → Space + Organization).
3. Role-enum drift (locked 7-value `org_role`).
4. `color_label` enum drift (locked 9 values).
5. Hard-coded hex colors.
6. Identifier discipline (every PK/FK = `uuid`).

---

## 2. Findings

| Check | Result |
|-------|--------|
| ULID references | 1 hit (`00-overview.md:10`) — **legitimate** (states "Never ULID" rule) ✅ |
| Bare "Workspace" | **0 hits** ✅ |
| Role enum | `08-member.md:15` declares the canonical 7-value enum verbatim — matches lock ✅ |
| `color_label` enum | `05-item.md:26` declares all 9 values verbatim — matches lock ✅ |
| Hard-coded hex | **0 hits** ✅ |
| FK/PK discipline | All entity tables use `uuid` (UUIDv7) — verified across 06/07/11/12/13 ✅ |
| RLS template | `templates/entity-rls.md` correctly mandates `has_role()` SECURITY DEFINER pattern (no recursive joins) ✅ |

---

## 3. Patches Applied

**None.** Folder is the source-of-truth for the locked rules and is internally consistent.

---

## 4. Notes

- `08-member.md` and `17-admin-org/03-roles.md` remain in lock-step on the role enum.
- `05-item.md` `color_label` enum is the single declaration site; downstream files (`06-ui-ux/01-design-tokens.md §1.6`, `07-features/04-collections.md`) cite it correctly.
- `07-share.md` continues to be the v1 single-table source-of-truth (per locked rule). No drift toward the v2 design note.
- `templates/entity-rls.md` provides the canonical RLS pattern — referenced correctly by downstream entity files.

---

## 5. Outcome

`02-data-model/` passes broad sweep clean. No spec changes. Score impact: 0.
