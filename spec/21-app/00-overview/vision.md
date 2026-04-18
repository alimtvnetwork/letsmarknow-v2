# Vision

## One-line pitch

**Lets Mark Now is the AI-era replacement for Toby and Tab Extend — the fastest, most beautiful, no-limits way to save, organize, share, and re-open everything that lives in a browser tab.**

## The problem

Knowledge workers, developers, designers, marketers, students and researchers live in dozens of browser tabs. The two leading tools today both fall short:

- **Toby (gettoby.com)** has a great hierarchical model and sharing, but its UI is dated, the free tier is crippling (60 saved tabs), there is no mind-map / visual mode, and the search is mediocre.
- **Tab Extend (tabextend.com)** has stunning typography and a great column layout, but caps free users at 8 categories, has no undo/redo, no group-level sharing, a broken search, and almost no power-user features.

Neither has been seriously updated in years. Neither is built for the AI era. Neither lets you share a single group as a public link with a password and expiry.

## The vision

A single tool that:

1. **Looks better than Tab Extend** (Apple-system + Ubuntu typography, dark-first, polished animation).
2. **Organizes deeper than Toby** (5-level hierarchy: Workspace → Space → Collection → Group → Item, with no caps in paid tiers).
3. **Shares richer than both** (public link / password / expiry / invite-only roles at every level, custom slugs on `letsmarknow.com/t/{slug}`).
4. **Works faster than both** (instant fuzzy search with jump-to-tab, Ctrl+K command palette, full keyboard control).
5. **Never loses your data** (every action goes to history, Ctrl+Z always works, real-time multi-window sync).
6. **Visualizes in ways neither competitor offers** (List + Grid + Compact + Mind-map bubbles + Tab Extend column mode, all toggleable).
7. **Earns trust through licensing** (Free + Pro + Team + Lifetime, with a real license manager, real support, real updater).

## Mission

> Make every tab in every browser instantly findable, beautifully organized, and effortlessly shareable — for one person or a whole team.

## North-star metric

**Weekly Active Re-opens** — number of times users re-open a saved item in a given week. This measures whether the tool is genuinely replacing browser bookmarks and tab clutter, not just collecting dust.

## Secondary metrics

- Average saved items per active user (depth of use).
- Share-link views per Pro account per month (collaboration value).
- Day-7 / Day-30 retention.
- Free → Pro conversion rate.
- Search-to-jump latency p95 (must be < 100 ms).

## Principles

1. **No artificial limits in paid tiers.** Unlimited workspaces, spaces, collections, groups, items, shares.
2. **Speed is a feature.** Every interaction under 100 ms perceived latency. Local-first cache, optimistic UI.
3. **Undo always works.** Every destructive action is reversible until the history window expires.
4. **Beautiful by default.** Design tokens, no ad-hoc styling, dark-first, accessible.
5. **Keyboard-first.** Anything that can be done with a mouse must be doable with a shortcut.
6. **Privacy by default.** Items are private until explicitly shared. Share links are unguessable by default.
7. **Open data.** First-class import from Toby, Tab Extend, Chrome bookmarks, JSON. First-class export to JSON, HTML, CSV.
8. **Honest pricing.** No dark patterns, no hidden caps, no "contact sales" walls for individuals.

## Non-goals (v1)

- ❌ Mobile native apps (iOS/Android). Web-responsive viewer for `/t/{slug}` only.
- ❌ Built-in browser (we are an extension, not a browser).
- ❌ Note-taking app (notes per Item/Collection are short, not a Notion replacement).
- ❌ AI summarization of pages (deferred to v2 — see `20-roadmap/phase-3-mindmap-ai.md`).
- ❌ Firefox / Safari support at v1 launch (Chrome-first, then Chromium siblings, then Firefox — see roadmap).

## Success looks like

- A solo developer migrates 2,000 Toby bookmarks in under 60 seconds and never looks back.
- A 10-person marketing team replaces a shared Google Doc of links with a single shared Space, with each member getting their own private Space alongside.
- A YouTuber publishes `letsmarknow.com/t/my-gear` with 40 affiliate links and an expiry date, password-protected for Patreon supporters.
- A user hits Ctrl+K, types three letters, hits Enter, and the tab they saved six months ago opens — every time.
