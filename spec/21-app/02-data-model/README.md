# 02 — Data Model

> ⚠️ **This folder defines entity CONTRACTS, not database schemas.** The DB team will translate these into tables, indexes, constraints, and migrations separately. This spec only locks down: field name, field type, nullability, default, validation, and meaning.

## How to read each entity file

Every file in this folder follows the same template:

```
# Entity: <Name>

## Purpose
One paragraph.

## Fields
| Name | Type | Null | Default | Validation | Description |

## Computed / Derived
Fields the API returns but are not stored as-is.

## Relationships
- Parent: ...
- Children: ...
- Cross-refs: ...

## Invariants
Rules the DB or service layer MUST enforce.

## Indexes (recommended, non-binding)
Hints for the DB team.

## Lifecycle
Create → Update → Soft-delete → Hard-delete behaviors.

## Events emitted
Which History Events this entity produces.
```

## Type vocabulary (locked)

| Type token | Meaning |
|---|---|
| `uuid` | UUIDv7 string, 36 chars with hyphens |
| `string(N)` | UTF-8 string, max N chars after trim |
| `text` | UTF-8 string, max 64 KB |
| `int` | 64-bit signed integer |
| `bigint` | 64-bit signed integer (positions, counters) |
| `bool` | true / false |
| `timestamp` | ISO-8601 UTC with milliseconds, e.g. `2026-04-18T14:22:31.123Z` |
| `date` | ISO-8601 date `YYYY-MM-DD` |
| `enum(a\|b\|c)` | one of the listed string values |
| `json` | arbitrary JSON, schema noted inline |
| `array<T>` | ordered array of `T` |
| `url` | RFC 3986 absolute URL, max 2048 chars |
| `email` | RFC 5322 email, lowercased on write |
| `slug` | `[a-z0-9-]{3,64}`, unique per scope |
| `color` | hex `#RRGGBB` or named token (see `06-ui-ux/design-tokens.md`) |

## Files

| File | Entity |
|---|---|
| `organization.md` | Organization (the workspace bubble) |
| `space.md` | Space |
| `collection.md` | Collection |
| `group.md` | Group (sub-container inside Collection) |
| `item.md` | Item (the saved tab) |
| `tag.md` | Tag |
| `share.md` | Share (public/password/expiry/invite link) |
| `member.md` | Membership of an Account in an Organization |
| `history-event.md` | History Event (powers Undo/Redo and audit) |
| `license.md` | License / Entitlement |

## Common fields on all top-level entities

Every entity in this folder (except `history-event` and `tag`) carries the **Audit Block**:

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | uuid | no | UUIDv7, primary identifier |
| `created_at` | timestamp | no | server-set on insert |
| `updated_at` | timestamp | no | server-set on every mutation |
| `deleted_at` | timestamp | yes | soft-delete marker |
| `created_by` | uuid (Account.id) | no | who created |
| `updated_by` | uuid (Account.id) | no | last mutator |

Audit Block fields are referenced as **"Audit Block"** in each entity file rather than re-listed.
