# Migration Out

Helping users leave Lets Mark Now. We make this easy on purpose.

---

## 1. Philosophy

Trust is built by being trivial to leave. A user who can leave but doesn't is worth ten who feel locked in.

This file describes what we do BEYOND the standard export pipeline to specifically support migration to other tools.

## 2. Migration-targeted exports

`/settings/export → "Migrate to another tool"`:

Targets we explicitly support:
- **Chrome / Firefox / Safari / Edge** → Netscape HTML import-ready.
- **Raindrop.io** → Raindrop CSV format.
- **Pocket** → Netscape HTML (Pocket accepts).
- **Pinboard** → Pinboard XML (their backup format).
- **Notion** → Markdown bundle (importable as Notion pages).
- **Anybox / Mymind / Are.na** → LMN JSON + format guide.
- **Self-hosted Linkding / Shaarli / Readeck** → Netscape HTML.
- **Plain text / spreadsheet** → CSV.

For each: a one-pager guide on how to import into the target tool.

## 3. Format adaptations per target

Each target export uses the closest LOSSLESS format the target supports.

### Raindrop CSV
- Columns ordered exactly as Raindrop's importer expects.
- Folder paths use ` > ` separator (Raindrop convention).
- Tags semicolon-separated.

### Pocket HTML
- Pocket only imports root-level bookmarks; we flatten with collection name as prefix.
- Tags placed in folder hierarchy where supported.

### Notion Markdown
- One `.md` per Collection.
- Tags rendered as inline `#tag` text (Notion converts).
- Notes preserved as Markdown body.

### Linkding HTML
- Standard Netscape format with extensions Linkding recognizes.
- `tags` rendered into `TAGS` attribute on `<A>`.

## 4. Side-by-side migration

For users who want to gradually migrate:
- Export everything.
- Set up forwarding (e.g., Email-in remains active).
- Outbound webhook to new tool's API (if supported).
- "Mirror mode": Pro+ users can configure outbound webhook per Collection to mirror to external tool.

## 5. Account closure with export

Combined flow at `/settings/account/close`:
1. "Before you go: download your data."
2. One-click full export (LMN JSON + Markdown bundle).
3. "Migrate to another tool?" → step 6.
4. Confirmation: account closure + 30-day grace.

## 6. Migration assistant

UI wizard:
1. Pick destination tool.
2. We pre-select the right format.
3. Generate export with target-specific tweaks.
4. Show step-by-step instructions for importing to target.
5. Optional: open target's import URL in new tab.

Implemented as static content (`/migrate-to/<tool>`) for SEO + helpfulness even to non-customers (a competitor's user might find us via Google searching "migrate from raindrop" — we win their trust).

## 7. Public docs

`/help/exporting` and `/help/migrating-from-lmn`:
- Public, SEO-indexed.
- Mention this as a feature in marketing copy ("No lock-in. Leave any time, take everything.").
- Include screenshots of target tool's import UI.

## 8. API for third-parties

A public, documented API endpoint others can use to ingest LMN data programmatically:
- `GET /v1/exports/lmn-json/:account_token` — token issued in `/settings/api/migration-token`. Path-param style follows `:param` convention per `03-api-endpoints/01-conventions.md` (no `{curly}` form).
- 30-day TTL on token.
- Streaming JSON response.
- Rate-limited.

This lets third-party importers (e.g., a tool building "Import from LMN") work without users downloading + uploading manually.

## 9. Telemetry

- `migration.target_selected` `{ target }`
- `migration.export_generated` `{ target, items }`
- `migration.guide_viewed` `{ target }`
- `migration.api_token_issued`
- `migration.api_token_consumed` `{ items }`
- `account.closed_with_export`

(We DO NOT track which user migrated to which tool beyond aggregate counts — privacy.)

## 10. Quality bar

For every supported migration target:
- Tested round-trip with real target tool's importer (manual QA).
- Format snapshots in CI.
- One-pager guide reviewed quarterly.
- User-reported issues triaged at same priority as inbound importers.

## 11. Edge cases

| Case | Behavior |
|---|---|
| Target tool's importer changes format | Detected by quarterly QA; format adapted; release notes mention |
| User wants to migrate then come back | Re-import via standard import pipeline; idempotent matching by external ID where possible |
| Export to target needs feature target doesn't support (e.g., notes) | Exporter docs note the lossy mapping clearly |
| Account closed, then re-opened in grace, then migrate | Full data still exportable |

## 12. Tests

- Each target: synthetic export → assert against snapshot.
- Migration token API: auth, expiry, rate limit.
- Public guide pages render correctly.
- Wizard flow per target.
