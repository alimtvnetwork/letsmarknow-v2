# Formats

Supported import/export file formats and their schemas.

---

## 1. Format matrix

| Format | Import | Export | Notes |
|---|:---:|:---:|---|
| Netscape HTML bookmarks | ✅ | ✅ | Universal — Chrome, Firefox, Safari, Edge |
| LMN JSON | ✅ | ✅ | Native; full fidelity round-trip |
| CSV | ✅ | ✅ | Flat; lossy for groups/notes |
| OPML | ✅ | ✅ | RSS reader heritage; collections only |
| Markdown | ❌ | ✅ | Human-readable backup |
| Pocket JSON | ✅ | ❌ | Pocket's export format |
| Raindrop CSV/JSON | ✅ | ❌ | Raindrop's export formats |
| Pinboard JSON/XML | ✅ | ❌ | Pinboard's API format |

---

## 2. Netscape HTML bookmarks (universal)

The de-facto standard since Netscape Navigator. All major browsers import/export this.

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1734567890" LAST_MODIFIED="1734567890">My Collection</H3>
    <DL><p>
        <DT><A HREF="https://example.com" ADD_DATE="1734567890" ICON="data:image/png;base64,...">Example</A>
        <DD>Optional description / note
    </DL><p>
</DL><p>
```

### Mapping to our model
- `<H3>` → Collection (or Group if nested 2 deep).
- `<A>` → Item; `HREF` → url, text → title.
- `<DD>` → Item description.
- `ADD_DATE` (Unix seconds) → `created_at`.
- `ICON` → `favicon_data_url` if present.

### Limits on parse
- Max nesting: 4 levels (deeper flattened with breadcrumb in title).
- Max items per file: 100,000 (chunk if larger).
- Max file size: 50 MB (rejected if larger; offer split tool).

---

## 3. LMN JSON (native, full fidelity)

Our canonical format. Round-trips losslessly.

```json
{
  "schema_version": "1.0",
  "exported_at": "2026-04-18T12:34:56Z",
  "exporter": "lmn-web/2.4.1",
  "account": {
    "id": "01J...",
    "email": "alim@example.com"
  },
  "organization": {
    "id": "01J...",
    "name": "Personal",
    "slug": "personal"
  },
  "spaces": [
    {
      "id": "01J...",
      "name": "Work",
      "icon": "💼",
      "collections": [
        {
          "id": "01J...",
          "name": "Reading List",
          "color": "amber",
          "groups": [
            {
              "id": "01J...",
              "name": "AI papers",
              "items": ["01J...", "01J..."]
            }
          ],
          "items": [
            {
              "id": "01J...",
              "url": "https://example.com",
              "title": "Example",
              "description": "...",
              "tags": ["ai", "research"],
              "starred": true,
              "pinned_position": 0,
              "created_at": "2026-04-01T10:00:00Z",
              "updated_at": "2026-04-15T11:00:00Z",
              "favicon": "https://example.com/favicon.ico",
              "preview": {
                "title": "...",
                "description": "...",
                "image": "https://...",
                "fetched_at": "..."
              },
              "imported_from": "chrome",
              "imported_at": "..."
            }
          ]
        }
      ]
    }
  ],
  "tags": [{ "id": "...", "name": "ai", "color": "blue" }],
  "shares": [],
  "checksum": "sha256:..."
}
```

### Validation
- JSON Schema in `schemas/lmn-export-v1.json`.
- `schema_version` mandatory; reject unknown majors.
- `checksum` over canonical JSON minus the field itself; verify on import.

---

## 4. CSV

Flat structure; for spreadsheets / quick edits / migration tools that only speak CSV.

```csv
url,title,description,tags,collection_path,created_at,starred
https://example.com,Example,An example page,"ai;research","Work / Reading List / AI papers",2026-04-01T10:00:00Z,true
```

### Conventions
- UTF-8 with BOM (Excel-friendly).
- RFC 4180 quoting.
- `tags` separated by `;` (semicolon, not comma).
- `collection_path` uses ` / ` separator (spaces around slash); imports auto-create missing collections/groups.
- `starred` is `true` / `false`.
- `created_at` ISO 8601.

### Lossy on export
- Notes truncated to first 1000 chars (full content in JSON only).
- Pinned position lost.
- Share status lost.
- Group is encoded in path; export re-emits.

---

## 5. OPML

Designed for RSS readers but commonly used for hierarchical bookmarks.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Lets Mark Now Export</title></head>
  <body>
    <outline text="Reading List">
      <outline text="Example" type="link" url="https://example.com"/>
    </outline>
  </body>
</opml>
```

Lossy: no notes, no tags, no metadata beyond URL + title.

---

## 6. Markdown (export only)

Human-readable backup format. Each Collection = one `.md` file in a zip bundle.

```md
# Reading List

> Color: amber · Updated 2026-04-15

## AI papers

- [Example](https://example.com) — An example page · `ai` `research` ⭐
  > Optional note in blockquote.

- [Another](https://another.com)
```

### Bundle structure
```
lmn-export-2026-04-18/
├── README.md
├── personal/
│   ├── work/
│   │   ├── reading-list.md
│   │   └── ai-papers.md
│   └── personal-index.md
└── manifest.json
```

`manifest.json` includes IDs + LMN JSON pointer for round-tripping.

---

## 7. Pocket JSON (import only)

Pocket's export format (`ril_export.html` actually uses Netscape HTML, but their API JSON is supported too).

```json
{
  "list": {
    "12345": {
      "item_id": "12345",
      "resolved_url": "https://example.com",
      "given_title": "Example",
      "time_added": "1734567890",
      "tags": { "ai": { "tag": "ai" } },
      "favorite": "1"
    }
  }
}
```

Mapping: each entry → Item; `tags` keys → tags; `favorite=1` → starred.

---

## 8. Raindrop CSV/JSON

Raindrop's export. CSV columns: `id, title, note, excerpt, url, folder, tags, created, cover, highlights`.
JSON: official Raindrop export schema. Mapping straightforward.

---

## 9. Pinboard JSON

Pinboard's API export.

```json
[
  {
    "href": "https://example.com",
    "description": "Example",
    "extended": "Note",
    "meta": "...",
    "hash": "...",
    "time": "2026-04-01T10:00:00Z",
    "shared": "yes",
    "toread": "no",
    "tags": "ai research"
  }
]
```

`tags` space-separated; `toread=yes` → goes to a "Read Later" Collection.

---

## 10. Format detection

On upload:
1. Inspect file extension (.html, .json, .csv, .opml, .xml, .zip).
2. Sniff first 1 KB for signatures:
   - `<!DOCTYPE NETSCAPE-Bookmark-file-1>` → Netscape HTML.
   - `{"schema_version"` → LMN JSON.
   - `{"list":` → Pocket JSON.
   - `<opml` → OPML.
   - `<?xml` + `posts` → Pinboard XML.
3. If ambiguous, prompt user to pick from detected candidates.
4. Reject unknown formats with format suggestion.

## 11. Versioning

- LMN JSON `schema_version` follows semver-ish: major bump = breaking, minor = additive.
- Importer supports current major + previous major.
- Exporter emits current major only.
- Migration scripts published when major bumps.

## 12. Tests

- Round-trip: LMN JSON export → re-import → byte-identical structure.
- Netscape HTML import from each major browser snapshot.
- CSV with edge cases: embedded commas, newlines, unicode, BOM/no-BOM.
- OPML deep nesting.
- Format sniffing accuracy on 1000-file corpus.
