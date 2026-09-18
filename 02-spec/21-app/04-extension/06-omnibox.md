# Omnibox

URL bar keyword integration. User types `lmn ` (keyword + space) → Chrome routes input to extension.

---

## 1. Manifest

```json
"omnibox": { "keyword": "lmn" }
```

Default suggestion (always shown first): "Search your saved tabs in Lets Mark Now".

## 2. Listeners

```ts
chrome.omnibox.onInputStarted.addListener(() => warmCache());
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => { ... });
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => { ... });
chrome.omnibox.onInputCancelled.addListener(() => clearPending());
```

## 3. Suggestion algorithm

1. Debounce 80 ms.
2. Hit local IndexedDB cache first → render up to 5 results synchronously (instant feel).
3. In parallel, call `GET /v1/search/quick?q=<text>&recent_boost=true`.
4. When server responds (< 150 ms p95), replace local results.
5. Always include a final "🔍 Search "text" in dashboard" entry that opens `/?q=text`.

## 4. Suggestion shape

Chrome's omnibox API is HTML-restricted. We use:
```ts
suggest([
  {
    content: "https://chatgpt.com/",          // what fills URL bar / triggers on Enter
    description: '<match>Chat</match>GPT  <dim>· chatgpt.com · in Quick Tools</dim>'
  }
]);
```

Tag rules:
- `<match>` for matched substring (Chrome highlights).
- `<dim>` for de-emphasized metadata.
- `<url>` for the full URL.

## 5. On Enter (`onInputEntered`)

- If `text` is a URL pointing to an existing Item → open in tab per `disposition` (`currentTab` / `newForegroundTab` / `newBackgroundTab`).
- If user picked the "Search in dashboard" suggestion → open `chrome://newtab/?q=<text>` (the new-tab override picks up `?q=` and runs full search).
- If `text` doesn't match any suggestion verbatim → also opens dashboard search.

## 6. Jump-to-tab from omnibox

If the chosen Item URL is already open in any window of the current profile, switch to that tab instead of opening a new one. Implemented via `chrome.tabs.query({ url })` + `chrome.tabs.update({ active:true })` + `chrome.windows.update({ focused:true })`.

User can disable via Options "Jump to existing tab from omnibox" (default ON).

## 7. Auth-required state

If unauth:
- Sole suggestion: "Sign in to Lets Mark Now to search your tabs"; on Enter opens `https://letsmarknow.com/login?from=omnibox`.

## 8. Rate limiting

- Local debounce 80 ms.
- Coalesce in-flight requests; cancel previous via `AbortController`.
- Server `search` rate class is 120/min — well above any human typing speed.

## 9. Telemetry

Per omnibox session (start → enter or cancel) record (no PII):
- `query_length`
- `result_count_local`, `result_count_server`
- `chosen_index` (or null if cancelled)
- `latency_first_render_ms`, `latency_server_ms`

Used to tune cache hit rate and ranking.

## 10. Edge cases

| Case | Behavior |
|---|---|
| Empty query (`lmn `) | Show "Type to search…" + 3 most-recent items. |
| Query is a URL the user has saved | First suggestion is the saved Item; second is "Open in dashboard". |
| Multi-Org account, ambiguous tab | Search runs in **active Org**; suggestion footer shows "Search in other orgs ↗" → opens dashboard with org-switch hint. |
| Offline | Local cache only; banner suggestion "Offline — showing cached results." |

## 11. `lmk/{slug}` shortlink interception (separate surface)

Distinct from the `lmn ` keyword: when the user types `lmk/{slug}` directly into the address bar (no space, looks like a URL path), the extension intercepts via `chrome.webNavigation.onBeforeNavigate` and resolves against the active Organization. This is the memorable-shortlink surface specified in `08-sharing-collab/13-share-link.md` §1.4.

| Aspect | `lmn` keyword (this file's main subject) | `lmk/{slug}` shortlink (this section) |
|---|---|---|
| Trigger | `lmn ` + free-text query | URL pattern `lmk/{slug}` typed in address bar |
| Backed by | Live search across user's tabs/items | Resolves a specific Share's `memorable_slug` |
| Result | Suggestion list | Direct navigation (≤ 300 ms) |
| Out-of-extension fallback | None — keyword needs the extension | Full URL `letsmarknow.com/lmk/{org_handle}/{slug}` works server-side |

Only `lmn` is a registered `chrome.omnibox` keyword (reserved at extension registration, users cannot rebind). `lmk` is **not** a keyword — it is a path-pattern intercepted by `chrome.webNavigation.onBeforeNavigate`. Both surfaces are reserved against rebinding (the manifest keyword by Chrome's omnibox API; the path pattern by the extension's webNavigation listener).
