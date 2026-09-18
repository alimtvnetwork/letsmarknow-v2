# URL Normalization

> **Audience.** Engineers and AI agents implementing URL handling across Mark Now (extension capture, Share targets, Item dedup, `lmk/` resolver, omnibox).
>
> **Scope.** Defines the canonical form for any URL stored or compared in Mark Now. Used by: Item dedup (`02-data-model/05-item.md`), Save Session capture (`04-extension/09-save-session.md`), Share `target_url` (`02-data-model/07-share.md`), `lmk/` resolver (`08-sharing-collab/13-share-link.md`), and analytics URL columns (`18-analytics-telemetry/`).

---

## 1. Normalization pipeline (deterministic, ordered)

Every URL entering the system is normalized via this pipeline **in order**. Output is a `normalized_url` string and a structured `url_parts` object. Both are stored alongside the original `raw_url` (the raw form is preserved verbatim and never mutated).

| # | Step | Rule |
|---|---|---|
| 1 | Trim whitespace | Strip leading/trailing whitespace and control chars (U+0000–U+001F, U+007F). |
| 2 | Reject non-HTTP(S) | Only `http:` and `https:` are accepted for Share/Item/Session storage. `chrome://`, `about:`, `file://`, `javascript:`, `data:` → rejected with `URL_SCHEME_UNSUPPORTED`. |
| 3 | Lowercase scheme | `HTTPS://` → `https://`. |
| 4 | Lowercase host | `EXAMPLE.COM` → `example.com`. IDN hostnames are converted to **Punycode** (`xn--`) at storage time; UI displays the Unicode form. |
| 5 | Strip default port | `:80` on `http`, `:443` on `https` removed. Other ports preserved. |
| 6 | Strip userinfo | `https://user:pass@host/...` → `https://host/...`. Logged as `URL_USERINFO_STRIPPED` (S2 warning, never an error). |
| 7 | Path canonicalization | Decode safe percent-escapes (unreserved chars per RFC 3986 §2.3). Re-encode unsafe chars uppercase (`%2F` not `%2f`). Collapse `//` runs to `/`. Resolve `.` and `..` segments. |
| 8 | Trailing slash | Remove trailing `/` **except** when the path is exactly `/` (root). `https://x.com/a/` → `https://x.com/a`. |
| 9 | Query param filter | Drop tracking params (see §2). Sort remaining params alphabetically by key, then by value for repeated keys. Re-encode values with consistent uppercase percent-escapes. |
| 10 | Empty query elision | If all params were dropped, remove the `?` entirely. |
| 11 | Fragment handling | Drop fragment by default. **Exception:** preserve fragments matching `^#[!/]` (hashbang/SPA routes) and `^#:~:text=` (text fragments) — these are semantically meaningful. |
| 12 | Length cap | Reject `normalized_url` > 2048 chars with `URL_TOO_LONG`. |

The pipeline is **idempotent**: `normalize(normalize(x)) === normalize(x)` for all valid inputs. Enforced by a property test in `scripts/lint/` (planned).

---

## 2. Tracking-parameter strip list

Removed at step 9. Case-insensitive on key. Value preserved in audit log when `share.target_repointed` fires (so reattribution is possible later).

**Always stripped:**

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `utm_name`, `utm_brand`, `utm_social`, `utm_social-type`, `gclid`, `gbraid`, `wbraid`, `dclid`, `fbclid`, `msclkid`, `mc_cid`, `mc_eid`, `_hsenc`, `_hsmi`, `hsCtaTracking`, `vero_id`, `vero_conv`, `yclid`, `ysclid`, `ttclid`, `twclid`, `igshid`, `mkt_tok`, `oly_anon_id`, `oly_enc_id`, `s_cid`, `ml_subscriber`, `ml_subscriber_hash`, `ref`, `ref_src`, `ref_url`, `referrer`, `source`, `_ga`, `_gl`.

**Kept (do not strip):**

- App-meaningful params: `q`, `query`, `s`, `id`, `v`, `t` (YouTube timestamp), `page`, `tab`, `lang`, `locale`, `theme`.
- Anything not on the strip list above.

The strip list lives in `lib/url/tracking-params.ts` (planned). Updates require a changeset entry in `.release/`.

---

## 3. Equivalence & dedup

Two URLs are **equivalent** iff their `normalized_url` strings are byte-identical. Used by:

- `Item` dedup within a Collection (`02-data-model/05-item.md §4.2` — dedup key = `(collection_id, normalized_url)`).
- Save Session de-duplication of repeat tabs (`04-extension/09-save-session.md §3.2`).
- Share target resolution: `Share.target_normalized_url` is the lookup key; `Share.target_raw_url` is shown in UI.

**What equivalence does NOT collapse:**

- `http` vs `https` — different schemes, different URLs (avoid silent downgrade).
- `www.example.com` vs `example.com` — different hosts (we don't guess canonical host; site owner's choice).
- Trailing-slash on root vs non-root path is normalized at step 8, but `?a=1` vs `?a=1&b=` are different (empty values are preserved).

---

## 4. `lmk/` slug normalization

The `memorable_slug` portion of an `lmk/` URL (`08-sharing-collab/13-share-link.md §1.2`) is normalized separately:

| Step | Rule |
|---|---|
| Lowercase | `lmk/HR` → `lmk/hr`. |
| NFKC unicode normalize | Collapses lookalike chars before the regex check. |
| Reject non-ASCII | After NFKC, only `[a-z0-9-]` allowed. |
| Reject reserved | See `08-sharing-collab/13-share-link.md §2` reserved list. |
| Length | 1–60 chars after normalization. |

Org handles in `lmk/{org_handle}/{slug}` follow the same rules with length 3–32.

---

## 5. Display vs storage

| Surface | Form |
|---|---|
| Database (`items.url`, `shares.target_url`) | Normalized + Punycoded. |
| Database (`*_raw_url` columns) | Verbatim raw input (length-capped at 4096, truncated with `…` if longer; truncation logged). |
| UI (Item card, Share editor, address-bar copy) | Unicode-decoded host, original-case path, **stripped** of tracking params (matches normalized form except for IDN). |
| Clipboard "Copy link" | Unicode-decoded normalized URL (no tracking params). |
| Audit log entry | Both `raw_url` and `normalized_url` recorded so historical reattribution is possible after strip-list changes. |

---

## 6. Error codes

| Code | When | Severity |
|---|---|---|
| `URL_SCHEME_UNSUPPORTED` | Step 2 reject | Hard error — input refused. |
| `URL_PARSE_FAILED` | WHATWG URL parser throws | Hard error — input refused. |
| `URL_TOO_LONG` | Step 12 reject | Hard error — input refused. |
| `URL_USERINFO_STRIPPED` | Step 6 fired | Soft warning — stored, audit-logged. |
| `URL_TRACKING_STRIPPED` | Step 9 dropped ≥1 param | Info — counted in `analytics.url.tracking_stripped` metric. |

---

## 7. Versioning

This pipeline is **v1**. Changes to the strip list (§2) or step ordering bump the pipeline version. Each `Item` and `Share` row stores `url_normalization_version` so a future migration can re-normalize selectively without losing history.

Current version: `1`.

---

## 8. References

- `02-data-model/05-item.md` — Item dedup uses `normalized_url`.
- `02-data-model/07-share.md` — Share target storage.
- `04-extension/09-save-session.md §3.2` — Session capture dedup.
- `08-sharing-collab/13-share-link.md` — `lmk/` and `/t/` URL surfaces.
- `19-security-privacy/06-extension-privacy.md` — Tracking-param stripping is a privacy feature, not just dedup.
