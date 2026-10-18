import { eq, and, desc, isNotNull, inArray } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemHistoryEvent } from "../db/memRepo.js";

export interface RecordEventParams {
  orgId: string;
  accountId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  forwardPatch?: Record<string, unknown> | null;
  reversePatch?: Record<string, unknown> | null;
  batchId?: string | null;
  client?: string | null;
  isUndoable?: boolean;
  undoExpiresAt?: Date | null;
  metadata?: Record<string, unknown>;
  entitySnapshot?: Record<string, unknown> | null;
}

export interface HistoryEventDto {
  id: string;
  organization_id: string;
  actor_account_id: string | null;
  actor_name: string;
  actor_avatar_url: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string;
  entity_snapshot: Record<string, unknown> | null;
  diff: Record<string, unknown> | null;
  batch_id: string | null;
  client: string | null;
  is_undone: boolean;
  undone_by_event_id: string | null;
  undoable: boolean;
  undo_expires_at: string | null;
  created_at: string;
}

export interface TrashItemDto {
  entity_type: "space" | "collection" | "group" | "item";
  entity_id: string;
  name: string;
  deleted_at: string;
  purges_at: string;
  deleted_by: {
    account_id: string | null;
    name: string;
  };
  history_event_id: string | null;
  size_summary: Record<string, number>;
}

export class HistoryService {
  /**
   * Format a MemHistoryEvent or DB row to DTO
   */
  public toDto(
    event: {
      id: string;
      organizationId: string;
      accountId?: string | null;
      entityType: string;
      entityId: string;
      action: string;
      forwardPatch?: unknown;
      reversePatch?: unknown;
      batchId?: string | null;
      client?: string | null;
      isUndoable?: boolean;
      undoneAt?: Date | string | null;
      undoneByEventId?: string | null;
      redoneAt?: Date | string | null;
      undoExpiresAt?: Date | string | null;
      metadata?: unknown;
      entitySnapshot?: unknown;
      createdAt: Date | string;
    },
    accountMap?: Map<string, { name: string; avatarUrl?: string | null }>
  ): HistoryEventDto {
    const toIso = (d: Date | string | null | undefined): string | null => {
      if (!d) return null;
      return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
    };

    const isUndone = Boolean(event.undoneAt);
    const undoExpiresTime = event.undoExpiresAt
      ? new Date(event.undoExpiresAt).getTime()
      : null;
    const isExpired = undoExpiresTime !== null && undoExpiresTime <= Date.now();
    const isUndoable = Boolean(event.isUndoable ?? true) && !isUndone && !isExpired;

    const account = event.accountId ? accountMap?.get(event.accountId) : undefined;
    const actorName = account?.name || "System";
    const actorAvatar = account?.avatarUrl ?? null;

    return {
      id: event.id,
      organization_id: event.organizationId,
      actor_account_id: event.accountId ?? null,
      actor_name: actorName,
      actor_avatar_url: actorAvatar,
      event_type: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      entity_snapshot: (event.entitySnapshot as Record<string, unknown>) || null,
      diff: (event.forwardPatch as Record<string, unknown>) || null,
      batch_id: event.batchId ?? null,
      client: event.client ?? null,
      is_undone: isUndone,
      undone_by_event_id: event.undoneByEventId ?? null,
      undoable: isUndoable,
      undo_expires_at: toIso(event.undoExpiresAt),
      created_at: toIso(event.createdAt)!,
    };
  }

  /**
   * Record a new mutation event into the append-only history log
   */
  public async recordEvent(params: RecordEventParams): Promise<HistoryEventDto> {
    const id = uuidv7();
    const now = new Date();
    const isUndoable = params.isUndoable ?? true;

    // Default undo window: 30 days
    const undoExpiresAt =
      params.undoExpiresAt !== undefined
        ? params.undoExpiresAt
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const [inserted] = await db
        .insert(schema.historyEvents)
        .values({
          id,
          organizationId: params.orgId,
          accountId: params.accountId ?? null,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          forwardPatch: params.forwardPatch ?? null,
          reversePatch: params.reversePatch ?? null,
          batchId: params.batchId ?? null,
          client: params.client ?? null,
          isUndoable,
          undoneAt: null,
          undoneByEventId: null,
          redoneAt: null,
          undoExpiresAt,
          metadata: params.metadata || {},
          entitySnapshot: params.entitySnapshot ?? null,
          createdAt: now,
        })
        .returning();

      return this.toDto(inserted);
    }

    const memEvent: MemHistoryEvent = {
      id,
      organizationId: params.orgId,
      accountId: params.accountId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      forwardPatch: params.forwardPatch ?? null,
      reversePatch: params.reversePatch ?? null,
      batchId: params.batchId ?? null,
      client: params.client ?? null,
      isUndoable,
      undoneAt: null,
      undoneByEventId: null,
      redoneAt: null,
      undoExpiresAt,
      metadata: params.metadata || {},
      entitySnapshot: params.entitySnapshot ?? null,
      createdAt: now,
    };

    memRepo.historyEvents.push(memEvent);
    return this.toDto(memEvent);
  }

  /**
   * Helper to build account map for actor names
   */
  private async getAccountMap(accountIds: string[]): Promise<Map<string, { name: string; avatarUrl?: string | null }>> {
    const map = new Map<string, { name: string; avatarUrl?: string | null }>();
    if (accountIds.length === 0) return map;

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const rows = await db
        .select({ id: schema.accounts.id, name: schema.accounts.displayName, email: schema.accounts.email, avatar: schema.accounts.avatarUrl })
        .from(schema.accounts)
        .where(inArray(schema.accounts.id, accountIds));
      for (const r of rows) {
        map.set(r.id, { name: r.name || r.email.split("@")[0], avatarUrl: r.avatar });
      }
    } else {
      for (const id of accountIds) {
        const acc = memRepo.getAccountById(id);
        if (acc) {
          map.set(id, { name: acc.displayName || acc.email.split("@")[0], avatarUrl: acc.avatarUrl });
        }
      }
    }
    return map;
  }

  /**
   * List history events with filtering and cursor pagination
   */
  public async listEvents(
    orgId: string,
    options: {
      actor_account_id?: string;
      entity_type?: string;
      entity_id?: string;
      event_type?: string;
      since?: string;
      until?: string;
      batch_id?: string;
      include_undone?: boolean;
      limit?: number;
      cursor?: string;
    }
  ) {
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);
    const includeUndone = options.include_undone !== false;

    const entityTypes = options.entity_type
      ? options.entity_type.split(",").map((s) => s.trim().toLowerCase())
      : undefined;

    const eventTypes = options.event_type
      ? options.event_type.split(",").map((s) => s.trim().toLowerCase())
      : undefined;

    const isDb = await checkDbConnection();
    let eventsList: any[] = [];

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.historyEvents.organizationId, orgId)];

      if (options.actor_account_id) {
        conditions.push(eq(schema.historyEvents.accountId, options.actor_account_id));
      }

      if (options.entity_id) {
        conditions.push(eq(schema.historyEvents.entityId, options.entity_id));
      }

      if (options.batch_id) {
        conditions.push(eq(schema.historyEvents.batchId, options.batch_id));
      }

      const rows = await db
        .select()
        .from(schema.historyEvents)
        .where(and(...conditions))
        .orderBy(desc(schema.historyEvents.createdAt));

      eventsList = rows;
    } else {
      eventsList = memRepo.historyEvents.filter((e) => e.organizationId === orgId);
    }

    // Apply in-memory filters for options
    let filtered = eventsList.filter((e) => {
      if (options.actor_account_id && e.accountId !== options.actor_account_id) return false;
      if (options.entity_id && e.entityId !== options.entity_id) return false;
      if (options.batch_id && e.batchId !== options.batch_id) return false;

      if (entityTypes && !entityTypes.includes(e.entityType.toLowerCase())) return false;
      if (eventTypes && !eventTypes.includes(e.action.toLowerCase())) return false;

      if (!includeUndone && e.undoneAt) return false;

      if (options.since && new Date(e.createdAt).getTime() < new Date(options.since).getTime()) return false;
      if (options.until && new Date(e.createdAt).getTime() > new Date(options.until).getTime()) return false;

      return true;
    });

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Cursor pagination (offset base64)
    let startIndex = 0;
    if (options.cursor) {
      const parsed = parseInt(Buffer.from(options.cursor, "base64").toString("utf-8"), 10);
      if (!isNaN(parsed)) startIndex = parsed;
    }

    const paged = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore ? Buffer.from(String(startIndex + limit)).toString("base64") : null;

    // Resolve accounts for actors
    const accountIds = Array.from(new Set(paged.map((e) => e.accountId).filter(Boolean) as string[]));
    const accountMap = await this.getAccountMap(accountIds);

    return {
      data: paged.map((e) => this.toDto(e, accountMap)),
      page: {
        next_cursor: nextCursor,
        has_more: hasMore,
        limit,
      },
    };
  }

  /**
   * Get single history event
   */
  public async getEvent(orgId: string, eventId: string): Promise<HistoryEventDto> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.historyEvents)
        .where(and(eq(schema.historyEvents.id, eventId), eq(schema.historyEvents.organizationId, orgId)))
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "History event not found." });
      }

      const accountMap = await this.getAccountMap(rows[0].accountId ? [rows[0].accountId] : []);
      return this.toDto(rows[0], accountMap);
    }

    const event = memRepo.historyEvents.find((e) => e.id === eventId && e.organizationId === orgId);
    if (!event) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "History event not found." });
    }

    const accountMap = await this.getAccountMap(event.accountId ? [event.accountId] : []);
    return this.toDto(event, accountMap);
  }

  /**
   * Undo event or entire batch
   */
  public async undoEvent(
    orgId: string,
    accountId: string,
    eventId: string,
    undoEntireBatch = false
  ) {
    const isDb = await checkDbConnection();
    let rootEvent: any;

    if (isDb) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.historyEvents)
        .where(and(eq(schema.historyEvents.id, eventId), eq(schema.historyEvents.organizationId, orgId)))
        .limit(1);
      rootEvent = row;
    } else {
      rootEvent = memRepo.historyEvents.find((e) => e.id === eventId && e.organizationId === orgId);
    }

    if (!rootEvent) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "History event not found." });
    }

    if (rootEvent.undoneAt) {
      throw new AppError({
        statusCode: 409,
        code: "HISTORY_ALREADY_UNDONE",
        message: "This history event has already been undone.",
        details: { event_id: rootEvent.id, undo_event_id: rootEvent.undoneByEventId },
      });
    }

    if (!rootEvent.isUndoable) {
      throw new AppError({
        statusCode: 422,
        code: "HISTORY_NOT_UNDOABLE",
        message: "This event cannot be undone.",
        details: { event_id: rootEvent.id, kind: rootEvent.action },
      });
    }

    if (rootEvent.undoExpiresAt && new Date(rootEvent.undoExpiresAt).getTime() <= Date.now()) {
      throw new AppError({
        statusCode: 410,
        code: "HISTORY_UNDO_WINDOW_EXPIRED",
        message: "The window for undoing this action has expired.",
        details: { event_id: rootEvent.id, expires_at: new Date(rootEvent.undoExpiresAt).toISOString() },
      });
    }

    // Determine target events (single or batch)
    let targetEvents: any[] = [rootEvent];
    if (undoEntireBatch && rootEvent.batchId) {
      if (isDb) {
        const db = getDb();
        targetEvents = await db
          .select()
          .from(schema.historyEvents)
          .where(
            and(
              eq(schema.historyEvents.organizationId, orgId),
              eq(schema.historyEvents.batchId, rootEvent.batchId)
            )
          );
      } else {
        targetEvents = memRepo.historyEvents.filter(
          (e) => e.organizationId === orgId && e.batchId === rootEvent.batchId
        );
      }
    }

    const undoEventId = uuidv7();
    const now = new Date();
    const restoredIds: string[] = [];
    const skipped: Array<{ entity_id: string; reason: string }> = [];

    // Perform reverse operations
    for (const evt of targetEvents) {
      if (evt.undoneAt) continue;

      const action = evt.action.toLowerCase();
      const entityType = evt.entityType.toLowerCase();
      const entityId = evt.entityId;

      try {
        if (action.includes("deleted")) {
          // Inverse of delete is restore
          await this.applyRestore(orgId, entityType, entityId);
          restoredIds.push(entityId);
        } else if (action.includes("created")) {
          // Inverse of create is soft-delete
          await this.applyDelete(orgId, entityType, entityId);
          restoredIds.push(entityId);
        } else if (action.includes("updated") || action.includes("moved")) {
          // Inverse of update/move: apply reverse patch if available
          if (evt.reversePatch) {
            await this.applyPatch(orgId, entityType, entityId, evt.reversePatch);
            restoredIds.push(entityId);
          } else {
            skipped.push({ entity_id: entityId, reason: "no_reverse_patch" });
          }
        } else {
          skipped.push({ entity_id: entityId, reason: "action_not_invertible" });
        }

        // Mark target event as undone
        if (isDb) {
          const db = getDb();
          await db
            .update(schema.historyEvents)
            .set({ undoneAt: now, undoneByEventId: undoEventId })
            .where(eq(schema.historyEvents.id, evt.id));
        } else {
          evt.undoneAt = now;
          evt.undoneByEventId = undoEventId;
        }
      } catch (err: any) {
        skipped.push({ entity_id: entityId, reason: err.message || "failed_to_invert" });
      }
    }

    // Record compensating history event
    await this.recordEvent({
      orgId,
      accountId,
      entityType: rootEvent.entityType,
      entityId: rootEvent.entityId,
      action: "history.undone",
      metadata: { undone_event_id: rootEvent.id, batch_id: rootEvent.batchId },
      isUndoable: false,
    });

    return {
      undo_event_id: undoEventId,
      restored_entity_ids: restoredIds,
      skipped,
    };
  }

  /**
   * Redo an event that was previously undone
   */
  public async redoEvent(orgId: string, accountId: string, eventId: string) {
    const isDb = await checkDbConnection();
    let event: any;

    if (isDb) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.historyEvents)
        .where(and(eq(schema.historyEvents.id, eventId), eq(schema.historyEvents.organizationId, orgId)))
        .limit(1);
      event = row;
    } else {
      event = memRepo.historyEvents.find((e) => e.id === eventId && e.organizationId === orgId);
    }

    if (!event) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "History event not found." });
    }

    if (!event.undoneAt) {
      throw new AppError({
        statusCode: 409,
        code: "HISTORY_REDO_NOT_AVAILABLE",
        message: "This event is not in an undone state and cannot be redone.",
        details: { event_id: event.id },
      });
    }

    const action = event.action.toLowerCase();
    const entityType = event.entityType.toLowerCase();
    const entityId = event.entityId;

    if (action.includes("deleted")) {
      await this.applyDelete(orgId, entityType, entityId);
    } else if (action.includes("created")) {
      await this.applyRestore(orgId, entityType, entityId);
    } else if (action.includes("updated") && event.forwardPatch) {
      await this.applyPatch(orgId, entityType, entityId, event.forwardPatch);
    }

    const redoEventId = uuidv7();
    const now = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.historyEvents)
        .set({ undoneAt: null, undoneByEventId: null, redoneAt: now })
        .where(eq(schema.historyEvents.id, event.id));
    } else {
      event.undoneAt = null;
      event.undoneByEventId = null;
      event.redoneAt = now;
    }

    await this.recordEvent({
      orgId,
      accountId,
      entityType: event.entityType,
      entityId: event.entityId,
      action: "history.redone",
      metadata: { redone_event_id: event.id },
      isUndoable: false,
    });

    return {
      redo_event_id: redoEventId,
      restored_entity_ids: [entityId],
      skipped: [],
    };
  }

  // Helpers for applying undo/redo state mutations
  private async applyRestore(orgId: string, entityType: string, entityId: string) {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      if (entityType === "item") {
        await db.update(schema.items).set({ deletedAt: null }).where(eq(schema.items.id, entityId));
      } else if (entityType === "collection") {
        await db.update(schema.collections).set({ deletedAt: null }).where(eq(schema.collections.id, entityId));
      } else if (entityType === "group") {
        await db.update(schema.groups).set({ deletedAt: null }).where(eq(schema.groups.id, entityId));
      } else if (entityType === "space") {
        await db.update(schema.spaces).set({ deletedAt: null }).where(eq(schema.spaces.id, entityId));
      }
    } else {
      if (entityType === "item") {
        const it = memRepo.items.find((i) => i.id === entityId);
        if (it) it.deletedAt = null;
      } else if (entityType === "collection") {
        const c = memRepo.collections.find((i) => i.id === entityId);
        if (c) c.deletedAt = null;
      } else if (entityType === "group") {
        const g = memRepo.groups.find((i) => i.id === entityId);
        if (g) g.deletedAt = null;
      } else if (entityType === "space") {
        const s = memRepo.spaces.find((i) => i.id === entityId);
        if (s) s.deletedAt = null;
      }
    }
  }

  private async applyDelete(orgId: string, entityType: string, entityId: string) {
    const now = new Date();
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      if (entityType === "item") {
        await db.update(schema.items).set({ deletedAt: now }).where(eq(schema.items.id, entityId));
      } else if (entityType === "collection") {
        await db.update(schema.collections).set({ deletedAt: now }).where(eq(schema.collections.id, entityId));
      } else if (entityType === "group") {
        await db.update(schema.groups).set({ deletedAt: now }).where(eq(schema.groups.id, entityId));
      } else if (entityType === "space") {
        await db.update(schema.spaces).set({ deletedAt: now }).where(eq(schema.spaces.id, entityId));
      }
    } else {
      if (entityType === "item") {
        const it = memRepo.items.find((i) => i.id === entityId);
        if (it) it.deletedAt = now;
      } else if (entityType === "collection") {
        const c = memRepo.collections.find((i) => i.id === entityId);
        if (c) c.deletedAt = now;
      } else if (entityType === "group") {
        const g = memRepo.groups.find((i) => i.id === entityId);
        if (g) g.deletedAt = now;
      } else if (entityType === "space") {
        const s = memRepo.spaces.find((i) => i.id === entityId);
        if (s) s.deletedAt = now;
      }
    }
  }

  private async applyPatch(orgId: string, entityType: string, entityId: string, patch: Record<string, unknown>) {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      if (entityType === "item") {
        await db.update(schema.items).set(patch as any).where(eq(schema.items.id, entityId));
      } else if (entityType === "collection") {
        await db.update(schema.collections).set(patch as any).where(eq(schema.collections.id, entityId));
      } else if (entityType === "group") {
        await db.update(schema.groups).set(patch as any).where(eq(schema.groups.id, entityId));
      }
    } else {
      if (entityType === "item") {
        const it = memRepo.items.find((i) => i.id === entityId);
        if (it) Object.assign(it, patch);
      } else if (entityType === "collection") {
        const c = memRepo.collections.find((i) => i.id === entityId);
        if (c) Object.assign(c, patch);
      } else if (entityType === "group") {
        const g = memRepo.groups.find((i) => i.id === entityId);
        if (g) Object.assign(g, patch);
      }
    }
  }

  // =========================================================================
  // TRASH MANAGEMENT
  // =========================================================================

  /**
   * List all soft-deleted entities across the Org
   */
  public async getTrash(
    orgId: string,
    options: {
      entity_type?: string;
      purges_before?: string;
      limit?: number;
      cursor?: string;
    }
  ) {
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);
    const filterTypes = options.entity_type
      ? options.entity_type.split(",").map((t) => t.trim().toLowerCase())
      : undefined;

    const trashItems: TrashItemDto[] = [];
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      // Collections
      if (!filterTypes || filterTypes.includes("collection")) {
        const cols = await db
          .select()
          .from(schema.collections)
          .where(and(eq(schema.collections.organizationId, orgId), isNotNull(schema.collections.deletedAt)));
        for (const c of cols) {
          trashItems.push({
            entity_type: "collection",
            entity_id: c.id,
            name: c.name,
            deleted_at: c.deletedAt!.toISOString(),
            purges_at: new Date(c.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            deleted_by: { account_id: c.createdBy || null, name: "Member" },
            history_event_id: null,
            size_summary: { items: 0, groups: 0 },
          });
        }
      }

      // Groups
      if (!filterTypes || filterTypes.includes("group")) {
        const grps = await db
          .select()
          .from(schema.groups)
          .where(and(eq(schema.groups.organizationId, orgId), isNotNull(schema.groups.deletedAt)));
        for (const g of grps) {
          trashItems.push({
            entity_type: "group",
            entity_id: g.id,
            name: g.name,
            deleted_at: g.deletedAt!.toISOString(),
            purges_at: new Date(g.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            deleted_by: { account_id: null, name: "Member" },
            history_event_id: null,
            size_summary: { items: 0 },
          });
        }
      }

      // Items
      if (!filterTypes || filterTypes.includes("item")) {
        const its = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.organizationId, orgId), isNotNull(schema.items.deletedAt)));
        for (const i of its) {
          trashItems.push({
            entity_type: "item",
            entity_id: i.id,
            name: i.title,
            deleted_at: i.deletedAt!.toISOString(),
            purges_at: new Date(i.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            deleted_by: { account_id: null, name: "Member" },
            history_event_id: null,
            size_summary: {},
          });
        }
      }
    } else {
      if (!filterTypes || filterTypes.includes("collection")) {
        for (const c of memRepo.collections) {
          if (c.organizationId === orgId && c.deletedAt) {
            trashItems.push({
              entity_type: "collection",
              entity_id: c.id,
              name: c.name,
              deleted_at: c.deletedAt.toISOString(),
              purges_at: new Date(c.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              deleted_by: { account_id: c.createdBy || null, name: "Member" },
              history_event_id: null,
              size_summary: { items: 0, groups: 0 },
            });
          }
        }
      }

      if (!filterTypes || filterTypes.includes("group")) {
        for (const g of memRepo.groups) {
          if (g.organizationId === orgId && g.deletedAt) {
            trashItems.push({
              entity_type: "group",
              entity_id: g.id,
              name: g.name,
              deleted_at: g.deletedAt.toISOString(),
              purges_at: new Date(g.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              deleted_by: { account_id: null, name: "Member" },
              history_event_id: null,
              size_summary: { items: 0 },
            });
          }
        }
      }

      if (!filterTypes || filterTypes.includes("item")) {
        for (const i of memRepo.items) {
          if (i.organizationId === orgId && i.deletedAt) {
            trashItems.push({
              entity_type: "item",
              entity_id: i.id,
              name: i.title,
              deleted_at: i.deletedAt.toISOString(),
              purges_at: new Date(i.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              deleted_by: { account_id: null, name: "Member" },
              history_event_id: null,
              size_summary: {},
            });
          }
        }
      }
    }

    trashItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

    let startIndex = 0;
    if (options.cursor) {
      const parsed = parseInt(Buffer.from(options.cursor, "base64").toString("utf-8"), 10);
      if (!isNaN(parsed)) startIndex = parsed;
    }

    const paged = trashItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < trashItems.length;
    const nextCursor = hasMore ? Buffer.from(String(startIndex + limit)).toString("base64") : null;

    return {
      data: paged,
      page: {
        next_cursor: nextCursor,
        has_more: hasMore,
        limit,
      },
    };
  }

  /**
   * Bulk restore soft-deleted entities from Trash
   */
  public async restoreTrash(orgId: string, accountId: string, entityIds: string[]) {
    let restoredCount = 0;
    const restoredIds: string[] = [];

    for (const id of entityIds) {
      // Check each entity type
      let found = false;
      const isDb = await checkDbConnection();

      if (isDb) {
        const db = getDb();
        const [it] = await db.select().from(schema.items).where(eq(schema.items.id, id)).limit(1);
        if (it && it.deletedAt) {
          await db.update(schema.items).set({ deletedAt: null }).where(eq(schema.items.id, id));
          found = true;
        }

        if (!found) {
          const [col] = await db.select().from(schema.collections).where(eq(schema.collections.id, id)).limit(1);
          if (col && col.deletedAt) {
            await db.update(schema.collections).set({ deletedAt: null }).where(eq(schema.collections.id, id));
            found = true;
          }
        }

        if (!found) {
          const [grp] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1);
          if (grp && grp.deletedAt) {
            await db.update(schema.groups).set({ deletedAt: null }).where(eq(schema.groups.id, id));
            found = true;
          }
        }

        if (!found) {
          const [sp] = await db.select().from(schema.spaces).where(eq(schema.spaces.id, id)).limit(1);
          if (sp && sp.deletedAt) {
            await db.update(schema.spaces).set({ deletedAt: null }).where(eq(schema.spaces.id, id));
            found = true;
          }
        }
      } else {
        const it = memRepo.items.find((i) => i.id === id);
        if (it && it.deletedAt) {
          it.deletedAt = null;
          found = true;
        }

        if (!found) {
          const col = memRepo.collections.find((c) => c.id === id);
          if (col && col.deletedAt) {
            col.deletedAt = null;
            found = true;
          }
        }

        if (!found) {
          const grp = memRepo.groups.find((g) => g.id === id);
          if (grp && grp.deletedAt) {
            grp.deletedAt = null;
            found = true;
          }
        }

        if (!found) {
          const sp = memRepo.spaces.find((s) => s.id === id);
          if (sp && sp.deletedAt) {
            sp.deletedAt = null;
            found = true;
          }
        }
      }

      if (found) {
        restoredCount++;
        restoredIds.push(id);
      }
    }

    if (restoredCount > 0) {
      await this.recordEvent({
        orgId,
        accountId,
        entityType: "trash",
        entityId: restoredIds[0],
        action: "trash.restored",
        metadata: { restored_ids: restoredIds },
        isUndoable: false,
      });
    }

    return {
      restored_count: restoredCount,
      restored_ids: restoredIds,
    };
  }

  /**
   * Hard-delete specified entities from Trash
   */
  public async purgeTrash(orgId: string, entityIds: string[]) {
    let purgedCount = 0;
    const purgedIds: string[] = [];
    const isDb = await checkDbConnection();

    for (const id of entityIds) {
      if (isDb) {
        const db = getDb();
        await db.delete(schema.items).where(eq(schema.items.id, id));
        await db.delete(schema.groups).where(eq(schema.groups.id, id));
        await db.delete(schema.collections).where(eq(schema.collections.id, id));
        await db.delete(schema.spaces).where(eq(schema.spaces.id, id));
        purgedCount++;
        purgedIds.push(id);
      } else {
        const itemIdx = memRepo.items.findIndex((i) => i.id === id);
        if (itemIdx !== -1) {
          memRepo.items.splice(itemIdx, 1);
          purgedCount++;
          purgedIds.push(id);
          continue;
        }

        const grpIdx = memRepo.groups.findIndex((g) => g.id === id);
        if (grpIdx !== -1) {
          memRepo.groups.splice(grpIdx, 1);
          purgedCount++;
          purgedIds.push(id);
          continue;
        }

        const colIdx = memRepo.collections.findIndex((c) => c.id === id);
        if (colIdx !== -1) {
          memRepo.collections.splice(colIdx, 1);
          purgedCount++;
          purgedIds.push(id);
          continue;
        }

        const spIdx = memRepo.spaces.findIndex((s) => s.id === id);
        if (spIdx !== -1) {
          memRepo.spaces.splice(spIdx, 1);
          purgedCount++;
          purgedIds.push(id);
        }
      }
    }

    return {
      purged_count: purgedCount,
      purged_ids: purgedIds,
    };
  }

  /**
   * Hard-delete all soft-deleted entities in Org
   */
  public async emptyTrash(orgId: string) {
    let purgedCount = 0;
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db.delete(schema.items).where(and(eq(schema.items.organizationId, orgId), isNotNull(schema.items.deletedAt)));
      await db.delete(schema.groups).where(and(eq(schema.groups.organizationId, orgId), isNotNull(schema.groups.deletedAt)));
      await db.delete(schema.collections).where(and(eq(schema.collections.organizationId, orgId), isNotNull(schema.collections.deletedAt)));
      await db.delete(schema.spaces).where(and(eq(schema.spaces.organizationId, orgId), isNotNull(schema.spaces.deletedAt)));
      purgedCount = 1;
    } else {
      const delItems = memRepo.items.filter((i) => i.organizationId === orgId && i.deletedAt);
      purgedCount += delItems.length;
      memRepo.items = memRepo.items.filter((i) => !(i.organizationId === orgId && i.deletedAt));

      const delGroups = memRepo.groups.filter((g) => g.organizationId === orgId && g.deletedAt);
      purgedCount += delGroups.length;
      memRepo.groups = memRepo.groups.filter((g) => !(g.organizationId === orgId && g.deletedAt));

      const delCols = memRepo.collections.filter((c) => c.organizationId === orgId && c.deletedAt);
      purgedCount += delCols.length;
      memRepo.collections = memRepo.collections.filter((c) => !(c.organizationId === orgId && c.deletedAt));

      const delSpaces = memRepo.spaces.filter((s) => s.organizationId === orgId && s.deletedAt);
      purgedCount += delSpaces.length;
      memRepo.spaces = memRepo.spaces.filter((s) => !(s.organizationId === orgId && s.deletedAt));
    }

    return {
      job_id: uuidv7(),
      purged_count: purgedCount,
      status: "completed",
    };
  }
}

export const historyService = new HistoryService();
