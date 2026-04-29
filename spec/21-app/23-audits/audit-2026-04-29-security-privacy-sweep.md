<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: closed
opened-on: 2026-04-29
closed-on: 2026-04-29
closed-because: 7 of 8 findings resolved by spec edits (F1, F2, F3, F5, F6, F7, F8). F4 promoted to SI-029 in `13-spec-issues/02-current-issues.md` as a tracked v1-launch-gate (needs legal counsel; cannot be agent-resolved).
scope: 19-security-privacy/ folder + sub-processor consistency across spec
-->

# Audit — Security & Privacy Sweep (Session 53)

**Date:** 2026-04-29 (Session 53, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 8 files in `spec/21-app/19-security-privacy/` plus every cross-folder reference to sub-processors, infrastructure providers, and email vendors.
**Reason:** First dedicated audit of this folder since `audit-2026-04-19-spec-internal.md`. Triggered by Session 53 spec-only sweep request when no SIs were open.

> **Open audit.** Findings below should be fixed in subsequent sessions; this file becomes `closed-on` when the SI it spawns is closed.

---

## 1. Headline findings

| # | Severity | Title | Owning files |
|---|---|---|---|
| F1 | **S1** | Three contradictory sub-processor lists in the same spec | `19-security-privacy/02-data-handling.md §7` vs `04-gdpr-ccpa.md §?` vs `07-privacy-policy.md §3` |
| F2 | **S1** | Email-provider drift — Postmark vs Resend in the same folder | `19-security-privacy/02-data-handling.md §7`, `04-gdpr-ccpa.md`, `10-licensing-billing/16-billing-emails.md §115` vs locked `22-infrastructure/11-email-provider.md` |
| F3 | **S2** | Hosting-vendor drift — AWS/Cloudflare named in privacy spec, but `22-infrastructure/01-hosting.md` is the lock | `19-security-privacy/02-data-handling.md §7`, `04-gdpr-ccpa.md` |
| F4 | **S2** | Stub files `06-extension-privacy.md` and `07-privacy-policy.md` are flagged "to be expanded before v1 Phase 1" with no tracked owner or due-date | `19-security-privacy/06-extension-privacy.md`, `07-privacy-policy.md` |
| F5 | **S3** | `02-data-handling.md §3` declares 4 residency regions (Frankfurt/Dublin/Virginia/Oregon/Sydney) but `07-privacy-policy.md §3` only declares EU + US | same files |
| F6 | **S3** | `01-threat-model.md §2.Sharing` says "Bcrypt-hashed" passwords for password-protected shares, but `00-overview.md §1.3` says "Argon2id parameters" | `01-threat-model.md` line 36 |
| F7 | **S3** | `01-threat-model.md §4` rows 9 and 10 use a `\|` (pipe) instead of `→` for the mitigation arrow, breaking the visual pattern set by rows 1–8 | `01-threat-model.md` lines 109–110 |
| F8 | **S3** | Customer-support sub-processor "Plain / front" appears in `02-data-handling.md §7` only — not in `07-privacy-policy.md`, not in `04-gdpr-ccpa.md`. Either provision the row or drop it. | `02-data-handling.md §7` |

---

## 2. Detail — F1 (sub-processor list contradiction)

Three files in the spec name **different** sub-processors:

| File | Listed sub-processors |
|---|---|
| `19-security-privacy/02-data-handling.md §7` | AWS / Cloudflare, Postmark, Stripe / Paddle, Plain / front |
| `19-security-privacy/04-gdpr-ccpa.md` (lines 59–61) | AWS / Cloudflare, Postmark |
| `19-security-privacy/07-privacy-policy.md §3` | Lovable Cloud (managed Supabase), Stripe, Resend |

**Impact.** This is the public-facing privacy disclosure. Drift here is a **legal and CWS-submission risk**, not just a spec defect. The Chrome Web Store privacy form pulls from `06-extension-privacy.md` which references `07-privacy-policy.md` — if the published policy contradicts the engineering data-handling spec, both compliance and the store listing are wrong.

**Fix.** Pick `07-privacy-policy.md §3` as the single source of truth (it's the one that already matches the locked `22-infrastructure/` decisions: Lovable Cloud + Stripe + Resend). Rewrite `02-data-handling.md §7` and `04-gdpr-ccpa.md` to point at it, OR replicate verbatim with a "single source of truth: `07-privacy-policy.md §3`" header.

---

## 3. Detail — F2 (email-provider drift)

Locked in `22-infrastructure/11-email-provider.md` line 4:

> **Locked decision:** **Resend** as primary transactional provider. **Postmark** as failover.

Drift sites:
- `19-security-privacy/02-data-handling.md §7` — names "Postmark" only.
- `19-security-privacy/04-gdpr-ccpa.md` line 61 — names "Postmark" only.
- `10-licensing-billing/16-billing-emails.md` line 115 — "Provider: Postmark (transactional stream `mn-billing`)".
- `10-licensing-billing/16-billing-emails.md` line 142 — schema field "message_id (Postmark)".

**Fix.** All four mentions should read "Resend (primary) / Postmark (failover)" or just "Resend" with a footnote pointer to `22-infrastructure/11-email-provider.md` for the failover policy. The `16-billing-emails.md` schema field should be renamed `provider_message_id` (provider-agnostic) since either Resend or Postmark may have generated it.

---

## 4. Detail — F3 (hosting-vendor drift)

`22-infrastructure/01-hosting.md` is the lock — it specifies Lovable Cloud (managed Supabase), not AWS or Cloudflare directly. References to "AWS / Cloudflare" in `02-data-handling.md §7` and `04-gdpr-ccpa.md` line 59 leak the underlying implementation detail and contradict our user-facing posture (Lovable Cloud abstracts the cloud).

**Fix.** Replace "AWS / Cloudflare (infra)" with "Lovable Cloud (managed Supabase) — see `22-infrastructure/01-hosting.md`". Cloudflare WAF is mentioned separately in `05-share-link-security.md §22` and is fine there because that's a real product surface (bot challenge), not an infra layer.

---

## 5. Detail — F4 (stub-file ownership gap)

`06-extension-privacy.md` line 3 and `07-privacy-policy.md` line 3 both contain notes like:

> Stub authored Session 41 to close SI-026 forward-ref. Content to be expanded before v1 Phase 1 store submission.

There is no SI tracking the expansion, no owner, no due-date beyond "before v1 Phase 1". Per the audit-cadence rule, stubs that gate launch should be tracked.

**Fix.** Open SI-029 ("Privacy-pack stubs need pre-launch expansion") with two checklist items: (a) full per-permission justification narrative in `06-extension-privacy.md §4`, (b) full legal-reviewed copy for all 14 sections of `07-privacy-policy.md §2`. Severity S2. Owner: legal counsel + agent at v1 Phase 1 readiness gate.

---

## 6. Detail — F5 (residency mismatch)

`02-data-handling.md §3` (lines 36–46) declares 4 residency regions: EU+UK+CH (Frankfurt/Dublin), US+CA (Virginia/Oregon), AU+NZ (Sydney), Rest-of-world (user-chosen).
`07-privacy-policy.md §3` (line 45) declares only "EU (default) / US (opt-in for US-billed orgs)".

The privacy policy is the public commitment. If we offer AU/Sydney to AU users but the policy doesn't disclose it, we have an accuracy gap.

**Fix.** Either expand the privacy-policy table to 4 regions matching `02-data-handling.md`, or scope `02-data-handling.md` down to 2 regions (EU + US) matching the policy. Decision belongs to product/legal — recommend matching the policy down to EU+US for v1, then expanding when AU/Sydney goes live.

---

## 7. Detail — F6 (Argon2id vs Bcrypt drift for share passwords)

- `00-overview.md §1.3` line 11: "secret hashing (Argon2id passwords; HMAC for share-link tokens; SHA-256 for invite-token storage)."
- `01-threat-model.md` line 36: "Password share brute force | Bcrypt-hashed; 5 attempts → 1 min lockout, then exponential"
- `05-share-link-security.md` (per `00-overview.md §1.5` summary): "password share Argon2id parameters"

Three files, two algorithms. Argon2id is the locked choice everywhere else; the threat-model row is the outlier.

**Fix.** Change `01-threat-model.md` line 36 from "Bcrypt-hashed" to "Argon2id-hashed". Verify `05-share-link-security.md` actually documents Argon2id parameters.

---

## 8. Detail — F7 (table separator typo)

`01-threat-model.md §4` (Top 10 risks):
- Rows 1–8 use `→` between threat and mitigation.
- Rows 9 and 10 use `|` (pipe), which markdown then misrenders as a malformed table cell.

```
9. **DoS via expensive query** | per-Account query budget; ...
10. **Public share enumeration** | rate-limited 404 responses; ...
```

**Fix.** Replace the two `|` with `→`.

---

## 9. Detail — F8 (orphan sub-processor row)

"Plain / front" customer-support sub-processor appears only in `02-data-handling.md §7`. Either:
- It's real → add to `07-privacy-policy.md §3` and `04-gdpr-ccpa.md`.
- It's not real → drop it from `02-data-handling.md §7`.

Folded into F1's resolution.

---

## 10. Files NOT audited but spot-checked clean

- `03-encryption.md` — TLS 1.3 lock present, KMS rotation policy clear.
- `05-share-link-security.md` — high-entropy slug spec clean, rate-limit pointers correct.
- `04-gdpr-ccpa.md` — DSR SLA matches `02-data-handling.md §6`.

---

## 11. Recommended next session

Open **SI-029** with checklist mapping to F1–F8 and drain in 2–3 sessions. F1+F2+F3 can be batched (single-file rewrite of `02-data-handling.md §7` + `04-gdpr-ccpa.md` paragraph + `16-billing-emails.md` two lines). F4 needs explicit user OK on opening the tracked SI and naming the legal-counsel owner.

---

## 12. Cross-references

- Last security-related audit: `audit-2026-04-19-spec-internal.md`.
- Locked email provider: `22-infrastructure/11-email-provider.md`.
- Locked hosting: `22-infrastructure/01-hosting.md`.
- Spec-issue tracker: `13-spec-issues/02-current-issues.md`.
