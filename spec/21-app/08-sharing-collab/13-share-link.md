# Share Link

> 📌 **Pointer file.** The shipping v1 share contract is `02-data-model/07-share.md`. The richer multi-link v2 design is in `08-sharing-collab/01-share-model.md` (marked v2-future).

This file covers the **URL surface** of a Share — slug rules, reservations, custom-slug entitlement, and link rotation.

---

## 1. URL pattern

The Share entity exposes **two** parallel URL surfaces. Both resolve to the same target; both honor the same access mode (`public` / `password` / `invite_only`).

### 1.1 Random-slug surface (always available)

`https://letsmarknow.com/t/{slug}`

- `{slug}`: `[a-z0-9-]{3,64}`, lowercase, hyphen-separated, no leading/trailing/double hyphen.
- Auto-generated default: `[a-z0-9]{10}` (collision-checked, globally unique).
- Custom slug on this surface: Pro+ entitlement (`custom_share_slug`).
- Globally unique across all Organizations.

### 1.2 Memorable-shortlink surface (`lmk/...`, opt-in)

`https://letsmarknow.com/lmk/{org_handle}/{memorable_slug}`

Browser-native shorthand (when the Mark Now extension is installed): typing `lmk/{memorable_slug}` in the address bar resolves against the **active Organization**, so members rarely need to type the `{org_handle}` segment.

- `{memorable_slug}`: `[a-z0-9-]{1,60}`, lowercase, hyphen-separated, no leading/trailing/double hyphen, no consecutive hyphens. Validation regex (anchored): `/^[a-z0-9]$|^[a-z0-9][a-z0-9-]*[a-z0-9]$/` plus a separate "no `--`" reject.
- Uniqueness: `(organization_id, memorable_slug)` is unique (case-insensitive). Two Organizations may both have `lmk/hr`.
- Optional: a Share may have a `memorable_slug` set, or only the random `/t/{slug}`, or both. The random surface is the universal fallback.
- Reserved memorable slugs: same list as §2 plus `lmk`, `t`, `new`, `edit`.
- Entitlement: memorable slugs are **Pro+** on personal Spaces, included in all paid Org plans (`custom_share_slug` covers both surfaces).
- Resolver behavior is specified in §1.4.

### 1.3 Canonical & redirects

- The **canonical** for SEO/OG is whichever surface the user copies via the "Share" UI. The `<link rel="canonical">` is set per response to the requested surface.
- A Share with both surfaces enabled: hitting either renders the same page; no cross-surface redirect (avoids confusing copy-paste flows).
- Surface mismatch (e.g. memorable slug typed against wrong org handle) → 404 with "Did you mean `lmk/{guess}`?" suggestion if a near-match exists in another visible Org.

### 1.4 Address-bar resolver (extension-mediated)

When the Mark Now Chrome extension is installed and the user is signed in, typing `lmk/{slug}` in the omnibox is intercepted (per `04-extension/06-omnibox.md` — keyword `lmk`):

| Case | Resolver behavior |
|---|---|
| `{slug}` exists in the active Organization | Navigate to that Share's `target` page within ≤ 300 ms. `Alt+Enter` opens in new tab. |
| `{slug}` exists in another Org the user belongs to but not active | Switch to that Org, then navigate. Toast: "Switched to {org_name}". |
| `{slug}` exists in multiple of the user's Orgs | Show disambiguation page listing matches with org name + target preview. |
| `{slug}` does not exist anywhere | Redirect to `https://letsmarknow.com/lmk/new?slug={slug}` (Create-Share dialog pre-filled). |
| Extension not installed (web-only) | The full `https://letsmarknow.com/lmk/{org_handle}/{slug}` URL is the only path; no omnibox shortcut. Server-side 302 still works for the full URL. |



## 2. Reserved slugs

Blocked at create time (case-insensitive):

`t`, `e`, `s`, `app`, `api`, `admin`, `account`, `auth`, `billing`, `blog`, `careers`, `changelog`, `community`, `contact`, `dashboard`, `docs`, `download`, `embed`, `extensions`, `features`, `feedback`, `help`, `home`, `jobs`, `legal`, `login`, `logout`, `marketing`, `oauth`, `org`, `pricing`, `privacy`, `pro`, `roadmap`, `security`, `settings`, `share`, `signin`, `signup`, `status`, `support`, `team`, `terms`, `trial`, `tos`, `upgrade`, `user`, `vs`, `webhooks`, `welcome`.

Configurable blocklist appendable by ops.

## 3. Slug lifecycle

- **Create:** server checks reservation list + uniqueness. Returns `409 SLUG_TAKEN` on collision.
- **Rotate:** "Rotate link" action revokes the current slug (410 Gone forever) and assigns a new auto-generated one. Old slug reserved 90 days against re-issue.
- **Reuse window:** soft-deleted slugs cannot be reclaimed for 90 days (anti-confusion).

## 4. Custom slug entitlement

Gated by License entitlement `custom_share_slug` (Pro+, see `../10-licensing-billing/01-plans-matrix.md` and `../10-licensing-billing/02-entitlements-engine.md`). Free users get only auto-generated slugs.

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
| URL with no scheme typed in resolver (e.g. `lmk/example.com`) | Treat as a slug, not a URL — never auto-prepend `https://`. URLs go in the Share's target via the normal Create-Share flow. |
| Memorable slug very long (> 60 chars) | Reject at create time with `409 SLUG_INVALID`. |
| Memorable slug collides at save (race) | Server returns `409 SLUG_TAKEN`; client surfaces inline error. |

## 7. Orphaned target state

When a Share's underlying target (Space / Collection / Group / Item) is soft-deleted, invariant §47 of `02-data-model/07-share.md` already revokes the Share (`revoked_at = now()`). Public viewers therefore receive `410 Gone`.

For the **owner-facing UI**, the Share is additionally surfaced with an "orphaned" badge so the owner can either:

- **Repoint** the Share to a different target (preserves the slug, especially valuable for memorable `lmk/...` slugs the team has memorized).
- **Hard-delete** the Share entirely (releases the slug into the 90-day cooldown).

Repointing requirements:
- New target must belong to the same Organization.
- New target's `target_type` must match the original (you cannot repoint a `space`-share at a `collection`).
- Repointing logs `share.target_repointed` and resets `revoked_at` to null.

UI surface: `06-ui-ux/` shares panel (planned, SI-026).

## 8. Request-access page (visitor lacks access)

When an unauthenticated visitor hits a memorable `lmk/{org_handle}/{slug}` URL whose Share is in `invite_only` mode and their email is not in `allowed_emails`, OR whose target lives in a private Space they cannot see:

- Show a "Request access to `{org_handle}` / `{slug}`" page.
- Display: target type (Space / Collection / Group / Item) — never the target name or contents.
- Show owner Org's avatar + name (only if `show_owner_branding=true`).
- Form: visitor email + optional message.
- On submit: emit `share.access_requested` event (per §13 of `02-data-model/07-share.md` events list — to be added). Org owners + admins receive a notification (per `16-notifications-updates/`).

This page must NEVER reveal the target's title, URL, or contents.

## 9. Cross-references

- Data contract: `02-data-model/07-share.md`.
- v2 multi-link future: `08-sharing-collab/01-share-model.md`.
- Security (entropy, enumeration): `19-security-privacy/05-share-link-security.md`.
- Public viewer: `05-web-app/14-share-viewer.md`.
- Extension omnibox keyword `lmk`: `04-extension/06-omnibox.md`.
- Reserved-slug list authority: §2 of this file.

