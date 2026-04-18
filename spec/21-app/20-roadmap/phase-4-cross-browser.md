# Phase 4 — Cross-browser + Mobile

**Duration**: 12-16 weeks after Phase 3 launch
**Audience**: Firefox / Edge / Safari users; mobile-first users; existing customers wanting full coverage.
**Goal**: Eliminate "I love LMN but it doesn't work on my browser/phone" objections. Truly available everywhere.

---

## 1. Scope additions over Phase 3

### Cross-browser extensions
- **Firefox extension** (Manifest V3 / WebExtensions, with v2 fallback if needed).
- **Edge extension** (Chromium-based; mostly free given Chrome work).
- **Safari extension** (App Extension on macOS + iOS via App Store).
- **Brave / Vivaldi / Opera**: tested + listed as supported (Chromium fork).
- **Per-browser quirks**:
  - Firefox: `browser.*` API namespace, manifest differences.
  - Safari: storage limits, app-extension architecture, App Store review.
  - All: feature parity matrix tracked publicly.

### Mobile (PWA + native)
- **Mobile PWA** (responsive web app, installable, offline-capable):
  - Touch-optimized list + grid + column views.
  - Swipe gestures (star, trash, share).
  - Bottom sheet for actions.
  - Share-to-LMN via OS share sheet (PWA share target API).
- **iOS native app** (SwiftUI):
  - Share extension to save from Safari + any app.
  - Today widget showing recent / pinned items.
  - Spotlight integration.
- **Android native app** (Kotlin / Compose):
  - Share intent receiver.
  - Home-screen widget.
  - Quick-tile.

### Cross-device sync UX
- **Device list** in Settings → Devices.
- **Push notifications** (mentions, share access, save confirmations).
- **Continuity**: "Continue reading on iPhone" handoff.
- **Conflict-free sync** validated under poor network.

### Public API + integrations
- **Zapier / Make / n8n** native connectors.
- **Raycast extension** (macOS).
- **Alfred workflow** (macOS).
- **Open-source CLI** (`lmn save <url>`).

### Polish + accessibility
- **WCAG 2.1 AA** compliance verified externally.
- **Localization**: 5 launch languages (EN, ES, DE, FR, JA).
- **RTL support** for Arabic / Hebrew (next phase or this).

## 2. Won't have (Phase 4)

- ❌ Native desktop apps (Electron); web app + extensions cover desktop.
- ❌ Watch apps (over-scope).
- ❌ Custom roles (Enterprise; later).
- ❌ End-to-end encryption (research; later).

## 3. Success criteria

| Metric | Target at end of Phase 4 |
|---|---|
| Non-Chrome browser users / WAU | ≥ 25% |
| Mobile MAU | ≥ 30% of total MAU |
| iOS app rating | ≥ 4.5 |
| Android app rating | ≥ 4.4 |
| Localized users / total | ≥ 30% non-EN |
| MRR | ≥ $150,000 |
| Crash-free session rate (mobile) | ≥ 99.3% |

## 4. Tech infrastructure additions

- **Per-platform CI** (Chrome / Firefox / Safari / iOS / Android).
- **Cross-platform e2e harness**.
- **Push notification service** (APNs + FCM).
- **App Store + Play Store** release pipelines.
- **Localization pipeline** (Crowdin or similar).
- **Mobile analytics** (same self-hosted stack, with mobile SDKs).

## 5. App Store readiness

- **Apple privacy nutrition labels** filled accurately.
- **Google Play data safety** form completed.
- **Family-safe** rating (no age-restricted content).
- **In-app purchase** for Pro upgrade (via Apple/Google billing where required; Stripe everywhere else).
- **App Tracking Transparency** prompt (no tracking → trivial answer).

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Safari App Extension review delays | Submit early; have Phase 4 contingency for Safari-only v1.1 follow-up |
| App Store IAP fees vs web pricing | Honor existing Pro subs cross-platform; avoid double-charge |
| Mobile sync conflicts under poor network | CRDT layer already proven in Phase 2; mobile e2e tests |
| Localization quality | Native-speaker review per language; community feedback channel |
| Cross-browser feature gap (e.g., omnibox in Safari) | Document gaps publicly; provide alternative UX |
| Maintenance burden of N platforms | Strict shared core; thin platform shells |

## 7. Marketing

- "Available everywhere" launch campaign.
- Per-platform deep-dive blog posts.
- Influencer outreach in non-EN markets.
- App Store featuring requests.
- Productivity-podcast tour.

## 8. Exit criteria → Future phases

- Phase 4 success criteria met.
- All platforms in maintenance mode (no critical regressions).
- Customer breakdown shows healthy non-Chrome / mobile mix.
- Future roadmap items (E2EE, Enterprise custom roles, advanced AI) prioritized from data.

## 9. Phase 4 deliverables checklist

- [ ] Firefox extension
- [ ] Edge extension
- [ ] Safari extension (macOS + iOS)
- [ ] Brave / Vivaldi / Opera tested
- [ ] Mobile PWA (responsive + installable)
- [ ] iOS native app
- [ ] Android native app
- [ ] Push notifications
- [ ] Continuity / handoff
- [ ] Device management UI
- [ ] Zapier / Make / n8n connectors
- [ ] Raycast + Alfred extensions
- [ ] Open-source CLI
- [ ] WCAG 2.1 AA audit passed
- [ ] 5-language localization
- [ ] App Store + Play Store launch
- [ ] Cross-platform e2e harness

---

## Beyond Phase 4 (parking lot)

- **End-to-end encryption** for note bodies (Pro+).
- **Enterprise custom roles**.
- **Advanced AI**: agent workflows, automatic Collection curation.
- **Public API marketplace** for integrations.
- **Browser extension SDK** so partners can extend LMN.
- **Air-gapped self-hosted** Enterprise edition.
- **Watch + TV / large-screen** apps.
- **Voice-first save** ("Hey Siri, save this to LMN").
