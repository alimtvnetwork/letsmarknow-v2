# Notes & Descriptions

Two free-form text fields per Item, plus optional descriptions on Collections, Groups, Spaces.

---

## 1. Fields

| Entity | Field | Length | Format |
|---|---|---|---|
| Item | `description` | 4 KB | Markdown-lite |
| Item | `note` | 8 KB | Markdown-lite |
| Collection | `description` | 4 KB | Markdown-lite |
| Group | `description` | 1 KB | plain text |
| Space | `description` | 4 KB | Markdown-lite |

`description` = factual / public-ish.
`note` = personal / contextual / private (still visible to Org Members; never in shares unless opted in).

## 2. Markdown-lite subset

Supported:
- `# h1`, `## h2`, `### h3`
- `**bold**`, `*italic*`, `~~strike~~`
- Bullet lists `- item`, ordered lists `1. item`
- Links `[text](url)` + autolinks
- Inline code `` `code` `` and fenced ``` ```
- Blockquote `> quote`
- Horizontal rule `---`
- Task list `- [ ]` / `- [x]`

Not supported in v1 (rejected on save):
- Images
- Tables
- HTML
- Footnotes

## 3. Editor UX

- shadcn `<Textarea>` enhanced with `MarkdownLite` toolbar (bold, italic, link, code, list, h1-h3).
- Keyboard: `Cmd+B/I/K/E`, `Cmd+Shift+7/8` for ol/ul.
- Live preview toggle (split or tabbed).
- Autosave 800 ms after last keystroke.
- Character counter with warning at 90% of cap.

## 4. Render

- Server-side renderer in `packages/markdown` (used by web, share viewer, exports).
- Output sanitized (DOMPurify with strict allow-list).
- Links open in new tab with `rel="noopener noreferrer"`.
- Code blocks: syntax highlighted via Shiki (top 12 languages preloaded; others lazy).

## 5. Storage

- Stored as raw Markdown text in DB.
- Rendered HTML cached in IndexedDB / Redis for hot items.

## 6. Privacy in shares

- `description` visible to share viewers by default.
- `note` excluded by default; opt-in per share via "Include private notes".
- Group / Space description follow Collection share rule.

## 7. Concurrency

- `If-Match` header on PATCH.
- 409 → conflict resolver opens with 3-way merge UI (CodeMirror-based diff).
- Realtime broadcast tells other clients to refetch (debounced 1 s).

## 8. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Item description + note | ✅ | ✅ | ✅ |
| Collection / Space description | ✅ | ✅ | ✅ |
| Markdown rendering | ✅ | ✅ | ✅ |
| Code block syntax highlight | ❌ | ✅ | ✅ |
| Live preview pane | ✅ | ✅ | ✅ |
| Image upload in notes (future) | ❌ | ✅ | ✅ |

## 9. Telemetry

- `note.edited` `{ entity_type, length }` (length bucketed)
- `note.preview_toggled`
- `note.conflict_resolved` `{ strategy }`
- `note.size_warning_shown`

## 10. A11y

- Markdown toolbar buttons have `aria-label` and `aria-keyshortcuts`.
- Preview pane uses semantic HTML rendered from MD.
- Editor focus order: textarea → toolbar (toolbar reachable via `F6`).

## 11. Edge cases

| Case | Behavior |
|---|---|
| User pastes large blob | Truncated to cap with toast "Pasted text was trimmed to fit" |
| User pastes HTML | Stripped to MD-equivalent or text |
| Note contains markdown that renders as image | Image syntax kept as text (since images are unsupported); literal `![alt](url)` shown |
| Server returns sanitized HTML differing from local render | Local re-renders from server's stored Markdown for consistency |

## 12. Tests

- MD parser unit tests covering each supported feature.
- Sanitizer tests (XSS attempts, javascript: URLs, on-event handlers).
- Conflict-resolver E2E.
- Shiki bundle size budget.
