# Extensions & OS Integrations

How Lets Mark Now plugs into the operating system and other apps without leaving the user's flow.

---

## 1. Web Share Target (PWA)

- Manifest declares `share_target` (see `05-web-app/pwa.md`).
- OS share sheet → "Lets Mark Now" → opens `/save?title=...&url=...&text=...` in installed PWA.
- Prefilled new-item modal; user picks destination.

## 2. Protocol handler (PWA)

- `web+lmn://collection/<id>`, `web+lmn://item/<id>` open the PWA.
- Useful for cross-device handoff (email yourself a link from desktop → tap on phone).

## 3. Browser context menu (extension)

- Right-click page → "Save to Lets Mark Now".
- Right-click selection → "Save selection to LMN" (saves with `selection` field).
- Right-click link → "Save link to LMN" (saves the link target without opening it).
- Right-click image → "Save image to LMN" (saves image URL with `type=image`).

## 4. Omnibox (extension)

- Trigger: type `lmn` + space in address bar.
- Sub-commands:
  - `lmn save [optional collection name]`
  - `lmn savesession [name]`
  - `lmn find <query>`
  - `lmn open <collection|tag>`
  - `lmn help`
- Suggestion list shows top 6 matches with previews.

## 5. Drag URL onto LMN

- Drag tab title bar / link → drop on LMN sidebar/Collection → save.
- Drag from outside browser into LMN web app → if URL parseable, save.

## 6. Bookmarklet (legacy fallback)

- Drag-to-bookmarks bar; clicking opens `app.letsmarknow.com/save?url=...&title=...`.
- Ensures users without our extension can still capture from any browser.

## 7. iOS / Android share

- PWA installed on Android: appears in OS share menu (via `share_target`).
- iOS Safari: Share sheet → "Add to Home Screen" guidance; for actual share-to-app, future iOS Shortcut recipe published.

## 8. Desktop file open (PWA)

- File handler registered for `application/json` (LMN exports).
- Opens in PWA's import flow with file pre-loaded.

## 9. Email-in (Pro+)

- Each Account gets a private inbox address: `<token>@in.letsmarknow.com`.
- Forwarded emails parsed:
  - Subject → title
  - Body URLs → items
  - Attachments ignored in v1 (rejected with reply email)
- Saved to default Collection unless subject prefix routes (e.g. `[Quick Tools] How to ...`).
- Configurable per Account in `/me/connected`.

## 10. macOS Quick Action / Shortcuts

- We publish a Shortcuts Gallery recipe "Save tab to LMN" using the bookmarklet endpoint.
- No native Mac app in v1.

## 11. Browser-specific notes

| Browser | Support |
|---|---|
| Chrome | Full (extension + PWA) |
| Edge | Full (extension via CWS port) |
| Brave | Full (extension via CWS) |
| Arc | Extension works; PWA install limited |
| Firefox | Extension MV3-port planned post-launch; PWA partial |
| Safari macOS | PWA only; Safari extension planned year 2 |
| Safari iOS | PWA + Shortcut recipe |

## 12. Webhooks (Team)

Outbound webhooks call a URL on events:
- `item.created` / `.updated` / `.deleted`
- `share.created` / `.viewed` / `.revoked`
- `member.added` / `.removed` / `.role_changed`
- `import.completed` / `.failed`
- `org.settings_changed`

Configured in Org Settings → Webhooks. Signed with HMAC-SHA256.

## 13. API tokens (Team)

Personal access tokens with scopes (`read`, `write`, `admin`) for scripting. See `09-auth-accounts/` and `03-api-endpoints/`.

## 14. Telemetry

- `os_integration.share_target_used`
- `os_integration.protocol_handler_used`
- `os_integration.context_menu_used` `{ action }`
- `os_integration.omnibox_used` `{ command }`
- `os_integration.bookmarklet_used`
- `os_integration.email_in_received`

## 15. Privacy

- Email-in: incoming emails parsed and discarded; never stored as raw.
- Webhooks: payloads exclude `note` field by default; toggle to include for own-org payloads.
- Share Target: payload kept only as a save attempt; no analytics on raw text.

## 16. Tests

- Manifest-validation tests for protocol/share target.
- Email-in: integration tests with mock SMTP receiving.
- Webhook: signature verification tests.
- E2E: share-target navigation prefills modal correctly.
