# Phase 2 — Collaboration (Team Plan Launch)

**Duration**: 12 weeks after Phase 1 launch
**Audience**: Existing Pro users + new Team customers (small teams 2-25 people)
**Goal**: Become a credible team-knowledge tool. Compete with Notion / Coda for shared link + reference workflows.

---

## 1. Scope additions over Phase 1

### Sharing
- **Public share links** (`letsmarknow.com/t/{token}`) with read-only viewer.
- **Custom slugs** (Pro+) for memorable URLs.
- **Password-protected shares** with brute-force protection.
- **Invite-only shares** with email-bound tokens, single-use.
- **Expiry + view limits** per share.
- **Embed widget** for blog / docs sites.
- **Share manager** UI to view / revoke / edit all shares.
- **Per-share analytics** (Pro+): view count, top referrers, geo (coarse).

### Multi-user Orgs
- **Team plan** with per-seat billing.
- **Member management**: invite, suspend, remove, transfer ownership.
- **Roles**: Owner, Admin, Editor, Viewer (per `03-roles.md`).
- **Member profile drawer** with sessions + 2FA + activity.
- **Bulk invite** via CSV.
- **Domain-restricted invites**.

### Real-time collab
- **Presence**: see who else is in the same Collection (avatar bubbles).
- **Live updates**: changes by others appear without reload.
- **Conflict resolution**: per `12-history-undo/03-conflict-resolution.md` (CRDTs for notes; LWW for scalars).
- **Cursor / selection broadcast** in Collection views.

### Comments + reactions
- **Item-level comments** with @mentions.
- **Reactions** (emoji) on items + comments.
- **Notifications** for mentions + replies.

### Audit + admin
- **Audit log UI** for Org Admins (filtered, exportable).
- **Org settings**: branding, security policies, IP allowlist (Enterprise).
- **MFA enforcement** for Owner / Admin.
- **Self-service Org export + delete**.

### API + integrations
- **Personal API tokens** (Pro+) with scoped permissions.
- **Webhooks**: outbound for share/save events (Team+).
- **Slack integration**: post events to channel (Team+).
- **Public REST API** documented at `developers.letsmarknow.com`.

### SSO (Team+)
- **Google Workspace** SSO.
- **Generic SAML 2.0**.
- **SCIM 2.0** provisioning (Enterprise).

### Notifications
- **In-app notifications panel** (mentions, share access requests, member changes).
- **Email digests** (daily / weekly toggle).
- **Per-event preferences** (granular).

### Updates
- **Release channels** (stable + beta) opt-in.
- **App updater** with mid-edit-safe reload.

## 2. Won't have (Phase 2)

- ❌ Mind-map view (Phase 3).
- ❌ AI summaries / suggestions (Phase 3).
- ❌ Mobile app (Phase 4).
- ❌ Cross-browser parity (Phase 4).
- ❌ Custom roles (Enterprise reserve; future).
- ❌ End-to-end encryption (future research).

## 3. Success criteria

| Metric | Target at end of Phase 2 |
|---|---|
| Team customers (paying) | ≥ 200 |
| Team seats sold | ≥ 1,500 |
| MRR | ≥ $30,000 |
| Active Team members weekly | ≥ 1,000 |
| Avg shares created per Team Org / month | ≥ 20 |
| Share viewer p95 latency | ≤ 400 ms |
| Real-time update propagation p95 | ≤ 500 ms |
| Crash-free session rate | ≥ 99.6% |

## 4. Tech infrastructure additions

- **Real-time transport**: WebSocket fleet (or SSE) per `08-sharing-collab/06-realtime-presence.md`.
- **CRDT runtime**: Y.js for note bodies; fractional indexing for ordering.
- **Webhook outbox** with retries + signing.
- **SAML/SCIM endpoints** + IDP fixture testing.
- **Per-Org seat counting** + Stripe metered billing.
- **Audit log partitioned table** + cold storage tier.

## 5. Compliance additions

- **DPA template signed at Team checkout**.
- **Sub-processor list updated** with WebSocket provider.
- **SOC 2 Type 1 readiness** (audit started; report end of Phase 2).
- **Annual pen test** scheduled.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Real-time infra cost spike | Backpressure + presence batching; downgrade to polling for free shares |
| Conflict resolution bugs cause data loss | Extensive Y.js test suite + audit log replay |
| Sharing abuse (spam / phishing) | Rate limits + auto-disable on signal + abuse@ flow |
| SSO integration drag (per IDP) | Start with Google Workspace + generic SAML; case-by-case for others |
| Team buyers want SSO + audit before paying | Bundle as Team-tier table-stakes |
| Existing Pro users churn from team-feature-bloat | Keep Pro UX clean; Team features only visible in Team Orgs |

## 7. Marketing additions

- Team plan landing page with use cases (research teams, marketing, design).
- Comparison vs Notion (for shared links workflow specifically).
- Case studies (3 Team customers).
- Webinar series ("Team workflows in LMN").

## 8. Exit criteria → Phase 3

- Phase 2 success criteria met.
- 0 P0/P1 bugs in collab stack.
- Real-time stability: < 0.1% session drop rate.
- SSO live and used by ≥ 10 Team Orgs.
- Mind-map + AI scope finalized + reviewed.

## 9. Phase 2 deliverables checklist

- [ ] Public + password + invite-only shares
- [ ] Embed widget
- [ ] Share manager + analytics
- [ ] Team plan billing
- [ ] Member management UI
- [ ] Roles + RLS (full matrix)
- [ ] Real-time presence + updates
- [ ] CRDT-based note editing
- [ ] Comments + reactions + mentions
- [ ] Notifications panel + digests
- [ ] Audit log UI
- [ ] API tokens + public API
- [ ] Webhooks + Slack
- [ ] Google SSO + generic SAML
- [ ] SCIM (Enterprise tier teaser)
- [ ] Release channels (beta opt-in)
- [ ] SOC 2 Type 1 audit started
