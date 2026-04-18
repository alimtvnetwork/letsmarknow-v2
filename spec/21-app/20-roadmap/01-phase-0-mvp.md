# Phase 0 — MVP (Internal Alpha)

**Duration**: 8 weeks
**Audience**: Lovable team + 20 hand-picked alpha testers
**Goal**: Prove the core save → organize → retrieve loop is faster + nicer than Toby and Tab Extend combined.

---

## 1. Scope

### Must have

- **Account & Org**: signup, signin, single personal Org, MFA optional.
- **Data model**: Account → Org → Space → Collection → Group → Item + Tags.
- **Web app shell**: header + sidebar + main canvas + resizable panes.
- **List view + Compact view** (no Grid yet, no Mind-map).
- **Quick-save** via:
  - Web app "Save URL" form.
  - Chrome extension popup (`Alt+S`).
  - Context-menu "Save link / Save page".
- **Cmd+K global search** (local index + Postgres tsvector; no operators).
- **Basic CRUD** for everything (Spaces, Collections, Groups, Items, Tags).
- **Drag-and-drop** within and between Collections.
- **Trash + 30-day soft delete**.
- **History event log** (read-only viewer; no Undo UI yet).
- **Single sign-in session** (no multi-device sync yet beyond DB).

### Won't have (Phase 0)

- ❌ Sharing (any form).
- ❌ Multi-Org / Org switching UI.
- ❌ Mind-map.
- ❌ Grid view.
- ❌ Tab Extend column view.
- ❌ Save Session (multi-tab).
- ❌ Billing.
- ❌ Notifications.
- ❌ Mobile responsive (desktop ≥ 1024 px only).
- ❌ Themes (dark only).

## 2. Success criteria

| Metric | Target |
|---|---|
| Save action p95 latency | < 600 ms end-to-end |
| Search first-result p95 | < 200 ms |
| Active alpha users (week 4+) | ≥ 15/20 weekly active |
| Self-reported "faster than Toby/TE" (week 6 survey) | ≥ 75% agree |
| Critical bugs (P0/P1) outstanding at end | 0 |
| Test coverage | ≥ 70% |

## 3. Out-of-scope risks accepted

- No payment infra: alpha is free.
- No collaboration: alpha is single-user.
- Limited browser: Chrome only.
- Limited platform: desktop only.

## 4. Tech foundations established

These are foundational and must be solid by end of Phase 0:

- CI/CD pipeline (build, test, deploy).
- Staging + production envs.
- Postgres + RLS baseline.
- KMS + secrets management.
- Self-hosted Sentry + PostHog.
- Trust portal scaffold (legal docs in place).
- Bug bounty private invite.

## 5. Data migration path established

- Importer for Chrome Bookmarks HTML (the most common starting point).
- Round-trip export → import for own JSON format.
- Sufficient for alpha users to bring data over without manual entry.

## 6. Telemetry defined

All Phase 0 events registered in `analytics/events.yaml`. Foundational set:
- `auth.*` (signup, signin, MFA enable).
- `item.*` (created, edited, opened, deleted).
- `collection.*` (created, edited).
- `search.*` (queried, result_clicked).
- `view.*` (mode, density).
- `extension.*` (installed, popup_opened, save_clicked).

## 7. Definition of Done (per feature)

- Spec linked.
- Unit + integration tests passing.
- Telemetry events emitted + verified.
- Audit log entries (where applicable).
- Performance budget met.
- Accessibility (keyboard, screen reader) sanity check.
- No P0/P1 bugs.
- Code review by ≥ 1 engineer.
- Privacy review (if touches PII).

## 8. Exit criteria → Phase 1

- All "Must have" items shipped.
- Success criteria met for 2 consecutive weeks.
- 0 P0/P1 bugs.
- Alpha cohort retention (week 4 → week 8) ≥ 60%.
- 3 onboarding sessions video-recorded for UX learnings.
- Phase 1 spec reviewed + approved.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Search latency budget missed | Local index fallback; Meilisearch as Phase 1 escape hatch |
| Importer crashes on weird Bookmarks HTML | Fuzzing harness; "import in safe mode" with row-by-row error reporting |
| Postgres RLS policy gap | Matrix-based test suite covering every role × every endpoint |
| Alpha users drop out | Weekly office-hours call; rapid bug response; in-app feedback button |
| Scope creep | Strict change control; new requests deferred to Phase 1 backlog |

## 10. Phase 0 deliverables checklist

- [ ] Auth + Org single-tenant
- [ ] Data model + RLS
- [ ] Web shell + List + Compact views
- [ ] Cmd+K search (basic)
- [ ] Extension popup + context menu
- [ ] Quick-save flows
- [ ] Trash + soft delete
- [ ] History log (read-only)
- [ ] Bookmarks HTML importer
- [ ] CI/CD + staging + prod envs
- [ ] Sentry + PostHog
- [ ] Trust portal scaffold
- [ ] Alpha onboarding doc
- [ ] Weekly cohort survey instrumented
