import { eq, and, like, desc, asc } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo } from "../db/memRepo.js";

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
}

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class TagService {
  public async listTags(
    orgId: string,
    options: {
      q?: string;
      sort?: "name" | "-usage_count" | "-created_at";
      limit?: number;
    } = {}
  ) {
    const isDb = await checkDbConnection();
    const limit = Math.min(options.limit || 100, 500);

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.tags.organizationId, orgId)];

      if (options.q) {
        conditions.push(like(schema.tags.name, `%${options.q.trim()}%`));
      }

      let orderClause = asc(schema.tags.name);
      if (options.sort === "-usage_count") {
        orderClause = desc(schema.tags.usageCountCache);
      } else if (options.sort === "-created_at") {
        orderClause = desc(schema.tags.createdAt);
      }

      const rows = await db
        .select()
        .from(schema.tags)
        .where(and(...conditions))
        .orderBy(orderClause)
        .limit(limit);

      return rows.map((t) => ({
        id: t.id,
        organization_id: t.organizationId,
        name: t.name,
        slug: deriveSlug(t.name),
        color: t.color,
        usage_count: t.usageCountCache,
        created_by: t.createdBy,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      }));
    } else {
      let filtered = memRepo.tags.filter((t) => t.organizationId === orgId);

      if (options.q) {
        const query = options.q.toLowerCase().trim();
        filtered = filtered.filter((t) => t.name.toLowerCase().includes(query));
      }

      filtered.sort((a, b) => {
        if (options.sort === "-usage_count") {
          return b.usageCountCache - a.usageCountCache;
        } else if (options.sort === "-created_at") {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.name.localeCompare(b.name);
      });

      return filtered.slice(0, limit).map((t) => ({
        id: t.id,
        organization_id: t.organizationId,
        name: t.name,
        slug: deriveSlug(t.name),
        color: t.color,
        usage_count: t.usageCountCache,
        created_by: t.createdBy || null,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      }));
    }
  }

  public async createTag(orgId: string, accountId: string, input: CreateTagInput) {
    const cleanName = input.name?.trim();
    if (!cleanName || cleanName.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Tag name is required.",
        details: { field: "name" },
      });
    }

    if (cleanName.length > 40) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Tag name must be 40 characters or fewer.",
        details: { field: "name" },
      });
    }

    const isDb = await checkDbConnection();

    // Check case-insensitive uniqueness within org
    if (isDb) {
      const db = getDb();
      const existing = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.organizationId, orgId),
            like(schema.tags.name, cleanName)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `A tag with name '${cleanName}' already exists.`,
          details: { reason: "name_exists" },
        });
      }

      const tagId = uuidv7();
      await db.insert(schema.tags).values({
        id: tagId,
        organizationId: orgId,
        name: cleanName,
        color: input.color || "purple",
        createdBy: accountId,
      });

      const now = new Date();
      memRepo.tags.push({
        id: tagId,
        organizationId: orgId,
        name: cleanName,
        color: input.color || "purple",
        usageCountCache: 0,
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });

      return this.getTag(orgId, tagId);
    } else {
      const existing = memRepo.tags.find(
        (t) => t.organizationId === orgId && t.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existing) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `A tag with name '${cleanName}' already exists.`,
          details: { reason: "name_exists" },
        });
      }

      const tagId = uuidv7();
      const now = new Date();
      memRepo.tags.push({
        id: tagId,
        organizationId: orgId,
        name: cleanName,
        color: input.color || "purple",
        usageCountCache: 0,
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });

      return this.getTag(orgId, tagId);
    }
  }

  public async getTag(orgId: string, tagId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.tags)
        .where(and(eq(schema.tags.id, tagId), eq(schema.tags.organizationId, orgId)))
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Tag not found." });
      }

      const t = rows[0];
      return {
        id: t.id,
        organization_id: t.organizationId,
        name: t.name,
        slug: deriveSlug(t.name),
        color: t.color,
        usage_count: t.usageCountCache,
        created_by: t.createdBy,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      };
    } else {
      const t = memRepo.tags.find((tag) => tag.id === tagId && tag.organizationId === orgId);
      if (!t) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Tag not found." });
      }

      return {
        id: t.id,
        organization_id: t.organizationId,
        name: t.name,
        slug: deriveSlug(t.name),
        color: t.color,
        usage_count: t.usageCountCache,
        created_by: t.createdBy || null,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      };
    }
  }

  public async updateTag(orgId: string, tagId: string, input: UpdateTagInput) {
    await this.getTag(orgId, tagId);
    const isDb = await checkDbConnection();

    if (input.name) {
      const cleanName = input.name.trim();
      // Check collision
      if (isDb) {
        const db = getDb();
        const existing = await db
          .select()
          .from(schema.tags)
          .where(
            and(
              eq(schema.tags.organizationId, orgId),
              like(schema.tags.name, cleanName)
            )
          )
          .limit(1);

        if (existing.length > 0 && existing[0].id !== tagId) {
          throw new AppError({
            statusCode: 409,
            code: "CONFLICT",
            message: `A tag with name '${cleanName}' already exists.`,
            details: { reason: "name_exists" },
          });
        }
      } else {
        const existing = memRepo.tags.find(
          (t) =>
            t.organizationId === orgId &&
            t.id !== tagId &&
            t.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (existing) {
          throw new AppError({
            statusCode: 409,
            code: "CONFLICT",
            message: `A tag with name '${cleanName}' already exists.`,
            details: { reason: "name_exists" },
          });
        }
      }
    }

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.tags)
        .set({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.tags.id, tagId), eq(schema.tags.organizationId, orgId)));
    } else {
      const t = memRepo.tags.find((tag) => tag.id === tagId && tag.organizationId === orgId);
      if (t) {
        if (input.name !== undefined) t.name = input.name.trim();
        if (input.color !== undefined) t.color = input.color;
        t.updatedAt = new Date();
      }
    }

    return this.getTag(orgId, tagId);
  }

  public async deleteTag(orgId: string, tagId: string) {
    await this.getTag(orgId, tagId);
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      // Cascade delete on itemTags handled by schema onDelete: 'cascade'
      await db
        .delete(schema.tags)
        .where(and(eq(schema.tags.id, tagId), eq(schema.tags.organizationId, orgId)));
    } else {
      memRepo.tags = memRepo.tags.filter((t) => t.id !== tagId);
      memRepo.itemTags = memRepo.itemTags.filter((it) => it.tagId !== tagId);
    }
  }

  public async suggestTags(orgId: string, q: string, limit = 10) {
    const cleanQ = q.trim();
    if (!cleanQ) return [];

    const existingTags = await this.listTags(orgId, { q: cleanQ, limit });
    const exactMatch = existingTags.some(
      (t) => t.name.toLowerCase() === cleanQ.toLowerCase()
    );

    const suggestions = existingTags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      match: "prefix",
    }));

    if (!exactMatch) {
      suggestions.push({
        id: null as unknown as string,
        name: cleanQ,
        color: null as unknown as string,
        match: "create_new",
      });
    }

    return suggestions;
  }

  public async getItemTagIds(itemId: string): Promise<string[]> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select({ tagId: schema.itemTags.tagId })
        .from(schema.itemTags)
        .where(eq(schema.itemTags.itemId, itemId));
      return rows.map((r) => r.tagId);
    } else {
      return memRepo.itemTags
        .filter((it) => it.itemId === itemId)
        .map((it) => it.tagId);
    }
  }

  public async setItemTags(
    orgId: string,
    accountId: string,
    itemId: string,
    input: {
      add?: string[];
      remove?: string[];
      create?: Array<{ name: string; color?: string }>;
    }
  ) {
    const isDb = await checkDbConnection();

    // 1. Create any on-the-fly tags
    const createdTagIds: string[] = [];
    if (input.create && input.create.length > 0) {
      for (const toCreate of input.create) {
        try {
          const newTag = await this.createTag(orgId, accountId, toCreate);
          createdTagIds.push(newTag.id);
        } catch (err) {
          // If already exists, find it and add it
          if (err instanceof AppError && err.code === "CONFLICT") {
            const existing = await this.listTags(orgId, { q: toCreate.name, limit: 1 });
            if (existing[0]) createdTagIds.push(existing[0].id);
          }
        }
      }
    }

    const tagsToAdd = [...(input.add || []), ...createdTagIds];
    const tagsToRemove = new Set(input.remove || []);

    if (isDb) {
      const db = getDb();
      // Remove
      for (const removeId of tagsToRemove) {
        await db
          .delete(schema.itemTags)
          .where(
            and(
              eq(schema.itemTags.itemId, itemId),
              eq(schema.itemTags.tagId, removeId)
            )
          );
      }

      // Add
      for (const addId of tagsToAdd) {
        if (tagsToRemove.has(addId)) continue;
        try {
          await db.insert(schema.itemTags).values({
            itemId,
            tagId: addId,
          });
        } catch {
          // Ignore duplicate junction inserts
        }
      }
    } else {
      // Remove
      memRepo.itemTags = memRepo.itemTags.filter(
        (it) => !(it.itemId === itemId && tagsToRemove.has(it.tagId))
      );

      // Add
      for (const addId of tagsToAdd) {
        if (tagsToRemove.has(addId)) continue;
        const exists = memRepo.itemTags.some(
          (it) => it.itemId === itemId && it.tagId === addId
        );
        if (!exists) {
          memRepo.itemTags.push({ itemId, tagId: addId });
        }
      }
    }

    // Return all attached tag IDs for item
    return this.getItemTagIds(itemId);
  }
}

export const tagService = new TagService();
