# Browser Scope Decree — Chrome-Only for v1

> **Status:** LOCKED as of 2026-04-18.
> **Supersedes:** Any conflicting line in any other spec file.
> **Owner decision:** First release targets **Google Chrome only**. All other browsers are **postponed**.

---

## 1. What "Chrome-only" means

| Browser | v1 status | Rationale |
|---|---|---|
| **Google Chrome** (stable, ≥ M120) | ✅ **In scope** | Sole launch target. All extension dev, QA, and Web Store submission focus here. |
| Microsoft Edge | ⏭ **Postponed** | Chromium-compatible but not validated for v1. Defer to Phase 4. |
| Brave | ⏭ **Postponed** | Chromium-compatible but not validated for v1. Defer to Phase 4. |
| Arc | ⏭ **Postponed** | Chromium-compatible but not validated for v1. Defer to Phase 4. |
| Opera | ⏭ **Postponed** | Chromium-compatible but not validated for v1. Defer to Phase 4. |
| Mozilla Firefox | ⏭ **Postponed** | Requires MV3 port + Gecko parity work. Defer to Phase 4. |
| Safari (macOS) | ⏭ **Postponed** | Requires native Safari Web Extension wrapper. Defer to Phase 4 or later. |
| Safari (iOS) | ⏭ **Postponed** | Same as above; out of scope until mobile phase. |

**Rule of thumb:** If the answer to "does this work in Chrome?" is *yes*, it ships in v1. Everything else is Phase 4 or later.

---

## 2. Implications across the spec

These cross-cutting rules override anything in domain-specific files.

### 2.1 Extension (`04-extension/`)
- Build target: **Chrome MV3 only**. No Firefox `browser.*` polyfill, no Safari packaging.
- Manifest `browser_specific_settings` block: **omit**.
- Test matrix: Chrome stable + Chrome beta. No others.
- Distribution: **Chrome Web Store only.**
- Service worker, action API, scripting API: use Chrome-namespaced APIs (`chrome.*`).

### 2.2 Onboarding (`05-web-app/onboarding.md`, wireframes)
- Browser-detection step shows **only the Chrome card**.
- Other-browser cards (Edge / Firefox / Brave / Arc) are **hidden in v1**.
- Copy: "Coming soon for Edge, Brave, Arc, Firefox, Safari" — single line, no per-browser CTAs.

### 2.3 Marketing site (`05-web-app/marketing-site.md`)
- Hero CTA: **"Add to Chrome"** only.
- Footer / install page may list "Coming soon" for other browsers — no working store links.

### 2.4 Import / Export (`11-import-export/`)
- **Importing** from non-Chrome bookmark HTML files (Firefox, Safari, Edge, Arc) **stays in scope** — these are static file uploads, not browser integrations. Users on any browser may upload an HTML file.
- **Browser-extension auto-pull** for non-Chrome bookmarks: **postponed.**
- **Export** to Netscape HTML stays universal (any browser can re-import the file).

### 2.5 PWA (`05-web-app/pwa.md`)
- PWA still ships in v1 as a fallback for mobile and unsupported browsers.
- PWA QA matrix simplifies to: Chrome desktop + Chrome Android only for v1.
- Safari iOS PWA install instructions: **deferred** to Phase 4.

### 2.6 Embed widget (`08-sharing-collab/embed-widget.md`)
- Cross-browser iframe rendering test matrix reduces to **Chrome only** for v1.
- Public share viewer (`/s/:token`, `/t/{slug}`) is plain web HTML — works in any browser by virtue of standards; **no per-browser QA in v1**.

### 2.7 Roadmap (`20-roadmap/`)
- `phase-1-v1.md` non-goals: keep "Firefox / Safari / Edge extensions (Phase 4)" as already stated.
- `phase-3-mindmap-ai.md` non-goals: keep "Cross-browser parity beyond Chrome (Phase 4)" as already stated.
- `phase-4-cross-browser.md` is the single home for all post-Chrome work.

### 2.8 Notifications & updater (`16-notifications-updates/app-updater.md`)
- v1 update flow is **Chrome Web Store only**.
- "Edge / Firefox / Brave" update sections are **postponed** (keep documented but flagged as Phase 4).

### 2.9 Print stylesheet (`06-ui-ux/print-stylesheet.md`)
- v1 print QA: Chrome only. Safari `@page` notes remain documentary, not blocking.

### 2.10 Audit log (`17-admin-org/audit-log.md`)
- The user-agent string `"Mozilla/5.0 ..."` example is **a UA string format**, not a browser-target reference. **No change needed.** (Chrome's UA string also begins with "Mozilla/5.0".)

---

## 3. How to read existing spec files

When any spec file mentions:
- "Edge", "Brave", "Arc", "Opera" as **launch targets** → treat as **postponed (Phase 4)**.
- "Firefox", "Safari", "Mozilla" as **launch targets** → treat as **postponed (Phase 4)**.
- "Chromium siblings" / "cross-browser" → treat as **postponed (Phase 4)**.
- "Edge cases" or "edge weight" or "GIN index" or "Microsoft Edge" in any non-browser context → unchanged.
- `Mozilla/5.0` UA strings → unchanged (this is what Chrome itself sends).

---

## 4. Files that reference non-Chrome browsers

For traceability, the following files mention non-Chrome browsers as either a target, a fallback, or a comparison. Each is governed by §2 above and **does not need line-by-line edits** unless the file itself is being implemented in v1.

- `00-overview/vision.md` — already correctly marks Firefox/Safari as "Chrome-first, then Chromium siblings, then Firefox"; v1 implementation **stops at Chrome**.
- `00-overview/competitive-analysis.md` — Firefox row stays as "⏭ later phase".
- `04-extension/README.md` — first sentence "Priority: Chrome first, Edge/Brave/Arc/Opera next, Firefox later" — for v1 read as **Chrome only**.
- `05-web-app/onboarding.md` — only the Chrome CTA renders in v1.
- `05-web-app/pwa.md` — QA matrix reduces to Chrome rows for v1.
- `06-ui-ux/print-stylesheet.md` — Chrome-only QA in v1.
- `06-ui-ux/wireframes/04-onboarding.md` — Step 2 renders only the Chrome install card in v1.
- `07-features/extensions-os-integrations.md` — non-Chrome rows in browser table are **postponed**.
- `08-sharing-collab/embed-widget.md` — cross-browser iframe QA reduces to Chrome.
- `11-import-export/formats.md` — bookmark HTML uploads from any browser remain supported.
- `11-import-export/importers.md` — only the **Chrome** row uses extension auto-pull in v1; all others are HTML upload only.
- `11-import-export/migration-out.md` — export to Netscape HTML stays universal.
- `16-notifications-updates/app-updater.md` — only the "Chrome Web Store" path is implemented in v1.
- `17-admin-org/audit-log.md` — `Mozilla/5.0` is a UA string, **not** a browser-target reference. No change.
- `20-roadmap/phase-1-v1.md` — non-goals already exclude Firefox/Safari/Edge correctly.
- `20-roadmap/phase-3-mindmap-ai.md` — non-goals already exclude cross-browser correctly.
- `20-roadmap/phase-4-cross-browser.md` — the single home for all postponed browser work.

---

## 5. Locked rules

- **v1 ships for Chrome only.** No exceptions.
- **No conditional code paths** for non-Chrome browsers in v1 source. Don't add `if (isFirefox)` branches "just in case."
- **No QA cycles** spent on non-Chrome browsers in v1. Bug reports from Edge/Brave/Arc users are filed as `phase-4-cross-browser` candidates, not v1 blockers.
- **No marketing claims** of cross-browser support in v1.
- **Manifest stays Chrome-pure** — no `browser_specific_settings`, no `applications` key, no Firefox-only permissions.
- **Phase 4 is the only place** where any non-Chrome work is planned. Reopening that conversation requires explicit owner sign-off.
