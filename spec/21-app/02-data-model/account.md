# Entity: Account

## Purpose

The human user (or service principal). One per real person. Owns or is a Member of one or more Organizations. Carries authentication credentials, profile, locale, and security settings.

> 📌 **Canonical contract.** When this file disagrees with `09-auth-accounts/identity-model.md`, **this file wins**. `identity-model.md` is the narrative description; this file is the schema.

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
| `last_signin_ip` | string(64) | yes | null | IPv4/IPv6, truncated /24 or /48 before storage | Privacy: see `19-security-privacy/data-handling.md`. |
| `is_service_principal` | bool | no | false | — | True for Team API tokens (synthetic accounts). |
| `kind` | enum(`human`\|`api_token`) | no | `human` | — | — |
| `marketing_opt_in` | bool | no | false | — | Email marketing consent. |
| `analytics_opt_in` | bool | no | false in EU/UK, true elsewhere | — | Per `18-analytics-telemetry/opt-in-analytics.md`. |

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
- **GDPR DSR:** bypasses the 30-day grace, see `19-security-privacy/gdpr-ccpa.md`.

## Events emitted

- `account.created` (with `via`)
- `account.email_verified`
- `account.password_changed`
- `account.mfa_enabled` / `account.mfa_disabled`
- `account.signed_in` / `account.signed_out`
- `account.soft_deleted` / `account.restored` / `account.hard_deleted`
