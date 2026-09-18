# Devices & Security

Device tracking, suspicious-login alerts, IP heuristics.

---

## 1. Device list

`/me/security/devices`:
- Sourced from `Session` rows with `revoked_at IS NULL` and `expires_at > now()`.
- Per row:
  - Device label: derived from UA (`Chrome on macOS`, `LMN extension on Chrome`, `iPhone PWA`).
  - Client kind + version.
  - Geo: city, country (from truncated IP).
  - First seen, last seen.
  - "Current device" badge.
  - Revoke button.
- "Revoke all others" sticky action.

## 2. Trusted devices (MFA)

Stored separately (not in Session table) via long-lived cookie:
- `Name`: `__Host-lmn_trust`
- HttpOnly, Secure, **SameSite=Strict** (intentional difference from refresh cookie — trust cookie is only consulted on same-site sign-in form submit; no magic-link / cross-site nav use case).
- 30-day TTL.
- Value: opaque random; hashed on server.
- One row per `(account_id, device_fingerprint)` in `trusted_devices`.
- Revoke from `/me/security/devices`.

## 3. Suspicious-login detection

Heuristics evaluated server-side at sign-in:
- New country (vs last 30 days).
- New ASN.
- Impossible travel (distance ÷ time > 800 km/h between two sign-ins).
- New client kind (e.g., first PWA on iOS).
- Sign-in from Tor exit node or known abuse IP.

If `risk >= "medium"`:
- MFA challenge inserted (even if "trusted device").
- Email + inbox alert: "New sign-in to your LMN account from {city, country} on {device}."
- Mark Session with `risk_signal_at`.

If `risk >= "high"`:
- Block sign-in; require email-verified one-time code.
- Auto-trigger "Sign out everywhere" prompt on next safe sign-in.

## 4. IP handling

- IPs truncated for storage:
  - IPv4 → /24
  - IPv6 → /48
- Full IP retained ONLY for 24 h in transient brute-force defense store, then deleted.
- Geo derived from CDN/Cloudflare headers, never stored as exact coords.
- Tor and known VPN IPs labeled in UI ("VPN") for transparency without blocking by default.

## 5. Notifications

- New device sign-in: email + inbox.
- New country sign-in: email + inbox.
- "Sign out everywhere" performed: email confirmation.
- Trusted device added: inbox only.
- Suspicious blocked: email immediate (always; non-disable).

User can choose verbosity in `/me/notifications/preferences`:
- `all_devices` (default)
- `new_country_only`
- `high_risk_only`

## 6. UI

- `/me/security` aggregates:
  - MFA status + setup.
  - Recovery codes status + regenerate.
  - Connected providers (`/connections`).
  - Devices list.
  - Recent activity log (sign-ins, sign-outs, password changes — last 90 d).
- Recent activity entries link to "Was this you?" → escalation to "Sign out everywhere" + password reset.

## 7. Performance

- Device list query p95 < 200 ms.
- Sign-in risk evaluation p99 < 30 ms (in-memory rules + Redis lookups).

## 8. Privacy

- IP truncation enforced at ingestion; never stored full beyond defense window.
- Geo never stored at higher precision than city.
- Device fingerprint = hash of (UA family + OS family + plugin set hash); not browser fingerprinting on entropy-rich attributes.

## 9. Telemetry

- `device.signin` `{ kind, country }`
- `device.new_country` `{ from, to }`
- `device.impossible_travel` `{ km, hours }`
- `device.revoked` `{ by_self: bool }`
- `device.trusted_added` / `_revoked`
- `device.high_risk_blocked` `{ reason }`

## 10. Edge cases

| Case | Behavior |
|---|---|
| User legitimately travels (legit impossible travel) | MFA challenge succeeds → trusted, no further friction |
| Same device updates browser version | Same fingerprint; Session continued |
| User on rotating mobile IP | Treated as same Session (not flagged) |
| Account-wide compromise suspected | Owner can request full session revoke + password reset email; admin escalation path |
| Privacy-conscious user disables geo display | UI shows "Hidden by setting" instead of city |

## 11. Tests

- Risk heuristic unit tests (each rule).
- Truncation + retention enforcement.
- Trusted-device cookie rotation.
- Suspicious-login alert delivery.
- Device list pagination + revoke action.
