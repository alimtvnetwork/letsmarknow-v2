# Email Provider

> **Closes gap M7.** Defines the transactional email provider, deliverability config, sender identities, and template management.
> **Locked decision:** **Resend** as primary transactional provider. **Postmark** as failover. **SES** considered Phase-2 if monthly volume > 200 k.

---

## 1. Decision matrix

| Provider | Deliverability | DX | Cost @ 50 k/mo | Verdict |
|---|---|---|---|---|
| **Resend** | A | Excellent (React Email) | $20 | **Primary** |
| Postmark | A+ (best for transactional) | Good | $50 | **Failover** |
| AWS SES | A (with warmup) | Manual | $5 | Phase 2 at scale |
| SendGrid | B | Acceptable | $30 | No (deliverability declines) |
| Mailgun | B | Acceptable | $35 | No |
| Nodemailer + Gmail | F | F | Free | **Forbidden** (DKIM, spam) |

## 2. Sender identities

| From | Purpose | DKIM | DMARC |
|---|---|---|---|
| `noreply@letsmarknow.com` | Transactional (verify, reset, invites) | Yes | `quarantine` |
| `notifications@letsmarknow.com` | Activity, share, comment | Yes | `quarantine` |
| `billing@letsmarknow.com` | Invoices, dunning | Yes | `quarantine` |
| `support@letsmarknow.com` | Inbound + outbound human reply (Postmark inbound) | Yes | `reject` |

All four MUST share the same `letsmarknow.com` SPF / DKIM / DMARC.

## 3. Required emails (Phase 0)

> **F-M13 reconciliation (2026-04-19):** the `auth.magic_link` template ships P0 because the magic-link sign-in flow is fully specified in `09-auth-accounts/02-signup-and-signin.md` §5 (token format, 15-min TTL, single-use, denylist replay window). This file owns only the email render contract (subject, sender, text fallback). Token issuance, route handler, and consumption rules belong to that auth file — do not duplicate them here.

| Template ID | Trigger | From | Subject | Plain-text fallback | Auth flow ref |
|---|---|---|---|---|---|
| `auth.verify` | Sign-up | noreply | "Verify your Lets Marknow email" | required | `09-auth-accounts/02-signup-and-signin.md` §3 |
| `auth.reset` | Password reset request | noreply | "Reset your password" | required | `09-auth-accounts/02-signup-and-signin.md` §8 |
| `auth.magic_link` | Magic link sign-in | noreply | "Your sign-in link" | required | `09-auth-accounts/02-signup-and-signin.md` §5 |
| `org.invite` | Member invited | noreply | "{Inviter} invited you to {Org}" | required | `09-auth-accounts/02-signup-and-signin.md` §6 |
| `share.commented` | Comment on share | notifications | "{Commenter} commented on your share" | required | — |
| `billing.invoice` | New invoice | billing | "Invoice #{n} from Lets Marknow" | required | — |
| `billing.payment_failed` | Stripe failure | billing | "Payment failed — action required" | required | — |

Templates live in `src/emails/*.tsx` (React Email). PR adds template → adds row here.

## 4. Configuration

| Setting | Value |
|---|---|
| Provider | Resend |
| API key secret | `RESEND_API_KEY` (Lovable Cloud secret) |
| Reply-To default | `support@letsmarknow.com` |
| List-Unsubscribe header | `<mailto:unsubscribe@letsmarknow.com>, <https://app.letsmarknow.com/unsubscribe?t=…>` |
| Bounce + complaint webhook | `POST /v1/webhooks/email-bounce` (Resend/Postmark; declared in `03-api-endpoints/00-overview.md`). Distinct from `/v1/webhooks/email-in` (inbound mail-to-Org). |
| Rate limit | 60/sec global (Resend free-tier safe) |

## 5. Failover

If Resend health check fails 3× in 5 min → switch to Postmark via env var `EMAIL_PROVIDER=postmark`. Switch is automatic; alert PagerDuty `email_failover`.

## 6. Bounce / complaint handling

- Hard bounce → mark `accounts.email_bounced=true`; suppress all non-essential emails until user confirms new email.
- Soft bounce → retry with exponential backoff (max 3 attempts in 24 h).
- Spam complaint → immediately suppress all non-billing email; log audit event `email.complaint`.

## 7. Locked rules

1. **No Gmail/Nodemailer in production.** Forbidden.
2. Every email MUST have plain-text fallback alongside HTML.
3. Every email MUST include `List-Unsubscribe` header (transactional-only emails are exempt from one-click unsubscribe but still include the mailto).
4. Templates MUST be reviewed for prompt-injection content before sending (no raw user HTML).
5. Email subjects MUST NOT exceed 78 chars (RFC 5322 readability).
