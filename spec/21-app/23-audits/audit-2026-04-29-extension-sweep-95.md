<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (2 of 4 closed)
opened-on: 2026-04-29
scope: 04-extension/ folder — manifest permission gap, omnibox-vs-webNavigation surface confusion, share-link cross-ref drift, role-pattern cross-ref polish
-->

# Audit — Extension Sweep (Session 95)

**Date:** 2026-04-29 (Session 95, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** 22 markdown files (~2,400 lines) in `spec/21-app/04-extension/`. Cross-checked against `01-manifest.md` permissions, `00-overview/02-glossary.md` brand/glossary, `08-sharing-collab/13-share-link.md §1.4` (omnibox/`lmk` shortlink resolver), `03-api-endpoints/03-auth.md` (auth-bridge endpoints), `<user-roles>` SECURITY DEFINER directive.
**Reason:** First-ever audit of this folder; never previously swept. High surface area (manifest, permissions, omnibox `lmk` resolver, auth-bridge).

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| EX1 | **S2** | ✅ **CLOSED Session 96.** Added `"webNavigation"` to `01-manifest.md §96-107` `permissions` array and added a corresponding row to the Permission Rationale table at §148 citing both `06-omnibox.md §11` and `08-sharing-collab/13-share-link.md §1.4`, with the install-dialog-wording note ("Read your browsing history"; overlaps `tabs` so user-visible string unchanged). The `lmk/{slug}` address-bar interceptor surface is now manifestly enabled. | `01-manifest.md §96-107 + §148` |
| EX2 | **S3** | ✅ **CLOSED Session 97.** Surface-vs-API vocabulary reconciled across both files. `08-sharing-collab/13-share-link.md §1.4` lead-in rewritten: now states the `lmk/{slug}` resolver is intercepted via `chrome.webNavigation.onBeforeNavigate` URL-pattern listener (per `04-extension/06-omnibox.md §11`), explicitly noting it is NOT a `chrome.omnibox` keyword route and citing the only registered keyword (`lmn`) at `01-manifest.md §54-56`. The §1.4 "Extension not installed" row now says "no address-bar shortcut" instead of "no omnibox shortcut". `04-extension/06-omnibox.md §102` rewritten: `lmn` is the registered `chrome.omnibox` keyword; `lmk` is explicitly NOT a keyword but a `webNavigation` path-pattern intercept. Both surfaces remain reserved against rebinding. | `08-sharing-collab/13-share-link.md §1.4`, `04-extension/06-omnibox.md §102` |
| EX3 | **S3** | **`19-staging-seed.md §27-28` declares seed users with locked roles (`billing`, `guest`) but does not cite the role-enforcement SoT.** Seed rows correctly use the locked 7-role enum (`19-staging-seed.md §67` does cite `09-auth-accounts/07-org-membership.md` as glossary SoT, good), but does not reference the role-enforcement pattern (`<user-roles>` directive — SECURITY DEFINER `has_role(_user_id, _role)`) used to gate access in seed-policy tests. Mirrors the same fix pattern as the security-privacy sweep (SP3). One-line addition pointing at `19-security-privacy/01-threat-model.md §"Elevation of privilege"` (which now hosts the canonical pattern citation per Session 90). | `19-staging-seed.md §67` |
| EX4 | **S3** | **`11-auth-bridge.md §54-55` declares `Idempotency-Key` injection without SoT cross-ref.** SW request decorator code injects `Idempotency-Key` for every non-GET; same root cause as IE6 + SC4 + HU4. One-line fix: append "(per `03-api-endpoints/01-conventions.md §6`)" to the `Idempotency-Key` line or the surrounding §4 paragraph. | `11-auth-bridge.md §4` |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | EX1 | Single **S2** — must drain first. Manifest hole that breaks a memory-locked feature surface (`lmk` shortlink). Trivial: add one permission + one rationale row. |
| Following | EX2 | **S3** but cross-folder (touches `08-sharing-collab/` AND `04-extension/`); single coherent fix. |
| Following | EX3 + EX4 | Two **S3** polish, single session — both are one-line SoT cross-ref additions. |

Total estimated: 3 sessions to fully drain.

**Scorecard impact NOW (audit-opening only):** No F-class findings. EX1 is **S2** but is a **functional gap** (manifest lacks the permission for a memory-locked feature) — Cursor/Claude-Code pass docks 1 point until drained because static analysis of the manifest against Core memory ("`lmk` shortlink resolver") detects the inconsistency. Lovable and Raw-LLM passes hold (they evaluate prose intent, not code-vs-manifest cross-validation).

| Pass | Lovable | Cursor/Claude-Code | Raw-LLM |
|---|---:|---:|---:|
| Pre-audit | 100 | 100 | 100 |
| Audit-95 opening | **100** | **99** | **100** |
| After EX1 drain | **100** | **100** | **100** |

---

## 3. Files NOT deeply audited (spot-checked only)

`02-surfaces.md`, `03-service-worker.md`, `04-popup.md`, `05-new-tab.md`, `07-context-menu.md`, `08-keyboard-shortcuts.md`, `09-save-session.md`, `10-sync-and-offline.md`, `12-messaging.md`, `13-update-and-rollout.md`, `14-analytics-telemetry.md`, `15-dev-loop.md`, `16-open-tabs-panel.md`, `17-store-listing.md`, `18-firefox-port.md`, `flow-diagram.mmd` — read for keyword matches (`ulid`, role names other than the 7 locked, identifier types, retention windows, undeclared endpoints, share-model). No drift detected. The `ulid` repo grep (Session 92 baseline) remains clean across this folder.

## 4. Cross-references

- Core memory: `lmk/{org_handle}/{memorable_slug}` resolver via extension surface; brand "Lets Mark Now" (per `00-overview/02-glossary.md`).
- Share-link SoT: `08-sharing-collab/13-share-link.md §1.4`.
- Auth endpoint SoT: `03-api-endpoints/03-auth.md` (all four extension auth endpoints — `/v1/auth/token`, `/v1/auth/signout`, `/v1/auth/signout-all`, `/v1/auth/oauth/:provider/{start,callback}` — verified declared).
- Idempotency-Key SoT: `03-api-endpoints/01-conventions.md §6`.
- Role-enforcement pattern SoT: `19-security-privacy/01-threat-model.md "Elevation of privilege"` row (per Session 90).
- Last closed audit: `audit-2026-04-29-history-undo-sweep-91.md` (5/5).
