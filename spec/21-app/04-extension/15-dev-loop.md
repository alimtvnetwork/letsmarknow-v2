# Dev Loop

How developers build, run, debug, and ship the extension locally.

---

## 1. Repo layout

```
extension/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── icons/              icon-{16,32,48,128}.png
│   └── _locales/<locale>/messages.json
├── manifests/
│   ├── manifest.dev.json
│   ├── manifest.staging.json
│   └── manifest.prod.json
├── src/
│   ├── background/         service worker
│   ├── popup/
│   ├── newtab/
│   ├── sidepanel/
│   ├── options/
│   ├── content/
│   ├── shared/             shared UI, utils, types, zod schemas
│   └── api/                generated API client (from openapi.json)
├── scripts/
│   ├── build.ts
│   ├── pack.ts             zip for CWS upload
│   └── gen-api.ts          regenerate api client
└── dist/                   build output (gitignored)
```

## 2. Stack

- **Vite** with `@crxjs/vite-plugin` for HMR-aware MV3 builds.
- **TypeScript** strict.
- **React 18** in popup / new-tab / side-panel / options.
- **Tailwind CSS** with the LMN design tokens (mirrored from `06-ui-ux/01-design-tokens.md`).
- **zod** for runtime validation of messages and API responses.
- **idb-keyval** + custom IndexedDB wrapper for caches.
- **vitest** for unit, **playwright** for e2e against a real Chrome with the unpacked extension loaded.

## 3. Local commands

```bash
pnpm install
pnpm dev              # builds dev manifest, watches src/, hot-reloads UI surfaces
pnpm dev:staging      # same but points at api.staging.letsmarknow.com
pnpm build:prod       # production bundle, source maps stripped
pnpm pack             # zip dist/ → builds/lmn-<version>.zip
pnpm test             # vitest
pnpm test:e2e         # playwright
pnpm gen-api          # fetch openapi from api/, generate src/api/
pnpm typecheck
pnpm lint
```

## 4. Manifest variants

`manifests/manifest.<env>.json` overrides for:
- `name` suffix (`Lets Mark Now (dev)` / `(staging)`)
- `key` (a stable EXT_ID locally so OAuth redirects work)
- `host_permissions` to point at the right API host
- icon overlay (red dot for dev, yellow for staging) via `public/icons/<env>/`
- `update_url` for internal channel only

Build script picks variant from `MANIFEST_ENV` env var.

## 5. Loading unpacked

```
chrome://extensions → Developer mode → Load unpacked → select dist/
```

HMR triggers SW reload; UI surfaces auto-refresh via `@crxjs/vite-plugin` injection.

## 6. Test accounts

Staging seed accounts (managed in `20-release-ops/staging-seed.md`):
- `qa-free@letsmarknow.test` — Free tier
- `qa-pro@letsmarknow.test` — Pro
- `qa-team-owner@letsmarknow.test` — Team Owner with 4 invited members
- `qa-lifetime@letsmarknow.test` — Lifetime license

All share password `qa-only-staging`. Reset weekly via cron.

## 7. Debugging

- **SW console:** `chrome://extensions → service worker → "Inspect views: service worker"`.
- **Popup console:** right-click extension icon → "Inspect popup".
- **New-tab console:** open a new tab → DevTools as usual.
- **IndexedDB:** DevTools → Application → IndexedDB → `lmn-cache`.
- **Storage:** DevTools → Application → Storage → Extension storage.
- **Network mocking:** `pnpm dev:mock` runs `msw` against the popup; useful for offline-flow tests.

## 8. e2e testing

Playwright spec example:
```ts
test("save current tab via shortcut", async ({ context }) => {
  const ext = await loadExtension(context);
  const page = await context.newPage();
  await page.goto("https://example.com");
  await page.keyboard.press("Alt+Shift+S");
  await expect(ext.popup.getByText("Saved to")).toBeVisible({ timeout: 5000 });
});
```

`loadExtension` helper signs in via test account using `chrome.identity.launchWebAuthFlow` mock.

## 9. CI

GitHub Actions:
- on PR: `lint`, `typecheck`, `test`, `build:prod`, e2e on Chrome Stable.
- on merge to main: above + `pack` + upload artifact + auto-publish to CWS Draft (gated by required reviewer).
- on tag `v*`: same + promote Draft to staged rollout.

## 10. Source maps

- Generated locally and for staging; uploaded to error-tracking server.
- Stripped from production CWS bundle to reduce size and keep code obfuscated.

## 11. Bundle budget

- Total CRX size: < 2 MB uncompressed.
- Per-surface JS: popup < 80 KB gz, new-tab < 180 KB gz, side-panel < 80 KB gz, sw < 60 KB gz.
- CI fails build on regression > 10%.

## 12. Common pitfalls (cheat sheet)

| Symptom | Cause / fix |
|---|---|
| `chrome.runtime.lastError: Could not establish connection` | Surface unmounted before reply; wrap with try/catch and ignore. |
| SW dies mid-fetch | Use `event.waitUntil(promise)` in alarm handlers; popup-triggered fetches keep SW alive only until response. |
| Service worker logs disappear | "Inspect views" view auto-closes when SW is GC'd; reopen after action. |
| `chrome.identity` not available | Forgot `"identity"` permission; or running unpacked without `key` field — set stable EXT_ID via `key`. |
| OAuth redirect mismatch | Provider must allow `https://<EXT_ID>.chromiumapp.org/oauth/cb` exactly; staging vs prod EXT_IDs differ. |
| HMR fails for SW | Use `pnpm dev` only; manual reload required after `manifest.json` edits. |
