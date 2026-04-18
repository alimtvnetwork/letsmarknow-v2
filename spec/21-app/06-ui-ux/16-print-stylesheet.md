# Print Stylesheet

Printing a Collection, Item, or Share viewer should look intentional, not broken.

---

## 1. Activated by

- `@media print` CSS.
- Standalone print route variants (e.g. `/c/:slug?print=1`) for users who want a clean page first.
- "Print this collection" action in Collection ⋯ menu.

## 2. Force light tokens

```css
@media print {
  :root, .dark {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --muted-foreground: 0 0% 30%;
    --card: 0 0% 100%;
    --border: 0 0% 80%;
    --primary: 0 0% 0%;
  }
  body { background: white !important; color: black !important; }
}
```

No dark mode prints; saves ink + readable.

## 3. Hide non-essential UI

```css
@media print {
  .org-rail, .sidebar, .top-bar, .footer, .toast-container,
  .command-palette, .density-switch, .view-mode-switch,
  [data-print="hide"] { display: none !important; }
}
```

## 4. Page setup

```css
@page {
  margin: 1.5cm;
  size: A4;
}
@page :first {
  margin-top: 2cm;
}
@media print {
  body { font-size: 11pt; line-height: 1.45; }
  h1 { page-break-after: avoid; }
  h2, h3, h4 { page-break-after: avoid; break-after: avoid; }
  ul, ol, table { page-break-inside: avoid; }
  a { color: black; text-decoration: underline; }
  a[href]:after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #555;
  }
}
```

## 5. Item card in print

- Collapsed to single-line: favicon (mono SVG) · title · domain.
- URL printed below in mono small.
- Tags inline.
- Notes printed as bordered blockquote underneath.

## 6. Group printing

- Group header `h2`.
- Items follow as bulleted list.
- `page-break-inside: avoid` for tight groups.

## 7. Header / footer (per page)

- Top: Org name · Collection title.
- Bottom: page X of Y · printed date · share URL (if applicable).
- Implemented via `@page` margin boxes where supported (Chrome, Safari).

## 8. Share viewer print

- Same composition.
- "Powered by Lets Mark Now" foot small line (always shown in print regardless of branding setting — provenance for printed page).

## 9. Item-only print

- Title `h1`.
- URL.
- Description and notes as flowing paragraphs.
- Tags + dates in footer.

## 10. Forbidden in print

- Background colors (heavy ink).
- Box shadows.
- Sticky positioning.
- Animations / transitions.
- Off-screen content (`overflow: hidden` containers reset).

## 11. PDF export (alternative)

For "save to PDF" intent, recommend browser native print → save as PDF; we don't ship a custom PDF generator in v1.

Future (v2): server-side PDF rendering for shared collections.

## 12. Telemetry

- `print.opened` `{ scope: "collection" | "item" | "share" }`
