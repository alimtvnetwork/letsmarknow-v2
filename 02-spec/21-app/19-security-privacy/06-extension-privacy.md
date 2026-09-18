# 06 — Extension Privacy Practices

> **Status.** Stub authored Session 41 to close SI-026 forward-ref. Content to be expanded before v1 Phase 1 store submission.
> **Owns.** The Chrome Web Store "Privacy practices" disclosures for the Mark Now extension: declared data types, usage purposes, transfer/sale stance, and the per-permission justification narrative.

---

## 1. Purpose

CWS requires every extension to fill a structured "Privacy practices" form covering: data types collected, usage purpose, third-party sharing, and a public privacy policy URL. This file is the source of truth for those disclosures so that the form, the manifest, and the public privacy policy never drift.

---

## 2. Data types collected (CWS taxonomy)

| CWS data type | Collected? | Purpose | Notes |
|---|---|---|---|
| Personally identifiable information (name, email) | Yes | Account creation | Email + display name only. No phone/address. |
| Authentication information | Yes | Sign-in | Refresh-token cookie shared with `app.letsmarknow.com` (see `04-extension/11-auth-bridge.md`). |
| Web history | Yes (only what user explicitly saves) | Save/organize bookmarks | We do **not** auto-collect browsing history. Only URLs the user explicitly clicks "Save" on. |
| User activity (within extension) | Yes (opt-out telemetry) | Product analytics | Per `04-extension/14-analytics-telemetry.md`; opt-out default in EU/UK/CH. |
| Website content | No | — | We never read page DOM beyond `document.title` + canonical URL on save. |
| Location | No | — | Never collected. |
| Financial info | No | — | Stripe handles billing on the web app, not in the extension. |
| Health info | No | — | — |
| Personal communications | No | — | — |

---

## 3. Usage & handling commitments

We commit (these mirror the CWS form's required attestations):

1. We do **not** sell or transfer user data to third parties outside the approved use cases.
2. We do **not** use or transfer user data for purposes unrelated to the item's single purpose (visual bookmarking).
3. We do **not** use or transfer user data to determine creditworthiness or for lending purposes.

---

## 4. Per-permission justification

For each permission declared in `04-extension/01-manifest.md`, write one paragraph explaining the user benefit. CWS reviewers reject vague justifications. Drafts to be authored before submission.

| Permission | Justification (draft target) |
|---|---|
| `storage` | Cache user's collections locally for instant new-tab render and offline reads. |
| `tabs` | Read `tab.title` and `tab.url` of the active tab when the user clicks Save. |
| `contextMenus` | Provide right-click "Save link / Save image / Save tab" entries. |
| `bookmarks` (optional) | One-time import of existing Chrome bookmarks during onboarding (user-initiated). |
| `<all_urls>` host permission | Enable Save action on any page the user visits. Page content is not read; only the URL is captured at the moment of Save. |

---

## 5. Public privacy policy

The public, user-facing privacy policy lives at `19-security-privacy/07-privacy-policy.md` and is published to `https://letsmarknow.com/privacy` (URL is the value submitted in the CWS "Privacy policy URL" field).

---

## 6. Cross-references

- Cited from: `04-extension/01-manifest.md` line 177.
- Public privacy policy: `19-security-privacy/07-privacy-policy.md`.
- Telemetry & opt-out: `04-extension/14-analytics-telemetry.md`.
- Manifest permissions: `04-extension/01-manifest.md`.
- GDPR/CCPA legal basis: `19-security-privacy/04-gdpr-ccpa.md`.
- Threat model: `19-security-privacy/01-threat-model.md`.
