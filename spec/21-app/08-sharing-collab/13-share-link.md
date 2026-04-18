# Share Link

> 📌 **Pointer file.** The shipping v1 share contract is `02-data-model/07-share.md`. The richer multi-link v2 design is in `08-sharing-collab/01-share-model.md` (marked v2-future).

This file covers the **URL surface** of a Share — slug rules, reservations, custom-slug entitlement, and link rotation.

---

## 1. URL pattern

`https://letsmarknow.com/t/{slug}`

- `{slug}`: `[a-z0-9-]{3,64}`, lowercase, hyphen-separated, no leading/trailing/double hyphen.
- Auto-generated default: `[a-z0-9]{10}` (collision-checked).
- Custom slug: Pro+ entitlement (`custom_share_slug`).

## 2. Reserved slugs

Blocked at create time (case-insensitive):

`t`, `e`, `s`, `app`, `api`, `admin`, `account`, `auth`, `billing`, `blog`, `careers`, `changelog`, `community`, `contact`, `dashboard`, `docs`, `download`, `embed`, `extensions`, `features`, `feedback`, `help`, `home`, `jobs`, `legal`, `login`, `logout`, `marketing`, `oauth`, `org`, `pricing`, `privacy`, `pro`, `roadmap`, `security`, `settings`, `share`, `signin`, `signup`, `status`, `support`, `team`, `terms`, `trial`, `tos`, `upgrade`, `user`, `vs`, `webhooks`, `welcome`.

Configurable blocklist appendable by ops.

## 3. Slug lifecycle

- **Create:** server checks reservation list + uniqueness. Returns `409 SLUG_TAKEN` on collision.
- **Rotate:** "Rotate link" action revokes the current slug (410 Gone forever) and assigns a new auto-generated one. Old slug reserved 90 days against re-issue.
- **Reuse window:** soft-deleted slugs cannot be reclaimed for 90 days (anti-confusion).

## 4. Custom slug entitlement

Gated by License entitlement `custom_share_slug` (Pro+, see `10-licensing-billing/01-plans-matrix.md` and `02-entitlements-engine.md`). Free users get only auto-generated slugs.

## 5. SEO / indexability

- Default response headers: `X-Robots-Tag: noindex, nofollow`.
- Pro+ owners can flip per Share → `index, follow` and supply OG title/description/image (see `02-data-model/07-share.md`).
- No sitemap auto-generation.

## 6. Edge cases

| Case | Behavior |
|---|---|
| Slug ends up as a profanity match | Auto-regenerate; surface warning in API response. |
| Custom domain (Team v2) DNS broken | `letsmarknow.com/t/{slug}` always works as fallback. |
| Slug case mismatch in URL | 301 redirect to lowercase canonical. |
| Slug with trailing slash | 301 redirect to canonical (no trailing slash). |

## 7. Cross-references

- Data contract: `02-data-model/07-share.md`.
- v2 multi-link future: `08-sharing-collab/01-share-model.md`.
- Security (entropy, enumeration): `19-security-privacy/05-share-link-security.md`.
- Public viewer: `05-web-app/14-share-viewer.md`.
