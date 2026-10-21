import { eq, and, isNull, like, or } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemItem } from "../db/memRepo.js";
import { workspaceService } from "./workspaceService.js";
import { historyService } from "./historyService.js";

export interface CreateItemInput {
  collectionId?: string;
  groupId?: string | null;
  url: string;
  title?: string;
  description?: string;
  faviconUrl?: string | null;
  color?: string;
  source?: string;
}

export interface UpdateItemInput {
  title?: string;
  url?: string;
  description?: string;
  color?: string;
  isStarred?: boolean;
  position?: number;
}

export interface SaveSessionInput {
  destination: {
    kind: "new_collection" | "existing_collection" | "new_group" | "existing_group";
    space_id?: string;
    collection_id?: string;
    group_id?: string;
    name?: string;
    color?: string;
  };
  tabs: Array<{
    url: string;
    title?: string;
    favicon_data_url?: string;
    pinned?: boolean;
    active?: boolean;
    window_position?: number;
  }>;
  options?: {
    close_tabs_after_save?: boolean;
    exclude_pinned?: boolean;
    exclude_chrome_internal?: boolean;
    dedupe_within_session?: boolean;
    dedupe_against_collection?: boolean;
  };
  client?: {
    window_id?: number;
    extension_version?: string;
    browser?: string;
  };
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

export class ItemService {
  public async listItems(
    orgId: string,
    options: {
      collectionId?: string;
      groupId?: string;
      includeGroups?: boolean;
      isStarred?: boolean;
      includeDeleted?: boolean;
      tagId?: string;
      tag?: string;
      q?: string;
    } = {}
  ) {
    const isDb = await checkDbConnection();
    const includeDeleted = options.includeDeleted === true;

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.items.organizationId, orgId)];

      if (!includeDeleted) {
        conditions.push(isNull(schema.items.deletedAt));
      }

      if (options.groupId) {
        conditions.push(eq(schema.items.groupId, options.groupId));
      } else if (options.collectionId) {
        conditions.push(eq(schema.items.collectionId, options.collectionId));
        if (!options.includeGroups) {
          conditions.push(isNull(schema.items.groupId));
        }
      }

      if (options.isStarred !== undefined) {
        conditions.push(eq(schema.items.isStarred, options.isStarred));
      }

      if (options.q) {
        const query = `%${options.q.trim()}%`;
        conditions.push(or(like(schema.items.title, query), like(schema.items.url, query))!);
      }

      const rows = await db
        .select()
        .from(schema.items)
        .where(and(...conditions));

      // Resolve tag IDs
      let targetTagId = options.tagId;
      if (options.tag && !targetTagId) {
        const foundTags = await db
          .select({ id: schema.tags.id })
          .from(schema.tags)
          .where(and(eq(schema.tags.organizationId, orgId), like(schema.tags.name, options.tag.trim())))
          .limit(1);
        if (foundTags.length > 0) targetTagId = foundTags[0].id;
        else return [];
      }

      const itemTagRows = await db
        .select()
        .from(schema.itemTags);

      const tagMap = new Map<string, string[]>();
      for (const it of itemTagRows) {
        const existing = tagMap.get(it.itemId) || [];
        existing.push(it.tagId);
        tagMap.set(it.itemId, existing);
      }

      let filteredRows = rows;
      if (targetTagId) {
        filteredRows = filteredRows.filter((it) => (tagMap.get(it.id) || []).includes(targetTagId!));
      }

      return filteredRows.map((it) => ({
        id: it.id,
        collection_id: it.collectionId,
        group_id: it.groupId,
        space_id: it.spaceId,
        organization_id: it.organizationId,
        title: it.title,
        url: it.url,
        domain: extractDomain(it.url),
        description: it.description,
        favicon_url: it.faviconUrl,
        color: it.color,
        position: it.position,
        is_starred: it.isStarred,
        tag_ids: tagMap.get(it.id) || [],
        source: it.source,
        deleted_at: it.deletedAt ? it.deletedAt.toISOString() : null,
        created_at: it.createdAt.toISOString(),
        updated_at: it.updatedAt.toISOString(),
      }));
    } else {
      let targetTagId = options.tagId;
      if (options.tag && !targetTagId) {
        const found = memRepo.tags.find(
          (t) => t.organizationId === orgId && t.name.toLowerCase() === options.tag!.toLowerCase().trim()
        );
        if (found) targetTagId = found.id;
        else return [];
      }

      const filtered = memRepo.items.filter((it) => {
        if (it.organizationId !== orgId) return false;
        if (!includeDeleted && it.deletedAt) return false;

        if (options.groupId) {
          if (it.groupId !== options.groupId) return false;
        } else if (options.collectionId) {
          if (it.collectionId !== options.collectionId) return false;
          if (!options.includeGroups && it.groupId) return false;
        }

        if (options.isStarred !== undefined && it.isStarred !== options.isStarred) {
          return false;
        }

        if (options.q) {
          const needle = options.q.toLowerCase();
          const matches =
            it.title.toLowerCase().includes(needle) ||
            it.url.toLowerCase().includes(needle);
          if (!matches) return false;
        }

        if (targetTagId) {
          const hasTag = memRepo.itemTags.some(
            (junction) => junction.itemId === it.id && junction.tagId === targetTagId
          );
          if (!hasTag) return false;
        }

        return true;
      });

      return filtered.map((it) => {
        const tagIds = memRepo.itemTags
          .filter((junction) => junction.itemId === it.id)
          .map((junction) => junction.tagId);

        return {
          id: it.id,
          collection_id: it.collectionId,
          group_id: it.groupId || null,
          space_id: it.spaceId || null,
          organization_id: it.organizationId,
          title: it.title,
          url: it.url,
          domain: extractDomain(it.url),
          description: it.description || null,
          favicon_url: it.faviconUrl || null,
          color: it.color || "none",
          position: it.position,
          is_starred: it.isStarred || false,
          tag_ids: tagIds,
          source: it.source || "manual",
          deleted_at: it.deletedAt ? it.deletedAt.toISOString() : null,
          created_at: it.createdAt.toISOString(),
          updated_at: it.updatedAt.toISOString(),
        };
      });
    }
  }

  public async createItem(orgId: string, accountId: string, input: CreateItemInput) {
    const cleanUrl = input.url?.trim();
    if (!cleanUrl) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "URL is required.",
        details: { field: "url" },
      });
    }

    // URL validation
    try {
      const parsed = new URL(cleanUrl);
      if (!["http:", "https:", "chrome-extension:", "file:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Invalid URL scheme. Supported: http, https, chrome-extension, file.",
        details: { field: "url" },
      });
    }

    let targetCollectionId = input.collectionId;
    let targetGroupId = input.groupId || null;
    let targetSpaceId: string | undefined;

    if (targetGroupId) {
      const grp = await workspaceService.getGroup(orgId, targetGroupId);
      targetCollectionId = grp.collection_id;
      targetSpaceId = grp.space_id || undefined;
    } else if (targetCollectionId) {
      const col = await workspaceService.getCollection(orgId, targetCollectionId);
      targetSpaceId = col.space_id || undefined;
    } else {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Either collection_id or group_id must be provided.",
      });
    }

    const domain = extractDomain(cleanUrl);
    const title = input.title?.trim() || domain;
    const faviconUrl = input.faviconUrl || null;
    const itemId = uuidv7();
    const now = new Date();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.items).values({
        id: itemId,
        organizationId: orgId,
        spaceId: targetSpaceId,
        collectionId: targetCollectionId!,
        groupId: targetGroupId,
        title,
        url: cleanUrl,
        description: input.description,
        faviconUrl,
        color: input.color || "none",
        source: input.source || "manual",
        createdBy: accountId,
      });
    }

    memRepo.items.push({
      id: itemId,
      organizationId: orgId,
      spaceId: targetSpaceId,
      collectionId: targetCollectionId!,
      groupId: targetGroupId,
      title,
      url: cleanUrl,
      description: input.description,
      faviconUrl,
      color: input.color || "none",
      position: (memRepo.items.filter((it) => it.collectionId === targetCollectionId).length + 1) * 1024,
      source: input.source || "manual",
      createdBy: accountId,
      createdAt: now,
      updatedAt: now,
    });

    await historyService.recordEvent({
      orgId,
      accountId,
      entityType: "item",
      entityId: itemId,
      action: "item.created",
      forwardPatch: { id: itemId, title, url: cleanUrl, collection_id: targetCollectionId },
      entitySnapshot: { title, url: cleanUrl },
    });

    return this.getItem(orgId, itemId);
  }

  public async getItem(orgId: string, itemId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.items)
        .where(
          and(
            eq(schema.items.id, itemId),
            eq(schema.items.organizationId, orgId),
            isNull(schema.items.deletedAt)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }

      const it = rows[0];
      const tagRows = await db
        .select({ tagId: schema.itemTags.tagId })
        .from(schema.itemTags)
        .where(eq(schema.itemTags.itemId, it.id));

      return {
        id: it.id,
        collection_id: it.collectionId,
        group_id: it.groupId,
        space_id: it.spaceId,
        organization_id: it.organizationId,
        title: it.title,
        url: it.url,
        domain: extractDomain(it.url),
        description: it.description,
        favicon_url: it.faviconUrl,
        color: it.color,
        position: it.position,
        is_starred: it.isStarred,
        tag_ids: tagRows.map((r) => r.tagId),
        source: it.source,
        deleted_at: it.deletedAt ? it.deletedAt.toISOString() : null,
        created_at: it.createdAt.toISOString(),
        updated_at: it.updatedAt.toISOString(),
      };
    } else {
      const it = memRepo.items.find(
        (item) => item.id === itemId && item.organizationId === orgId && !item.deletedAt
      );

      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }

      const tagIds = memRepo.itemTags
        .filter((junction) => junction.itemId === it.id)
        .map((junction) => junction.tagId);

      return {
        id: it.id,
        collection_id: it.collectionId,
        group_id: it.groupId || null,
        space_id: it.spaceId || null,
        organization_id: it.organizationId,
        title: it.title,
        url: it.url,
        domain: extractDomain(it.url),
        description: it.description || null,
        favicon_url: it.faviconUrl || `https://www.google.com/s2/favicons?domain=${extractDomain(it.url)}&sz=64`,
        color: it.color || "none",
        position: it.position,
        is_starred: it.isStarred || false,
        tag_ids: tagIds,
        source: it.source || "manual",
        deleted_at: it.deletedAt ? it.deletedAt.toISOString() : null,
        created_at: it.createdAt.toISOString(),
        updated_at: it.updatedAt.toISOString(),
      };
    }
  }

  public async updateItem(orgId: string, itemId: string, input: UpdateItemInput) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.items)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.url !== undefined ? { url: input.url, faviconUrl: `https://www.google.com/s2/favicons?domain=${extractDomain(input.url)}&sz=64` } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.isStarred !== undefined ? { isStarred: input.isStarred } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.items.id, itemId),
            eq(schema.items.organizationId, orgId)
          )
        );
    } else {
      const it = memRepo.items.find(
        (item) => item.id === itemId && item.organizationId === orgId && !item.deletedAt
      );
      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }

      if (input.title !== undefined) it.title = input.title;
      if (input.url !== undefined) {
        it.url = input.url;
        it.faviconUrl = `https://www.google.com/s2/favicons?domain=${extractDomain(input.url)}&sz=64`;
      }
      if (input.description !== undefined) it.description = input.description;
      if (input.color !== undefined) it.color = input.color;
      if (input.isStarred !== undefined) it.isStarred = input.isStarred;
      if (input.position !== undefined) it.position = input.position;
      it.updatedAt = new Date();
    }

    return this.getItem(orgId, itemId);
  }

  public async moveItem(
    orgId: string,
    itemId: string,
    input: { toCollectionId?: string; toGroupId?: string | null }
  ) {
    let resolvedCollectionId = input.toCollectionId;
    let resolvedGroupId = input.toGroupId || null;
    let resolvedSpaceId: string | undefined;

    if (resolvedGroupId) {
      const grp = await workspaceService.getGroup(orgId, resolvedGroupId);
      resolvedCollectionId = grp.collection_id;
      resolvedSpaceId = grp.space_id || undefined;
    } else if (resolvedCollectionId) {
      const col = await workspaceService.getCollection(orgId, resolvedCollectionId);
      resolvedSpaceId = col.space_id || undefined;
    } else {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Destination collection_id or to_group_id is required.",
      });
    }

    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.items)
        .set({
          collectionId: resolvedCollectionId!,
          groupId: resolvedGroupId,
          spaceId: resolvedSpaceId,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.items.id, itemId), eq(schema.items.organizationId, orgId)));
    } else {
      const it = memRepo.items.find(
        (item) => item.id === itemId && item.organizationId === orgId && !item.deletedAt
      );
      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }
      it.collectionId = resolvedCollectionId!;
      it.groupId = resolvedGroupId;
      it.spaceId = resolvedSpaceId;
      it.updatedAt = new Date();
    }

    return this.getItem(orgId, itemId);
  }

  public async deleteItem(orgId: string, itemId: string) {
    const isDb = await checkDbConnection();
    const deletedAt = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.items)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(and(eq(schema.items.id, itemId), eq(schema.items.organizationId, orgId)));
    } else {
      const it = memRepo.items.find(
        (item) => item.id === itemId && item.organizationId === orgId && !item.deletedAt
      );
      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }
      it.deletedAt = deletedAt;
      it.updatedAt = deletedAt;
    }

    await historyService.recordEvent({
      orgId,
      entityType: "item",
      entityId: itemId,
      action: "item.deleted",
      entitySnapshot: { id: itemId },
    });

    return {
      deleted_at: deletedAt.toISOString(),
      purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
    };
  }

  public async restoreItem(orgId: string, itemId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.items)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(and(eq(schema.items.id, itemId), eq(schema.items.organizationId, orgId)));
    } else {
      const it = memRepo.items.find(
        (item) => item.id === itemId && item.organizationId === orgId
      );
      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }
      it.deletedAt = null;
      it.updatedAt = new Date();
    }

    await historyService.recordEvent({
      orgId,
      entityType: "item",
      entityId: itemId,
      action: "item.restored",
      isUndoable: false,
    });

    return this.getItem(orgId, itemId);
  }

  // ===================== SAVE SESSION =====================
  public async saveSession(
    orgId: string,
    accountId: string,
    input: SaveSessionInput
  ) {
    // Filter and sanitize tabs
    const excludeInternal = input.options?.exclude_chrome_internal !== false;
    const excludePinned = input.options?.exclude_pinned === true;
    const dedupe = input.options?.dedupe_within_session !== false;

    let targetCollectionId = input.destination.collection_id;
    let targetGroupId = input.destination.group_id || null;

    // Resolve or create destination
    if (input.destination.kind === "new_collection") {
      let spaceId = input.destination.space_id;
      if (!spaceId) {
        // Resolve default space
        const spaces = await workspaceService.listSpaces(orgId);
        if (spaces.length > 0) spaceId = spaces[0].id;
        else {
          const newSp = await workspaceService.createSpace(orgId, accountId, { name: "Saved Sessions" });
          spaceId = newSp.id;
        }
      }

      const colName = input.destination.name || `Session ${new Date().toLocaleDateString()}`;
      const newCol = await workspaceService.createCollection(orgId, accountId, {
        spaceId,
        name: colName,
        color: input.destination.color || "pink",
        viewMode: "grid",
      });
      targetCollectionId = newCol.id;
    } else if (input.destination.kind === "new_group") {
      if (!targetCollectionId) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "collection_id required when kind is new_group.",
        });
      }
      const grpName = input.destination.name || `Tabs ${new Date().toLocaleDateString()}`;
      const newGrp = await workspaceService.createGroup(orgId, accountId, {
        collectionId: targetCollectionId,
        name: grpName,
        color: input.destination.color,
      });
      targetGroupId = newGrp.id;
    }

    if (!targetCollectionId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Failed to resolve destination collection.",
      });
    }

    const seenUrls = new Set<string>();
    const validTabs: Array<{ url: string; title: string; faviconUrl?: string }> = [];
    const skipped: Array<{ url: string; reason: string }> = [];

    for (const tab of input.tabs) {
      if (!tab.url) continue;

      if (excludePinned && tab.pinned) {
        skipped.push({ url: tab.url, reason: "pinned_tab_excluded" });
        continue;
      }

      if (excludeInternal && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
        skipped.push({ url: tab.url, reason: "internal_url_excluded" });
        continue;
      }

      if (dedupe) {
        if (seenUrls.has(tab.url)) {
          skipped.push({ url: tab.url, reason: "duplicate_in_session" });
          continue;
        }
        seenUrls.add(tab.url);
      }

      validTabs.push({
        url: tab.url,
        title: tab.title || extractDomain(tab.url),
        faviconUrl: tab.favicon_data_url,
      });
    }

    if (validTabs.length === 0 && input.tabs.length > 0) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "All tabs were skipped based on options filters.",
        details: { skipped },
      });
    }

    // Create items
    for (const tab of validTabs) {
      await this.createItem(orgId, accountId, {
        collectionId: targetCollectionId,
        groupId: targetGroupId,
        url: tab.url,
        title: tab.title,
        source: "session_save",
      });
    }

    const historyEventId = uuidv7();

    await historyService.recordEvent({
      orgId,
      accountId,
      entityType: "session",
      entityId: targetCollectionId,
      action: "session.saved",
      batchId: historyEventId,
      metadata: {
        destination_kind: input.destination.kind,
        items_created: validTabs.length,
      },
      isUndoable: true,
    });

    return {
      destination: {
        kind: input.destination.kind,
        collection_id: targetCollectionId,
        group_id: targetGroupId,
      },
      items_created: validTabs.length,
      items_skipped: skipped.length,
      items_failed: 0,
      skipped,
      history_event_id: historyEventId,
      undo_token: `lmn-undo-${uuidv7().slice(0, 16)}`,
    };
  }

  public previewSaveSession(
    input: Omit<SaveSessionInput, "client">
  ) {
    const excludeInternal = input.options?.exclude_chrome_internal !== false;
    const excludePinned = input.options?.exclude_pinned === true;
    const dedupe = input.options?.dedupe_within_session !== false;

    const seenUrls = new Set<string>();
    const validTabs: Array<{ url: string; title: string }> = [];
    const skipped: Array<{ url: string; reason: string }> = [];

    for (const tab of input.tabs) {
      if (!tab.url) continue;

      if (excludePinned && tab.pinned) {
        skipped.push({ url: tab.url, reason: "pinned_tab_excluded" });
        continue;
      }

      if (excludeInternal && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
        skipped.push({ url: tab.url, reason: "internal_url_excluded" });
        continue;
      }

      if (dedupe) {
        if (seenUrls.has(tab.url)) {
          skipped.push({ url: tab.url, reason: "duplicate_in_session" });
          continue;
        }
        seenUrls.add(tab.url);
      }

      validTabs.push({
        url: tab.url,
        title: tab.title || extractDomain(tab.url),
      });
    }

    return {
      would_create: validTabs.length,
      would_skip: skipped.length,
      skipped,
      destination_resolved: {
        kind: input.destination.kind,
        name: input.destination.name || "Session",
      },
      entitlement_blocking: false,
    };
  }
}

export const itemService = new ItemService();
