# Share Analytics (Pro+)

Lightweight, privacy-respecting metrics for share owners.

---

## 1. Scope

Per-Share dashboard at `/settings/shares/:id/analytics`.

Metrics shown:
- Total views (unique + total).
- Views over time (sparkline + 30-day chart).
- Top countries (from CDN-provided country header; never IP-stored).
- Top referrer hosts (only host, not full URL).
- Top items by click-through.
- Most-used emoji reaction (if reactions enabled).
- For password mode: unlock attempts (success vs fail), top failing IPs (truncated).
- For invite mode: invitee acceptance + last-seen.

## 2. Data sources

- `share_view` table (append-only, 90 d retention by default; 1 y on Team).
- Item-click events tracked client-side and sent batched to `/v1/shares/:id/analytics/events`.
- Aggregations precomputed nightly into `share_view_daily` for chart speed.

## 3. Privacy

- No IP stored long-term; truncated to /24 (IPv4) / /48 (IPv6) only for rate-limit + brute-force defense (90-day retention).
- No user-agent stored beyond device class (`mobile / tablet / desktop`).
- No cross-site tracking pixels.
- DNT (`Do Not Track` / `Sec-GPC`) respected — viewer counted in totals only, no country/referrer.

## 4. Aggregation rules

- Unique views deduped per `(share_link_id, viewer_fingerprint)` per 24h window.
- Viewer fingerprint = hash of (truncated IP + UA class + share_link_id) — non-reversible.
- Bot traffic filtered via UA heuristic + behavior (no clicks within 2 s) — flagged in separate "bot" bucket.

## 5. Performance

- Dashboard load p75 < 400 ms (precomputed aggregates).
- Event ingestion p99 < 50 ms (fire-and-forget).
- Chart renders with virtualized SVG; < 60 KB JS.

## 6. UI

- Header KPIs: 4 tiles (Views, Uniques, Items clicked, Reactions).
- Time selector: 7 / 30 / 90 days (Pro), + 1 y (Team).
- Chart: stacked area (uniques vs total).
- Tables: top countries, top referrers, top items.
- Export CSV button.

## 7. Entitlements

| Feature | Free | Pro | Team |
|---|:---:|:---:|:---:|
| Share analytics | ❌ | ✅ (90 d) | ✅ (1 y) |
| Export CSV | ❌ | ✅ | ✅ |
| Per-invitee analytics (invite mode) | ❌ | ✅ | ✅ |
| Bot filtering toggle | ❌ | ❌ | ✅ |
| Webhook on view milestones | ❌ | ❌ | ✅ |

## 8. Telemetry (meta)

- `share_analytics.viewed` `{ share_id }`
- `share_analytics.exported` `{ row_count }`
- `share_analytics.range_changed` `{ days }`

## 9. Edge cases

| Case | Behavior |
|---|---|
| Brand-new share | Empty state with "Share to start collecting data" |
| Share revoked | Analytics frozen; historical data still readable |
| Plan downgrade Pro→Free | Analytics hidden; data retained 30 d for grace re-upgrade |
| Bot-heavy traffic | "X% likely bots" badge; option to filter view (Team) |
| User clears cookies | Counts as new unique next visit; matches privacy posture |

## 10. Tests

- Aggregation correctness over fixtures.
- DNT respect: country/referrer absent for DNT viewers.
- Retention: 91-day-old rows pruned on Pro plan.
- Performance: 10k events/min ingestion budget.
