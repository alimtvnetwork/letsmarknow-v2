import { AppError } from "../errors/AppError.js";
import { itemService } from "./itemService.js";
import { workspaceService } from "./workspaceService.js";
import { tagService } from "./tagService.js";
import { memRepo } from "../db/memRepo.js";
import { uuidv7 } from "../db/utils/uuidv7.js";

export interface ParsedSearchQuery {
  terms: string[];
  filters: {
    tag?: string[];
    inCollection?: string;
    inSpace?: string;
    isStarred?: boolean;
    domain?: string;
  };
}

export function parseSearchQuery(queryStr: string): ParsedSearchQuery {
  const parts = queryStr.trim().split(/\s+/);
  const terms: string[] = [];
  const filters: ParsedSearchQuery["filters"] = {};

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("tag:")) {
      const val = part.slice(4).trim();
      if (val) {
        if (!filters.tag) filters.tag = [];
        filters.tag.push(val);
      }
    } else if (part.startsWith("in:")) {
      filters.inCollection = part.slice(3).trim();
    } else if (part.startsWith("space:")) {
      filters.inSpace = part.slice(6).trim();
    } else if (part === "is:starred") {
      filters.isStarred = true;
    } else if (part.startsWith("domain:")) {
      filters.domain = part.slice(7).trim().toLowerCase();
    } else {
      // Remove enclosing quotes if any
      const cleaned = part.replace(/^"|"$/g, "");
      if (cleaned) {
        terms.push(cleaned);
      }
    }
  }

  return { terms, filters };
}

function applyHighlight(text: string, terms: string[]): string {
  let highlighted = text;
  for (const term of terms) {
    if (!term) continue;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    highlighted = highlighted.replace(regex, "<em>$1</em>");
  }
  return highlighted;
}

export class SearchService {
  public async searchGlobal(
    orgId: string,
    accountId: string,
    input: {
      q: string;
      types?: string[];
      limit?: number;
      highlight?: boolean;
    }
  ) {
    const startTime = Date.now();
    const rawQ = input.q?.trim();
    if (!rawQ || rawQ.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Search query 'q' is required.",
        details: { field: "q" },
      });
    }

    if (rawQ.length > 200) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Search query must not exceed 200 characters.",
        details: { field: "q" },
      });
    }

    const parsed = parseSearchQuery(rawQ);
    const limit = Math.min(input.limit || 25, 100);
    const shouldHighlight = input.highlight !== false;
    const types = input.types || ["item", "collection", "group", "tag"];

    const results: Array<Record<string, unknown>> = [];

    // 1. Search Collections
    if (types.includes("collection") && !parsed.filters.domain && !parsed.filters.tag) {
      const collections = await workspaceService.listCollections(orgId);
      for (const col of collections) {
        if (parsed.filters.isStarred !== undefined && col.is_starred !== parsed.filters.isStarred) {
          continue;
        }
        if (parsed.filters.inSpace && col.space_id !== parsed.filters.inSpace) {
          continue;
        }
        if (parsed.filters.inCollection) {
          const match =
            col.id === parsed.filters.inCollection ||
            col.name.toLowerCase() === parsed.filters.inCollection.toLowerCase() ||
            col.slug?.toLowerCase() === parsed.filters.inCollection.toLowerCase();
          if (!match) continue;
        }

        let score = 0;
        const nameLower = col.name.toLowerCase();
        const descLower = (col.description || "").toLowerCase();

        for (const term of parsed.terms) {
          const tLower = term.toLowerCase();
          if (nameLower === tLower) score += 1.0;
          else if (nameLower.startsWith(tLower)) score += 0.8;
          else if (nameLower.includes(tLower)) score += 0.6;
          else if (descLower.includes(tLower)) score += 0.3;
        }

        if (parsed.terms.length === 0 && (parsed.filters.inSpace || parsed.filters.inCollection || parsed.filters.isStarred !== undefined)) {
          score = 0.5;
        }

        if (score > 0) {
          results.push({
            type: "collection",
            id: col.id,
            name: col.name,
            color: col.color,
            item_count_cache: col.item_count_cache || 0,
            score: Math.min(parseFloat(score.toFixed(2)), 1.0),
            highlight: shouldHighlight
              ? { name: applyHighlight(col.name, parsed.terms) }
              : undefined,
          });
        }
      }
    }

    // 2. Search Items
    if (types.includes("item")) {
      const allItems = await itemService.listItems(orgId, {
        isStarred: parsed.filters.isStarred,
        includeGroups: true,
      });

      const allCollections = await workspaceService.listCollections(orgId);
      const collectionMap = new Map(allCollections.map((c) => [c.id, c]));
      const allTags = await tagService.listTags(orgId);
      const tagMap = new Map(allTags.map((t) => [t.id, t]));

      for (const it of allItems) {
        // Apply domain filter
        if (parsed.filters.domain && it.domain.toLowerCase() !== parsed.filters.domain) {
          continue;
        }

        // Apply inCollection filter
        if (parsed.filters.inCollection) {
          const parentCol = collectionMap.get(it.collection_id);
          const matches =
            it.collection_id === parsed.filters.inCollection ||
            parentCol?.name.toLowerCase() === parsed.filters.inCollection.toLowerCase() ||
            parentCol?.slug?.toLowerCase() === parsed.filters.inCollection.toLowerCase();
          if (!matches) continue;
        }

        // Apply inSpace filter
        if (parsed.filters.inSpace && it.space_id !== parsed.filters.inSpace) {
          continue;
        }

        // Apply tag filter
        if (parsed.filters.tag && parsed.filters.tag.length > 0) {
          const itemTagNames = it.tag_ids
            .map((tid) => tagMap.get(tid)?.name.toLowerCase())
            .filter(Boolean);
          const hasAllTags = parsed.filters.tag.every((reqTag) =>
            itemTagNames.includes(reqTag.toLowerCase())
          );
          if (!hasAllTags) continue;
        }

        let score = 0;
        const titleLower = it.title.toLowerCase();
        const urlLower = it.url.toLowerCase();
        const descLower = (it.description || "").toLowerCase();

        for (const term of parsed.terms) {
          const tLower = term.toLowerCase();
          if (titleLower === tLower) score += 1.0;
          else if (titleLower.startsWith(tLower)) score += 0.85;
          else if (titleLower.includes(tLower)) score += 0.65;
          else if (urlLower.includes(tLower)) score += 0.5;
          else if (descLower.includes(tLower)) score += 0.3;
        }

        if (parsed.terms.length === 0) {
          score = 0.5;
        }

        if (score > 0) {
          const parentCol = collectionMap.get(it.collection_id);
          const attachedTags = it.tag_ids
            .map((tid) => tagMap.get(tid))
            .filter(Boolean)
            .map((t) => ({ id: t!.id, name: t!.name, color: t!.color }));

          results.push({
            type: "item",
            id: it.id,
            title: it.title,
            url: it.url,
            favicon_url: it.favicon_url,
            collection: parentCol
              ? { id: parentCol.id, name: parentCol.name, color: parentCol.color }
              : null,
            group: null,
            tags: attachedTags,
            score: Math.min(parseFloat(score.toFixed(2)), 1.0),
            highlight: shouldHighlight
              ? {
                  title: applyHighlight(it.title, parsed.terms),
                  url: applyHighlight(it.url, parsed.terms),
                }
              : undefined,
          });
        }
      }
    }

    // 3. Search Tags
    if (types.includes("tag") && !parsed.filters.domain && !parsed.filters.inCollection && !parsed.filters.inSpace && parsed.filters.isStarred === undefined) {
      const tags = await tagService.listTags(orgId);
      for (const t of tags) {
        let score = 0;
        const nameLower = t.name.toLowerCase();

        for (const term of parsed.terms) {
          const tLower = term.toLowerCase();
          if (nameLower === tLower) score += 1.0;
          else if (nameLower.startsWith(tLower)) score += 0.8;
          else if (nameLower.includes(tLower)) score += 0.6;
        }

        if (score > 0) {
          results.push({
            type: "tag",
            id: t.id,
            name: t.name,
            color: t.color,
            usage_count: t.usage_count,
            score: Math.min(parseFloat(score.toFixed(2)), 1.0),
            highlight: shouldHighlight
              ? { name: applyHighlight(t.name, parsed.terms) }
              : undefined,
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));

    // Save recent search entry
    this.recordRecentSearch(orgId, accountId, rawQ, results.length);

    const tookMs = Date.now() - startTime;

    return {
      data: results.slice(0, limit),
      page: { next_cursor: null, has_more: false, limit },
      meta: {
        took_ms: tookMs,
        parsed_query: parsed,
      },
    };
  }

  public async searchQuick(
    orgId: string,
    queryStr: string,
    limit = 10
  ) {
    const rawQ = queryStr.trim().toLowerCase();
    if (!rawQ) return [];

    const items = await itemService.listItems(orgId, { includeGroups: true });
    const collections = await workspaceService.listCollections(orgId);
    const colMap = new Map(collections.map((c) => [c.id, c.name]));

    const scoredItems: Array<{
      id: string;
      title: string;
      url: string;
      favicon_url: string | null;
      collection_name: string;
      score: number;
    }> = [];

    for (const it of items) {
      let score = 0;
      const titleLower = it.title.toLowerCase();
      const urlLower = it.url.toLowerCase();
      const colName = colMap.get(it.collection_id) || "";

      if (titleLower === rawQ) score = 1.0;
      else if (titleLower.startsWith(rawQ)) score = 0.9;
      else if (titleLower.includes(rawQ)) score = 0.7;
      else if (urlLower.includes(rawQ)) score = 0.5;
      else if (colName.toLowerCase().includes(rawQ)) score = 0.4;

      if (score > 0) {
        scoredItems.push({
          id: it.id,
          title: it.title,
          url: it.url,
          favicon_url: it.favicon_url,
          collection_name: colName,
          score: Math.min(parseFloat(score.toFixed(2)), 1.0),
        });
      }
    }

    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.slice(0, Math.min(limit, 20));
  }

  public async suggest(orgId: string, q: string, limit = 8) {
    const cleanQ = q.trim().toLowerCase();
    if (!cleanQ) {
      return { queries: [], tags: [], collections: [], domains: [] };
    }

    const [tags, collections, items] = await Promise.all([
      tagService.listTags(orgId, { q: cleanQ, limit }),
      workspaceService.listCollections(orgId),
      itemService.listItems(orgId, { q: cleanQ }),
    ]);

    const matchingCollections = collections
      .filter((c) => c.name.toLowerCase().includes(cleanQ))
      .slice(0, limit)
      .map((c) => ({ id: c.id, name: c.name }));

    const matchingDomains = Array.from(
      new Set(
        items
          .filter((it) => it.domain.toLowerCase().includes(cleanQ))
          .map((it) => it.domain)
      )
    ).slice(0, limit);

    return {
      queries: [cleanQ],
      tags: tags.map((t) => ({ id: t.id, name: t.name })),
      collections: matchingCollections,
      domains: matchingDomains,
    };
  }

  public recordRecentSearch(
    orgId: string,
    accountId: string,
    query: string,
    resultsCount: number
  ) {
    const existingIndex = memRepo.recentSearches.findIndex(
      (r) => r.organizationId === orgId && r.accountId === accountId && r.query === query
    );

    const entry = {
      id: uuidv7(),
      accountId,
      organizationId: orgId,
      query,
      resultsCount,
      lastUsedAt: new Date(),
    };

    if (existingIndex >= 0) {
      memRepo.recentSearches.splice(existingIndex, 1);
    }
    memRepo.recentSearches.unshift(entry);

    // Keep max 50 recent searches
    if (memRepo.recentSearches.length > 50) {
      memRepo.recentSearches.pop();
    }
  }

  public listRecentSearches(orgId: string, accountId: string) {
    return memRepo.recentSearches
      .filter((r) => r.organizationId === orgId && r.accountId === accountId)
      .slice(0, 20)
      .map((r) => ({
        q: r.query,
        last_used_at: r.lastUsedAt.toISOString(),
        results_count: r.resultsCount,
      }));
  }

  public deleteRecentSearches(orgId: string, accountId: string, q?: string) {
    if (q) {
      memRepo.recentSearches = memRepo.recentSearches.filter(
        (r) => !(r.organizationId === orgId && r.accountId === accountId && r.query === q)
      );
    } else {
      memRepo.recentSearches = memRepo.recentSearches.filter(
        (r) => !(r.organizationId === orgId && r.accountId === accountId)
      );
    }
  }
}

export const searchService = new SearchService();
