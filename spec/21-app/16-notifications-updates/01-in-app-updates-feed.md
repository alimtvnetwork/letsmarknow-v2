# In-App Updates Feed

The "What's new" panel — product changelog visible inside the app.

---

## 1. Surface

- Bell icon in top-right of shell header.
- Click opens dropdown panel (400 × 560 px).
- Mobile: full-screen sheet from top.
- Also accessible at `/whats-new` for direct linking.

## 2. Entry types

| Type | Icon | Color |
|---|---|---|
| Feature | ✨ | primary |
| Improvement | ⬆ | accent |
| Fix | 🔧 | muted |
| Notice | 📢 | warning (e.g. "Maintenance Sunday 2am UTC") |

## 3. Entry anatomy

```
┌────────────────────────────────────────────┐
│ ✨ FEATURE · v1.4.0 · 2 days ago          │
│ Mind-map view                              │
│ See your workspace as a force-directed     │
│ bubble graph. Drag, zoom, lasso-select.    │
│ [Try it →] [Read more →]                   │
└────────────────────────────────────────────┘
```

- Type chip + version + relative time.
- Headline (bold, 1-2 lines).
- Body (markdown rendered, max 4 lines before "Read more").
- Optional CTA buttons: deep-link into the relevant feature.
- Optional inline image / GIF (lazy-loaded; auto-pause).

## 4. Unread state

- Bell shows red dot when ≥ 1 unread entry exists.
- Dot disappears when panel opened.
- Per-Account read state (synced; not per-device).
- Capped at 1 dot — no count bubble.

## 5. Filtering

Top of panel:
- All / Features / Fixes / Notices tabs.
- Search input (keyword filter).

## 6. Source of truth

- Entries live in a CMS-backed JSON endpoint: `GET /v1/whats-new?since=ts&channel=stable|beta`.
- Cached client-side; revalidated every 30 min on app focus.
- Markdown body sanitized server-side before render.

## 7. Targeting (optional)

Entry can have audience filters:
- `plan: free | pro | team`
- `surface: web | extension`
- `org_role: viewer | editor | admin | owner`
- `country: ISO codes` (rarely used; e.g. EU-only legal notice)

Server filters before sending.

## 8. Mark as read

- Auto-mark visible entries as read on panel open (after 600 ms).
- Manual "Mark all read" button.
- Per-entry "dismiss" hides without affecting unread badge logic.

## 9. Deep-linking

- CTA links use `letsmarknow://feature/<id>` or `https://letsmarknow.com/...`.
- Extension intercepts `letsmarknow://` and routes to internal surface.
- Web app handles via React Router with feature flag gate.

## 10. Notice entries

- Pinned at top until acknowledged.
- Optional banner in main shell (for critical notices like incidents or scheduled downtime).
- Banner respects `auto_dismiss_at` timestamp.

## 11. Accessibility

- Panel is a popover with `role="dialog"` and focus trap.
- Esc closes; focus returns to bell.
- Each entry is a `<article>` with proper heading levels.
- Reduced-motion: GIFs replaced with static first frame + play button.

## 12. Telemetry

- `whats_new.opened` `{ unread_count }`
- `whats_new.entry_viewed` `{ entry_id, type, dwell_ms }`
- `whats_new.cta_clicked` `{ entry_id, cta_id }`
- `whats_new.dismissed` `{ entry_id }`
- `whats_new.marked_all_read`

## 13. Authoring (Lovable team)

- Internal admin route `/admin/whats-new` (Lovable employees only, gated by `is_staff`).
- Form: type, version, headline, body (markdown), CTAs, audience filters, publish_at, expires_at.
- Preview tab renders entry exactly as users will see.
- Versioned drafts; require 2-person review for publish.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Offline | Cached entries visible; "Last updated N min ago" hint |
| Long body (> 800 chars) | Truncated; "Read more" expands inline |
| Image fails to load | Hide image; rest of entry intact |
| Entry deleted server-side after read | Stays in local cache for 24 h then disappears |
| User on beta channel | Sees beta + stable entries; chip badges beta-only ones |

## 15. Tests

- Unread dot lifecycle (read → re-publish → unread again only if version bump).
- Audience filter correctness.
- Markdown sanitization (XSS).
- CTA deep-link routing in both web + extension.
- Banner acknowledgment persistence across devices.
