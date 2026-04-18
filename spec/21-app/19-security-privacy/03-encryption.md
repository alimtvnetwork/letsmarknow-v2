# Encryption

Cryptographic choices for data at rest and in transit.

---

## 1. In transit

- **TLS 1.3 minimum** for every external connection.
- TLS 1.2 disabled at LB level Q4 2026.
- Certificates: Let's Encrypt with auto-renewal; OCSP stapling; CAA records.
- HSTS preload: `max-age=63072000; includeSubDomains; preload`.
- Internal service-to-service: mTLS with short-lived (1 h) certificates rotated by service mesh.

Cipher suite policy:
- ECDHE key exchange only.
- AEAD ciphers only (ChaCha20-Poly1305, AES-GCM).
- No CBC, no RC4, no DH < 2048 bits.

## 2. At rest

### Postgres
- Disk-level encryption (cloud-managed, AES-256-XTS).
- Selected columns app-layer encrypted (AES-256-GCM with envelope key from KMS):
  - `users.password_hash` (already bcrypt; the bcrypt output itself is not re-encrypted).
  - `users.mfa_secret` (TOTP shared secret).
  - `users.recovery_codes` (hashed individually).
  - `payment_methods.token` (provider token).
  - `api_tokens.hash` (SHA-256 of token; lookup-only).
  - `share_passwords.hash` (bcrypt).
  - `org.security_settings.ip_allowlist` (operationally sensitive).

### Object storage
- Server-side encryption with KMS-managed keys.
- Per-Org sub-key (envelope encryption) for high-tier plans.
- Signed URLs with 5-min default TTL.

### Backups
- Encrypted with a SEPARATE KMS key from production.
- Decryption requires multi-party approval (M-of-N for production restore).

## 3. Key management

| Key | Purpose | Rotation |
|---|---|---|
| `KMS root` | Encrypts envelope keys | Cloud-provider managed |
| `KMS env key` | Per-Org envelope key | Annual + on-demand |
| `JWT signing key (current)` | Sign access + refresh tokens | 90 d |
| `JWT signing key (next)` | Pre-rotation | rolled in 1 d before activation |
| `Webhook HMAC secret` | Sign outbound webhooks | Per integration; user-rotatable |
| `Backup key` | Encrypt backups | 1 y; old backups remain readable |
| `Share-link token salt` | HMAC for token gen | 2 y; old tokens remain valid |

Key rotation steps documented in runbook; tested quarterly.

## 4. JWT specifics

- Algorithm: **EdDSA (Ed25519)** — fast, no nonce risk, modern.
- `RS256` fallback only for legacy clients (none expected).
- HS256 forbidden (shared secret risk).
- Keys exposed via JWKS endpoint `/.well-known/jwks.json` (rotation-aware).
- Access token TTL: 15 min.
- Refresh token TTL: 30 d (rotates on use).
- Refresh tokens single-use; reuse triggers session invalidation + alert.

## 5. Password hashing

- **bcrypt cost 12** (current); review every 2 y.
- Pepper added pre-hash from server-side env (rotates rarely; old peppers kept for verification).
- Migration path to **argon2id** documented; enabled when bcrypt verification too slow on commodity hardware.

## 6. Share-link tokens

- 132-bit entropy: `base64url(crypto.randomBytes(17))` → 22 chars.
- Stored as HMAC-SHA256 in DB (lookup by hash; raw token never persisted server-side after creation).
- Constant-time comparison on lookup.
- Revocation by deleting hash row.

## 7. API tokens

- Format: `lmnpat_<env>_<base62(32 bytes)>` displayed once at creation.
- Stored as SHA-256 in DB.
- Last 4 chars of raw token shown in UI for identification.
- Revocation: soft-delete + cache bust within 60 s.

## 8. CSRF

- Cookie-based auth requires CSRF token (double-submit pattern).
- Token issued in HTML on first GET; verified on POST/PUT/DELETE.
- API token auth doesn't require CSRF (no ambient credentials).

## 9. Password reset tokens

- 256-bit entropy.
- TTL 1 h.
- Single-use; consumed atomically.
- Bound to `user_id` + `email_at_request_time` (mid-flight email change invalidates).

## 10. Email verification

- Same scheme as password reset.
- TTL 24 h.
- Re-sendable with throttle (3 / hour).

## 11. End-to-end encryption (future, not v1)

- Researched for note bodies in Pro+ tier.
- Out of scope for v1 (key recovery UX is hard; postpone).
- Schema reserved: `items.note_encrypted bytea`, `items.note_encryption_key_id`.

## 12. Cryptographic agility

- All algorithm choices behind a config layer.
- Migration paths documented for each (TLS, password hash, JWT alg, key sizes).
- "Algorithm sunset" alert fires 6 mo before deprecation deadline of any in-use primitive.

## 13. Telemetry (security-only)

- `crypto.jwt_key_rotated`
- `crypto.kms_failure` `{ operation }` (alert immediately)
- `crypto.invalid_signature` `{ kind }` (potential attack)
- `crypto.refresh_token_reuse_detected` (alert + invalidate session)

## 14. Edge cases

| Case | Behavior |
|---|---|
| KMS unreachable | App returns 503; no stored fallback (fail-secure) |
| JWT key rotation mid-session | Old key valid for 1 d overlap; clients fetch JWKS on verification fail |
| Refresh token reuse | All sessions for that account invalidated; user notified by email |
| Backup encryption key lost | Backups unrecoverable; documented as DR scenario; M-of-N custody prevents single loss |
| Cipher downgrade attempt at TLS | Connection rejected; logged as security event |

## 15. Tests

- TLS configuration scanned by SSL Labs + Testssl.sh; A+ grade required.
- JWT verification with correct + wrong + rotated keys.
- Refresh-token reuse triggers invalidation.
- Constant-time comparison for share token (timing attack test).
- Bcrypt cost calibrated to ≥ 250 ms on baseline hardware.
- KMS failure simulated (chaos test).
- Backup restore round-trip with encryption.
