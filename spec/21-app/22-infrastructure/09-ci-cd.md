# CI / CD

Pipelines, gates, rollback. Build once, deploy three times (dev → staging → prod).

---

## 1. Provider

GitHub Actions (workflows in `.github/workflows/`). Lovable hosting auto-deploys on tag push.

## 2. Pipelines

### 2.1 `ci.yml` — runs on every PR

Jobs (parallel):
1. **install** — restore cached `node_modules` / `bun` cache.
2. **typecheck** — `tsc --noEmit`.
3. **lint** — `eslint . --max-warnings 0`.
4. **format** — `prettier --check .`.
5. **unit** — `vitest run` (per `21-testing/`).
6. **integration** — spin up ephemeral Cloud project; run API contract tests.
7. **build** — produce `dist/` for web app, marketing, extension.
8. **bundle-scan** — grep client bundle for forbidden secret prefixes (`sk_`, `whsec_`, `re_`, …); fail on hit.
9. **a11y** — `@axe-core/cli` against built routes; fail on serious/critical.
10. **lighthouse** — perf budget on key routes (LCP < 2.5s, CLS < 0.1, TBT < 200ms).
11. **size-limit** — fail if any route's JS > 250 KB gzipped.
12. **spec-link-check** — fail if any `spec/21-app/**/*.md` link points to a non-existent file.
13. **env-check** — `scripts/check-env.ts` validates required env vars present per environment matrix.

Gate: **all green** required to merge to `main`.

### 2.2 `deploy-dev.yml` — runs on merge to `main`

- Build + deploy web app + marketing + API to dev.
- Run smoke tests (per `21-testing/`).
- Post Slack notification with deploy URL + commit summary.

### 2.3 `deploy-staging.yml` — runs on tag `staging-vX.Y.Z`

- Build once (artifact cached).
- Deploy to staging.
- Run full e2e suite against staging.
- Run schema-migration check (forward + rollback dry-run on staging DB).
- Post Slack with link to QA checklist.
- Manual approval required to proceed.

### 2.4 `deploy-prod.yml` — runs on tag `vX.Y.Z`

- Reuse staging artifact (must be same SHA).
- Apply DB migrations (forward only; rollback plan documented in PR).
- Canary: route 10% traffic to new version for 24h.
- Auto-rollback if error rate > 2x baseline or p99 latency > 1.5x baseline for 5 consecutive minutes.
- After 24h clean, ramp to 100%.
- Tag the SHA in error reporter + analytics for release tracking.
- Publish release notes to `/changelog` (per `16-notifications-updates/01-in-app-updates-feed.md`).

### 2.5 `extension-publish.yml` — runs on tag `ext-vX.Y.Z`

- Build extension with prod env.
- Strip sourcemaps.
- Sign + zip.
- Upload to Chrome Web Store via API.
- Submit for review (manual queue per `04-extension/13-update-and-rollout.md`).

## 3. Rollback

- **Web app / marketing / API:** redeploy previous tag. Single command, < 2 min.
- **DB migrations:** every migration ships with a `down` script. Rollback within 24h is automated; beyond 24h requires data-migration plan.
- **Extension:** Chrome Web Store rollback to previous version via store dashboard; users update over next 24h.
- **Feature flag kill switch:** for in-progress launches, flip flag in admin panel; no redeploy needed.

## 4. Build secrets

Configured at workspace level in Lovable (per platform docs):
- `NPM_TOKEN` — only if private packages.
- `SENTRY_AUTH_TOKEN` (or GlitchTip) — for sourcemap upload.
- `CHROME_WEB_STORE_REFRESH_TOKEN` — for extension publish.
- `CHROME_WEB_STORE_CLIENT_ID` / `SECRET` — store API credentials.

## 5. Concurrency

- One in-flight deploy per environment; new deploys queue.
- Two PR merges within 5 min batch into one dev deploy.

## 6. Artifact retention

- Build artifacts retained 90 d.
- Deploy logs retained 1 y.
- Test results retained 30 d.

## 7. Cross-references

- Environments: `02-environments.md`
- Env vars: `03-env-vars.md`
- Build secrets: `04-secrets.md`
- Test suite location: `21-testing/` (when B4 closes)
