# OAuth Clients & Redirect URIs

> **Closes gap M2.** Canonical registry of OAuth client IDs, redirect URIs, and provider configuration per environment.
> **Locked rule:** Client IDs and redirect URIs are environment-scoped. Code never references a literal `https://localhost` redirect.

---

## 1. Supported providers (Phase 0)

| Provider | Status | Notes |
|---|---|---|
| Google | **Required (P0)** | OAuth 2.0 + OpenID Connect; managed via Lovable Cloud Auth |
| Apple | Required (P0) | Sign in with Apple; needs Apple Team + Service ID |
| GitHub | P1 | Manual via Supabase provider config (not in Cloud-managed list) |
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

| Provider | Env | Client ID | Client Secret name (in Lovable Cloud secrets) |
|---|---|---|---|
| Google | staging | `OWNER_FILL_GOOGLE_CLIENT_ID_STAGING.apps.googleusercontent.com` | `GOOGLE_OAUTH_CLIENT_SECRET_STAGING` |
| Google | prod    | `OWNER_FILL_GOOGLE_CLIENT_ID_PROD.apps.googleusercontent.com`    | `GOOGLE_OAUTH_CLIENT_SECRET_PROD` |
| Apple  | staging | `com.letsmarknow.app.staging` (Service ID) | `APPLE_OAUTH_KEY_STAGING` (.p8 contents) |
| Apple  | prod    | `com.letsmarknow.app`         (Service ID) | `APPLE_OAUTH_KEY_PROD` |
| GitHub | staging | `OWNER_FILL_GH_CLIENT_ID_STAGING` | `GITHUB_OAUTH_CLIENT_SECRET_STAGING` |
| GitHub | prod    | `OWNER_FILL_GH_CLIENT_ID_PROD`    | `GITHUB_OAUTH_CLIENT_SECRET_PROD` |

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
