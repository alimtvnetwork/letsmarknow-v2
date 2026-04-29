<!--
audit-date: 2026-04-19
next-audit-by: 2027-04-19
audit-type: ad-hoc
status: closed
closed-on: 2026-04-29
closed-because: All decisions resolved and locked into spec/memory.
-->
# Audit 2026-04-19 — Decisions Needed (Owner vs. AI Judgment)

> **Status (2026-04-19 p.m.):** all 23 findings in `audit-2026-04-19-m-gaps.md` are already reconciled. This file is a **retrospective classification** so the same triage can be reused on the next audit cycle. It answers one question only: *which findings genuinely need a human owner, and which can an AI close on its own without inventing strategy?*

---

## 1. Decision rubric

A finding **requires owner input** if **any** of the following is true:

1. **Money or pricing** is involved (revenue model, plan pricing, currency).
2. **Legal / compliance** scope changes (data residency, GDPR boundary, retention, license terms).
3. **Roadmap scope** changes (P0 ↔ P1 ↔ P2 movement of any feature).
4. **External vendor lock-in** (provider choice that costs money to reverse: payment processor, email provider, OAuth app registration, custom domain).
5. **Brand / naming** decision visible to end users (product names, public URLs, plan names).

Otherwise the finding is **AI-resolvable**: the spec already locked the answer elsewhere, or there is exactly one defensible engineering choice given the locked constraints.

---

## 2. The 5 findings that most urgently need owner input

Ordered by *cost-of-getting-it-wrong*.

### 🔴 Owner-1 — Pricing canon ($5/$9/$79/$249 vs. $8/$12/$199/$599)

- **Finding:** F-M11 (SKU map vs. plans-matrix).
- **Rubric trigger:** #1 (money) + #5 (brand: pricing page is public).
- **Why owner only:** The two numbers correspond to different revenue strategies (volume vs. premium). Either is internally consistent; no engineering signal can pick. Wrong choice at launch is a 6–12-month repricing exercise with grandfathering pain.
- **What was decided 2026-04-19:** $5/$9/$79/$249 (locked plans-matrix wins). Defensible because plans-matrix is older + already cited in marketing draft.
- **Re-decide trigger:** any new market data on competitor pricing, or any change to seat-count assumption in `07-seats-and-quotas.md`.

### 🔴 Owner-2 — GitHub OAuth in P0 vs. P1

- **Finding:** F-M14.
- **Rubric trigger:** #3 (roadmap scope) + #4 (vendor: GitHub OAuth app needs registration + verification).
- **Why owner only:** Trade-off is *launch surface area* vs. *developer-segment conversion rate*. Engineering can spec either; the call depends on who the launch audience is, which is a go-to-market decision.
- **What was decided 2026-04-19:** P1 (deferred). Forward-spec preserved so Phase-1 work can drop in without re-opening the spec.
- **Re-decide trigger:** any pivot toward developer-tools positioning, or any user-research data showing GitHub-first signups in the waitlist.

### 🔴 Owner-3 — Custom domain for share viewer (`share.letsmarknow.com` Team-plan feature)

- **Finding:** F-M23 (domain map).
- **Rubric trigger:** #4 (DNS + SSL cost per custom domain) + #5 (brand: customer-visible URL).
- **Why owner only:** Whether Team-plan customers get a vanity domain (`shares.acme.com` CNAME → `share.letsmarknow.com`) is a *plan-feature* decision, not a tech one. Engineering can build either; the question is whether the upsell justifies the operational cost (cert renewal, abuse review, support burden).
- **What was decided 2026-04-19:** kept as Team-plan feature (`share.letsmarknow.com` registered as the CNAME target). No commitment to custom-host yet.
- **Re-decide trigger:** any cancellation pattern showing custom-domain as the primary churn reason on Team plan.

### 🔴 Owner-4 — Email provider lock-in (Postmark)

- **Finding:** F-M03 (email env vars).
- **Rubric trigger:** #4 (vendor lock-in: warm-up period, sender-reputation accumulation, template re-write cost on switch).
- **Why owner only:** Postmark vs. Resend vs. SES vs. Mailgun differ on price (5–10× spread at scale), deliverability, and EU data residency. Engineering can integrate any; the choice locks 12+ months of reputation building.
- **What was decided 2026-04-19:** Postmark (per `22-infrastructure/11-email-provider.md` v4 lock-in). Defensible because EU data residency is required and Postmark publishes EU region.
- **Re-decide trigger:** any cost projection showing > $500/mo email spend, or any GDPR ruling change affecting Postmark's EU stance.

### 🔴 Owner-5 — Lifetime license offering (`lifetime_pro` $79, `lifetime_team` $249)

- **Finding:** F-M11 (sub-decision, separate from per-month pricing).
- **Rubric trigger:** #1 (money) + #3 (roadmap: lifetime SKUs commit support obligation forever).
- **Why owner only:** Lifetime deals are a *cash-now / margin-later* trade-off. Whether to offer them at all, and at what cap, is a business decision. Engineering can disable the SKUs trivially.
- **What was decided 2026-04-19:** kept (both `lifetime_pro` and `lifetime_team` in SKU map). Defensible because AppSumo-style launch is a known indie-SaaS playbook.
- **Re-decide trigger:** any decision to seek institutional funding (lifetime deals reduce ARR multiples).

---

## 3. The 18 findings AI can resolve alone (and how)

Grouped by resolution pattern.

### 3.1 — "The spec already locked this elsewhere; one file drifted" (8 findings)

AI just propagates the existing locked answer. Zero invention.

| ID | Drifted file | Locked source-of-truth | AI action |
|---|---|---|---|
| F-M02 | `12-oauth-clients.md` env-var names | `22-infrastructure/03-env-vars.md` style | Rename to `OAUTH_<PROVIDER>_<FIELD>_<ENV>` |
| F-M04 | `13-rate-limit-values.md` numbers | `09-auth-accounts/11-rate-limits-and-abuse.md` | Re-align numbers |
| F-M05 | `13-rate-limit-values.md` paths | `03-api-endpoints/01-conventions.md` (`/v1/` prefix) | Add `/v1/` |
| F-M07 | `14-realtime-transport.md` channel naming `user:` | `00-overview/02-glossary.md` (canonical: `account:`) | Rename to `account:` |
| F-M08 | `19-breakpoints.md` missing `3xl` | `06-ui-ux/04-layout-grid.md` (1920px column) | Add `3xl` row |
| F-M09 | `13-rate-limit-values.md` 429 envelope | `03-api-endpoints/18-error-codes.md` `{ error: { code } }` | Wrap envelope |
| F-M10 | `13-rate-limit-values.md` quota error | `18-error-codes.md` `BILLING_QUOTA_EXCEEDED` | Use canonical code |
| F-M22 | DoD broken-link verification | All target files exist | Verify clean |

### 3.2 — "Only one engineering choice survives the locked constraints" (5 findings)

AI picks the answer because the locked rules eliminate alternatives.

| ID | Question | Locked constraint that decides | AI action |
|---|---|---|---|
| F-M06 | Realtime transport | Lovable Cloud (Supabase) is the locked stack → Supabase Realtime | Lock Supabase Realtime |
| F-M12 | `backups` bucket presence | DR rule (RPO ≤ 1h, RTO ≤ 4h) requires backups | Re-add bucket |
| F-M19 | `amount_cents` vs. `amountUsd` | API convention is snake_case (`01-conventions.md` §9); currency must be explicit for forward compat | Use `amount_cents` + `currency` |
| F-M20 | Cron timezone | `22-infrastructure/02-environments.md` runs UTC; user TZ is Asia/KL only for owner-facing dashboards | Annotate UTC explicitly |
| F-M21 | SKU env suffix | `01-plans-matrix.md` §6 forbids hardcoded env-marked IDs | Move env to lookup, not key |

### 3.3 — "Pure cross-reference / file relocation; zero choice" (5 findings)

AI re-files content to its correct home per the folder taxonomy.

| ID | Action |
|---|---|
| F-M01 | Standardize storage bucket names + apply hybrid path scheme (the 3 schemes already exist in different files; just merge) |
| F-M13 | Add cross-ref from email-template table → magic-link auth flow (already specced in `02-signup-and-signin.md` §5) |
| F-M15 | Add `collection:` + `item:` channels back (already implied by realtime presence requirements) |
| F-M16 | Move WCAG file from `19-security-privacy/` → `06-ui-ux/` (file naming convention says UX docs live in UX folder) |
| F-M17 | Add `search_tsv` column to `02-data-model/05-item.md` (already specced in `14-search/06-search-engine.md` §2.2; just back-port the cross-ref) |
| F-M18 | Add cross-ref from mapping file → dedup algorithm file |

> Note: F-M15 + F-M17 + F-M18 are pure bidirectional-link additions; no semantic decision.

---

## 4. Summary table

| Category | Count | % | AI can do alone? |
|---|---|---|---|
| Owner-required | **5** | 22% | ❌ — needs human business judgment |
| Spec-already-locked propagation | 8 | 35% | ✅ — mechanical |
| Single-defensible engineering choice | 5 | 22% | ✅ — eliminate-alternatives reasoning |
| Pure cross-ref / file move | 5 | 22% | ✅ — taxonomic |
| **Total** | **23** | **100%** | **78% AI-resolvable** |

---

## 5. Process recommendation for next audit cycle

1. **First pass (AI alone):** apply rubric §1; resolve everything that fails the owner-trigger tests. Expected throughput: ~75–80% of findings.
2. **Second pass (owner queue):** present the remaining ~20% as a single batched decision document with:
   - the conflict
   - the two (or more) locked-elsewhere answers
   - the cost of getting each wrong
   - a recommendation with rationale
3. **Third pass (AI alone):** propagate the owner's answer back to all dependent files.

This avoids the failure mode of asking the owner to adjudicate things the spec already answers, which is what made the 2026-04-19 m-gap audit feel heavier than it needed to be.

---

## 6. Cross-refs

- Source audit: `audit-2026-04-19-m-gaps.md`
- Reconciliation log: `.lovable/memory/features/gap-analysis-state.md` (v6, Round 4)
- Owner decisions confirmed: see Round 4 owner-decision block in the same memory file.
