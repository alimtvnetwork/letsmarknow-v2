# Email-In

Save items by emailing a personal address. Pro+ feature.

---

## 1. Address format

`save+<token>@in.letsmarknow.com`

- `<token>` is opaque per Account-Org pair (default Org or explicitly chosen Org).
- Generated in `/settings/email-in`.
- Multiple tokens allowed per Account (e.g., one per Collection).
- Tokens can be revoked & rotated instantly.

## 2. How it works

1. Inbound mail received via SES / Postmark inbound parsing.
2. MIME parsed; URLs extracted from:
   - Subject line (first URL).
   - Plain-text body (every URL).
   - HTML body (every `<a href>`).
3. Each unique URL becomes an Item.
4. Defaults from token config applied (target Collection, default tags).
5. Notification sent (in-app inbox; optional email reply).

## 3. URL extraction rules

- Standard URL regex (`https?://...`).
- Tracking params stripped (per `mapping-and-dedup.md` § 4).
- Mailto / tel / javascript URLs ignored.
- Image URLs ignored UNLESS `--include-images` keyword in subject.
- Max 50 URLs per email; rest discarded with warning reply.

## 4. Subject parsing (commands)

Subject can include directives prefixed with `--`:

| Directive | Effect |
|---|---|
| `--collection=<slug>` | Override target Collection |
| `--tags=ai,research` | Add tags |
| `--star` | Mark starred |
| `--note=<text>` | Use rest-of-subject as note |
| `--note-from-body` | Use email body (text) as note |
| `--include-images` | Process image URLs too |

Example: `Cool article --tags=ai,llm --star`

## 5. Body as note

By default, plain-text body NOT saved (avoid pollution from email signatures).
With `--note-from-body`: body sanitized (signature stripped via regex/heuristic) and used as item note.

## 6. Multiple items per email

If body contains 5 URLs:
- 5 Items created, all sharing the same tags / collection / note.
- Note is shared content (not per-URL).
- Star flag applies to all.

## 7. Anti-spam

### At ingestion
- DKIM + SPF verification (reject on hard fail).
- Sender domain reputation check.
- Sender must match Account's verified email OR be on allowlist.
- Subject contains required token (anti-forwarding-spam).

### Rate limits

| Plan | Emails per 24h | Bytes per email |
|---|---|---|
| Pro | 100 | 5 MB |
| Team | 1,000 | 10 MB |

Exceeding → emails bounced with friendly explanation.

### Block patterns
- Disposable sender domains rejected.
- Auto-reply / bounce / out-of-office detected and dropped (no item created).
- Mailing list emails (`Precedence: list`) dropped.

## 8. Reply behavior

- Default: silent (no reply).
- Per-token setting: reply with summary ("Saved 3 items: A, B, C") OR reply on errors only.
- Replies use `noreply@in.letsmarknow.com`.
- Bounce-resistant: no reply if sender bounced or marked auto-respond.

## 9. Forward-from-mobile flow

User on mobile reads article in Apple News, taps Share → Mail → composes email to `save+token@...` → done.
- Subject usually carries article title automatically.
- Body usually carries URL automatically.
- Works with no extension installed.

## 10. Token UI

`/settings/email-in`:
- List of tokens with name, target Collection, default tags, last_used_at.
- "Copy address" button.
- "Revoke" button.
- "Add new" with config form.
- QR code for mobile contact-add (helpful trick).

## 11. Failure handling

| Failure | Behavior |
|---|---|
| No URLs found in email | Bounce with "We couldn't find any links in your email." |
| Token unknown / revoked | Bounce 5xx; no leak that the address ever existed |
| URLs invalid (broken, javascript:, etc.) | Skipped; reply notes which were skipped (if reply enabled) |
| Quota exceeded | Bounce with upgrade CTA |
| Spam score > threshold | Drop silently (no bounce — appears to spammer as success) |

## 12. Telemetry

- `email_in.received` `{ token_id, urls_found }`
- `email_in.committed` `{ token_id, items_created }`
- `email_in.bounced` `{ reason }`
- `email_in.spam_dropped`
- `email_in.token_created`
- `email_in.token_revoked`
- `email_in.quota_exceeded` `{ token_id }`

## 13. Audit

Every email-in event logged with sender, subject (truncated 200), URLs (count + samples), action taken.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Same URL emailed twice | Dedup per token's configured mode (default merge_by_url) |
| Email to wrong token format | Bounce as unknown |
| Token's target Collection deleted | Default to Org's "Inbox" Collection; reply warns |
| MIME with attachments | Attachments ignored; URLs from body only |
| Email with very long subject (> 1 KB) | Truncated; commands still parsed from prefix |
| User changes default Collection mid-stream | New emails go to new Collection; prior items unchanged |

## 15. Privacy

- Email body content not stored unless `--note-from-body` used.
- Sender address logged; available to Account holder in audit log; deleted with Account.
- No content used for ML / training / analytics beyond aggregate stats.

## 16. Tests

- Subject directive parser.
- URL extraction across plain/HTML email fixtures.
- Spam filter behavior on synthetic spam corpus.
- Quota enforcement.
- Token revocation immediacy.
- DKIM/SPF rejection cases.
