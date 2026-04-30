# Identity Model

The relationships between Account, Member, Org, and how the active context is determined.

---

## 1. Entities

### `Account`
The human (or service principal). One per real person.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | primary key everywhere |
| `email` | citext | unique; canonical identifier |
| `email_verified_at` | timestamptz? | |
| `display_name` | text | optional; falls back to email local-part |
| `avatar_url` | text? | |
| `locale` | text | BCP-47 |
| `timezone` | text | IANA |
| `password_hash` | text? | argon2id (params `m=64MB, t=3, p=4` per `03-passwords-and-mfa.md §2`); null if OAuth-only |
| `mfa_totp_secret_enc` | bytea? | encrypted at rest |
| `mfa_recovery_codes_enc` | bytea? | |
| `created_at`, `updated_at`, `deleted_at?` | | |

### `Org`
A workspace. Either Personal (auto-created) or Team.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `name` | text | |
| `slug` | text | unique; URL component |
| `kind` | `personal \| team` | Org category. Determines collaborator caps (see §2 + `10-licensing-billing/`). Independent of billing tier. |
| `plan_id` | enum | **Denormalization** of `License.plan` per `02-data-model/10-license.md §1` — canonical SoT for the enum is there: `free \| pro \| team \| lifetime`. Lifecycle states (`trialing`, `past_due`, etc.) live on `License.status`, NOT here. Allowed combinations: `kind=personal` → `plan_id ∈ {free, pro, lifetime}`; `kind=team` → `plan_id = team`. Updated by webhook handler on subscription events; never written by API. |
| `owner_account_id` | UUIDv7 | exactly one |
| `brand` | jsonb? | colors, logo (Pro+) |
| `domain` | text? | claimed domain (Team) |
| `created_at`, `updated_at`, `deleted_at?` | | |

### `Member`
The role binding of one Account to one Org.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `org_id` | UUIDv7 | |
| `account_id` | UUIDv7 | |
| `role` | `owner \| admin \| editor \| viewer \| billing \| guest \| system` (canonical 7-value `org_role` enum per `17-admin-org/03-roles.md` §1) | |
| `invited_by` | account_id? | |
| `joined_at` | timestamptz | |
| `last_active_at` | timestamptz | per Org |
| `removed_at` | timestamptz? | soft remove |

Unique `(org_id, account_id)` where `removed_at IS NULL`.

### `Role` enum
Canonical 7-value `org_role`: `owner`, `admin`, `editor`, `viewer`, `billing`, `guest`, `system`. Single source of truth: `17-admin-org/03-roles.md` §1 + SQL DDL §2. Permissions matrix: `08-sharing-collab/05-permissions-matrix.md`. `system` is server-issued only (never user-assignable, enforced by SQL CHECK). `guest` is rare on Members (typically tracked via Share access).

### `user_roles` (security-definer table)
Mirrors the `Member.role` for fast RLS via `has_role(account_id, org_id, role)`. Updated by trigger on Member changes; never written directly by API.

## 2. Personal Org

- Auto-created on first signup with `kind="personal"`, `name="<display_name>'s workspace"`.
- Owner is the signing-up Account; cannot be transferred.
- On Free, no other Members allowed; on Pro, up to 3 collaborators; on Team, must convert to a Team Org or create a separate one.
- Cannot be deleted while the Account exists; deleting the Account purges it.

## 3. Active context

Every authenticated request carries:
- `Authorization: Bearer <jwt>` — identifies Account.
- `X-Organization-Id: <org_id>` — declares active Org context.

Server validates Member exists for `(account_id, org_id)` with `removed_at IS NULL`.

UI tracks `activeOrgId` in TanStack Query meta + `localStorage` for persistence; switching Org triggers token refresh with new context.

## 4. Multi-Account

- One browser can have multiple signed-in Accounts (Pro+ feature).
- Account switcher in top bar shows avatars; switching restarts the app shell.
- Each Account has its own refresh-cookie (scoped via `__Host-` prefix + path).
- Extension is single-Account at a time (browser profile boundary).

## 5. Service principal (Team API tokens)

- Acts as a synthetic "Account" with limited scopes; tied to creating Account.
- Cannot create new Accounts/Orgs/Members.
- Audited under `actor_role="system"` (canonical — matches `02-data-model/09-history-event.md` and the locked role enum in `17-admin-org/03-roles.md`).
- Optional sub-classification via `actor_kind` field: `system.api_token`, `system.cron`, `system.webhook`, `system.migration`. `actor_kind` is informational only — never use it for permission checks; gate on `actor_role="system"`.

> **W-11 closure (2026-04-19):** Previously this section used `actor_kind="api_token"` as the discriminator, conflicting with `02-data-model/09-history-event.md` which used `actor_role=system`. Canonical field is now `actor_role` (enum, already exists). `actor_kind` is demoted to optional sub-type. Audit-log queries filtering "exclude system actions" MUST use `WHERE actor_role <> 'system'`.

## 6. Domain claim (Team)

- Org Owner verifies a domain (DNS TXT record).
- Future signups with that email domain auto-prompt to join the Org (Team setting).
- Existing Accounts on that domain receive an invite, not auto-join.

## 7. Telemetry

- `account.created` `{ via: "email" | "google" | "apple" | "github" | "saml" }`
- `org.created` `{ kind }`
- `member.created` `{ role, via: "invite" | "saml" | "domain_claim" }`
- `context.switched` `{ from_org, to_org }`

## 8. Edge cases

| Case | Behavior |
|---|---|
| Email collision on OAuth signup | If verified email matches existing Account, link providers; else create new |
| Account on multiple Orgs | Active Org persists per device; URL deep links carry `?org=<id>` |
| Org Owner deletes their Account | Must transfer ownership first; UI guides through |
| Member removed mid-session | Next request 401; client signs out gracefully |
| Soft-deleted Account email re-used within 30 d | Restoration flow offered instead of new signup |

## 9. Tests

- Personal Org auto-create on first signup.
- Member uniqueness constraint (one role per Account per Org).
- `has_role` returns correct value across role changes.
- Domain claim signup flow.
- Multi-Account isolation (cookies, queries, caches).
