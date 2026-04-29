# Environments

Three environments. No more, no less. Promotion is one-way: `dev → staging → prod`.

---

## 1. Environment matrix

| Property | dev | staging | prod |
|---|---|---|---|
| Web app URL | `dev-app.letsmarknow.dev` | `staging-app.letsmarknow.dev` | `app.letsmarknow.com` |
| Marketing URL | `dev.letsmarknow.dev` | `staging.letsmarknow.dev` | `letsmarknow.com` |
| API URL | `dev-api.letsmarknow.dev` | `staging-api.letsmarknow.dev` | `api.letsmarknow.com` |
| Cloud project | `lmn-dev` | `lmn-staging` | `lmn-prod` |
| DB | shared dev instance | isolated, restored monthly from prod backup | prod (HA) |
| Email sender | `noreply@dev.letsmarknow.dev` | `noreply@staging.letsmarknow.dev` | `noreply@letsmarknow.com` |
| Stripe / Paddle | test mode | test mode | live mode |
| OAuth client IDs | dev clients | staging clients | prod clients |
| Feature flags | all ON by default | mirrors prod | per `../07-features/15-feature-flags-and-rollouts.md` |
| Telemetry sink | dev PostHog project | staging PostHog project | prod PostHog project |
| Error reporter | dev DSN | staging DSN | prod DSN |
| Allowed signups | any email | `@letsmarknow.com` + invite list | open |
| Robots / indexing | `Disallow: /` | `Disallow: /` | per `05-web-app/16-seo.md` |

## 2. Promotion flow

```
PR opened
   │
   ▼
dev (auto-deploy on merge to `main`)
   │  manual approval + smoke tests pass
   ▼
staging (deploy via tag `staging-vX.Y.Z`)
   │  manual approval + QA sign-off + canary 10% prod
   ▼
prod (deploy via tag `vX.Y.Z`, full rollout after 24h canary)
```

See `09-ci-cd.md` for the pipeline definition.

## 3. Data flow rules

- **Prod → staging:** monthly anonymized restore (PII scrubbed: emails hashed, names replaced with faker, share secrets rotated).
- **Prod → dev:** never. Dev uses synthetic seed data only.
- **Staging → prod:** schema migrations only, never data.
- **Dev → anything:** never.

## 4. Branch / tag conventions

- `main` → auto-deploys to dev.
- Tag `staging-vX.Y.Z` → deploys to staging.
- Tag `vX.Y.Z` → deploys to prod (semver enforced; major bumps require migration plan).

## 5. Cross-references

- CI/CD: `09-ci-cd.md`
- Env vars per environment: `03-env-vars.md`
- Secrets per environment: `04-secrets.md`
