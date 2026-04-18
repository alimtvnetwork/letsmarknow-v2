# 19 — Security & Privacy

Threat model, data handling, encryption, GDPR/CCPA compliance, share-link security.

## Reading order

1. `01-threat-model.md` — STRIDE analysis + adversaries.
2. `02-data-handling.md` — Classification, retention, residency.
3. `03-encryption.md` — At-rest and in-transit.
4. `04-gdpr-ccpa.md` — Compliance posture.
5. `05-share-link-security.md` — Public/password/invite-only specifics.

## Files

| File | Purpose |
|---|---|
| `01-threat-model.md` | Adversaries, attack surfaces, mitigations |
| `02-data-handling.md` | Data classification + lifecycle |
| `03-encryption.md` | Crypto choices |
| `04-gdpr-ccpa.md` | Legal compliance posture |
| `05-share-link-security.md` | Share-specific threats |

## Locked rules

- **TLS 1.3 mandatory** end-to-end; no fallback.
- **At-rest encryption** for all PII via AES-256-GCM (envelope encryption).
- **Secrets in env / KMS only**; never in code, never in client bundles.
- **CSP strict** (no unsafe-inline / no unsafe-eval); nonce-based for inline.
- **Rate limiting** on every public endpoint.
- **Bug bounty program** (Pro+) via dedicated security@letsmarknow.com.
- **Annual penetration test** (Team+) results summarized in trust portal.
- **Data residency**: EU users → EU region; opt-in for US.
- **No third-party trackers** ever; self-hosted analytics + error reporting.
- **MFA strongly recommended** for all roles; enforced for Owner / Admin (Team+).
