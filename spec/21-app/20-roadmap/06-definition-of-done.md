# Definition of Done (DoD)

> **Closes gap M14.** A feature is "Done" only when ALL of the criteria below pass. PRs cannot merge without explicit DoD checklist in the description.

---

## 1. Universal DoD (every feature)

A feature is **Done** when:

### Spec & contract
- [ ] Feature implements the spec section it claims (citation in PR description, e.g. "implements `07-features/01-save-tab.md`").
- [ ] Conflicts with spec surfaced and resolved (either spec updated or implementation amended) before merge.
- [ ] Locked rules in the relevant section's `readme.md` re-read and confirmed.

### Database & API
- [ ] Migration committed (if schema change), naming `NNN_feature.sql`.
- [ ] RLS policies in place, generated from `permissions-matrix.json` (no hand-written policies that bypass the matrix).
- [ ] API endpoint matches spec body literally (Zod schema validates request + response).
- [ ] Error responses use codes from `03-api-endpoints/18-error-codes.md`.

### UI
- [ ] Matches the wireframe in `06-ui-ux/wireframes/` (or wireframe added if missing).
- [ ] Uses design tokens only (no hex literals, no ad-hoc colors). Brand `--primary` MUST resolve to `343 79% 60%` (Toby pink #EC4868) — never re-anchored.
- [ ] Color-label visuals (Item `color_label`) read from `--color-label-*` tokens defined in `06-ui-ux/01-design-tokens.md §1.6`; never hardcoded.
- [ ] Toasts use the canonical placement from `06-ui-ux/11-feedback.md §2.1` (bottom-right desktop, top-center mobile, max 3 stacked, single `<Toaster />`); no per-surface overrides.
- [ ] Uses copy strings from `06-ui-ux/17-copy-strings.md` (no inline English).
- [ ] Responsive at xs / md / lg per `06-ui-ux/19-breakpoints.md`.
- [ ] Accessibility checklist (`06-ui-ux/20-accessibility-wcag.md` §2) passes.

### Behavior
- [ ] Soft-delete + Undo path verified (if entity is soft-deletable).
- [ ] Telemetry events fire per `18-analytics-telemetry/03-events.md` (verified in dev tools).
- [ ] Rate limits set per `09-auth-accounts/13-rate-limit-values.md`.
- [ ] Feature flag wrapped if marked behind a flag in spec.

### Quality
- [ ] Unit tests for non-trivial logic (B4 deferred for Phase-0; resume at Phase-1).
- [ ] E2E happy path for any user-facing flow (Playwright; Phase-1+).
- [ ] No new `axe-core` serious/critical violations.
- [ ] Lighthouse a11y ≥ 95 on affected routes.
- [ ] No console errors / warnings in dev tools on happy path.
- [ ] Manual smoke on mobile (xs) AND desktop (lg).

### Operational
- [ ] No new env var without entry in `22-infrastructure/03-env-vars.md`.
- [ ] No new secret without entry in `22-infrastructure/04-secrets.md`.
- [ ] No new background job without entry in `22-infrastructure/08-cron.md`.
- [ ] PR description includes screenshot or 30 s screen-cap of the change.
- [ ] At least minor version bump (per user preference).

## 2. Phase-0 MVP DoD overlay

Phase-0 is allowed to skip:

- [ ] ~~Unit tests~~ (B4 deferred)
- [ ] ~~Seed fixtures~~ (B7 deferred)
- [ ] SAML SSO
- [ ] Mind-map view (Phase 3)
- [ ] Cross-browser extension (Phase 4)

Everything else in §1 still applies in Phase 0.

## 3. Per-domain DoD additions

### Sharing features
- [ ] Public share viewer renders without auth.
- [ ] Password-protected share verifies via secure server endpoint, not client check.
- [ ] Revocation propagates within 60 s (cache invalidation).

### Billing features
- [ ] Tested in Stripe test mode end-to-end.
- [ ] Webhook idempotent (`idempotency_key` honored).
- [ ] Invoice PDF generated with correct tax line.

### Auth features
- [ ] Tested across email+password, Google, Apple flows.
- [ ] Password reset round-trip works.
- [ ] Session revocation kills all open tabs within 30 s.

### Import/export
- [ ] Dedup algorithm runs (M12).
- [ ] Large-import path (> 1 000 items) batched and resumable.
- [ ] Export download URL expires per `12-storage-layout.md`.

### Collections / Sessions (SI-021, SI-023)
- [ ] `Collection.kind` immutable after create (cannot promote `manual` ↔ `session`).
- [ ] `captured_at` non-null iff `kind=session`; re-capture updates only `captured_at` + items.
- [ ] `source_window_id` only set when `kind=session`; cleared when source window closed.
- [ ] Session-only events fire: `collection.session_captured`, `collection.session_recaptured`, `collection.session_restored {scope, opened, skipped}`.
- [ ] `Restore session` / `Restore in new window` / `Re-capture from current window` actions hidden when `kind != session`.
- [ ] `starred_pin_position` non-null iff `is_starred=true` (per `02-data-model/03-collection.md` invariant 5).
- [ ] Drag-drop matrix in `07-features/04-collections.md §13.3` honored for every drop target the feature exposes.

## 4. Definition of "Shipped"

A feature is **Shipped** when:
1. Done per §1.
2. Behind a feature flag (default off).
3. Deployed to production via standard CI/CD.
4. Internally dogfooded for ≥ 24 h (small changes) or ≥ 7 days (major).
5. Flag flipped on for 5% of Orgs.
6. Telemetry confirms no error spike (24 h observation).
7. Flag flipped on globally.

Steps 5–7 may be skipped for security patches.

## 5. PR template (mandatory)

```md
## What
…

## Why
…

## Spec section implemented
`spec/21-app/…`

## DoD checklist
- [ ] Spec citation present
- [ ] Migration + RLS
- [ ] Wireframe match
- [ ] Tokens + copy strings used
- [ ] a11y checklist
- [ ] Telemetry events
- [ ] Rate limits
- [ ] Screenshot / screen-cap
- [ ] Version bumped
```

PRs missing the checklist fail CI lint.

## 6. Locked rules

1. DoD is non-negotiable. PRs cannot merge with unchecked items unless an `OK_SKIP` comment from owner is present.
2. Phase overlays (§2) are temporary; Phase-1 reinstates tests and fixtures.
3. "Shipped" requires the 7-step rollout for any user-visible change.
4. Spec drift discovered during DoD MUST update the spec before merge — code is never the source of truth.
5. Toby-parity invariants (brand pink HSL `343 79% 60%`, locked `color_label` enum, locked `Collection.kind` enum, locked role enum) are checked by CI lint, not by humans alone.

## 7. Walkthrough log

| Date | Reviewer | Result | Notes |
|---|---|---|---|
| 2026-04-29 | AI sweep (post SI-024 close) | ✅ Pass | All 11 cross-refs resolve. Added Toby-pink line, color-label-token line, toast placement line, and a new "Collections / Sessions" §3 block enforcing SI-021 + SI-023 invariants. Added Locked rule #5 to require CI-level enforcement. No removals. |
