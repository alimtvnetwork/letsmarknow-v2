# 00 — Data Model Folder Overview

> **Purpose.** The **single source of truth for every persisted entity**. Column names, types, constraints, indexes, RLS hooks, lifecycle, and inter-table relationships all live here. Any folder that references a database row points back to this folder. Drift between this folder and the API or UI is a P0 bug.

---

## 1. Responsibilities

1. **Define every table** the product uses, exactly once.
2. **Lock identifier strategy.** UUIDv7 for every primary key, every foreign key. Never ULID, never auto-increment.
3. **Lock column naming.** `snake_case` always. Money in `amount_cents` (not `amount_minor`, not `amount_in_cents`). Pagination input is `limit` (not `page_size`). Timestamps are `created_at`, `updated_at`, `deleted_at` (TZ = `timestamptz` UTC). Soft-delete via `deleted_at`.
4. **Define the canonical 7-value role enum** (`owner, admin, editor, viewer, billing, guest, system`) and pin it via SQL `CHECK` so other folders cannot drift.
5. **Define lifecycle rules** per entity: when created, when soft-deleted, when hard-purged, when versioned, what cascades on parent deletion.
6. **Define indexes** required for the API access patterns and search engine.
7. **Provide the contract that RLS policies and edge functions must enforce** (the schema is the law; functions only translate intent into rows).

---

## 2. File-by-file behaviour

| File | Owns table(s) | Key locked decisions |
|---|---|---|
| `01-organization.md` | `organizations` | Org slug uniqueness, plan FK to license, hard-delete cascade rule. |
| `02-space.md` | `spaces` | Space slug unique within Org; soft-delete with restore window. |
| `03-collection.md` | `collections` | Collection-within-Space uniqueness; tree position not nested (flat under Space). |
| `04-group.md` | `groups`, `group_items` | Many-to-many between Group and Item; group order via `position` int. |
| `05-item.md` | `items` | URL canonicalisation, favicon ref, OG metadata fields, `last_visited_at`, `position`. |
| `06-tag.md` | `tags`, `item_tags` | Tags are Org-scoped; case-insensitive uniqueness per Org. |
| `07-share.md` | `shares` | **v1 single-table model** (locked). `target_type`, `target_id`, `mode`, `password_hash`, `expires_at`, `slug`, `memorable_slug`. |
| `08-member.md` | `org_members`, `org_invites` | 7-value role enum (canonical); invite token hash + expiry. |
| `09-history-event.md` | `history_events` | Append-only event log feeding undo/redo and audit log. |
| `10-license.md` | `licenses`, `subscriptions` | SKU references, `amount_cents`, provider tuple `(provider, event_id)` for idempotency. |
| `11-account.md` | `accounts`, `auth_identities`, `sessions`, `mfa_factors` | User identity, OAuth identities, refresh sessions, TOTP/WebAuthn factors. |
| `12-next-item.md` | `next_items` | Per-Account "Next" queue (read-it-later). Ordered via `position`; one row per (account, item). |

---

## 3. Tasks performed by this folder

- **Schema definition** for every table (DDL-equivalent in markdown form).
- **FK relationship mapping** showing which entities reference which.
- **Soft-delete + cascade matrix** (what gets nulled, what gets cascade-deleted, what gets restricted).
- **Index list** per table with the access pattern that motivates each index.
- **RLS hook surface** — the policy intent each table requires (full policy SQL lives in `08-sharing-collab/05-permissions-matrix.md` and infra migrations).
- **Storage of money/quantity contracts** so billing, webhooks, and UI all agree.

---

## 4. What this folder is NOT

- **Not the API.** Endpoint shapes live in `03-api-endpoints/`. This folder describes the row; that folder describes the request/response.
- **Not the UI.** Field labels, validation copy, and form widgets live in `06-ui-ux/10-forms.md` and `06-ui-ux/17-copy-strings.md`.
- **Not migrations.** Forward/down DDL files are an implementation artefact (deferred per `mem://constraints/no-implementation-mode`).
- **Not the search engine.** Indexed columns are listed; search relevance and tokeniser config live in `14-search/06-search-engine.md`.

---

## 4a. Master foreign-key on-delete table

> Single source of truth for every cross-entity FK declared in this folder. Closes audit finding **DM3** (`23-audits/audit-2026-04-29-data-model-sweep-99.md`) and the older Locked rule "FKs `on delete <action>` per file" from `audit-2026-04-19-spec-internal.md`. Per-entity files MUST point at this table rather than restating actions inline.
>
> **Action vocabulary** (Postgres): `cascade` / `set null` / `restrict` / `no action`.
>
> **Soft-delete vs hard-delete:** `cascade` here describes the SQL-level FK action that fires on **hard delete**. Soft-delete cascades (sets `deleted_at` on children) are application-layer behaviour described in each entity's `## Lifecycle` and are NOT expressible as FK actions.

| Child entity | Child column | → Parent entity (column) | on delete | Rationale |
|---|---|---|---|---|
| Space | `organization_id` | Organization (`id`) | `cascade` | Org-tree containment. |
| Collection | `space_id` | Space (`id`) | `cascade` | Org-tree. Nullable for `kind = next` (Invariant 10) — partial FK / trigger enforces non-null + cascade for `manual`/`session`. |
| Collection | `organization_id` | Organization (`id`) | `cascade` | Denormalised; same lifetime as Space. |
| Collection | `account_id` | Account (`id`) | `cascade` | Only set when `kind = next`; deleting Account removes the singleton Next-Collection. |
| Group | `collection_id` | Collection (`id`) | `cascade` | Org-tree. |
| Group | `space_id` | Space (`id`) | `cascade` | Denormalised. |
| Group | `organization_id` | Organization (`id`) | `cascade` | Denormalised. |
| Group | `parent_group_id` | Group (`id`) | `cascade` | Reserved for v2; v1 service rejects non-null. |
| Item | `collection_id` | Collection (`id`) | `cascade` | Org-tree. |
| Item | `group_id` | Group (`id`) | `set null` | Item survives Group deletion (lives directly in Collection). |
| Item | `space_id` | Space (`id`) | `cascade` | Denormalised. |
| Item | `organization_id` | Organization (`id`) | `cascade` | Denormalised. |
| Tag | `organization_id` | Organization (`id`) | `cascade` | Org-scoped lookup. |
| Tag | `created_by` | Account (`id`) | `set null` | Tombstone author when Account hard-deletes. |
| Share | `organization_id` | Organization (`id`) | `cascade` | Org-scoped. |
| Share | `target_id` | (polymorphic — see Notes) | application-managed | Polymorphic FK validated by trigger; soft-delete of target sets `revoked_at` (per `07-share.md` invariant 7), hard-delete cascades via the same trigger. |
| Member | `organization_id` | Organization (`id`) | `cascade` | Org-scoped. |
| Member | `account_id` | Account (`id`) | `set null` | Account hard-delete leaves Member tombstone (`status = 'removed'`); Owner-removal blocked by Invariant 4 + RLS. |
| Member | `invited_by` | Account (`id`) | `set null` | Inviter tombstone. |
| HistoryEvent | `organization_id` | Organization (`id`) | `cascade` | Audit retained only while Org exists. |
| HistoryEvent | `account_id` | Account (`id`) | `set null` | Account hard-delete preserves audit row, nulls actor. |
| HistoryEvent | `target_id` | (polymorphic) | application-managed | Polymorphic; never enforced by FK. May become a dangling pointer after target hard-delete — readers tolerate. |
| HistoryEvent | `undone_by_event_id` | HistoryEvent (`id`) | `set null` | Self-ref; preserved across pruning. |
| License | `organization_id` | Organization (`id`) | `restrict` | Org-delete blocked while active License exists (per `01-organization.md` Lifecycle: "License subscription must be canceled first"). |
| License | `account_id` | Account (`id`) | `restrict` | Lifetime License blocks Account hard-delete; user must transfer or refund first. |
| Organization | `subscription_id` | License (`id`) | `set null` | Pointer cleared when License hard-deletes (rare; `restrict` from the License side normally prevents this). |
| Organization | `default_space_id` | Space (`id`) | `set null` | Pointer cleared if the default Space is removed; UI re-resolves to first Space. |
| Organization | `owner_account_id` | Account (`id`) | `restrict` | Org cannot lose Owner — must transfer ownership first (`01-organization.md` Invariants 1–3). |
| **All entities w/ Audit Block** | `created_by` / `updated_by` | Account (`id`) | `set null` | Universal author-tombstone rule. Declared once here; per-entity files do NOT restate. |
| NextItem | `next_collection_id` | Collection (`id`) | `cascade` | Per `12-next-item.md`. |
| NextItem | `account_id` | Account (`id`) | `cascade` | Per `12-next-item.md`. |
| NextItem | `item_id` | Item (`id`) | `set null` | Item hard-purge converts NextItem to tombstone (per `12-next-item.md` Lifecycle); FK action is `set null`, application then sets `tombstone = true` and copies snapshot fields. |
| NextItem | `source_collection_id` | Collection (`id`) | `set null` | Dangling pointer tolerated — see `12-next-item.md` field doc. |

**Notes:**
- Polymorphic FKs (`Share.target_id`, `HistoryEvent.target_id`) cannot use Postgres FK constraints; validated by triggers at write time and tolerated as dangling at read time.
- The universal `created_by` / `updated_by` Audit-Block rule (`set null`) applies to ALL entities and is declared once here, not in each file.
- Entity files reference this table from a one-line `## Foreign keys` block pointing at `00-overview.md §4a` plus any per-entity carve-outs.

---

## 5. Cross-references

- Hierarchy that constrains containment: `01-information-architecture/01-hierarchy.md`.
- Permission policies that read these tables: `08-sharing-collab/05-permissions-matrix.md`.
- API contracts on top of these tables: `03-api-endpoints/04-organizations.md` … `03-api-endpoints/16-licenses.md`.
- Webhook idempotency contract using `(provider, event_id)`: `03-api-endpoints/17-billing-webhooks.md`.
- Audit/event log consumers: `12-history-undo/01-event-log.md`, `17-admin-org/04-audit-log.md`.
