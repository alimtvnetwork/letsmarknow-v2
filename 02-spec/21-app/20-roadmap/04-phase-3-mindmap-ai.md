# Phase 3 — Mind-map + AI

**Duration**: 12 weeks after Phase 2 launch
**Audience**: Existing Pro + Team customers; appeals to researchers, designers, knowledge workers.
**Goal**: Differentiate beyond bookmark managers. Become the tool people show off.

---

## 1. Scope additions over Phase 2

### Mind-map view
- **Force-directed bubble graph** of Spaces, Collections, Groups, Tags (per `15-visualization/04-mindmap-view.md`).
- **Drill into nodes** to see items.
- **Drag to pin** node positions; layout persistence.
- **Lasso multi-select** with bulk actions.
- **Filter chips**: show/hide node types, color-by, min item count.
- **Saved layouts** as personal "mind-map views".
- **Export as PNG / SVG / JSON**.
- **WebGL renderer** for > 500 nodes.
- **Color-blind mode** with shape variants.

### AI features (opt-in per Org)
- **Auto-tagging suggestions** when saving an item.
- **Auto-summarize** long notes / page content into 1-3 sentences.
- **Smart Collections**: AI-generated suggested groupings.
- **Semantic search** alongside keyword (vectors + reranking).
- **"Find similar" item recommendations**.
- **Bulk dedupe assistant** for noisy imports.
- **Q&A over your saved content** ("What did I save about X?").

### AI infrastructure
- **Lovable AI Gateway** as default provider (no user API key needed).
- **Per-Org AI usage budget** + clear UI on consumption.
- **Token-cost-aware request batching**.
- **Embedding store** (pgvector or dedicated vector DB).
- **Re-embedding on content edit**, debounced.
- **Privacy mode**: AI features off entirely; no embeddings, no requests.

### View enhancements (non-AI)
- **Saved searches as smart Collections** in sidebar.
- **Bulk operations** with progress + undo.
- **Hover-to-jump** preview for items in mind-map and grid.
- **Keyboard navigation** improvements (vim-style across all views).

### Performance
- **Virtualization upgrades**: smoother at 50k+ items.
- **Local index improvements**: faster cold start for new devices.
- **Bundle size reduction**: target < 250 KB initial JS for web app.

## 2. Won't have (Phase 3)

- ❌ Mobile app (Phase 4).
- ❌ Cross-browser parity beyond Chrome (Phase 4).
- ❌ AI auto-actions without user approval (always suggest, never auto-execute).
- ❌ AI training on user data (explicit policy: never).

## 3. AI policy

- **Opt-in per Org**, default OFF.
- **Per-feature toggles**: tagging / summarize / search / Q&A.
- **No training on user data** — written guarantee + auditable provider contracts.
- **Data residency respected** for AI calls (EU calls stay EU).
- **AI usage logged** in audit log (Team+).
- **AI budget cap** with overage alerts.
- **Free tier**: limited AI quota (10 ops / month) as teaser.

## 4. Success criteria

| Metric | Target at end of Phase 3 |
|---|---|
| Mind-map weekly opens / WAU | ≥ 30% |
| AI features adoption / Pro+ users | ≥ 40% |
| Auto-tag accept rate | ≥ 60% |
| Semantic search CTR vs keyword | ≥ 1.2× |
| MRR | ≥ $80,000 |
| Pro retention month 6 | ≥ 70% |
| Mind-map render p95 (1k nodes) | ≤ 200 ms |
| AI op p95 latency | ≤ 2 s |

## 5. Tech infrastructure additions

- **Vector store** (pgvector for low scale; Qdrant / Weaviate at scale).
- **Embedding pipeline** with worker queue.
- **AI request gateway** (cost tracking, rate limit, fallback model).
- **Mind-map WebGL renderer** with web-worker physics.
- **Cost telemetry** dashboards.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| AI cost runaway | Per-Org budget + alerts; auto-pause at limit |
| AI accuracy disappointing | Feedback loops + per-feature kill switch + A/B against baseline |
| Privacy backlash | Explicit opt-in + per-Org toggle + clear policy + no training guarantee |
| Mind-map performance on huge graphs | Aggressive level-of-detail + super-node clustering |
| Vendor lock-in to one AI provider | Provider-abstract layer; multiple model swap-in |
| Mind-map perceived as gimmick | Onboarding tour shows real use cases; analytics-driven UX iteration |

## 7. Marketing

- Demo video showcasing mind-map.
- Blog series: "How researchers use the mind-map".
- AI launch post with privacy framing.
- Comparison page vs Notion AI / Pinboard.

## 8. Exit criteria → Phase 4

- Phase 3 success criteria met.
- AI infrastructure stable (< 1% op failure rate).
- Mind-map performance budget met at 5k nodes.
- Cross-browser + mobile scope finalized + reviewed.

## 9. Phase 3 deliverables checklist

- [ ] Mind-map view (full feature set)
- [ ] Saved layouts
- [ ] Mind-map export
- [ ] AI gateway integration
- [ ] Auto-tag suggestions
- [ ] Auto-summarize notes
- [ ] Semantic search
- [ ] Find similar items
- [ ] Q&A over saved content
- [ ] Bulk dedupe assistant
- [ ] Smart Collections (AI-suggested)
- [ ] AI budget UI + caps
- [ ] Privacy-mode toggle
- [ ] Vector store ops
- [ ] Embedding pipeline
- [ ] Saved-search smart Collections
- [ ] Mind-map onboarding tour
