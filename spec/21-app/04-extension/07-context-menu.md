# Context Menu

Right-click integration via `chrome.contextMenus`.

---

## 1. Registration

Registered in SW `onInstalled` and `onStartup` (idempotent — `chrome.contextMenus.removeAll` then re-create).

```ts
const ROOT = "lmn.root";

chrome.contextMenus.create({ id: ROOT, title: "Lets Mark Now", contexts: ["page","link","image","selection","frame"] });

chrome.contextMenus.create({
  id: "lmn.save-page", parentId: ROOT,
  title: "Save this page",
  contexts: ["page","frame"]
});

chrome.contextMenus.create({
  id: "lmn.save-link", parentId: ROOT,
  title: "Save this link",
  contexts: ["link"]
});

chrome.contextMenus.create({
  id: "lmn.save-image", parentId: ROOT,
  title: "Save this image",
  contexts: ["image"]
});

chrome.contextMenus.create({
  id: "lmn.save-selection", parentId: ROOT,
  title: 'Save selection as note',
  contexts: ["selection"]
});

chrome.contextMenus.create({ id: "lmn.sep1", parentId: ROOT, type: "separator", contexts: ["page","link","image","selection","frame"] });

// Dynamic destination submenu — rebuilt when last_used_collection_id or starred set changes
chrome.contextMenus.create({
  id: "lmn.dest.last", parentId: ROOT,
  title: "→ Last used: Quick Tools",
  contexts: ["page","link","image","selection","frame"]
});
chrome.contextMenus.create({
  id: "lmn.dest.choose", parentId: ROOT,
  title: "→ Choose collection…",
  contexts: ["page","link","image","selection","frame"]
});
// + up to 5 starred collections as direct items
```

## 2. Click handler

```ts
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "lmn.save-page":     return saveTab(tab, { destination: "last_used" });
    case "lmn.save-link":     return saveLink(info.linkUrl, info.selectionText, tab);
    case "lmn.save-image":    return saveImage(info.srcUrl, tab);
    case "lmn.save-selection":return saveSelectionNote(info.selectionText, tab);
    case "lmn.dest.choose":   return openDestinationPicker(tab); // chrome.action.openPopup() with prefilled state
    default:
      if (info.menuItemId.startsWith("lmn.dest.col.")) {
        const collection_id = info.menuItemId.slice("lmn.dest.col.".length);
        return saveTab(tab, { destination: { collection_id } });
      }
  }
});
```

## 3. Behavior per context

| Context | What gets saved | Destination default |
|---|---|---|
| `page` | Active tab (URL = tab.url, title = tab.title, favicon = tab.favIconUrl) | last-used |
| `link` | Linked URL (URL = info.linkUrl). Title = link text (`info.selectionText`) or pulled async via `<title>` fetch by SW. | last-used |
| `image` | Image URL stored as Item with `kind=image`; original page URL stored in notes. | "Images" group inside last-used Collection (auto-created on first use). Pro feature. |
| `selection` | Item created with title = first 60 chars of selection, URL = page URL, notes = full selection (max 8000 chars). | last-used |
| `frame` | Frame URL (`info.frameUrl`) instead of top-page URL. | last-used |

## 4. Visual feedback

- After click, SW shows `chrome.notifications.create` toast: "Saved to <Collection name>" + Undo button. Auto-dismiss 6s.
- If tab is one we have a content script in (`letsmarknow.com`), we also flash a subtle in-page toast.
- For other pages, no in-page DOM injection (avoid surprise / CSP issues).

## 5. Auth & error states

| Scenario | Behavior |
|---|---|
| Unauthenticated | Notification: "Sign in to save links" + button → opens sign-in tab. |
| `chrome://*` page | Items are still creatable for `link` context (the link target may be normal); for `page` context, gray out with notification "Chrome internal pages can't be saved". |
| Offline | Save queued (see `10-sync-and-offline.md`). Notification reflects queued state. |
| Free plan over item cap | Notification: "Limit reached — Upgrade" with Upgrade button. |

## 6. Submenu freshness

The destination submenu rebuilds when:
- `last_used_collection_id` changes
- `starred_collection_ids` set changes
- Active Org switches

Throttled at 1 rebuild per 500 ms to avoid Chrome menu flicker.

## 7. Disabling

Options toggle "Show 'Lets Mark Now' in right-click menus" (default ON). When OFF, SW calls `chrome.contextMenus.removeAll()` and skips registration on next boot.

## 8. Localization

`title` strings come from `_locale/<locale>/messages.json` via `chrome.i18n.getMessage("ctxSavePage")`. See `17-i18n-a11y/01-extension-strings.md`.
