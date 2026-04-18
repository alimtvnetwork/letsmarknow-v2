# Phase 1 — v1 (Public Launch)

**Duration**: 12 weeks after Phase 0 exit
**Audience**: General public; Free + Pro tiers live
**Goal**: First paying customers. Replace Toby for individuals; provide a credible alternative to Raindrop / Pocket / Tab Extend.

---

## 1. Scope additions over Phase 0

### Visualization
- **Grid view** with image previews (lazy-loaded, blurhash).
- **Tab Extend column view** for kanban-style users.
- **View mode persistence** per Collection.

### Save flows
- **Save Session** (current window / all windows) into a Collection.
- **Bulk save** via paste of multiple URLs.
- **Side panel** (Chrome MV3) for drag-and-drop while browsing.
- **Omnibox** keyword (`lmn `) for quick-find from URL bar.

### Find
- **Cmd+K operators**: `tag:`, `in:`, `domain:`, `is:starred`, `is:archived`, dates.
- **Recent searches** synced.
- **Quick-find** in extension popup (local index < 50 ms).

### Organize
- **Tags** with autocomplete + color.
- **Star + Pin** items.
- **Archive** + Trash separation.
- **Drag reorder** with manual sort persistence.
- **Inline edit** title + tags (no modal needed).

### Account
- **Multi-Org switcher** (left rail of bubbles, à la Toby).
- **Personal Org + create new Org** (free tier limited to 1 personal).
- **Profile + preferences page**.
- **Password reset + email verification**.

### Billing (Pro tier launch)
- **Pricing page** with Free / Pro comparison.
- **Stripe / Paddle integration** (per `10-licensing-billing/`).
- **Self-service upgrade / downgrade / cancel**.
- **Invoices** + tax receipts.
- **Pro tier limits removed** (Free: 5 Collections, 100 items per Collection, 1 Org; Pro: unlimited).
- **Lifetime license** SKU for early adopters.

### Themes & polish
- **Light + Dark theme** with system preference auto-switch.
- **Accent palette** (Pink default à la Toby; 6 alternatives).
- **Reduced-motion** respect throughout.
- **High-contrast** mode option.

### Extension polish
- **Auto-update via Chrome Web Store**.
- **Notification toasts** for background saves.
- **Keyboard shortcuts** customizable in Options.
- **Beta channel** opt-in.

### Updates
- **In-app "What's new"** panel.
- **Release notes** site at `/changelog`.

### Compliance
- **GDPR + CCPA flows** live (export, delete, consent banner).
- **Cookie banner** EU-compliant.
- **Privacy + terms pages** finalized.
- **DPA template** auto-signed at Pro checkout.

## 2. Won't have (Phase 1)

- ❌ Sharing (deferred to Phase 2 — needs collab infra first).
- ❌ Mind-map view (Phase 3).
- ❌ Real-time collaboration / presence.
- ❌ AI features (Phase 3).
- ❌ Mobile app (Phase 4).
- ❌ Firefox / Safari / Edge extensions (Phase 4).
- ❌ SSO / SAML (Phase 2 with Team plan).
- ❌ Audit log UI for users (just internal Lovable tools).
- ❌ Webhooks / API tokens for end users (Pro+ in Phase 2).

## 3. Success criteria

| Metric | Target at week 12 post-launch |
|---|---|
| Signups (cumulative) | ≥ 5,000 |
| Weekly active accounts | ≥ 1,500 |
| Free → Pro conversion | ≥ 4% within 30 d of signup |
| Lifetime sales | ≥ 100 units |
| MRR | ≥ $5,000 |
| Save p95 | ≤ 600 ms |
| Search p95 | ≤ 200 ms |
| Crash-free session rate | ≥ 99.5% |
| Public NPS | ≥ 40 |

## 4. Marketing site readiness

- Landing page with live demo.
- Comparison pages: vs Toby, vs Tab Extend, vs Raindrop.
- Help center with 30+ articles.
- Founder blog with 3 launch posts.
- Product Hunt launch prepared.
- Email drip for trial users.

## 5. Tech debts paid in Phase 1

- Sourcemaps + Sentry uploaded per release.
- Source-of-truth for events (`analytics/events.yaml`) enforced in CI.
- Pen test (external) before launch.
- Load test: 100k items / Org, 1k concurrent users.
- Backup restore drill executed once.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Stripe / Paddle integration delays | Start integration in week 2; soft-launch payments to internal first |
| Free tier too limited drives churn | Limits picked from telemetry; A/B test 2 limit sets; choose data-driven |
| Migration importers (Toby, Pocket) needed for adoption | Ship them as part of Phase 1 (per `11-import-export/importers.md`) |
| Performance regression with > 10k items per user | Virtualization mandatory; perf budget in CI |
| Press / launch causes signup spike | Auto-scale infra; pre-warm DB; rate limit signup at 100/min |

## 7. Importers shipped in Phase 1

- Chrome Bookmarks HTML.
- Firefox / Edge / Safari Bookmarks HTML.
- Toby JSON.
- Tab Extend JSON.
- Raindrop CSV.
- Pocket CSV.
- Pinboard JSON.

## 8. Exit criteria → Phase 2

- Phase 1 success criteria met.
- 0 P0/P1 bugs.
- Pro tier renewals demonstrating retention (month 1 → month 2 ≥ 70%).
- Collaboration features spec'd + reviewed.
- Customer support queue under control (< 24 h response).

## 9. Phase 1 deliverables checklist

- [ ] Grid + Column views
- [ ] Save Session
- [ ] Side panel + Omnibox
- [ ] Search operators
- [ ] Tags + Star + Pin + Archive
- [ ] Multi-Org switcher
- [ ] Email verification + password reset
- [ ] Pricing page + Stripe/Paddle live
- [ ] Lifetime SKU
- [ ] Themes (light + dark + accents)
- [ ] In-app updates feed
- [ ] GDPR/CCPA flows
- [ ] Importers (7 sources)
- [ ] Marketing site complete
- [ ] External pen test passed
- [ ] Public launch
