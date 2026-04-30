# Threat Model

STRIDE-based analysis of attack surfaces, adversaries, and mitigations.

---

## 1. Adversaries

| Adversary | Capability | Motivation |
|---|---|---|
| Curious user | Standard browser; valid account | Snoop on other Orgs they don't belong to |
| Malicious member | Valid Org membership | Exfiltrate data; sabotage; escalate role |
| External attacker | No account; full network attack toolkit | Account takeover, data theft, service disruption |
| Compromised endpoint | Stolen device w/ active session | Read all the user's data |
| Insider (Lovable employee) | Database / infra access | Curiosity; data exfil |
| Nation-state | Sophisticated; supply-chain | Targeted intelligence |

## 2. STRIDE per surface

### Authentication

| Threat | Mitigation |
|---|---|
| Spoofing (account takeover) | Strong password rules, breached-password check (HIBP), MFA, anomaly-detection alerts |
| Tampering (modified tokens) | Signed JWTs (EdDSA), short TTL access tokens, refresh-token rotation |
| Repudiation | Audit log of every auth event; immutable |
| Information disclosure (token leak) | HttpOnly + Secure + SameSite=Lax cookies; CSRF tokens for state-changing requests |
| Denial of service | Per-IP + per-account rate limits on `/auth/*` per `09-auth-accounts/13-rate-limit-values.md §2` (SoT); CAPTCHA escalation thresholds per `13-rate-limit-values.md §2.1` (SoT) |
| Elevation of privilege | RLS + `has_role` SECURITY DEFINER; no client-side role checks |

### Sharing

| Threat | Mitigation |
|---|---|
| Public link discovery | 22-char URL-safe token (132 bits entropy); no enumeration |
| Password share brute force | Argon2id-hashed (parameters in `19-security-privacy/05-share-link-security.md §6`); rate limits + lockout per `09-auth-accounts/13-rate-limit-values.md §4` (SoT) |
| Invite-only bypass | Token + email match; one-time-use; HTTPS-only; expiry |
| Shared content escalation (read → write) | Permission re-validated on every mutation server-side |
| Share leak via referrer | `Referrer-Policy: no-referrer` on share viewer |
| Embed widget XSS | Sandboxed iframe, postMessage-only, strict CSP |

### API

| Threat | Mitigation |
|---|---|
| Injection (SQL / NoSQL) | Parameterized queries, ORM-mediated, code review checklist |
| Mass assignment | Allowlist of mutable fields per endpoint |
| IDOR (insecure direct object reference) | RLS at DB layer + `has_role` checks |
| CSRF | SameSite cookies + double-submit token for cookie-auth requests |
| SSRF | Outbound URL fetcher restricted to HTTP(S), public IP ranges only, redirect cap, timeout |
| Server-side parser exploits | Image/PDF parsing in isolated worker (gVisor/firecracker), CPU/mem limits |

### Data layer

| Threat | Mitigation |
|---|---|
| Backup leak | Backups encrypted with separate KMS key; access audit-logged |
| Insider DB query | Strict access controls; query audit; sensitive cols encrypted at app layer |
| Supply chain (npm) | Lockfile required, dependabot, audit on CI, SCA scanning, minimal deps |
| Cryptojacking via dependency | Lockfile + allowlist + manifest review |

### Client

| Threat | Mitigation |
|---|---|
| XSS | Strict CSP, nonce-based inline, sanitize all user-generated content (DOMPurify) |
| Clickjacking | `X-Frame-Options: DENY` everywhere except sanctioned embed routes |
| Local storage theft (XSS payoff) | Tokens in HttpOnly cookies (not localStorage) |
| Extension permission abuse | Minimal permissions; `host_permissions` scoped; user-approved |
| Compromised extension build | Code signing for self-hosted; reproducible builds |

### Operations

| Threat | Mitigation |
|---|---|
| Stolen admin credentials | Hardware MFA enforced for staff; just-in-time access; session recording |
| Misconfigured infra | Infra-as-code with peer review; drift detection; cloud security baseline checks |
| Logs leak PII | Log scrubber middleware; periodic audit |
| Secret in repo | Pre-commit secret scanner (gitleaks); CI gate; rotated immediately if found |

## 3. Trust boundaries

```
Browser (untrusted)
  ↓ TLS 1.3
CDN / WAF (filter, rate-limit)
  ↓
API gateway (auth, rate-limit per Account)
  ↓
App services (RLS-bound DB queries)
  ↓
Postgres (RLS + encrypted columns)
Storage (signed URLs, short TTL)
KMS (key custody)
```

Each boundary validates inputs and enforces auth independently. No "trusted internal" tier.

## 4. Top 10 risks (prioritized)

1. **Account takeover via password reuse** → MFA push, breached-password check, anomaly alerts.
2. **Shared link leakage** → high-entropy tokens, expiry defaults, revoke-all-from-suspended.
3. **Member privilege escalation** → DB-enforced RLS + `has_role`; admin role changes audit-logged + notify Owner.
4. **Browser extension supply-chain attack** → minimal deps, SBOM, signed builds, integrity checks.
5. **SSRF via OG-image fetcher** → strict allowlist of schemes, public IPs only, timeouts.
6. **Cross-tenant data leak via cache** → Redis keys include `org_id`; cache busted on membership change.
7. **Sensitive data in error reports** → breadcrumb redaction + PII linter in CI.
8. **Insider data access** → JIT access, query audit, named-user access only.
9. **DoS via expensive query** → per-Account query budget; circuit breaker; query timeout.
10. **Public share enumeration** → rate-limited 404 responses; constant-time token compare.

## 5. Incident response

- 24/7 on-call rotation (post-launch).
- Severity ladder: SEV-0 (data breach), SEV-1 (downtime), SEV-2 (degraded), SEV-3 (minor).
- SEV-0/1 trigger: status page update within 15 min, customer email within 4 h, postmortem within 7 d (public for SEV-0).
- Runbook in private repo; tested quarterly via tabletop exercise.

## 6. Security review gates

- New feature: threat-model worksheet required for any change touching auth, sharing, or data export.
- Major release: external security review (Team+).
- Annual penetration test; results in trust portal.
- Quarterly dependency audit.

## 7. Bug bounty

- Public scope: web app, extension, marketing site.
- Out of scope: marketing site DOS, social engineering, third-party services.
- Tiered rewards: $50 (low) - $5,000 (critical RCE / auth bypass).
- Safe harbor language inviting researchers.

## 8. Telemetry

- `security.failed_auth_burst` `{ ip, account_email_hash }`
- `security.csrf_rejected`
- `security.rate_limit_exceeded` `{ endpoint }`
- `security.suspicious_pattern_detected` `{ pattern }` (server-side)
- `security.bug_bounty_report_received` (manual)

## 9. Tests

- Threat-model worksheet present for every PR touching auth/sharing/export.
- Automated SCA + SAST + DAST in CI.
- Fuzzing harness for parsers (Bookmarks HTML, OPML, JSON).
- Replay attack test for share tokens.
- Privilege escalation test for every role pair.
