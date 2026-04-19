# 00 — Security & Privacy Folder Overview

> **Purpose.** Define the **threat model**, **data handling rules**, **encryption stance**, **GDPR/CCPA obligations**, and **share-link security posture**. This folder is the constraint that constrains every other folder. If a feature is incompatible with what is written here, the feature changes — not this folder.

---

## 1. Responsibilities

1. **Threat model.** Documented attacker classes (opportunistic, targeted, insider, supply-chain) and the mitigations per class.
2. **Data handling.** Classification (public, internal, confidential, secret), per-class storage and transmission rules, retention windows, deletion guarantees.
3. **Encryption.** TLS 1.3 minimum on every public endpoint (locked in `22-infrastructure/readme.md`); at-rest encryption for DB, storage, backups; secret hashing (Argon2id passwords; HMAC for share-link tokens; SHA-256 for invite-token storage).
4. **GDPR/CCPA.** Lawful basis, data subject rights (access, rectification, erasure, portability), DPA template, Records of Processing.
5. **Share-link security.** High-entropy slugs, password share Argon2id parameters, unlock cookie scope/lifetime, server-side rate limiting, brute-force lockout.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-threat-model.md` | Attacker classes, mitigations, residual risks. |
| `02-data-handling.md` | Classification, retention, deletion, EU residency lock. |
| `03-encryption.md` | TLS, at-rest, hashing parameters, key management, rotation. |
| `04-gdpr-ccpa.md` | Lawful basis, subject rights, DPA, RoPA, sub-processor list. |
| `05-share-link-security.md` | Slug entropy, password hashing, unlock cookie, rate limiting, lockout. |

---

## 3. Tasks performed by this folder

- **Define the security posture** that all other folders must respect.
- **Lock encryption parameters** so they cannot be silently weakened.
- **Define data subject rights flows** consumed by `11-import-export/09-gdpr-export.md` and `09-auth-accounts/08-account-deletion.md`.
- **Define share-link entropy and rate-limit parameters** consumed by `08-sharing-collab/02-public-shares.md` … `04-invite-only-shares.md`.

---

## 4. What this folder is NOT

- **Not the auth model.** Identity and sessions are in `09-auth-accounts/`.
- **Not the rate limit values.** Numeric limits are in `09-auth-accounts/13-rate-limit-values.md`.
- **Not the audit log.** Format and retention live in `08-sharing-collab/09-audit-log.md` and `12-history-undo/01-event-log.md`.

---

## 5. Cross-references

- TLS lock: `22-infrastructure/readme.md` §Locked rules.
- Share-link slug shape: `08-sharing-collab/13-share-link.md`.
- Password hashing parameters: `09-auth-accounts/03-passwords-and-mfa.md`.
- GDPR export emission: `11-import-export/09-gdpr-export.md`.
- Account deletion lifecycle: `09-auth-accounts/08-account-deletion.md`.
