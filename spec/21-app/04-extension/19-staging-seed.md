# 19 — Staging Seed Accounts

> **Status.** Stub authored Session 39 to close SI-026 forward-ref.
> **Owns.** The fixed roster of seed accounts that exist in every staging environment, plus the script that creates them and the rules that keep them stable.

---

## 1. Purpose

Every staging environment (preview deploys, QA, demo) ships with the **same** set of pre-created accounts so that:
- QA can write deterministic test scripts without re-creating users.
- Sales/demo flows have predictable data to show.
- Bug repros reference a known account name, not "the account I made yesterday".

---

## 2. Seed roster

| Email | Tier | Org role | Purpose |
|---|---|---|---|
| `qa-free@letsmarknow.test` | Free | — | Free-tier limit testing. |
| `qa-pro@letsmarknow.test` | Pro | — | Pro-tier feature testing. |
| `qa-team-owner@letsmarknow.test` | Team | owner | Org admin flows; owns 4 invited members. |
| `qa-team-admin@letsmarknow.test` | Team | admin | Member of `qa-team-owner`'s org. |
| `qa-team-editor@letsmarknow.test` | Team | editor | Member of `qa-team-owner`'s org. |
| `qa-team-viewer@letsmarknow.test` | Team | viewer | Member of `qa-team-owner`'s org. |
| `qa-team-billing@letsmarknow.test` | Team | billing | Billing-only role testing. |
| `qa-guest@letsmarknow.test` | Free | guest (invited) | Guest-role share testing. |

Password for all seed accounts: stored in Lovable Cloud secret `STAGING_SEED_PASSWORD`. Never commit.

The `.test` TLD is reserved by RFC 2606 and never resolves — these emails cannot receive real mail, which is intentional for staging.

---

## 3. Seed data per account

Each seed account ships with:
- 1 default Space.
- 3 Collections (varying `kind` values per `02-data-model/03-collection.md`).
- ~15 Items spread across the Collections (mix of bookmarks, saved-tabs, notes).
- 1 `next` Collection (the singleton per `07-features/17-next-queue.md`) with 5 open items + 2 done items.

Exact item content is fixture data, version-controlled in the staging-seed script (location: extension package's `scripts/seed-staging.ts` — planned, lives outside this spec folder).

---

## 4. Reset cadence

- Staging DB is reset **nightly at 02:00 UTC**.
- Seed script runs immediately after reset.
- Any data QA created during the previous day is gone — this is intentional. QA writes idempotent tests.

---

## 5. What this file is NOT

- **Not the production user creation flow.** That lives in `09-auth-accounts/`.
- **Not the seed script implementation.** That lives in the extension/web-app repo, not in this spec folder. This file is the **contract** the script implements.
- **Not the prod data fixtures.** Production has no fixtures.

---

## 6. Cross-references

- Cited from: `04-extension/15-dev-loop.md` §"Staging seed" line 83.
- Role enum (locked): `09-auth-accounts/07-org-membership.md` and `00-overview/02-glossary.md`.
- Role enforcement pattern (SECURITY DEFINER `has_role(_user_id, _role)` for RLS): `19-security-privacy/01-threat-model.md` "Elevation of privilege" row. Seed-policy tests must use this pattern, never client-side role checks.
- Tier definitions: `10-licensing-billing/01-plans-matrix.md`.
- Collection kinds: `02-data-model/03-collection.md`.
- Next queue singleton: `07-features/17-next-queue.md`.
