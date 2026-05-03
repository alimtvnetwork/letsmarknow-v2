<!--
audit-date: 2026-04-30
next-audit-by: 2027-04-30
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: Decision + declaration of /v1/webhooks/apple-notifications. S118 F5 resolved.
-->
# Audit — Apple SiwA inbound webhook declaration (Session 121)

**Date:** 2026-04-30
**Trigger:** S118 F5 + S120 next-action #3 — decide whether `/v1/auth/apple/notifications` (referenced in `09-auth-accounts/04-oauth-providers.md §4.2`) should be declared as an inbound webhook in the canonical inventory or kept infra-only.

---

## 1. Decision

**Declare it.** Per Apple's "Sign in with Apple — process change notifications" requirement, every SiwA integration MUST register a callback URL and act on `pop` events (revocation, email change, account deletion). The endpoint exists in the system; not declaring it would diverge from the locked rule that "every inbound public surface is declared in `03-api-endpoints/00-overview.md`" (per audit-2026-04-29-orphan-endpoint-sweep / SI-022 closure).

## 2. Changes

| Change | File |
|---|---|
| Renamed bare `/auth/apple/notifications` → canonical `POST /v1/webhooks/apple-notifications` | `09-auth-accounts/04-oauth-providers.md §4.2` |
| Added inventory row in §2.15 Webhooks (inbound) | `03-api-endpoints/00-overview.md:354` |
| Added full endpoint contract (auth, JWS verification, event types, behavior, errors) | `03-api-endpoints/17-billing-webhooks.md` (new section between generic-inbound and diagnostics) |
| Bumped `§7` count via `scripts/lint/endpoint-counts.ts --write` | `03-api-endpoints/00-overview.md:474` (171 → 172) |

## 3. Rationale for path choice

- `/v1/webhooks/apple-notifications` matches the existing webhook namespace (`/v1/webhooks/{stripe,paddle,email-in,inbound,...}`) per `00-overview.md §2.15`.
- Avoids `/v1/auth/...` because that namespace is for outbound auth flows initiated by our clients; SiwA notifications are inbound from Apple.
- Hyphenated stem (`apple-notifications`) follows the `lifetime-redeem` / `email-in` precedent.

## 4. Behavior locked

- Auth: `webhook-sig` Apple JWS, verified against `https://appleid.apple.com/auth/keys`.
- Idempotency: `(sub, event_time)` tuple from decoded JWS.
- Events handled: `email-disabled`, `email-enabled`, `consent-revoked`, `account-delete`.
- `consent-revoked` / `account-delete` → unlink identity; if sole identity, schedule into standard 30-day deletion grace per `09-auth-accounts/08-account-deletion.md`.
- Response 200 `{ "received": true }` always (even on duplicate) to suppress Apple retries.

## 5. Verification

- `npx tsx scripts/lint/endpoint-counts.ts` → 0 drift (172/172, 99 POST rows).
- `grep -rn 'auth/apple/notifications' spec/21-app/` → 0 matches outside the closed audit-118 file.
- Auth class `webhook-sig` already declared in `00-overview.md §17`. No new auth class added.

## 6. Outcome

S118 F5 resolved. Inventory grows 171 → 172 (one declared row, fully specified). Open SI count = 1 (SI-029, blocked).

## 7. Suggested next sweeps

1. `04-extension/` second-pass post-audit-108.
2. `07-features/` deeper sweep beyond audit-116.
3. `06-ui-ux/22-share-modals.md` — withdrawn by S121 finding: existing `11-feedback.md §4` already locks modal widths (560/720) and `§2.2` locks toast durations; a new file would duplicate locked tokens. **Closed without action.**
4. SI-029 still blocked on legal counsel.
