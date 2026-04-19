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
| `07-share.md` | `shares` | **v1 single-table model** (locked). `target_kind`, `target_id`, `audience`, `password_hash`, `expires_at`, `slug`. |
| `08-member.md` | `org_members`, `org_invites` | 7-value role enum (canonical); invite token hash + expiry. |
| `09-history-event.md` | `history_events` | Append-only event log feeding undo/redo and audit log. |
| `10-license.md` | `licenses`, `subscriptions` | SKU references, `amount_cents`, provider tuple `(provider, event_id)` for idempotency. |
| `11-account.md` | `accounts`, `auth_identities`, `sessions`, `mfa_factors` | User identity, OAuth identities, refresh sessions, TOTP/WebAuthn factors. |

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

## 5. Cross-references

- Hierarchy that constrains containment: `01-information-architecture/01-hierarchy.md`.
- Permission policies that read these tables: `08-sharing-collab/05-permissions-matrix.md`.
- API contracts on top of these tables: `03-api-endpoints/04-organizations.md` … `03-api-endpoints/16-licenses.md`.
- Webhook idempotency contract using `(provider, event_id)`: `03-api-endpoints/17-billing-webhooks.md`.
- Audit/event log consumers: `12-history-undo/01-event-log.md`, `17-admin-org/04-audit-log.md`.
