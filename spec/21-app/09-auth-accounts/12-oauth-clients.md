# OAuth Clients & Redirect URIs

> **Closes gap M2.** Canonical registry of OAuth client IDs, redirect URIs, and provider configuration per environment.
> **Locked rule:** Client IDs and redirect URIs are environment-scoped. Code never references a literal `https://localhost` redirect.

---

## 1. Supported providers (Phase 0)

> **Reconciled (F-M14, 2026-04-19):** GitHub is **deferred to P1** (Phase 1, post-MVP). Decision rationale: Apple + Google cover ≥ 95% of consumer + Workspace signups; deferring GitHub reduces P0 OAuth surface area and saves provisioning + review effort for launch. The §4 client-ID rows and §5 scope rows for GitHub remain in the file as **forward-spec** so Phase-1 work can drop in without reopening the spec; they are flagged `(P1 — do not provision before Phase 1)`. Provider-listing UI MUST hide P1 rows in P0 (per locked rule §8.5).

| Provider | Status | Notes |
|---|---|---|
| Google | **Required (P0)** | OAuth 2.0 + OpenID Connect; managed via Lovable Cloud Auth |
| Apple | Required (P0) | Sign in with Apple; needs Apple Team + Service ID |
| GitHub | **Deferred — P1** | Spec preserved below for Phase-1 drop-in; do not provision in P0 |
| Microsoft (Azure AD) | P1 | Multi-tenant |
| SAML SSO | P2 (Team plan only) | Per-org, configured in admin UI |

## 2. Environments

| Env | Hostname | Purpose |
|---|---|---|
| local  | `http://localhost:8080` | Dev only; never used in OAuth Google/Apple registration |
| preview | `https://*.lovable.app` | Preview branches (wildcard); Google requires explicit registration of each preview origin OR the use of `https://preview.letsmarknow.com` proxy |
| staging | `https://staging.letsmarknow.com` | Pre-prod |
| prod | `https://app.letsmarknow.com` | Production |

> **Local dev rule:** OAuth in local dev MUST go through `staging` redirect → tunnel back to localhost via `lovable-cli proxy`. Do NOT add `http://localhost` to provider whitelists.

## 3. Redirect URI matrix

For every provider, register **all four** environment redirect URIs:

| Env | Redirect URI (Cloud Auth) | Redirect URI (custom) |
|---|---|---|
| local   | (use staging tunnel) | — |
| preview | `https://<project>.supabase.co/auth/v1/callback` | n/a |
| staging | `https://staging.letsmarknow.com/auth/callback` | + Cloud callback |
| prod    | `https://app.letsmarknow.com/auth/callback`     | + Cloud callback |

## 4. Client ID registry (placeholders — owner fills before launch)

> **Naming convention (locked, F-M02 reconciliation):** `OAUTH_<PROVIDER>_<FIELD>_<ENV>`. Matches `22-infrastructure/03-env-vars.md`. Old `OAUTH_GOOGLE_CLIENT_SECRET` (no env suffix) is removed.

| Provider | Env | Client ID env var | Client Secret env var |
|---|---|---|---|
| Google | staging | `OAUTH_GOOGLE_CLIENT_ID_STAGING` | `OAUTH_GOOGLE_CLIENT_SECRET_STAGING` |
| Google | prod    | `OAUTH_GOOGLE_CLIENT_ID_PROD`    | `OAUTH_GOOGLE_CLIENT_SECRET_PROD` |
| Apple  | staging | `OAUTH_APPLE_CLIENT_ID_STAGING` (Service ID `com.letsmarknow.app.staging`) | `OAUTH_APPLE_PRIVATE_KEY_STAGING` (.p8) + `OAUTH_APPLE_KEY_ID_STAGING` + `OAUTH_APPLE_TEAM_ID` |
| Apple  | prod    | `OAUTH_APPLE_CLIENT_ID_PROD` (Service ID `com.letsmarknow.app`) | `OAUTH_APPLE_PRIVATE_KEY_PROD` (.p8) + `OAUTH_APPLE_KEY_ID_PROD` + `OAUTH_APPLE_TEAM_ID` |
| GitHub | staging | `OAUTH_GITHUB_CLIENT_ID_STAGING` | `OAUTH_GITHUB_CLIENT_SECRET_STAGING` |
| GitHub | prod    | `OAUTH_GITHUB_CLIENT_ID_PROD`    | `OAUTH_GITHUB_CLIENT_SECRET_PROD` |

## 5. Required scopes

| Provider | Scopes | Why |
|---|---|---|
| Google | `openid email profile` | Identity + display name + avatar |
| Apple  | `name email` | Apple returns `name` only on first auth |
| GitHub | `read:user user:email` | Email is private by default on GH |

## 6. PKCE & state

- **PKCE required** for all browser-initiated flows (S256 method).
- **State parameter:** UUIDv7, signed HMAC-SHA256 with `OAUTH_STATE_SECRET` (rotated quarterly).
- **Nonce** required for OIDC providers (Google, Apple).

## 7. Account linking

- If email returned by provider matches an existing `accounts.email_verified=true` record → link silently, log audit event `auth.account_linked`.
- If unverified or mismatched → present "Is this you?" linking prompt; never auto-merge.

## 8. Locked rules

1. Never embed client IDs in client-side JS at build time. They are fetched at runtime via `/api/auth/providers` so rotation does not require redeploy.
2. Client secrets MUST live in Lovable Cloud secrets (server-only). Never in `.env` committed to repo.
3. Apple `name` field is captured exactly once on first sign-in; subsequent sign-ins return `null`. Persist it on initial callback.
4. GitHub email may be `null` — fall back to `/user/emails` endpoint with `user:email` scope.
5. Provider list shown to user is generated from `09-auth-accounts/04-oauth-providers.md` ENABLED column, not hardcoded in UI.
