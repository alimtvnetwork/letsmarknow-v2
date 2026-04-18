# Share Link Security

Specific threats and mitigations for shared content (public / password / invite-only).

---

## 1. Token generation

- 132-bit entropy: `crypto.randomBytes(17)` → base64url 22 chars.
- Format: `letsmarknow.com/t/{token}` for public; `letsmarknow.com/s/{token}` for invite/password.
- Custom slugs (Pro+) reserved separately; do NOT replace token (token still required for collision-resistance + revocation).
- DB stores HMAC-SHA256 of token (not the raw token).
- Constant-time comparison on lookup.

## 2. Threat: enumeration / brute force of token

| Mitigation | Detail |
|---|---|
| High entropy | 132 bits → 5×10³⁹ tokens |
| Rate limit | 60 /min /IP on `/t/{token}` and `/s/{token}` |
| Constant 404 timing | Always 200ms+ even on miss to prevent timing oracle |
| WAF | Cloudflare bot challenge after threshold |
| Logging | Failed attempts logged but not surfaced (avoid amplification) |

## 3. Threat: link leak via referrer

- Mitigation: `Referrer-Policy: no-referrer` on all share viewer responses.
- Embed widget pages: same.
- External links inside shared content open in new tab with `rel="noopener noreferrer"`.

## 4. Threat: link leak via screenshot / browser history / clipboard

- Cannot fully prevent — user education in share-create UI:
  - "Anyone with this link can view; share carefully."
  - "Add a password for sensitive content."
  - Default expiry suggestion ("Set to expire in 30 days?").
- Mitigations layered: password, expiry, view limits.

## 5. Threat: shared link discovered in CDN / proxy logs

- TLS 1.3 in transit (no mid-network logging possible).
- CDN edge logs: token redacted in standard log format (custom log fields exclude path).
- Internal proxies: same redaction policy.

## 6. Password shares

### Hashing
- bcrypt cost 12 (same as user passwords).
- Per-share salt.

### Brute force
- 5 wrong attempts / 15 min / IP per share → 1 min lockout.
- Continued failures: exponential lockout (1 min → 15 min → 1 h → 24 h).
- All attempts logged in audit.

### UX
- Password entry page: minimal info (no preview of content).
- Min password length 6 chars enforced at creation; strength indicator.
- Password sent OOB (creator's responsibility); never via the same link.

## 7. Invite-only shares

- Token + email match required.
- Invite links one-time-use; consumed on first claim.
- TTL 7 d for unaccepted invites; renewable.
- After acceptance: associates with recipient's Account; future visits via Account auth.
- Recipient must be signed in (or sign up) to consume invite.

## 8. View limits + expiry

- Per-share configurable: max views, expires_at.
- Defaults configurable per Org.
- Expiry: server-side timestamp check; expired shares return 410 Gone.
- View limit reached: 410 Gone with friendly message + "Request access" link.

## 9. Revocation

- One-click revoke from share manager.
- Effective within 60 s globally (cache bust).
- Revoked shares return 410 Gone.
- Bulk revoke: "Revoke all shares from this member" / "Revoke all expired".

## 10. Public discoverability

- `noindex` `nofollow` on share viewer pages (default).
- Owner can opt-in to allow indexing per-share (rare; intended for portfolio-style use).
- Sitemap NEVER lists shares.

## 11. Embed widgets

- iframe with `sandbox="allow-scripts allow-same-origin"` minimum.
- Embedding origin allowlist per Org (Team+).
- `X-Frame-Options: ALLOWALL` (or omit) only on dedicated `/embed/{token}` route.
- All other routes: `X-Frame-Options: DENY`.
- Postmessage protocol versioned; origin checked.

## 12. Share viewer hardening

- Strict CSP: no inline scripts, nonce-based.
- No third-party requests except sanctioned CDN.
- All user-generated content sanitized (DOMPurify).
- File downloads served with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

## 13. Anti-abuse

- Patterns of suspicious activity escalated:
  - High view rate from single IP across many tokens (bot scraping).
  - High creation rate per Account (spam).
  - Share content matching known phishing/malware signatures (basic URL reputation check).
- Auto-disable share + notify Owner; manual review for false positives.

## 14. Comments on shared content

- Per-share toggle.
- Anonymous comments allowed only if Org permits.
- Rate-limited per IP + per share.
- Reported comments queue for Owner review.

## 15. Analytics on shares

- Pro+: per-share view count, unique viewers (anonymized), referrers (top-level domain only), countries (coarse).
- Visible to share creator + Org Admins.
- No individual-viewer tracking; aggregated only.
- Viewer can opt out of analytics via `Do-Not-Track` (respected for share analytics specifically).

## 16. Telemetry (security-only)

- `share.brute_force_lockout` `{ share_id, ip_hash }`
- `share.token_404_burst` `{ ip_hash }` (potential enumeration)
- `share.auto_disabled` `{ reason }`
- `share.password_attempts` `{ count }` (aggregated)

## 17. Edge cases

| Case | Behavior |
|---|---|
| Token in URL leaked to analytics provider | Self-hosted analytics; URL path stripped to `/t/:redacted` for outbound calls (none in our case) |
| Share creator's account suspended | Per Org policy: auto-revoke or retain; default retain |
| Custom slug collides with existing | 409 + suggest alternatives |
| Password share wrong-password 100×/h on 1 share | Auto-lockout share for 24 h; notify creator |
| Embed origin not in allowlist | iframe blocked; viewer page shows "Not allowed to embed" |
| User reports phishing share to abuse@ | Queue for triage; auto-disable if high-confidence; manual review otherwise |

## 18. Tests

- Token entropy + uniformity statistical test.
- Constant-time 404 timing.
- Brute-force lockout escalation curve.
- Invite single-use enforcement under concurrent claim.
- Revocation propagation < 60 s.
- Embed origin enforcement.
- Sitemap excludes shares.
- CSP report-only mode test for share viewer with various content.
