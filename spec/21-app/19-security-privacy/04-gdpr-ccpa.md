# GDPR / CCPA Compliance

How LMN meets EU GDPR + UK GDPR + California CCPA + similar regimes.

---

## 1. Roles

| Regime | LMN role | Customer role |
|---|---|---|
| GDPR (personal accounts) | Controller | Data subject |
| GDPR (Org accounts) | Processor | Org is controller; members are data subjects of Org |
| CCPA | Business | Consumer |

DPA template available; auto-signed for paid Orgs at checkout.

## 2. Lawful bases (GDPR Art. 6)

| Processing | Basis |
|---|---|
| Account creation, sign-in, content storage | Contract performance |
| Billing | Contract + legal obligation |
| Security logs, audit log | Legitimate interest |
| Analytics (consented regions) | Consent |
| Crash reports (consented regions) | Consent |
| Marketing emails | Consent (opt-in only) |
| Transactional emails (receipts, security alerts) | Contract |

## 3. Data subject rights

| Right | How |
|---|---|
| Access (Art. 15) | `/account/export` self-service; ≤ 7 d (legal max 30) |
| Rectification (Art. 16) | Edit profile / content in-app |
| Erasure / "right to be forgotten" (Art. 17) | `/account/delete` with 30 d grace; full hard delete |
| Restriction (Art. 18) | Disable processing via `/account/privacy`; suspend membership |
| Portability (Art. 20) | Export in machine-readable JSON + Markdown + open formats |
| Objection (Art. 21) | privacy@letsmarknow.com |
| No automated decision-making (Art. 22) | Not used; banned by policy |

CCPA equivalents (right to know / delete / opt-out / non-discrimination) handled by same flows; "Do Not Sell" link in footer for CA users.

## 4. Consent management

- Granular toggles in `/account/privacy`: analytics, crash reports, marketing.
- Default per region (per `01-opt-in-analytics.md` § 1).
- Withdrawable any time without account impact.
- Audit-logged with timestamps.
- Cookie banner only loads when needed (analytics consent gates cookies; essential cookies clearly labeled).

## 5. Sub-processors

- Listed at `/legal/subprocessors`.
- 30-day notice before adding new ones.
- Email notification to all Org Owners (Pro+).
- DPAs in place with each.

Current expected list:
- AWS / Cloudflare (infra).
- Stripe / Paddle (payments).
- Postmark (transactional email).
- Self-hosted Sentry, PostHog (no third party).

## 6. Data Protection Officer

- DPO appointed once user count > 10k EU residents OR Team plan launches.
- Contact: dpo@letsmarknow.com.
- Listed in privacy policy.

## 7. Privacy by design

- Default-private content (Collections, Items not public unless explicit).
- Minimal data collection (no full URL in analytics, no titles, no notes).
- Local-first where possible (extension popup quick-find runs against local index).
- Per-Org residency choice.
- Self-hosted analytics + crash reporting.
- No fingerprinting; no third-party trackers; no ad networks.
- Strict CSP; no inline scripts.

## 8. Records of processing (GDPR Art. 30)

Maintained internally:
- Categories of data subjects (account holders, share recipients, members).
- Categories of personal data (email, name, IP, content).
- Categories of recipients (sub-processors).
- International transfers (US ↔ EU under SCCs / EU-US DPF).
- Retention schedules (per `02-data-handling.md`).
- Security measures summary.

Available to regulators on request.

## 9. International transfers

- EU → US transfers only under EU-US Data Privacy Framework (DPF).
- Backup SCCs in DPA in case DPF invalidated.
- User can opt for EU-only residency at signup.

## 10. Breach notification

- Internal SOC detects → triage within 1 h.
- Confirmed breach: regulators notified within 72 h (GDPR Art. 33).
- Affected users notified without undue delay if high risk.
- Public postmortem for SEV-0 incidents.
- Breach register maintained.

## 11. Cookies

| Cookie | Purpose | Type | Expiry |
|---|---|---|---|
| `__Host-session` | Auth | Essential | session / 30 d |
| `__Host-csrf` | CSRF token | Essential | session |
| `lmn_consent` | Records consent prefs | Essential | 1 y |
| `lmn_analytics_id` | Anonymized analytics ID | Optional | 1 y |
| `lmn_locale` | UI language | Functional | 1 y |

Banner uses TCF v2.2-aligned UI (Accept / Reject / Customize) for EU.

## 12. Children's data

- 16+ for self-service signup (EU default; varies by member state).
- 13+ for non-EU; under 13 prohibited.
- Age affirmation at signup.
- Parental consent flow not implemented (under-13 not allowed).
- Reported under-13 accounts deleted within 7 d.

## 13. Telemetry (compliance-only)

- `compliance.dsr_received` `{ kind, region }`
- `compliance.consent_changed` `{ category, granted }`
- `compliance.subprocessor_notice_sent` `{ subprocessor }`
- `compliance.breach_declared` (manual)

## 14. Trust portal

`trust.letsmarknow.com`:
- Privacy policy (versioned diff).
- Terms.
- DPA template.
- Sub-processor list.
- Security overview (encryption, retention, region map).
- Annual penetration test summary (Team+).
- SOC 2 status (target: Type 1 within 18 mo, Type 2 within 30 mo).
- Bug bounty program.
- Incident history.

## 15. Edge cases

| Case | Behavior |
|---|---|
| Member exercises GDPR rights against Org | LMN passes request to Org Owner with assistance; ultimately Org's responsibility as controller |
| User opts out of analytics mid-session | Buffered events discarded; future events not sent |
| Erasure of user who is Owner of paid Org | Block until ownership transferred or Org deleted |
| User in EU + uses VPN to non-EU region | Default to EU residency unless user explicitly chooses |
| Court order requesting data | Legal review; user notified unless gag order; minimum disclosure |

## 16. Tests

- DSR flows e2e for each right.
- Cookie banner correctness per region.
- Audit log entries for consent changes.
- Sub-processor list synced with deployed infra (CI check).
- Breach declaration runbook tabletop quarterly.
- Trust portal links not broken.
