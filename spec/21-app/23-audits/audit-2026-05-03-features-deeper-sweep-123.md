# Audit 123 — `07-features/` Deeper Sweep

**Date:** 2026-05-03 06:56 MYT
**Session:** 123
**Scope:** Second-pass review of all 19 spec files in `spec/21-app/07-features/` (post audit-116 light pass).
**Trigger:** User `next` instruction; selected from suggested actions.

---

## 1. Method

Scanned for drift against locked Core rules:

1. ULID leakage (UUIDv7 only).
2. Bare "Workspace" labels (must split → Space + Organization per SI-021).
3. Role-enum drift (locked: owner, admin, editor, viewer, billing, guest, system).
4. Bare endpoint paths (must be `/v1/`-prefixed).
5. Hard-coded color hex (must reference `--primary` / `--color-label-*` tokens).
6. `color_label` enum drift (locked: 9 values).

---

## 2. Findings

| Check | Result |
|-------|--------|
| ULID references | **0 hits** ✅ |
| Bare "Workspace" label | 1 hit in `04-collections.md:121` — **legitimate** (cites the glossary mapping rule itself) ✅ |
| Role-enum drift | **0 hits** ✅ — terms like "member", "contributor", "reader" used only as English prose (e.g. "created by member"), never as enum values |
| Non-`/v1/` endpoints | **0 hits** ✅ |
| Hard-coded hex | 1 hit in `04-collections.md:216` — **legitimate** (defines token value `#EC4868` alongside HSL, in design-tokens cross-reference) ✅ |
| `color_label` enum | Referenced correctly in `04-collections.md:245`, locked to `02-data-model/05-item.md` ✅ |

---

## 3. Patches Applied

**None.** Folder is in alignment with all locked rules.

---

## 4. Notes

- `08-view-modes.md` and `16-delete-with-undo.md` correctly act as pointer files into `15-visualization/` and `12-history-undo/` respectively — no contract duplication.
- `14-extensions-os-integrations.md` member events (`member.added/removed/role_changed`) align with `17-admin-org/02-members-management.md` shape post audit-117.
- `17-next-queue.md` "member of >1 Org" usage is English plural of Org-membership, not enum drift.

---

## 5. Outcome

`07-features/` passes second-pass sweep clean. No spec changes required. Score impact: 0.

Cross-link: see audit-2026-04-30-toby-invite-share-parity-117 (member.* events alignment) and audit-2026-04-30-visualization-sweep-120 (view-mode pointer integrity).
