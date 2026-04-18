# Importers

Per-source adapters that take a foreign format and produce LMN-shaped data.

---

## 1. Supported sources (v1)

| Source | Method | Auth |
|---|---|---|
| Chrome / Edge / Brave | HTML upload OR extension auto-pull | none / extension |
| Firefox | HTML upload | none |
| Safari | HTML upload | none |
| Arc | HTML upload | none |
| Raindrop.io | CSV/JSON upload OR OAuth | none / OAuth |
| Pocket | HTML/JSON upload OR OAuth | none / OAuth |
| Pinboard | JSON upload OR API token | none / token |
| Instapaper | CSV upload | none |
| Diigo | CSV upload | none |
| Notion | Markdown zip upload | none |
| LMN JSON | JSON upload | none |
| Generic CSV | CSV upload (with mapping UI) | none |

## 2. Adapter interface

```ts
interface Importer {
  id: string;                          // "chrome" | "raindrop" | ...
  display_name: string;
  supported_inputs: ImportInput[];     // file types or "oauth"
  detect(file: File): Promise<boolean>;// can this importer handle the file?
  parse(stream: ReadableStream): AsyncGenerator<LmnRecord>;
  preview_summary(records: LmnRecord[]): PreviewSummary;
  validate(records: LmnRecord[]): ValidationResult;
}
```

Each importer is a stateless module; new ones add by dropping a file in `importers/`.

## 3. Chrome / Edge / Brave (HTML)

- File: `bookmarks.html` (Netscape format).
- Folder structure → Collections (1st level) and Groups (2nd level).
- Deeper nesting flattened with breadcrumb in Collection name.
- "Bookmarks bar" → renamed "Bookmarks Bar" Collection.
- "Other bookmarks" → renamed "Other" Collection.
- `ICON` data-URLs preserved as favicon cache.

### Browser extension auto-pull
- With our extension installed, can pull live bookmarks via `chrome.bookmarks.getTree()`.
- Initial sync = one-shot import; subsequent pulls offered as opt-in (NOT continuous sync — risk of unwanted churn).

## 4. Firefox

- Same HTML format as Chrome; just slightly different folder defaults ("Bookmarks Toolbar", "Bookmarks Menu").
- Tags: Firefox bookmarks support tags natively; preserved as our tags.

## 5. Safari

- Safari exports to Netscape HTML via File → Export Bookmarks.
- Reading List items export separately; we detect and import to a "Read Later" Collection.

## 6. Raindrop.io

### Upload mode
- CSV or JSON exported from Raindrop's UI.
- Field mapping in `formats.md`.

### OAuth mode (Pro+)
1. User clicks "Connect Raindrop" → OAuth dance.
2. Server fetches all collections + raindrops via Raindrop API (paginated).
3. Streams to import pipeline.
4. Map: Raindrop "Collection" → LMN Collection; Raindrop "nested" → Group.
5. Highlights imported as item notes (markdown blockquotes).
6. Cover images preserved.

## 7. Pocket

### HTML upload (most common)
- `ril_export.html` is Netscape format; standard parser.

### OAuth (Pro+)
1. Connect Pocket account.
2. Fetch all items via `/v3/get` (paginated, 100 per call).
3. Map: `tags` → tags; `favorite` → starred; `time_added` → created_at; `time_read` → if present, item moved to "Archived" Collection.
4. `excerpt` → description.

## 8. Pinboard

### JSON / XML upload
- Standard Pinboard export.
- `tags` space-separated → split into individual tags.
- `toread=yes` items grouped into "Read Later" Collection.
- `shared=yes` items get a `public` tag (visual marker only; does NOT auto-share).

### API token (Pro+)
- User pastes Pinboard API token.
- Server fetches via `/posts/all`.

## 9. Instapaper

- CSV columns: `URL, Title, Selection, Folder, Timestamp`.
- `Folder` → Collection.
- `Selection` (highlight) → item note.
- No tags in Instapaper export.

## 10. Diigo

- CSV columns: `Title, URL, Tags, Description, Annotations, Created`.
- Annotations parsed as note (Markdown).

## 11. Notion

- User exports Notion workspace as Markdown zip.
- We look for pages with bookmark-like content (link blocks).
- Each parent page → Collection.
- Each link block → Item.
- Free text in page → first item's note (best effort).
- This importer is "best effort" — clearly labeled as such.

## 12. Generic CSV

- For sources we don't support natively.
- After upload, user maps CSV columns to LMN fields in a UI:
  - URL (required)
  - Title
  - Description
  - Tags (with delimiter picker)
  - Created date (with format picker)
  - Collection path
  - Custom fields → become tags or note
- Saved mapping reusable for repeat imports.

## 13. LMN JSON

- Our native format (`formats.md` § 3).
- Validated against JSON Schema.
- Checksum verified.
- Idempotent: re-importing same file yields no changes (matched by item ID).

## 14. Adapter testing

Each adapter ships with:
- Fixture files (real exports from each source).
- Snapshot tests of parsed output.
- Edge case fixtures (empty, malformed, huge, unicode).
- Round-trip tests where applicable (LMN JSON only).

## 15. Future / not-in-v1

| Source | Status | Notes |
|---|---|---|
| Mymind | post-v1 | API access required |
| Are.na | post-v1 | OAuth + Channels mapping non-trivial |
| Linkding | post-v1 | self-hosted; spec stable |
| Anybox | post-v1 | macOS-only export quirks |
| Hypothesis | post-v1 | annotations focus differs |

## 16. Telemetry

- `import.source_selected` `{ source }`
- `import.preview_generated` `{ source, item_count, error_count }`
- `import.committed` `{ source, item_count, dedup_action }`
- `import.failed` `{ source, reason }`
- `oauth.import_connected` `{ source }`

## 17. Edge cases

| Case | Behavior |
|---|---|
| Importer recognizes file but parse mid-stream fails | Surface partial preview; offer "import valid records only" |
| User uploads zip containing multiple bookmark files | Detect each; multi-file preview |
| Same import committed twice (user clicks twice) | Idempotency-Key blocks duplicate; UI shows "already imported" |
| OAuth token expires mid-import | Pause; prompt re-auth; resume |
| Source has feature LMN doesn't (e.g., Raindrop highlights) | Best-effort mapping documented; nothing silently dropped |
