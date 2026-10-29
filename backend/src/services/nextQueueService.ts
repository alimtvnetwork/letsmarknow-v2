import { eq, and, desc, asc } from "drizzle-orm";
import { EventEmitter } from "node:events";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemNextItem, type MemCollection } from "../db/memRepo.js";

export type NextSourceKind =
  | "collection"
  | "browser_tab"
  | "manual"
  | "session"
  | "bulk";

export interface AddToNextInput {
  itemId?: string | null;
  url: string;
  title?: string | null;
  faviconUrl?: string | null;
  sourceKind?: NextSourceKind;
  sourceCollectionId?: string | null;
  position?: number;
  insertPosition?: "top" | "bottom";
}

export interface UpdateNextItemInput {
  isDone?: boolean;
  position?: number;
  titleSnapshot?: string;
}

export interface NextQueueItemOutput {
  id: string;
  accountId: string;
  nextCollectionId: string;
  itemId: string | null;
  sourceCollectionId: string | null;
  titleSnapshot: string;
  urlSnapshot: string;
  faviconUrlSnapshot: string | null;
  position: number;
  isDone: boolean;
  isTombstone: boolean;
  createdAt: string;
  updatedAt: string;
  isExisting?: boolean;
  reopened?: boolean;
  softCapWarning?: boolean;
}

export interface NextQueueEvent {
  type: "next.item.added" | "next.item.updated" | "next.item.removed" | "next.item.tombstoned";
  channel: `account:${string}:next`;
  data: {
    item?: NextQueueItemOutput;
    itemId?: string;
    accountId: string;
    timestamp: string;
  };
}

class NextQueueEventEmitter extends EventEmitter {
  public broadcast(accountId: string, event: NextQueueEvent) {
    this.emit(`account:${accountId}:next`, event);
  }

  public subscribe(
    accountId: string,
    listener: (event: NextQueueEvent) => void
  ): () => void {
    const channel = `account:${accountId}:next`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }
}

export const nextQueueEvents = new NextQueueEventEmitter();

function formatItem(item: any): NextQueueItemOutput {
  return {
    id: item.id,
    accountId: item.accountId,
    nextCollectionId: item.nextCollectionId,
    itemId: item.itemId ?? null,
    sourceCollectionId: item.sourceCollectionId ?? null,
    titleSnapshot: item.titleSnapshot,
    urlSnapshot: item.urlSnapshot,
    faviconUrlSnapshot: item.faviconUrlSnapshot ?? null,
    position: Number(item.position) || 0,
    isDone: Boolean(item.isDone),
    isTombstone: Boolean(item.isTombstone),
    createdAt:
      item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : new Date(item.createdAt).toISOString(),
    updatedAt:
      item.updatedAt instanceof Date
        ? item.updatedAt.toISOString()
        : new Date(item.updatedAt).toISOString(),
  };
}

export class NextQueueService {
  /**
   * Returns or lazily creates the singleton Next collection for this account.
   * Per spec 07-features/17-next-queue.md §4 & 02-data-model/03-collection.md:
   * Exactly one Collection with kind = 'next' per Account.
   */
  public async getOrCreateNextCollection(
    accountId: string,
    organizationId?: string
  ): Promise<{ id: string; name: string; kind: string; organizationId: string }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const bookmarksDb = getDb("bookmarks");
      const workspaceDb = getDb("workspace");

      const existing = await bookmarksDb
        .select()
        .from(schema.collections)
        .where(
          and(
            eq(schema.collections.accountId, accountId),
            eq(schema.collections.kind, "next")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          id: existing[0].id,
          name: existing[0].name,
          kind: existing[0].kind,
          organizationId: existing[0].organizationId,
        };
      }

      // Look up orgId from workspace domain
      let orgId = organizationId;
      if (!orgId) {
        const member = await workspaceDb
          .select({ orgId: schema.orgMembers.organizationId })
          .from(schema.orgMembers)
          .where(eq(schema.orgMembers.accountId, accountId))
          .limit(1);
        orgId = member[0]?.orgId;
      }
      if (!orgId) {
        // Fallback to any organization
        const anyOrg = await workspaceDb
          .select({ id: schema.organizations.id })
          .from(schema.organizations)
          .limit(1);
        orgId = anyOrg[0]?.id || "default-org";
      }

      const id = uuidv7();
      const now = new Date();
      await bookmarksDb.insert(schema.collections).values({
        id,
        organizationId: orgId,
        accountId,
        name: "Next",
        slug: "next",
        description: "Personal to-do queue of saved Tabs",
        kind: "next",
        color: "none",
        isStarred: false,
        position: 0,
        viewMode: "list",
        createdBy: accountId,
        updatedBy: accountId,
        createdAt: now,
        updatedAt: now,
      });

      return { id, name: "Next", kind: "next", organizationId: orgId };
    }

    // In-memory fallback
    const memCol = memRepo.collections.find(
      (c) => c.kind === "next" && (c as any).accountId === accountId
    );
    if (memCol) {
      return {
        id: memCol.id,
        name: memCol.name,
        kind: memCol.kind,
        organizationId: memCol.organizationId,
      };
    }

    const orgId =
      organizationId ||
      memRepo.members.find((m) => m.accountId === accountId)?.organizationId ||
      Array.from(memRepo.organizations.keys())[0] ||
      "org-pe-default";

    const id = uuidv7();
    const now = new Date();
    const newCol: MemCollection & { accountId?: string; kind: string } = {
      id,
      organizationId: orgId,
      spaceId: "",
      accountId,
      name: "Next",
      slug: "next",
      description: "Personal to-do queue of saved Tabs",
      kind: "next",
      position: 0,
      createdBy: accountId,
      createdAt: now,
      updatedAt: now,
    };
    memRepo.collections.push(newCol as MemCollection);

    return { id, name: "Next", kind: "next", organizationId: orgId };
  }

  /**
   * Lists all Next items for the account, ordered by position ASC.
   */
  public async listNextItems(
    accountId: string,
    options: { includeDone?: boolean } = {}
  ): Promise<{ items: NextQueueItemOutput[]; totalCount: number; openCount: number }> {
    const isDb = await checkDbConnection();
    await this.getOrCreateNextCollection(accountId);

    if (isDb) {
      const db = getDb("bookmarks");
      const conditions = [eq(schema.nextItems.accountId, accountId)];
      if (options.includeDone === false) {
        conditions.push(eq(schema.nextItems.isDone, false));
      }

      const rows = await db
        .select()
        .from(schema.nextItems)
        .where(and(...conditions))
        .orderBy(asc(schema.nextItems.position), asc(schema.nextItems.createdAt));

      const items = rows.map(formatItem);
      const openCount = items.filter((i) => !i.isDone).length;

      return {
        items,
        totalCount: items.length,
        openCount,
      };
    }

    // In-memory fallback
    let rows = memRepo.nextItems.filter((i) => i.accountId === accountId);
    if (options.includeDone === false) {
      rows = rows.filter((i) => !i.isDone);
    }
    rows.sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime());

    const items = rows.map(formatItem);
    const openCount = items.filter((i) => !i.isDone).length;

    return {
      items,
      totalCount: items.length,
      openCount,
    };
  }

  /**
   * Adds an item to the Next queue with strict idempotency and cap checks.
   * Spec 07-features/17-next-queue.md §5 & §9:
   * - Duplicate open URL: no-op with toast "Already in Next".
   * - Duplicate done URL: un-archive existing row, re-position.
   * - Soft cap (500): warning.
   * - Hard cap (2000): blocks add.
   */
  public async addToNext(
    accountId: string,
    input: AddToNextInput
  ): Promise<NextQueueItemOutput> {
    if (!input.url || typeof input.url !== "string") {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "URL is required to Add to Next.",
        field: "url",
      });
    }

    const nextCol = await this.getOrCreateNextCollection(accountId);
    const isDb = await checkDbConnection();
    const cleanUrl = input.url.trim();
    const now = new Date();

    if (isDb) {
      const db = getDb("bookmarks");

      // Check current count against limits
      const allRows = await db
        .select()
        .from(schema.nextItems)
        .where(eq(schema.nextItems.accountId, accountId));

      if (allRows.length >= 2000) {
        throw new AppError({
          statusCode: 400,
          code: "NEXT_QUEUE_FULL",
          message: "Next is full. Archive completed items first.",
        });
      }

      // Check for existing duplicate by URL or itemId
      const existing = allRows.find(
        (r) =>
          (input.itemId && r.itemId === input.itemId) ||
          r.urlSnapshot.toLowerCase() === cleanUrl.toLowerCase()
      );

      if (existing) {
        if (!existing.isDone) {
          // Idempotency: Already open -> no-op
          const res = formatItem(existing);
          res.isExisting = true;
          return res;
        }

        // Idempotency: Exists and done -> un-archive it
        const newPos =
          input.insertPosition === "top"
            ? (allRows.length > 0 ? Math.min(...allRows.map((r) => r.position)) - 1024 : 0)
            : (allRows.length > 0 ? Math.max(...allRows.map((r) => r.position)) + 1024 : 0);

        await db
          .update(schema.nextItems)
          .set({
            isDone: false,
            position: newPos,
            updatedAt: now,
          })
          .where(eq(schema.nextItems.id, existing.id));

        const updated = formatItem({
          ...existing,
          isDone: false,
          position: newPos,
          updatedAt: now,
        });
        updated.reopened = true;

        this.broadcastEvent(accountId, "next.item.updated", updated);
        return updated;
      }

      // Calculate position
      let newPosition = input.position;
      if (newPosition === undefined) {
        if (allRows.length === 0) {
          newPosition = 1024;
        } else if (input.insertPosition === "top") {
          const minPos = Math.min(...allRows.map((r) => r.position));
          newPosition = minPos - 1024;
        } else {
          const maxPos = Math.max(...allRows.map((r) => r.position));
          newPosition = maxPos + 1024;
        }
      }

      const id = uuidv7();
      const title = input.title?.trim() || cleanUrl;

      await db.insert(schema.nextItems).values({
        id,
        accountId,
        nextCollectionId: nextCol.id,
        itemId: input.itemId ?? null,
        sourceCollectionId: input.sourceCollectionId ?? null,
        titleSnapshot: title,
        urlSnapshot: cleanUrl,
        faviconUrlSnapshot: input.faviconUrl ?? null,
        position: newPosition,
        isDone: false,
        isTombstone: false,
        createdAt: now,
        updatedAt: now,
      });

      const created = formatItem({
        id,
        accountId,
        nextCollectionId: nextCol.id,
        itemId: input.itemId ?? null,
        sourceCollectionId: input.sourceCollectionId ?? null,
        titleSnapshot: title,
        urlSnapshot: cleanUrl,
        faviconUrlSnapshot: input.faviconUrl ?? null,
        position: newPosition,
        isDone: false,
        isTombstone: false,
        createdAt: now,
        updatedAt: now,
      });

      if (allRows.length + 1 >= 500) {
        created.softCapWarning = true;
      }

      this.broadcastEvent(accountId, "next.item.added", created);
      return created;
    }

    // In-memory fallback
    const allRows = memRepo.nextItems.filter((i) => i.accountId === accountId);
    if (allRows.length >= 2000) {
      throw new AppError({
        statusCode: 400,
        code: "NEXT_QUEUE_FULL",
        message: "Next is full. Archive completed items first.",
      });
    }

    const existing = allRows.find(
      (r) =>
        (input.itemId && r.itemId === input.itemId) ||
        r.urlSnapshot.toLowerCase() === cleanUrl.toLowerCase()
    );

    if (existing) {
      if (!existing.isDone) {
        const res = formatItem(existing);
        res.isExisting = true;
        return res;
      }

      const newPos =
        input.insertPosition === "top"
          ? (allRows.length > 0 ? Math.min(...allRows.map((r) => r.position)) - 1024 : 0)
          : (allRows.length > 0 ? Math.max(...allRows.map((r) => r.position)) + 1024 : 0);

      existing.isDone = false;
      existing.position = newPos;
      existing.updatedAt = now;

      const updated = formatItem(existing);
      updated.reopened = true;

      this.broadcastEvent(accountId, "next.item.updated", updated);
      return updated;
    }

    let newPosition = input.position;
    if (newPosition === undefined) {
      if (allRows.length === 0) {
        newPosition = 1024;
      } else if (input.insertPosition === "top") {
        const minPos = Math.min(...allRows.map((r) => r.position));
        newPosition = minPos - 1024;
      } else {
        const maxPos = Math.max(...allRows.map((r) => r.position));
        newPosition = maxPos + 1024;
      }
    }

    const id = uuidv7();
    const title = input.title?.trim() || cleanUrl;
    const newItem: MemNextItem = {
      id,
      accountId,
      nextCollectionId: nextCol.id,
      itemId: input.itemId ?? null,
      sourceCollectionId: input.sourceCollectionId ?? null,
      titleSnapshot: title,
      urlSnapshot: cleanUrl,
      faviconUrlSnapshot: input.faviconUrl ?? null,
      position: newPosition,
      isDone: false,
      isTombstone: false,
      createdAt: now,
      updatedAt: now,
    };

    memRepo.nextItems.push(newItem);
    const created = formatItem(newItem);

    if (allRows.length + 1 >= 500) {
      created.softCapWarning = true;
    }

    this.broadcastEvent(accountId, "next.item.added", created);
    return created;
  }

  /**
   * Updates a Next item (e.g. toggle isDone, reorder position).
   */
  public async updateNextItem(
    accountId: string,
    id: string,
    patch: UpdateNextItemInput
  ): Promise<NextQueueItemOutput> {
    const isDb = await checkDbConnection();
    const now = new Date();

    if (isDb) {
      const db = getDb("bookmarks");
      const rows = await db
        .select()
        .from(schema.nextItems)
        .where(
          and(
            eq(schema.nextItems.id, id),
            eq(schema.nextItems.accountId, accountId)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NEXT_ITEM_NOT_FOUND",
          message: "Next item not found.",
        });
      }

      const updates: any = { updatedAt: now };
      if (patch.isDone !== undefined) updates.isDone = patch.isDone;
      if (patch.position !== undefined) updates.position = patch.position;
      if (patch.titleSnapshot !== undefined) updates.titleSnapshot = patch.titleSnapshot;

      await db
        .update(schema.nextItems)
        .set(updates)
        .where(eq(schema.nextItems.id, id));

      const updated = formatItem({ ...rows[0], ...updates });
      this.broadcastEvent(accountId, "next.item.updated", updated);
      return updated;
    }

    // In-memory fallback
    const item = memRepo.nextItems.find(
      (i) => i.id === id && i.accountId === accountId
    );
    if (!item) {
      throw new AppError({
        statusCode: 404,
        code: "NEXT_ITEM_NOT_FOUND",
        message: "Next item not found.",
      });
    }

    if (patch.isDone !== undefined) item.isDone = patch.isDone;
    if (patch.position !== undefined) item.position = patch.position;
    if (patch.titleSnapshot !== undefined) item.titleSnapshot = patch.titleSnapshot;
    item.updatedAt = now;

    const updated = formatItem(item);
    this.broadcastEvent(accountId, "next.item.updated", updated);
    return updated;
  }

  /**
   * Removes an item from the Next queue.
   */
  public async removeNextItem(
    accountId: string,
    id: string
  ): Promise<{ ok: boolean; removedId: string }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb("bookmarks");
      const rows = await db
        .select()
        .from(schema.nextItems)
        .where(
          and(
            eq(schema.nextItems.id, id),
            eq(schema.nextItems.accountId, accountId)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NEXT_ITEM_NOT_FOUND",
          message: "Next item not found.",
        });
      }

      await db
        .delete(schema.nextItems)
        .where(eq(schema.nextItems.id, id));

      this.broadcastEvent(accountId, "next.item.removed", undefined, id);
      return { ok: true, removedId: id };
    }

    // In-memory fallback
    const index = memRepo.nextItems.findIndex(
      (i) => i.id === id && i.accountId === accountId
    );
    if (index === -1) {
      throw new AppError({
        statusCode: 404,
        code: "NEXT_ITEM_NOT_FOUND",
        message: "Next item not found.",
      });
    }

    memRepo.nextItems.splice(index, 1);
    this.broadcastEvent(accountId, "next.item.removed", undefined, id);
    return { ok: true, removedId: id };
  }

  /**
   * Clears completed (isDone = true) items from the Next queue.
   */
  public async clearCompleted(
    accountId: string
  ): Promise<{ deletedCount: number }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb("bookmarks");
      const doneItems = await db
        .select()
        .from(schema.nextItems)
        .where(
          and(
            eq(schema.nextItems.accountId, accountId),
            eq(schema.nextItems.isDone, true)
          )
        );

      if (doneItems.length > 0) {
        await db
          .delete(schema.nextItems)
          .where(
            and(
              eq(schema.nextItems.accountId, accountId),
              eq(schema.nextItems.isDone, true)
            )
          );

        for (const item of doneItems) {
          this.broadcastEvent(accountId, "next.item.removed", undefined, item.id);
        }
      }

      return { deletedCount: doneItems.length };
    }

    // In-memory fallback
    const initialLen = memRepo.nextItems.length;
    const removed: string[] = [];
    memRepo.nextItems = memRepo.nextItems.filter((i) => {
      if (i.accountId === accountId && i.isDone) {
        removed.push(i.id);
        return false;
      }
      return true;
    });

    for (const id of removed) {
      this.broadcastEvent(accountId, "next.item.removed", undefined, id);
    }

    return { deletedCount: removed.length };
  }

  private broadcastEvent(
    accountId: string,
    type: NextQueueEvent["type"],
    item?: NextQueueItemOutput,
    itemId?: string
  ) {
    nextQueueEvents.broadcast(accountId, {
      type,
      channel: `account:${accountId}:next`,
      data: {
        item,
        itemId: itemId || item?.id,
        accountId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const nextQueueService = new NextQueueService();
