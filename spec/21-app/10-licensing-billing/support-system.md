# Support System

How users get help. Pointer file — full ticketing/SLA design lives in the help-center repo (not in this product spec).

---

## 1. Channels

| Channel | Free | Pro | Team | Lifetime |
|---|---|---|---|---|
| Help center (self-serve) | ✅ | ✅ | ✅ | ✅ |
| Community forum | ✅ | ✅ | ✅ | ✅ |
| Email (`support@letsmarknow.com`) | best-effort | 48 h | 8 h | 48 h |
| In-app chat | ❌ | ❌ | ✅ | ❌ |
| Dedicated CSM | ❌ | ❌ | Enterprise add-on | ❌ |

## 2. In-app entry points

- Top-bar `?` menu → "Contact support" → opens pre-filled form (Account email, plan, browser, extension version, last 50 console errors via opt-in).
- Cancellation flow surfaces support before the final cancel button (see `cancellations-and-refunds.md`).
- Error toasts include "Report this" button when the error has a correlation ID.

## 3. Data attached to tickets

- Account email, Org ID, plan, role.
- Browser + extension version.
- Last 50 client log lines (sanitized — no URLs, no Item content).
- Correlation ID if originating from an error toast.
- Optional screenshot (user uploads).

## 4. SLA

Documented per plan above. Measured from first business-hour response. Business hours = Mon–Fri 9–17 UTC.

## 5. Cross-references

- Cancellation/refund flow: `cancellations-and-refunds.md`.
- Error reporting opt-in: `18-analytics-telemetry/error-reporting.md`.
- Privacy of ticket data: `19-security-privacy/data-handling.md`.
