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
| `password_hash` | text? | argon2id; null if OAuth-only |
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
| `kind` | `personal \| team` | |
| `plan_id` | enum | free / pro / team / lifetime |
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
| `role` | `owner \| admin \| editor \| viewer \| billing` | |
| `invited_by` | account_id? | |
| `joined_at` | timestamptz | |
| `last_active_at` | timestamptz | per Org |
| `removed_at` | timestamptz? | soft remove |

Unique `(org_id, account_id)` where `removed_at IS NULL`.

### `Role` enum
`owner`, `admin`, `editor`, `viewer`, `billing`. See `08-sharing-collab/05-permissions-matrix.md`.

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
- Audited under its own `actor_kind="api_token"`.

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
