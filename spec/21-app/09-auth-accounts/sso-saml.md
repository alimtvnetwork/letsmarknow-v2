# SSO / SAML (Team)

Enterprise sign-in via SAML 2.0 + SCIM 2.0 provisioning.

---

## 1. Scope

- Team plan only (or higher).
- Per-Org configuration; not Account-wide.
- Idp-initiated and SP-initiated supported.
- SCIM 2.0 for user provisioning + deprovisioning.

## 2. Configuration

`/settings/team/sso`:
- Upload IdP metadata XML or paste fields:
  - SSO URL
  - Issuer (Entity ID)
  - X.509 cert
- ACS URL (we provide): `https://api.letsmarknow.com/v1/auth/saml/<org_slug>/acs`
- SP entity ID: `https://letsmarknow.com/saml/<org_slug>`
- Optional: Just-In-Time provisioning toggle.
- Optional: enforce SSO-only sign-in (disables password + OAuth for Org Members).

## 3. Sign-in flow

1. User enters Org slug or email at `/signin` → server detects SSO Org.
2. Redirect to IdP via SAML AuthnRequest (signed).
3. IdP authenticates user, posts SAMLResponse to ACS URL.
4. Server validates: signature, audience, conditions, issuer, NotOnOrAfter.
5. Match Account by NameID (email) → create Member if absent (JIT) or reject.
6. Issue JWT + refresh cookie; redirect to dashboard.

## 4. Attribute mapping

| Claim | Mapping |
|---|---|
| `NameID` (email format) | Account email |
| `firstName` / `lastName` | Display name composition |
| `groups` | Optional → role mapping (Team config) |
| `urn:oid:2.5.4.42` (givenName) | Display name fallback |

Group → role mapping defined per Org:
```
"lmn-admins"  → admin
"lmn-editors" → editor
"lmn-viewers" → viewer
```

## 5. SCIM provisioning

`/v1/scim/v2/<org_slug>/...`:
- Bearer token (rotatable; one active + one rotating).
- Endpoints: `/Users`, `/Groups`, `/ServiceProviderConfig`, `/Schemas`, `/ResourceTypes`.
- Operations: Create, Replace (PUT), Patch, Delete.
- Delete = soft-deactivate Member (Account preserved).
- Group membership changes mapped to role updates.

## 6. JIT vs SCIM

- JIT only: Account created on first SSO sign-in; never auto-removed.
- SCIM only: Members must be provisioned before they can sign in (rejected otherwise).
- Both: Provision via SCIM is canonical; JIT gracefully creates if SCIM is delayed.

## 7. Enforcement

- "SSO required" toggle disables password + OAuth for Org Members.
- Owner can be exempt (configurable; default exempt to avoid lockout).
- Extension auth supported via SAML in popup browser flow (no SAML in `chrome.identity` — opens new tab).

## 8. Tested IdPs

- Okta
- Azure AD / Entra
- Google Workspace
- OneLogin
- JumpCloud

Generic SAML 2.0 IdPs supported but documented best-effort.

## 9. Security

- All SAMLResponses signature-verified.
- Replay protection via `InResponseTo` ↔ stored AuthnRequest ID; 5-min TTL.
- Clock skew tolerance: ±2 min.
- Encrypted assertions supported (we provide our public cert).
- Strict audience check.
- SCIM tokens stored encrypted; rate-limited to 100 RPS per Org.

## 10. UI

- Sign-in page: "Sign in with SSO" link → enter Org slug or email.
- If Org enforces SSO and email matches Org domain: bypass password tab.
- Setup wizard: step-by-step IdP-specific guides (Okta/Azure/Google).
- Test connection button: dry-run SAML Authn against IdP.

## 11. Audit

Every SSO event logs:
- `sso.authn_request_sent`
- `sso.authn_response_received` `{ outcome, name_id_hash }`
- `sso.signature_invalid`
- `scim.user_created` / `_updated` / `_deactivated`
- `scim.group_membership_changed`
- `sso.config_changed`

## 12. Telemetry

- `sso.signin` `{ idp_kind, jit_created: bool }`
- `sso.config_validated`
- `sso.config_failed` `{ reason }`
- `scim.sync_event` `{ op, count }`

## 13. Edge cases

| Case | Behavior |
|---|---|
| IdP cert rotation | Configure secondary cert before primary expires; both accepted |
| SCIM deletes the Org Owner | Blocked; SCIM returns 409 with explanation |
| SAML email differs from existing Account | Treat as new Account by NameID + email; surface support flow |
| SSO required but extension can't show webview | Opens system browser tab; deep-links back |
| IdP misconfigured during enforcement | Owner exemption preserves recovery path |

## 14. Tests

- SAMLResponse signature validation (positive + negative).
- Replay rejection (`InResponseTo` reuse).
- SCIM CRUD against fixture Okta tenant.
- JIT + SCIM coexistence.
- Group → role mapping precedence.
