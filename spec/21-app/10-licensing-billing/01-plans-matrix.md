# Pricing & Plans

The canonical plan matrix. Single source of truth for marketing site, billing UI, and entitlements engine.

---

## 1. Plans (v1)

| Plan | Price (USD) | Audience |
|---|---|---|
| **Free** | $0 | Casual savers, trial users |
| **Pro** | $5/mo or $48/yr | Power users, freelancers |
| **Team** | $9/seat/mo or $84/seat/yr | Small teams (3–25 seats) |
| **Team Enterprise** | Custom | 25+ seats, SSO/SAML required |
| **Lifetime (Pro)** | $79 one-time | Lifetime Pro entitlements |
| **Lifetime (Team)** | $249 one-time, 5 seats | Lifetime Team entitlements |

All recurring plans offer 14-day Pro trial on signup; no card required.

## 2. Capability matrix

(Compact; full per-feature gates live in each `07-features/*.md`.)

| Capability | Free | Pro | Team | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Active items | 200 | 10k | 100k | unlimited |
| Collections per Org | 20 | unlimited | unlimited | unlimited |
| Members per Org | 1 | 3 | 25 | unlimited |
| Saves per session | 30 tabs | 200 tabs | 500 tabs | unlimited |
| Public shares | 3 active | 100 active | unlimited | unlimited |
| Password / invite shares | ❌ | ✅ | ✅ | ✅ |
| Custom share branding | ❌ | partial | full | full |
| Custom domain shares | ❌ | ❌ | ✅ | ✅ |
| Embed widget | ❌ | ✅ | ✅ | ✅ |
| Comments + reactions | read-only | full | full | full |
| Auto-tagging by domain | ❌ | ✅ | ✅ | ✅ |
| Smart tags (rules) | ❌ | ❌ | ✅ | ✅ |
| Rich previews | ❌ | ✅ | ✅ | ✅ |
| Saved searches | ❌ | ✅ | ✅ | ✅ |
| Boolean search operators | ❌ | ✅ | ✅ | ✅ |
| Email-in capture | ❌ | ✅ | ✅ | ✅ |
| Webhooks | ❌ | ❌ | ✅ | ✅ |
| API tokens | ❌ | ❌ | ✅ | ✅ |
| Audit log | ❌ | ❌ | 1y | 7y + hash chain |
| SSO/SAML + SCIM | ❌ | ❌ | ❌ | ✅ |
| Share analytics | ❌ | 90d | 1y | 1y |
| Live cursors in notes | ❌ | ✅ | ✅ | ✅ |
| Priority support | ❌ | ❌ | email | dedicated CSM |
| Uptime SLA | none | none | 99.9% | 99.95% |
| Data residency choice | ❌ | ❌ | ❌ | ✅ |

## 3. Trial

- **Pro 14-day trial** auto-started on signup; no card required.
- Banner counter visible in app shell.
- 3 days before end: email + inbox notification.
- On expiry: downgrades to Free; capabilities removed gracefully (excess shares deactivated oldest-first; banner CTA "Re-activate Pro").
- One trial per Account lifetime.

## 4. Annual discount

- Annual = ~20% off monthly equivalent.
- Switching mid-cycle prorated (see `06-proration-and-upgrades.md`).

## 5. Currency & geographic

- USD-primary; localized display in EUR / GBP / IDR / MYR / SGD via Stripe's adaptive pricing or Paddle automatic conversion.
- Local tax handled by processor (Stripe Tax / Paddle MoR).
- VAT-heavy markets (EU, UK, AU) routed via Paddle for MoR convenience.
- Display rule: prices shown ex-tax for B2B (Team) and inc-tax for B2C (Pro) — toggleable.

## 6. Plan IDs

Plan codes (stable, used in entitlements & telemetry). The string value below is the canonical **Plan ID**; when carried as a runtime field it is named `plan_code` (see `03-stripe-integration.md §6`, `04-paddle-integration.md`, `06-proration-and-upgrades.md` — all reference these exact strings):

- `free`
- `pro_monthly` / `pro_yearly`
- `team_monthly` / `team_yearly`
- `team_enterprise_yearly`
- `lifetime_pro`
- `lifetime_team`

Stripe Price IDs are mapped per-environment in config; never hardcoded in app code.

## 7. Display copy rules

- Always say "$5/month, billed monthly" or "$48/year, billed annually" — never just "$5".
- Trial CTA: "Start 14-day Pro trial · No card needed".
- Upgrade CTA from gated feature: "Unlock with Pro".
- Team CTA: "Add your team, billed per seat".
- Lifetime CTA: "Pay once. Use forever."

## 8. Entitlement keys

Each capability has a stable key consumed by code:
```
items.cap.active
collections.cap.per_org
members.cap.per_org
shares.public.cap.active
shares.modes.password
shares.modes.invite
shares.embed.enabled
shares.branding.custom_domain
features.auto_tag_by_domain
features.smart_tags
features.rich_previews
features.saved_searches
features.search.boolean
features.email_in
features.webhooks
features.api_tokens
features.audit_log.retention_days
features.history.retention_days
features.history.time_travel
features.sso_saml
analytics.shares.retention_days
support.priority
sla.uptime_target
```

Resolution rules in `02-entitlements-engine.md`.

## 9. Plan changes

| From → To | Effect |
|---|---|
| Free → Pro/Team | Immediate; payment captured |
| Pro → Team | Immediate; prorated |
| Pro/Team → Free | At period end (no refund) |
| Team → Pro | At period end |
| Yearly → Monthly | At period end |
| Lifetime + Pro/Team subscription | Both stack; entitlements union; subscription pauseable |

## 10. Telemetry

- `pricing.viewed` `{ surface, plan_focus }`
- `plan.upgraded` `{ from, to, prorated_amount }`
- `plan.downgraded` `{ from, to, scheduled }`
- `plan.trial_started`
- `plan.trial_expired`
- `plan.trial_converted` `{ to_plan }`
- `plan.canceled` `{ at_period_end: bool }`

## 11. Edge cases

| Case | Behavior |
|---|---|
| Trial start while already on Lifetime | Allowed; trial supplements with subscription features only |
| Price change mid-cycle | Locked in for current period; new price applies on renewal |
| Plan removed (deprecated) | Existing customers grandfathered; new signups blocked |
| Currency change at renewal | Re-quoted in new currency; user notified 30 d before |
| Free user hits cap | Inline upgrade CTA; soft block (no destructive failure) |

## 12. Tests

- Plan matrix completeness (every capability has a value per plan).
- Entitlement key stability (no rename without migration).
- Trial expiry job correctness.
- Currency localization snapshot tests.
