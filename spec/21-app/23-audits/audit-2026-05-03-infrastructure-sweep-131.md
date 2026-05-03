# Audit 131 — `22-infrastructure/` Sweep

**Date:** 2026-05-03 MYT
**Session:** 131
**Scope:** First broad sweep of all 14 spec files in `spec/21-app/22-infrastructure/`.

---

## 1. Findings

| Check | Result |
|---|---|
| ULID references | 0 ✅ |
| Hard-coded hex | 1 hit — `09-ci-cd.md:50` is the brand-pink lint rule itself, **legitimate** ✅ |
| "Workspace" | 1 hit — `04-secrets.md:12` "Workspace Build Secrets" was a CI-tier label that collided ambiguously with locked Toby-Workspace term ⚠️ |
| Non-`/v1/` paths | 1 hit — `11-email-provider.md:54` declared `POST /webhooks/email/{provider}` (no `/v1/` prefix, undeclared in inventory) ⚠️ |

## 2. Patches Applied

**F1 — `04-secrets.md §1`:** Renamed "Workspace Build Secrets" → "CI Build Secrets" to avoid collision with locked Toby-Workspace terminology.

**F2 — `11-email-provider.md §4`:** Replaced bare `POST /webhooks/email/{provider}` with canonical `POST /v1/webhooks/email-bounce` and noted distinction from `/v1/webhooks/email-in`.

**F3 — `03-api-endpoints/00-overview.md §2.15`:** Declared the new canonical endpoint `POST /v1/webhooks/email-bounce` (webhook-sig Resend/Postmark). Endpoint inventory: 172 → 173.

## 3. Outcome

Three drift fixes applied. Score impact: 0 (no SI opened — fixes applied immediately).
