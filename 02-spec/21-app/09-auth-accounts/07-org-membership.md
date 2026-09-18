# Org Membership

How Members join, leave, change roles, and how Orgs are owned and transferred.

> **Phase markers** (per sequencing audit S-7, 2026-04-19, reconciled against `20-roadmap/`):
> - **P0:** none. P0 ships single personal Org per Account; no invites, no role changes, no transfer. Sections below are forward-spec for P0 implementers — table columns may exist (`member_invites`, `member.role`) but no UI/email path is wired.
> - **P1:** §1 (path #1 Invite only — single email at a time, manual), §2 (Invite flow), §3 (Roles), §4 (Role changes), §5 (Removing Members), §6 (Last Owner protection), §9 (Visibility & directory — Members tab in `/settings/members`), §11 (Notifications — invite + role-change only).
> - **P2:** §1 (paths #2 Domain claim, #3 SCIM), §7 (Ownership transfer — requires re-auth + email confirm infra), §8 (Domain claim + DNS verification), §10 (capacity rows for Team/Enterprise), §11 (full notification matrix), §12 (telemetry beyond `org.invite_*`), §13 edge cases involving SCIM and bulk invite (1000 emails).
> - **P4 (cross-browser/Enterprise):** SAML JIT path referenced in §1.4 (cross-link to `05-sso-saml.md`).

---

## 1. Joining an Org

Three paths:
1. **Invite** — Owner/Admin sends to email; recipient accepts via magic link. **(P1)**
2. **Domain claim** (Team) — verified domain; matching-email signups offered to join. **(P2)**
3. **SCIM provisioning** (Team) — IdP creates Members. **(P2)**

JIT via SAML covered in `05-sso-saml.md`. **(P4)**

## 2. Invite flow

- Owner/Admin enters emails + role + optional message at `/settings/members`.
- Server creates `MemberInvite` rows: `{ id, org_id, email, role, token_hash, invited_by, expires_at }`.
- TTL: 14 d default; configurable 1 h–90 d.
- Email sent: subject "Join {Org name} on Lets Mark Now"; CTA → `/invite/<token>`.
- Recipient flow:
  - Signed in with matching email → 1-click join.
  - Signed in with different email → choose "Switch account" or "Sign out".
  - Not signed in → signup with email locked, password (or OAuth), then auto-join.
- Idempotent: re-inviting same email → updates existing pending invite (new token, old denied).

## 3. Roles

See `08-sharing-collab/05-permissions-matrix.md`. Role assigned at invite; changeable later.

## 4. Role changes

- Performed by Owner/Admin from `/settings/members`.
- Cannot demote yourself if you're the last Owner.
- Demoting an Owner requires explicit confirmation + transfer or co-Owner promotion.
- Audited; affected Member notified by inbox + email.

## 5. Removing Members

- Owner/Admin can remove anyone except the last Owner.
- Soft remove: `Member.removed_at` set; sessions revoked; presence dropped; comments/items remain (authored history preserved).
- Re-invite restores rather than creates new Member (same `id` reused if within 30 d).
- Self-leave via `/me/orgs` "Leave Org"; same constraint about last Owner.

## 6. Last Owner protection

- Server enforces ≥ 1 Owner per Org at all times.
- UI guards: cannot demote / remove / leave if last Owner; prompts transfer.

## 7. Ownership transfer

- Owner picks target Member at `/settings/team/transfer`.
- Server requires:
  - Re-auth.
  - Target accepts within 7 d (email + inbox) or auto-cancels.
- On accept: target becomes Owner; previous Owner becomes Admin (configurable).
- Audited.

## 8. Domain claim

- Owner adds domain at `/settings/team/domain`.
- DNS TXT verification (`lmn-verify=<token>`).
- Once verified:
  - Existing Accounts on that domain receive a one-time invite (not auto-joined).
  - Future signups with that domain see "Join {Org}?" prompt during signup.
  - Account can refuse and create their own Org.
- Multiple Orgs can claim the same domain (rare); choice prompt shown.

## 9. Visibility & directory

- Member list visible to all Members (avatar, display name, role, last_active_at).
- Email visible to Owner/Admin only by default; Team Admins can flip "Show emails to all Members".
- Directory search on `/settings/members` for large Orgs.

## 10. Capacity

| Plan | Max Members |
|---|---|
| Free | 1 (Personal Org only) |
| Pro | 3 collaborators on Personal Org; 5 on Team-style Org |
| Team | 100 (raised by request) |
| Enterprise | unlimited |

## 11. Notifications

- New Member joined → all Owner/Admin inbox.
- Role changed → affected Member inbox + email.
- Removed → affected Member email (always; non-disable).
- Ownership transfer → both parties.

## 12. Telemetry

- `org.invite_sent` `{ count }`
- `org.invite_accepted` `{ time_to_accept_h }`
- `org.invite_revoked`
- `org.member_role_changed` `{ from, to }`
- `org.member_removed` `{ by_self: bool }`
- `org.ownership_transfer_requested` / `_completed` / `_cancelled`
- `org.domain_claimed` / `_unclaimed`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Invite to existing Account in another Org | Account joins both Orgs; switcher shows |
| Invite to email associated with deleted Account (in 30-d grace) | Restoration flow offered before joining |
| SCIM removes member who is sole Owner | SCIM returns 409 |
| Domain claim conflict with existing Org | Both can claim; user chooses on signup |
| Massive invite list (1000 emails) | Background job; progress UI; per-row outcome |

## 14. Tests

- Invite happy path + token reuse rejection.
- Last Owner protection across all paths.
- Ownership transfer accept/cancel/expire.
- Domain claim DNS verification.
- SCIM owner removal blocked.
