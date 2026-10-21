import { createHash, randomBytes } from "node:crypto";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemImportJob, type MemExportJob, type MemItem } from "../db/memRepo.js";
import { workspaceService } from "./workspaceService.js";
import { itemService } from "./itemService.js";
import { tagService } from "./tagService.js";

export interface ParsedItem {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  starred?: boolean;
  spaceName?: string;
  collectionName: string;
  groupName?: string;
  createdAt?: string;
  favicon?: string;
}

export interface ParseResult {
  source: string;
  items: ParsedItem[];
  totals: {
    spaces: number;
    collections: number;
    groups: number;
    items: number;
    tags: number;
  };
  duplicates: {
    by_url_in_org: number;
    by_url_in_destination: number;
    by_canonical_url: number;
  };
  warnings: Array<{ code: string; count: number; samples?: string[] }>;
  tree: Array<{
    kind: string;
    name: string;
    items: number;
    groups: number;
    sample_items?: Array<{ title: string; url: string }>;
  }>;
}

export function normalizeUrl(urlStr: string): string {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return "";
    const u = new URL(trimmed);
    const protocol = u.protocol.toLowerCase();
    const hostname = u.hostname.toLowerCase();
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    const trackingParams = new Set([
      "ref",
      "ref_src",
      "mc_cid",
      "mc_eid",
      "_ga",
      "igshid",
      "yclid",
      "mkt_tok",
      "fbclid",
      "gclid",
    ]);
    const cleanParams: [string, string][] = [];
    u.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.startsWith("utm_") && !trackingParams.has(lowerKey)) {
        cleanParams.push([key, val]);
      }
    });
    cleanParams.sort((a, b) => a[0].localeCompare(b[0]));
    const search =
      cleanParams.length > 0
        ? "?" +
          cleanParams
            .map(
              ([k, v]) =>
                `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
            )
            .join("&")
        : "";
    let host = hostname;
    if (
      u.port &&
      ((protocol === "http:" && u.port !== "80") ||
        (protocol === "https:" && u.port !== "443"))
    ) {
      host = `${hostname}:${u.port}`;
    }
    return `${protocol}//${host}${pathname}${search}`;
  } catch {
    return urlStr.trim().toLowerCase();
  }
}

export function calculateSha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function detectFormat(content: string, filename?: string): string {
  const trimmed = content.trim();
  if (filename) {
    const ext = filename.toLowerCase().split(".").pop();
    if (ext === "html" || ext === "htm") return "bookmarks_html";
    if (ext === "csv") return "csv_flat";
  }
  if (
    trimmed.startsWith("<!DOCTYPE NETSCAPE") ||
    trimmed.includes("<NETSCAPE-Bookmark") ||
    (trimmed.includes("<DL>") && trimmed.includes("<DT>")) ||
    trimmed.includes("<H3") ||
    trimmed.includes("<A HREF")
  ) {
    return "bookmarks_html";
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed.schema_version ||
        parsed.schemaVersion ||
        (parsed.spaces && parsed.organization)
      ) {
        return "lmn_native_json";
      }
      if (parsed.list && typeof parsed.list === "object") {
        return "pocket_csv";
      }
      if (
        parsed.lists ||
        (Array.isArray(parsed) && parsed[0]?.cards) ||
        (Array.isArray(parsed) && parsed[0]?.title && parsed[0]?.tabs)
      ) {
        return "toby_json";
      }
      return "lmn_native_json";
    } catch {
      // not valid json
    }
  }
  if (
    trimmed.startsWith("url,") ||
    trimmed.startsWith("URL,") ||
    trimmed.startsWith('"url"') ||
    trimmed.includes(",title,") ||
    trimmed.includes(",folder,")
  ) {
    return "csv_flat";
  }
  return "bookmarks_html";
}

// =================== PARSERS ===================

function parseNetscapeBookmarks(html: string): { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> } {
  const items: ParsedItem[] = [];
  const warnings: Record<string, { count: number; samples: string[] }> = {
    MISSING_URL: { count: 0, samples: [] },
    INVALID_URL: { count: 0, samples: [] },
    URL_TOO_LONG: { count: 0, samples: [] },
    DUPLICATE_IN_FILE: { count: 0, samples: [] },
    MISSING_FAVICON: { count: 0, samples: [] },
  };

  const seenUrls = new Set<string>();

  // Regex tokens to walk through tags
  const tokenRegex = /<(H3|A|DD|DL|\/DL)[^>]*>([\s\S]*?)(?=<(?:H3|A|DD|DL|\/DL)|$)/gi;
  let match: RegExpExecArray | null;

  const folderStack: string[] = [];
  let lastItem: ParsedItem | null = null;

  // Simple tag-by-tag match
  const tagRegex = /<(\/?[a-z0-9]+)([^>]*)>([^<]*)/gi;
  let currentCollection = "Imported Bookmarks";
  let currentGroup: string | undefined = undefined;

  // Let's use line-by-line / tag scanner
  const lines = html.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check folder open <H3 ...>Title</H3>
    const h3Match = trimmed.match(/<H3[^>]*>([\s\S]*?)<\/H3>/i);
    if (h3Match) {
      const folderName = h3Match[1].replace(/<[^>]+>/g, "").trim() || "Untitled Folder";
      folderStack.push(folderName);
      if (folderStack.length === 1) {
        currentCollection = folderStack[0];
        currentGroup = undefined;
      } else if (folderStack.length >= 2) {
        currentCollection = folderStack[0];
        currentGroup = folderStack[folderStack.length - 1];
      }
      continue;
    }

    // Check folder close </DL>
    if (trimmed.includes("</DL>") || trimmed.includes("</dl>")) {
      if (folderStack.length > 0) {
        folderStack.pop();
        if (folderStack.length === 0) {
          currentCollection = "Imported Bookmarks";
          currentGroup = undefined;
        } else if (folderStack.length === 1) {
          currentCollection = folderStack[0];
          currentGroup = undefined;
        } else {
          currentGroup = folderStack[folderStack.length - 1];
        }
      }
      continue;
    }

    // Check Link <A HREF="..." ...>Title</A>
    const aMatch = trimmed.match(/<A\s+([^>]*?)>([\s\S]*?)<\/A>/i);
    if (aMatch) {
      const attrs = aMatch[1];
      const title = aMatch[2].replace(/<[^>]+>/g, "").trim();

      const hrefMatch = attrs.match(/HREF=["']([^"']*)["']/i);
      const url = hrefMatch ? hrefMatch[1].trim() : "";

      if (!url) {
        warnings.MISSING_URL.count++;
        continue;
      }

      if (url.startsWith("javascript:") || url.startsWith("data:text/html")) {
        warnings.INVALID_URL.count++;
        if (warnings.INVALID_URL.samples.length < 3) warnings.INVALID_URL.samples.push(url);
        continue;
      }

      if (url.length > 4096) {
        warnings.URL_TOO_LONG.count++;
        continue;
      }

      const normalized = normalizeUrl(url);
      if (seenUrls.has(normalized)) {
        warnings.DUPLICATE_IN_FILE.count++;
      } else {
        seenUrls.add(normalized);
      }

      const addDateMatch = attrs.match(/ADD_DATE=["'](\d+)["']/i);
      let createdAt: string | undefined = undefined;
      if (addDateMatch) {
        const sec = parseInt(addDateMatch[1], 10);
        if (!isNaN(sec) && sec > 0) {
          createdAt = new Date(sec * 1000).toISOString();
        }
      }

      const iconMatch = attrs.match(/ICON(?:_URI)?=["']([^"']*)["']/i);
      const favicon = iconMatch ? iconMatch[1] : undefined;
      if (!favicon) {
        warnings.MISSING_FAVICON.count++;
      }

      const item: ParsedItem = {
        url,
        title: title || url,
        collectionName: currentCollection,
        groupName: currentGroup,
        favicon,
        createdAt,
      };

      items.push(item);
      lastItem = item;
      continue;
    }

    // Check Description <DD>Description
    const ddMatch = trimmed.match(/<DD>([\s\S]*)/i);
    if (ddMatch && lastItem) {
      const desc = ddMatch[1].replace(/<[^>]+>/g, "").trim();
      if (desc) {
        lastItem.description = desc;
      }
    }
  }

  return { items, warnings };
}

function parseLmnJson(jsonStr: string): { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> } {
  const items: ParsedItem[] = [];
  const warnings: Record<string, { count: number; samples: string[] }> = {
    MISSING_URL: { count: 0, samples: [] },
    INVALID_URL: { count: 0, samples: [] },
    URL_TOO_LONG: { count: 0, samples: [] },
    DUPLICATE_IN_FILE: { count: 0, samples: [] },
    MISSING_FAVICON: { count: 0, samples: [] },
  };
  const seenUrls = new Set<string>();

  const data = JSON.parse(jsonStr);
  const spaces = Array.isArray(data.spaces) ? data.spaces : [];

  for (const space of spaces) {
    const spaceName = space.name || "Default Space";
    const collections = Array.isArray(space.collections) ? space.collections : [];
    for (const col of collections) {
      const colName = col.name || "Default Collection";
      const groupMap = new Map<string, string>();
      if (Array.isArray(col.groups)) {
        for (const g of col.groups) {
          if (Array.isArray(g.items)) {
            for (const itemId of g.items) {
              groupMap.set(itemId, g.name);
            }
          }
        }
      }

      const colItems = Array.isArray(col.items) ? col.items : [];
      for (const raw of colItems) {
        const url = raw.url?.trim();
        if (!url) {
          warnings.MISSING_URL.count++;
          continue;
        }
        if (url.startsWith("javascript:")) {
          warnings.INVALID_URL.count++;
          if (warnings.INVALID_URL.samples.length < 3) warnings.INVALID_URL.samples.push(url);
          continue;
        }
        if (url.length > 4096) {
          warnings.URL_TOO_LONG.count++;
          continue;
        }

        const normalized = normalizeUrl(url);
        if (seenUrls.has(normalized)) {
          warnings.DUPLICATE_IN_FILE.count++;
        } else {
          seenUrls.add(normalized);
        }

        if (!raw.favicon) {
          warnings.MISSING_FAVICON.count++;
        }

        const groupName = raw.groupId ? groupMap.get(raw.groupId) : (raw.id ? groupMap.get(raw.id) : undefined);

        items.push({
          url,
          title: raw.title || url,
          description: raw.description,
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          starred: Boolean(raw.starred || raw.isStarred),
          spaceName,
          collectionName: colName,
          groupName,
          createdAt: raw.createdAt || raw.created_at,
          favicon: raw.favicon || raw.faviconUrl,
        });
      }
    }
  }

  // If no spaces structure, check if top-level items array exists
  if (items.length === 0 && Array.isArray(data.items)) {
    for (const raw of data.items) {
      const url = raw.url?.trim();
      if (!url) continue;
      items.push({
        url,
        title: raw.title || url,
        description: raw.description,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        starred: Boolean(raw.starred),
        collectionName: raw.collectionName || raw.collection || "Imported Items",
        groupName: raw.groupName || raw.group,
      });
    }
  }

  return { items, warnings };
}

function parseTobyJson(jsonStr: string): { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> } {
  const items: ParsedItem[] = [];
  const warnings: Record<string, { count: number; samples: string[] }> = {
    MISSING_URL: { count: 0, samples: [] },
    INVALID_URL: { count: 0, samples: [] },
    URL_TOO_LONG: { count: 0, samples: [] },
    DUPLICATE_IN_FILE: { count: 0, samples: [] },
    MISSING_FAVICON: { count: 0, samples: [] },
  };
  const seenUrls = new Set<string>();

  const data = JSON.parse(jsonStr);
  const lists: Array<{ title: string; cards?: Array<{ title?: string; url?: string; description?: string }> }> = [];

  if (Array.isArray(data.lists)) {
    lists.push(...data.lists);
  } else if (Array.isArray(data)) {
    for (const entry of data) {
      if (entry.cards || entry.tabs) {
        lists.push({ title: entry.title || "Toby List", cards: entry.cards || entry.tabs });
      }
    }
  } else if (typeof data === "object") {
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === "object" && (val.cards || val.tabs)) {
        lists.push({ title: val.title || key, cards: val.cards || val.tabs });
      }
    }
  }

  for (const list of lists) {
    const colName = list.title || "Toby Collection";
    const cards = list.cards || [];
    for (const card of cards) {
      const url = (card.url || "").trim();
      if (!url) {
        warnings.MISSING_URL.count++;
        continue;
      }
      if (url.startsWith("javascript:")) {
        warnings.INVALID_URL.count++;
        continue;
      }
      const normalized = normalizeUrl(url);
      if (seenUrls.has(normalized)) {
        warnings.DUPLICATE_IN_FILE.count++;
      } else {
        seenUrls.add(normalized);
      }

      items.push({
        url,
        title: card.title || url,
        description: card.description,
        collectionName: colName,
        tags: [],
      });
    }
  }

  return { items, warnings };
}

function parsePocket(content: string): { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> } {
  const items: ParsedItem[] = [];
  const warnings: Record<string, { count: number; samples: string[] }> = {
    MISSING_URL: { count: 0, samples: [] },
    INVALID_URL: { count: 0, samples: [] },
    URL_TOO_LONG: { count: 0, samples: [] },
    DUPLICATE_IN_FILE: { count: 0, samples: [] },
    MISSING_FAVICON: { count: 0, samples: [] },
  };

  try {
    const data = JSON.parse(content);
    const list = data.list || data;
    for (const k of Object.keys(list)) {
      const entry = list[k];
      const url = entry.resolved_url || entry.given_url || entry.url;
      if (!url) {
        warnings.MISSING_URL.count++;
        continue;
      }
      const tags: string[] = [];
      if (entry.tags && typeof entry.tags === "object") {
        tags.push(...Object.keys(entry.tags));
      }
      items.push({
        url,
        title: entry.given_title || entry.resolved_title || url,
        description: entry.excerpt,
        tags,
        starred: entry.favorite === "1" || entry.favorite === 1 || entry.favorite === true,
        collectionName: entry.time_read ? "Archive" : "Read Later",
      });
    }
  } catch {
    // If pocket export is HTML, delegate to Netscape parser
    return parseNetscapeBookmarks(content);
  }

  return { items, warnings };
}

function parseCsv(csvStr: string): { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> } {
  const items: ParsedItem[] = [];
  const warnings: Record<string, { count: number; samples: string[] }> = {
    MISSING_URL: { count: 0, samples: [] },
    INVALID_URL: { count: 0, samples: [] },
    URL_TOO_LONG: { count: 0, samples: [] },
    DUPLICATE_IN_FILE: { count: 0, samples: [] },
    MISSING_FAVICON: { count: 0, samples: [] },
  };
  const seenUrls = new Set<string>();

  // Parse lines considering quotes
  const parseCsvLines = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (insideQuotes && next === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (ch === "," && !insideQuotes) {
        currentRow.push(currentCell);
        currentCell = "";
      } else if ((ch === "\r" || ch === "\n") && !insideQuotes) {
        if (ch === "\r" && next === "\n") i++;
        currentRow.push(currentCell);
        currentCell = "";
        if (currentRow.length > 0 && currentRow.some((c) => c.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += ch;
      }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    return rows;
  };

  const rows = parseCsvLines(csvStr);
  if (rows.length < 2) return { items, warnings };

  const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/^["']|["']$/g, ""));
  const urlIdx = headers.findIndex((h) => h === "url" || h === "link" || h === "href");
  const titleIdx = headers.findIndex((h) => h === "title" || h === "name");
  const descIdx = headers.findIndex((h) => h === "description" || h === "note" || h === "excerpt" || h === "selection");
  const tagsIdx = headers.findIndex((h) => h === "tags" || h === "tag");
  const pathIdx = headers.findIndex((h) => h === "collection_path" || h === "folder" || h === "collection");
  const dateIdx = headers.findIndex((h) => h === "created_at" || h === "created" || h === "timestamp" || h === "added at");
  const starIdx = headers.findIndex((h) => h === "starred" || h === "favorite");

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const url = (urlIdx !== -1 ? row[urlIdx] : "").trim();
    if (!url) {
      warnings.MISSING_URL.count++;
      continue;
    }
    if (url.startsWith("javascript:")) {
      warnings.INVALID_URL.count++;
      continue;
    }
    const normalized = normalizeUrl(url);
    if (seenUrls.has(normalized)) {
      warnings.DUPLICATE_IN_FILE.count++;
    } else {
      seenUrls.add(normalized);
    }

    const title = (titleIdx !== -1 ? row[titleIdx] : "").trim() || url;
    const description = descIdx !== -1 ? row[descIdx]?.trim() : undefined;
    const rawTags = tagsIdx !== -1 ? row[tagsIdx]?.trim() : "";
    const tags = rawTags
      ? rawTags
          .split(/[;,]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    let collectionName = "Imported Bookmarks";
    let groupName: string | undefined = undefined;
    let spaceName: string | undefined = undefined;

    if (pathIdx !== -1 && row[pathIdx]) {
      const parts = row[pathIdx].split("/").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        collectionName = parts[0];
      } else if (parts.length === 2) {
        collectionName = parts[0];
        groupName = parts[1];
      } else if (parts.length >= 3) {
        spaceName = parts[0];
        collectionName = parts[1];
        groupName = parts[2];
      }
    }

    const createdAt = dateIdx !== -1 ? row[dateIdx]?.trim() : undefined;
    const starred = starIdx !== -1 ? row[starIdx]?.trim().toLowerCase() === "true" || row[starIdx]?.trim() === "1" : false;

    items.push({
      url,
      title,
      description,
      tags,
      starred,
      spaceName,
      collectionName,
      groupName,
      createdAt,
    });
  }

  return { items, warnings };
}

// =================== SERVICE ===================

export class ImportExportService {
  /**
   * Starts a two-phase import job (POST /v1/imports)
   */
  public async createImportJob(
    orgId: string,
    accountId: string,
    params: {
      source: string;
      destination?: {
        kind: "new_space" | "existing_space" | "existing_collection";
        space_name?: string;
        space_id?: string;
        collection_id?: string;
        collection_strategy?: string;
      };
      options?: {
        dedupe_urls?: boolean;
        on_duplicate?: "skip" | "overwrite" | "create_new" | "merge_tags" | "merge_by_url" | "skip_duplicates" | "keep_both";
        tag_prefix?: string;
        preserve_dates?: boolean;
        convert_groups?: boolean;
      };
      upload?: {
        filename?: string;
        size_bytes?: number;
        mime?: string;
        sha256?: string;
      };
    }
  ): Promise<MemImportJob> {
    const importId = uuidv7();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const job: MemImportJob = {
      id: importId,
      organizationId: orgId,
      accountId,
      source: params.source,
      status: "awaiting_upload",
      phase: "parsing",
      filename: params.upload?.filename,
      sizeBytes: params.upload?.size_bytes,
      sha256: params.upload?.sha256,
      destination: params.destination,
      options: params.options,
      progress: { processed: 0, total: 0, percent: 0 },
      uploadUrl: `/v1/imports/${importId}/put`,
      uploadExpiresAt: expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    memRepo.imports.unshift(job);
    return job;
  }

  /**
   * One-shot or direct file upload parsing (POST /v1/imports/upload or direct PUT)
   */
  public async processImportContent(
    jobId: string,
    content: string,
    filename?: string,
    sourceOverride?: string
  ): Promise<MemImportJob> {
    const job = memRepo.imports.find((j) => j.id === jobId);
    if (!job) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Import job not found",
      });
    }

    const sha256 = calculateSha256(content);
    const sizeBytes = Buffer.byteLength(content, "utf8");
    const source = sourceOverride || job.source || detectFormat(content, filename || job.filename);

    job.status = "running";
    job.phase = "parsing";
    job.source = source;
    job.sizeBytes = sizeBytes;
    job.sha256 = sha256;
    job.content = content;
    job.updatedAt = new Date();

    // Parse according to detected format
    let parseResult: { items: ParsedItem[]; warnings: Record<string, { count: number; samples: string[] }> };

    if (source === "lmn_native" || source === "lmn_native_json") {
      parseResult = parseLmnJson(content);
    } else if (source === "toby_json" || source === "toby") {
      parseResult = parseTobyJson(content);
    } else if (source === "pocket_csv" || source === "pocket") {
      parseResult = parsePocket(content);
    } else if (source === "csv_flat" || source === "instapaper_csv" || source === "raindrop_csv") {
      parseResult = parseCsv(content);
    } else {
      parseResult = parseNetscapeBookmarks(content);
    }

    const { items, warnings } = parseResult;

    // Check duplicates against current organization items
    const existingItems = await itemService.listItems(job.organizationId, { includeDeleted: false });
    const existingUrlSet = new Set(existingItems.map((i) => normalizeUrl(i.url)));

    let dupInOrg = 0;
    for (const item of items) {
      if (existingUrlSet.has(normalizeUrl(item.url))) {
        dupInOrg++;
      }
    }

    // Build hierarchical tree preview
    const collectionMap = new Map<string, { name: string; items: number; groups: Set<string>; samples: Array<{ title: string; url: string }> }>();
    const spacesSet = new Set<string>();
    const tagsSet = new Set<string>();

    for (const it of items) {
      if (it.spaceName) spacesSet.add(it.spaceName);
      if (it.tags) it.tags.forEach((t) => tagsSet.add(t));

      const colName = it.collectionName || "Default";
      if (!collectionMap.has(colName)) {
        collectionMap.set(colName, { name: colName, items: 0, groups: new Set<string>(), samples: [] });
      }
      const entry = collectionMap.get(colName)!;
      entry.items++;
      if (it.groupName) entry.groups.add(it.groupName);
      if (entry.samples.length < 5) {
        entry.samples.push({ title: it.title, url: it.url });
      }
    }

    let totalGroups = 0;
    const tree = Array.from(collectionMap.values()).map((c) => {
      totalGroups += c.groups.size;
      return {
        kind: "collection",
        name: c.name,
        items: c.items,
        groups: c.groups.size,
        sample_items: c.samples,
      };
    });

    const warningList = Object.entries(warnings)
      .filter(([_, w]) => w.count > 0)
      .map(([code, w]) => ({
        code,
        count: w.count,
        samples: w.samples.length > 0 ? w.samples : undefined,
      }));

    job.parsedSummary = {
      totals: {
        spaces: spacesSet.size > 0 ? spacesSet.size : 1,
        collections: collectionMap.size,
        groups: totalGroups,
        items: items.length,
        tags: tagsSet.size,
      },
      duplicates: {
        by_url_in_org: dupInOrg,
        by_url_in_destination: dupInOrg,
        by_canonical_url: dupInOrg,
      },
      warnings: warningList,
      tree,
      items,
    };

    job.status = "queued";
    job.phase = "awaiting_commit";
    job.progress = {
      processed: items.length,
      total: items.length,
      percent: 100,
    };
    job.previewExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    job.updatedAt = new Date();

    return job;
  }

  /**
   * Commit a previewed import (POST /v1/imports/:id/commit)
   */
  public async commitImport(
    importId: string,
    orgId: string,
    accountId: string,
    params: {
      options?: {
        dedupe_urls?: boolean;
        on_duplicate?: "skip" | "overwrite" | "create_new" | "merge_tags" | "merge_by_url" | "skip_duplicates" | "keep_both";
        tag_prefix?: string;
        preserve_dates?: boolean;
        convert_groups?: boolean;
      };
      destination?: {
        kind: "new_space" | "existing_space" | "existing_collection";
        space_name?: string;
        space_id?: string;
        collection_id?: string;
      };
    } = {}
  ): Promise<MemImportJob> {
    const job = memRepo.imports.find((j) => j.id === importId && j.organizationId === orgId);
    if (!job) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Import not found",
      });
    }

    if (job.status === "succeeded") {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Import already committed",
      });
    }
    if (job.status === "canceled") {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "Import has been canceled",
      });
    }
    if (!job.parsedSummary || !job.parsedSummary.items) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "Import preview missing or expired",
      });
    }

    const options = { ...job.options, ...params.options };
    const destination = { ...job.destination, ...params.destination };

    const dedupeUrls = options.dedupe_urls !== false;
    const onDuplicate = options.on_duplicate || "skip";
    const tagPrefix = options.tag_prefix || "";

    job.status = "running";
    job.phase = "writing_spaces";
    job.updatedAt = new Date();

    let targetSpaceId: string | undefined;
    let targetCollectionId: string | undefined;

    // Resolve Destination Space / Collection
    if (destination.kind === "existing_collection" && destination.collection_id) {
      const col = await workspaceService.getCollection(orgId, destination.collection_id);
      targetCollectionId = col.id;
      targetSpaceId = col.space_id || undefined;
    } else if (destination.kind === "existing_space" && destination.space_id) {
      const sp = await workspaceService.getSpace(orgId, destination.space_id);
      targetSpaceId = sp.id;
    } else {
      // Create new space
      const spaceName = destination.space_name || `Imported ${job.source || "Bookmarks"}`;
      const newSpace = await workspaceService.createSpace(orgId, accountId, {
        name: spaceName,
        description: `Imported from ${job.source} on ${new Date().toLocaleDateString()}`,
      });
      targetSpaceId = newSpace.id;
    }

    // Cache of existing spaces/collections/groups to avoid duplicates
    const createdCollections = new Map<string, string>(); // name -> id
    const createdGroups = new Map<string, string>(); // colId:groupName -> id

    // Existing items for dedup
    const existingItems = await itemService.listItems(orgId, { includeDeleted: false });
    const existingMap = new Map<string, (typeof existingItems)[0]>();
    for (const ex of existingItems) {
      existingMap.set(normalizeUrl(ex.url), ex);
    }

    let itemsCreated = 0;
    let itemsSkipped = 0;
    let tagsCreated = 0;
    let groupsCreated = 0;
    let collectionsCreated = 0;
    let spacesCreated = destination.kind === "new_space" ? 1 : 0;

    const itemsToProcess = job.parsedSummary.items;
    job.phase = "writing_collections";

    for (let i = 0; i < itemsToProcess.length; i++) {
      const it = itemsToProcess[i];
      const normalizedUrl = normalizeUrl(it.url);
      const existing = existingMap.get(normalizedUrl);

      // Handle duplicate
      if (existing && dedupeUrls) {
        if (onDuplicate === "skip" || onDuplicate === "skip_duplicates") {
          itemsSkipped++;
          continue;
        } else if (onDuplicate === "merge_tags" || onDuplicate === "merge_by_url") {
          if (it.tags && it.tags.length > 0) {
            for (const tName of it.tags) {
              const fullTagName = tagPrefix ? `${tagPrefix}${tName}` : tName;
              try {
                await tagService.setItemTags(orgId, accountId, existing.id, {
                  create: [{ name: fullTagName }],
                });
              } catch {
                // Ignore
              }
            }
          }
          itemsSkipped++;
          continue;
        } else if (onDuplicate === "overwrite") {
          await itemService.updateItem(orgId, existing.id, {
            title: it.title,
            description: it.description,
            isStarred: it.starred,
          });
          itemsSkipped++;
          continue;
        }
      }

      // Determine Collection
      let colId = targetCollectionId;
      if (!colId) {
        const cName = it.collectionName || "Imported Bookmarks";
        if (createdCollections.has(cName)) {
          colId = createdCollections.get(cName)!;
        } else {
          const col = await workspaceService.createCollection(orgId, accountId, {
            spaceId: targetSpaceId!,
            name: cName,
            color: "blue",
          });
          colId = col.id;
          createdCollections.set(cName, colId);
          collectionsCreated++;
        }
      }

      // Determine Group if any
      let groupId: string | null = null;
      if (it.groupName) {
        const groupKey = `${colId}:${it.groupName}`;
        if (createdGroups.has(groupKey)) {
          groupId = createdGroups.get(groupKey)!;
        } else {
          const grp = await workspaceService.createGroup(orgId, accountId, {
            collectionId: colId,
            name: it.groupName,
            color: "slate",
          });
          groupId = grp.id;
          createdGroups.set(groupKey, groupId);
          groupsCreated++;
        }
      }

      // Create Item
      const createdItem = await itemService.createItem(orgId, accountId, {
        collectionId: colId,
        groupId,
        url: it.url,
        title: it.title || it.url,
        description: it.description,
        source: `import:${job.source}`,
      });

      if (it.starred) {
        await itemService.updateItem(orgId, createdItem.id, { isStarred: true });
      }

      // Add tags
      if (it.tags && it.tags.length > 0) {
        for (const tName of it.tags) {
          const fullTagName = tagPrefix ? `${tagPrefix}${tName}` : tName;
          try {
            await tagService.setItemTags(orgId, accountId, createdItem.id, {
              create: [{ name: fullTagName }],
            });
            tagsCreated++;
          } catch {
            // Ignore tag duplicate
          }
        }
      }

      existingMap.set(normalizedUrl, createdItem as any);
      itemsCreated++;

      job.progress = {
        processed: i + 1,
        total: itemsToProcess.length,
        percent: Math.round(((i + 1) / itemsToProcess.length) * 100),
      };
    }

    job.status = "succeeded";
    job.phase = "done";
    job.summary = {
      spaces_created: spacesCreated,
      collections_created: collectionsCreated,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      items_skipped_duplicate: itemsSkipped,
      items_failed: 0,
      tags_created: tagsCreated,
    };
    job.committedAt = new Date();
    job.finishedAt = new Date();
    job.updatedAt = new Date();

    return job;
  }

  /**
   * List imports (GET /v1/imports)
   */
  public async listImports(orgId: string, limit: number = 20): Promise<MemImportJob[]> {
    return memRepo.imports.filter((j) => j.organizationId === orgId).slice(0, limit);
  }

  /**
   * Get single import status (GET /v1/imports/:id)
   */
  public async getImport(importId: string, orgId: string): Promise<MemImportJob> {
    const job = memRepo.imports.find((j) => j.id === importId && j.organizationId === orgId);
    if (!job) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Import job not found",
      });
    }
    return job;
  }

  /**
   * Cancel an import (POST /v1/imports/:id/cancel)
   */
  public async cancelImport(importId: string, orgId: string): Promise<MemImportJob> {
    const job = await this.getImport(importId, orgId);
    if (job.status === "succeeded") {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Cannot cancel completed import",
      });
    }
    job.status = "canceled";
    job.updatedAt = new Date();
    return job;
  }

  // =================== EXPORT ENGINE ===================

  /**
   * Create and run export job (POST /v1/exports)
   */
  public async createExport(
    orgId: string,
    accountId: string,
    params: {
      format?: "lmn_native_json" | "bookmarks_html" | "csv_flat" | "pocket_csv";
      scope?: {
        kind: "organization" | "space" | "collection";
        space_id?: string;
        collection_id?: string;
        include?: string[];
        include_deleted?: boolean;
      };
      options?: {
        include_favicons?: boolean;
        redact_share_passwords?: boolean;
      };
    } = {}
  ): Promise<MemExportJob> {
    const exportId = uuidv7();
    const format = params.format || "lmn_native_json";
    const scope = params.scope || { kind: "organization" };
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Fetch Spaces, Collections, Groups, Items, Tags for org
    let spaces: any[] = await workspaceService.listSpaces(orgId);
    let collections: any[] = await workspaceService.listCollections(orgId);
    let items: any[] = await itemService.listItems(orgId, { includeDeleted: scope.include_deleted });
    const tags = await tagService.listTags(orgId);

    // Apply scope filter
    if (scope.kind === "space" && scope.space_id) {
      spaces = spaces.filter((s) => s.id === scope.space_id);
      collections = collections.filter((c) => c.space_id === scope.space_id);
      const colIds = new Set(collections.map((c) => c.id));
      items = items.filter((i) => colIds.has(i.collection_id));
    } else if (scope.kind === "collection" && scope.collection_id) {
      collections = collections.filter((c) => c.id === scope.collection_id);
      items = items.filter((i) => i.collection_id === scope.collection_id);
      const spaceIds = new Set(collections.map((c) => c.space_id));
      spaces = spaces.filter((s) => spaceIds.has(s.id));
    }

    // Render payload based on format
    let payload = "";
    if (format === "bookmarks_html") {
      payload = this.renderBookmarksHtml(spaces, collections, items);
    } else if (format === "csv_flat") {
      payload = this.renderCsv(spaces, collections, items);
    } else if (format === "pocket_csv") {
      payload = this.renderPocketJson(items);
    } else {
      payload = this.renderLmnJson(orgId, spaces, collections, items, tags);
    }

    const sizeBytes = Buffer.byteLength(payload, "utf8");
    const sha256 = calculateSha256(payload);

    const job: MemExportJob = {
      id: exportId,
      organizationId: orgId,
      accountId,
      format,
      status: "succeeded",
      scope,
      options: params.options,
      downloadUrl: `/v1/exports/${exportId}/download`,
      downloadExpiresAt: expiresAt,
      sizeBytes,
      sha256,
      itemsCount: items.length,
      payload,
      createdAt: now,
      updatedAt: now,
      finishedAt: now,
    };

    memRepo.exports.unshift(job);
    return job;
  }

  public async getExport(exportId: string, orgId: string): Promise<MemExportJob> {
    const job = memRepo.exports.find((e) => e.id === exportId && e.organizationId === orgId);
    if (!job) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Export not found",
      });
    }
    return job;
  }

  public async listExports(orgId: string, limit: number = 20): Promise<MemExportJob[]> {
    return memRepo.exports.filter((e) => e.organizationId === orgId).slice(0, limit);
  }

  public async refreshExportUrl(exportId: string, orgId: string, ttlHours: number = 168): Promise<MemExportJob> {
    const job = await this.getExport(exportId, orgId);
    const ttlMs = Math.min(ttlHours, 168) * 60 * 60 * 1000;
    job.downloadExpiresAt = new Date(Date.now() + ttlMs);
    job.updatedAt = new Date();
    return job;
  }

  // =================== FORMAT RENDERERS ===================

  private renderLmnJson(
    orgId: string,
    spaces: any[],
    collections: any[],
    items: any[],
    tags: any[]
  ): string {
    const spaceTree = spaces.map((sp) => {
      const spCollections = collections.filter((c) => c.space_id === sp.id);
      return {
        id: sp.id,
        name: sp.name,
        icon: sp.icon || "📁",
        color: sp.color || "blue",
        collections: spCollections.map((col) => {
          const colItems = items.filter((i) => i.collection_id === col.id);
          const groups = (col.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            items: colItems.filter((i) => i.group_id === g.id).map((i) => i.id),
          }));
          return {
            id: col.id,
            name: col.name,
            color: col.color || "blue",
            groups,
            items: colItems.map((i) => ({
              id: i.id,
              url: i.url,
              title: i.title,
              description: i.description || "",
              tags: i.tags?.map((t: any) => t.name) || [],
              starred: Boolean(i.is_starred),
              favicon: i.favicon_url,
              created_at: i.created_at,
              updated_at: i.updated_at,
            })),
          };
        }),
      };
    });

    const exportObj = {
      schema_version: "1.0",
      exported_at: new Date().toISOString(),
      exporter: "lmn-web/2.0",
      organization: { id: orgId, name: "Organization", slug: "org" },
      spaces: spaceTree,
      tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    };

    const canonicalJson = JSON.stringify(exportObj, null, 2);
    const checksum = `sha256:${calculateSha256(canonicalJson)}`;

    return JSON.stringify({ ...exportObj, checksum }, null, 2);
  }

  private renderBookmarksHtml(spaces: any[], collections: any[], items: any[]): string {
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Lets Mark Now Bookmarks Export</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    for (const col of collections) {
      html += `    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">${escapeHtml(col.name)}</H3>\n`;
      html += `    <DL><p>\n`;

      const colItems = items.filter((i) => i.collection_id === col.id);
      for (const item of colItems) {
        const addDate = item.created_at ? Math.floor(new Date(item.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
        const iconAttr = item.favicon_url ? ` ICON="${escapeHtml(item.favicon_url)}"` : "";
        html += `        <DT><A HREF="${escapeHtml(item.url)}" ADD_DATE="${addDate}"${iconAttr}>${escapeHtml(item.title || item.url)}</A>\n`;
        if (item.description) {
          html += `        <DD>${escapeHtml(item.description)}\n`;
        }
      }

      html += `    </DL><p>\n`;
    }

    html += `</DL><p>\n`;
    return html;
  }

  private renderCsv(spaces: any[], collections: any[], items: any[]): string {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const spaceMap = new Map(spaces.map((s) => [s.id, s.name]));
    const colMap = new Map(collections.map((c) => [c.id, c]));

    const header = "url,title,description,tags,collection_path,created_at,starred\n";
    const rows = items.map((i) => {
      const col = colMap.get(i.collection_id);
      const spaceName = col ? spaceMap.get(col.space_id) || "Workspace" : "Workspace";
      const colName = col ? col.name : "Collection";
      const path = `${spaceName} / ${colName}`;
      const tagStr = (i.tags || []).map((t: any) => t.name).join(";");
      const starredStr = i.is_starred ? "true" : "false";

      return [
        escapeCsv(i.url),
        escapeCsv(i.title || ""),
        escapeCsv(i.description || ""),
        escapeCsv(tagStr),
        escapeCsv(path),
        i.created_at,
        starredStr,
      ].join(",");
    });

    return header + rows.join("\n");
  }

  private renderPocketJson(items: any[]): string {
    const list: Record<string, any> = {};
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      list[String(idx + 1)] = {
        item_id: String(idx + 1),
        resolved_url: it.url,
        given_title: it.title,
        time_added: it.created_at ? String(Math.floor(new Date(it.created_at).getTime() / 1000)) : String(Math.floor(Date.now() / 1000)),
        favorite: it.is_starred ? "1" : "0",
        tags: (it.tags || []).reduce((acc: any, t: any) => {
          acc[t.name] = { tag: t.name };
          return acc;
        }, {}),
      };
    }
    return JSON.stringify({ list }, null, 2);
  }
}

export const importExportService = new ImportExportService();
