# Entity: Account

## Purpose

The human user (or service principal). One per real person. Owns or is a Member of one or more Organizations. Carries authentication credentials, profile, locale, and security settings.

> 📌 **Canonical contract.** When this file disagrees with `../09-auth-accounts/01-identity-model.md`, **this file wins**. `../09-auth-accounts/01-identity-model.md` is the narrative description; this file is the schema.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | — |
| `email` | email | no | — | RFC 5322, lowercased, unique | Canonical identifier. |
| `email_verified_at` | timestamp | yes | null | — | Set on email confirmation. |
| `display_name` | string(120) | yes | null | trim | Falls back to email local-part if null. |
| `avatar_url` | url | yes | null | https | CDN-mirrored. |
| `locale` | string(16) | no | `en-US` | BCP-47 | UI language. |
| `timezone` | string(64) | no | `UTC` | IANA tz | For timestamps in UI. |
| `password_hash` | string(255) | yes | null | argon2id | Null if OAuth-only Account. |
| `mfa_totp_secret_enc` | text | yes | null | AES-256-GCM ciphertext | Encrypted at rest. |
| `mfa_recovery_codes_enc` | text | yes | null | AES-256-GCM ciphertext | 10 single-use codes. |
| `mfa_enabled_at` | timestamp | yes | null | — | — |
| `last_signin_at` | timestamp | yes | null | — | — |
| `last_signin_ip` | string(64) | yes | null | IPv4/IPv6, truncated /24 or /48 before storage | Privacy: see `19-security-privacy/02-data-handling.md`. |
| `is_service_principal` | bool | no | false | — | True for Team API tokens (synthetic accounts). |
| `kind` | enum(`human`\|`api_token`) | no | `human` | — | — |
| `marketing_opt_in` | bool | no | false | — | Email marketing consent. |
| `analytics_opt_in` | bool | no | false in EU/UK, true elsewhere | — | Per `18-analytics-telemetry/01-opt-in-analytics.md`. |

## Relationships

- **Children:** Members (1..N — one per Org), Sessions, OAuth identities.
- **Cross-refs:** `created_by` / `updated_by` on every other entity points here.

## Invariants

1. `email` unique across non-deleted Accounts. Soft-deleted emails reserved for 30 days.
2. At least one of `password_hash` OR a linked OAuth identity must exist.
3. Service principals (`kind=api_token`) cannot own Organizations and cannot have password/MFA.
4. Deleting an Account where they are the sole Owner of any Org is rejected — must transfer ownership first.

## Indexes (recommended)

- `(email)` unique where `deleted_at IS NULL`
- `(last_signin_at DESC)`
- `(kind)`

## Lifecycle

- **Create:** signup (email+password / OAuth / SAML invite). Auto-creates a Personal Org.
- **Update:** profile fields, password change, MFA enable/disable.
- **Soft-delete:** standard 30-day grace. PII zeroed (email → `deleted-{uuid}@deleted.local`, name → "Deleted user") on hard-delete; `created_by` references retained as tombstones.
- **GDPR DSR:** bypasses the 30-day grace, see `19-security-privacy/04-gdpr-ccpa.md`.

## Events emitted

- `account.created` (with `via`)
- `account.email_verified`
- `account.password_changed`
- `account.mfa_enabled` / `account.mfa_disabled`
- `account.signed_in` / `account.signed_out`
- `account.soft_deleted` / `account.restored` / `account.hard_deleted`

## Permissions

> Role × action mapping for this entity lives in [`08-sharing-collab/05-permissions-matrix.md`](../08-sharing-collab/05-permissions-matrix.md) (search anchor: `account`). RLS policies in §RLS below translate that matrix into row-level predicates via `has_role()`; do not duplicate the matrix here.

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. No outgoing FKs beyond the universal Audit-Block `created_by` / `updated_by` (`set null`). Inbound: many entities reference Account; deletion paths governed by per-child rows in §4a.

## Sub-entity: `account_setting` (1:1 with Account)

> Per-Account preferences. One row per Account; created lazily on first write. Composite under Account (cascades on Account delete). Surfaced via the Settings UI; written via `update_account_setting()` RPC, never via direct PATCH on Account.

| Name | Type | Null | Default | Description |
|---|---|---|---|---|
| `account_id` | uuid (Account.id) PK FK | no | — | Owner. `on delete cascade`. |
| `next_insert_position` | enum(`top`\|`bottom`) | no | `bottom` | Where new Next items land. (`07-features/17-next-queue.md §7`.) |
| `next_close_tab_after_adding` | bool | no | `false` | Auto-close source browser tab after "Add to Next". |
| `next_hide_completed` | bool | no | `false` | Hide done rows from default Next view. |
| `next_auto_archive_days` | int | yes | null | Auto-archive done items after N days. Allowed: 1, 7, 30, null. |
| `next_show_in_extension_popup` | bool | no | `true` | Show "Next" tab in the extension popup tab-bar. |
| `next_prompt_done_on_close` | bool | no | `false` | Confirm marking-done when closing source tab. |
| `next_tip_dismissed` | bool | no | `false` | Permanently dismiss the "view Next from extension" tip. |
| `popup_default_tab` | enum(`save_tab`\|`create_link`\|`next`\|`group_tabs`) | no | `next` | Default tab on first popup open per Account. |

RLS: SELECT/UPDATE where `account_id = auth.account_id()`. INSERT/DELETE forbidden to clients (service role only — INSERT happens lazily via RPC).

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md). Strictly per-Account; Org membership does NOT grant cross-Account read access here.

- enable row level security
- SELECT: `id = auth.account_id()` for the full row. Other Org members see only the public-profile projection (`id`, `display_name`, `avatar_url`) via a separate `accounts_public` view governed by `EXISTS (members where ...co-membership...)`.
- INSERT: forbidden for non-service-role callers — Accounts are created exclusively by the signup / OAuth-link RPCs running as service role.
- UPDATE: `id = auth.account_id()`. Sensitive columns (`password_hash`, `mfa_totp_secret_enc`, `mfa_recovery_codes_enc`, `email`, `email_verified_at`) writable only via dedicated SECURITY DEFINER RPCs that perform re-authentication / verification flows — NEVER by direct table UPDATE.
- DELETE: forbidden for non-service-role callers. Account deletion goes through the `request_account_deletion()` RPC which enforces invariant 4 (sole-Owner check) and the 30-day grace from `19-security-privacy/04-gdpr-ccpa.md`.
- Notes: Service-principal Accounts (`kind = 'api_token'`) MUST NOT be returned by any user-facing list endpoint; filter `kind = 'human'` in views. `last_signin_ip` is truncated /24 (IPv4) or /48 (IPv6) BEFORE storage per `19-security-privacy/02-data-handling.md` — RLS cannot retroactively truncate.
