<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (3 of 9 closed: D1, D2, D4 — session 58)
opened-on: 2026-04-29
scope: 02-data-model/ folder — entity-coverage and enum-coverage drift
-->

# Audit — Data Model Sweep (Session 57)

**Date:** 2026-04-29 (Session 57, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 13 entity files in `spec/21-app/02-data-model/` plus `00-overview.md §2` cross-reference table and `09-history-event.md` enum coverage.
**Reason:** First dedicated audit of this folder since pre-Phase-9. Triggered by Session 57 spec-only sweep request when no agent-resolvable SIs were open (SI-029 awaits legal counsel).

> **Open audit.** Findings below should be drained in subsequent sessions; this file becomes `closed-on` when its findings are spec-resolved or promoted to a new SI.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| D1 | **S1** | `09-history-event.md` `target_type` enum is missing `next_item` and `account` despite both entities emitting history events | `09-history-event.md` line 17 |
| D2 | **S2** | `00-overview.md §2` File-by-file table is missing rows for `09-history-event.md`, `11-account.md`, **and** `12-next-item.md` (3 of 13 files orphaned) | `00-overview.md §2` |
| D3 | **S2** | `06-tag.md` opening sentence claims tags attach to "Collections, Groups, and Items" but **`05-item.md` is the only entity whose schema includes `tag_ids[]`** in addition to Collection and Group — verified true; however `06-tag.md` and `00-overview.md §2` describe scope as "Org-scoped" without naming the three attachable entity types | `06-tag.md` §Purpose |
| D4 | **S2** | `00-overview.md §2.07-share` row says `target_kind` but the actual column in `07-share.md` line 13 is `target_type`. Naming drift in a single sentence. | `00-overview.md` line 29 |
| D5 | **S2** | `04-group.md` says "Full-text on `(name, description, notes)`" (legacy); other entities (`05-item.md`) have already migrated to `search_tsv` generated column per F-M17 reconciliation. Drift between sibling entities. | `04-group.md` line 49, also `03-collection.md` line 60, `02-space.md` (likely) |
| D6 | **S3** | `06-tag.md` is missing the standard "Audit Block" placeholder row that every other entity table starts with (`Audit Block | — | — | — | — | see README.md`) | `06-tag.md` line 11 area |
| D7 | **S3** | `06-tag.md` lacks an `id` column declaration in most other entities — wait, it has `id` but no `updated_at`/`deleted_at` (consistent with §19 "Tags do NOT have soft-delete"). Document this design decision explicitly. | `06-tag.md` |
| D8 | **S3** | `04-group.md` invariant 4 says "Cascade soft/hard delete to Items" but `05-item.md` Lifecycle "Soft-delete: standard." doesn't say what happens to its parent Group when only the Item is deleted (orphan check). Opposite direction is undocumented. | `05-item.md` Lifecycle |
| D9 | **S3** | `05-item.md` Indexes section line 74 says "The legacy line 'Full-text on `(title, description, notes, url)`' is superseded" — the legacy line is no longer in the file (good), but the note remains. Consider trimming once stable. | `05-item.md` line 74 |

---

## 2. Detail — D1 (history-event enum missing entities)

`09-history-event.md` line 17 (full):

> `target_type` | enum(`organization`\|`space`\|`collection`\|`group`\|`item`\|`tag`\|`share`\|`member`\|`license`) | no | — | — | — |

**Missing:**
- `next_item` — `12-next-item.md` exists and emits events (Next-queue is per-Account, undoable per `12-history-undo/`).
- `account` — `11-account.md` emits events for profile updates, MFA enrollment, password change, locale change — none of which can be logged today because the enum doesn't permit it.

**Impact.** Any audit-log row for these entities cannot be persisted — schema rejects. This is a **codegen-blocking S1**: an LLM building from this spec would generate the enum exactly as written, then crash on first NextItem mutation.

**Fix.** Extend enum to:
`organization|space|collection|group|item|tag|share|member|license|account|next_item`

Add a corresponding invariant: "When a new entity table is added to `02-data-model/`, the entity's snake_case name MUST be added to this enum in the same change."

---

## 3. Detail — D2 (overview table missing rows) — **CLOSED session 58**

Re-verification during fix found audit was over-stated: `09-history-event.md` (line 31) and `11-account.md` (line 33) rows already existed. Only `12-next-item.md` was genuinely missing. Added in session 58.

**Fix applied.** `00-overview.md §2` now lists all 13 entity files.

---

## 4. Detail — D4 (target_kind vs target_type naming drift)

`00-overview.md` line 29 (the §2 row for `07-share.md`):

> ... `target_kind`, `target_id`, `audience`, `password_hash`, `expires_at`, `slug` ...

`07-share.md` line 13 (the actual column declaration):

> | `target_type` | enum(`space`\|`collection`\|`group`\|`item`\|`mindmap_layout`) | ...

Two names for the same column in the same folder. **The column is `target_type`** (consistent with `09-history-event.md` and the rest of the spec). `00-overview.md`'s `target_kind` is wrong.

Also: `00-overview.md` line 29 names a field `audience` that does not exist in `07-share.md` — the actual mode field is `mode` (enum `public|password|invite_only`).

**Fix.** Rewrite the §2 row to: "`v1 single-table model` (locked). `target_type`, `target_id`, `mode`, `password_hash`, `expires_at`, `slug`, `memorable_slug`."

---

## 5. Detail — D5 (search_tsv migration partial)

`05-item.md` has been migrated to `search_tsv` (line 33) per F-M17. Sibling entities still carry the legacy "Full-text on `(...)`" line:
- `04-group.md` line 49: "Full-text on `(name, description, notes)`"
- `03-collection.md` line 60: "Full-text index on `(name, description, notes)` for search"
- `02-space.md` likely same (not verified yet).

Yet `05-item.md` line 74 explicitly says "Analogous `search_tsv` columns also exist on `collections`, `spaces`, and `groups` per the same source spec" — meaning the design decision is already locked, only the sibling files weren't updated.

**Impact.** Migration-author would build the Group / Collection / Space tables WITHOUT the `search_tsv` GIN index, then rebuild the entire DB later when search docs are read. **S2** because it's a build-correctness drift between sibling entities in the same folder.

**Fix.** Add the same `search_tsv` row to `02-space.md`, `03-collection.md`, and `04-group.md` field tables and replace the legacy "Full-text on …" index line with "GIN on `search_tsv` — see `14-search/06-search-engine.md §2.2`" in each.

---

## 6. Detail — D8 (orphan-direction undocumented)

`04-group.md §Invariants 4`: "Cascade soft/hard delete to Items." (Group → Item direction documented.)
`05-item.md §Lifecycle`: "**Soft-delete:** standard." — does not state what happens when a Group still exists but all its Items are deleted (orphan-Group state).

Per `01-information-architecture/01-hierarchy.md` (cited in `00-overview §5`), an empty Group is valid. Worth documenting explicitly so an LLM doesn't infer a cascade-up rule.

**Fix.** Add to `05-item.md §Lifecycle`: "Deleting all Items in a Group does NOT delete the Group. Empty Groups are valid (see `01-information-architecture/01-hierarchy.md`)."

---

## 7. Files NOT audited but spot-checked clean

- `01-organization.md` — slug uniqueness, plan FK, cascade rule.
- `02-space.md` — needs D5 fix only.
- `08-member.md` — 7-value role enum matches Core memory lock.
- `10-license.md` — `(provider, event_id)` idempotency tuple matches `03-api-endpoints/17-billing-webhooks.md`.
- `11-account.md` — Argon2id password_hash matches the security-audit Argon2id lock.

---

## 8. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next session | D1, D4 | Two single-line edits. Highest leverage — D1 unblocks future codegen. |
| Following | D2, D3, D6, D7 | All `00-overview.md` + `06-tag.md` polish. |
| After | D5 | 3-file migration of sibling entities to `search_tsv`. |
| After | D8, D9 | Documentation/cleanup. |

Total estimated: 3–4 sessions. None require user input.

---

## 9. Cross-references

- Last data-model-related audit: `audit-2026-04-19-spec-internal.md`.
- Search column source-of-truth: `14-search/06-search-engine.md §2.2`.
- Locked role enum: Core memory + `08-member.md`.
- History-event consumers: `12-history-undo/01-event-log.md`, `17-admin-org/04-audit-log.md`.
- Spec-issue tracker: `13-spec-issues/02-current-issues.md`.
