import { eq, and, isNull } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemSpace, type MemCollection, type MemGroup } from "../db/memRepo.js";

export interface CreateSpaceInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: "private" | "org";
}

export interface UpdateSpaceInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: "private" | "org";
  position?: number;
}

export interface CreateCollectionInput {
  spaceId: string;
  name: string;
  description?: string;
  color?: string;
  viewMode?: "list" | "grid" | "compact" | "mindmap" | "column";
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  color?: string;
  isStarred?: boolean;
  viewMode?: "list" | "grid" | "compact" | "mindmap" | "column";
  position?: number;
}

export interface CreateGroupInput {
  collectionId: string;
  name: string;
  color?: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  position?: number;
}

export class WorkspaceService {
  // ===================== SPACES =====================
  public async listSpaces(orgId: string, options: { includeDeleted?: boolean } = {}) {
    const isDb = await checkDbConnection();
    const includeDeleted = options.includeDeleted === true;

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.spaces.organizationId, orgId)];
      if (!includeDeleted) {
        conditions.push(isNull(schema.spaces.deletedAt));
      }

      const rows = await db
        .select()
        .from(schema.spaces)
        .where(and(...conditions));

      return rows.map((s) => ({
        id: s.id,
        organization_id: s.organizationId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        color: s.color,
        position: s.position,
        is_starred: false,
        visibility: s.isPrivate ? "private" : "org",
        collection_count: 0,
        deleted_at: s.deletedAt ? s.deletedAt.toISOString() : null,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));
    } else {
      const rows = memRepo.spaces.filter((s) => {
        if (s.organizationId !== orgId) return false;
        if (!includeDeleted && s.deletedAt) return false;
        return true;
      });

      return rows.map((s) => {
        const colCount = memRepo.collections.filter(
          (c) => c.spaceId === s.id && !c.deletedAt
        ).length;

        return {
          id: s.id,
          organization_id: s.organizationId,
          name: s.name,
          slug: s.slug,
          description: s.description || null,
          icon: s.icon || null,
          color: s.color || null,
          position: s.position,
          is_starred: false,
          visibility: s.isPrivate ? "private" : "org",
          collection_count: colCount,
          deleted_at: s.deletedAt ? s.deletedAt.toISOString() : null,
          created_at: s.createdAt.toISOString(),
          updated_at: s.updatedAt.toISOString(),
        };
      });
    }
  }

  public async createSpace(orgId: string, accountId: string, input: CreateSpaceInput) {
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Space name is required.",
      });
    }

    const spaceId = uuidv7();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}-${spaceId.slice(0, 6)}`;
    const now = new Date();
    const isPrivate = input.visibility === "private";
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.spaces).values({
        id: spaceId,
        organizationId: orgId,
        name: cleanName,
        slug,
        description: input.description,
        icon: input.icon,
        color: input.color,
        isPrivate,
        createdBy: accountId,
      });
    } else {
      memRepo.spaces.push({
        id: spaceId,
        organizationId: orgId,
        name: cleanName,
        slug,
        description: input.description,
        icon: input.icon,
        color: input.color,
        position: (memRepo.spaces.filter((s) => s.organizationId === orgId).length + 1) * 1024,
        isPrivate,
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return this.getSpace(orgId, spaceId);
  }

  public async getSpace(orgId: string, spaceId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.spaces)
        .where(
          and(
            eq(schema.spaces.id, spaceId),
            eq(schema.spaces.organizationId, orgId),
            isNull(schema.spaces.deletedAt)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Space not found." });
      }

      const s = rows[0];
      return {
        id: s.id,
        organization_id: s.organizationId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        color: s.color,
        position: s.position,
        is_starred: false,
        visibility: s.isPrivate ? "private" : "org",
        collection_count: 0,
        deleted_at: s.deletedAt ? s.deletedAt.toISOString() : null,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      };
    } else {
      const s = memRepo.spaces.find(
        (sp) => sp.id === spaceId && sp.organizationId === orgId && !sp.deletedAt
      );

      if (!s) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Space not found." });
      }

      const colCount = memRepo.collections.filter(
        (c) => c.spaceId === s.id && !c.deletedAt
      ).length;

      return {
        id: s.id,
        organization_id: s.organizationId,
        name: s.name,
        slug: s.slug,
        description: s.description || null,
        icon: s.icon || null,
        color: s.color || null,
        position: s.position,
        is_starred: false,
        visibility: s.isPrivate ? "private" : "org",
        collection_count: colCount,
        deleted_at: s.deletedAt ? s.deletedAt.toISOString() : null,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      };
    }
  }

  public async updateSpace(orgId: string, spaceId: string, input: UpdateSpaceInput) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.spaces)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.visibility !== undefined ? { isPrivate: input.visibility === "private" } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.spaces.id, spaceId),
            eq(schema.spaces.organizationId, orgId)
          )
        );
    } else {
      const s = memRepo.spaces.find(
        (sp) => sp.id === spaceId && sp.organizationId === orgId && !sp.deletedAt
      );
      if (!s) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Space not found." });
      }

      if (input.name !== undefined) s.name = input.name;
      if (input.description !== undefined) s.description = input.description;
      if (input.icon !== undefined) s.icon = input.icon;
      if (input.color !== undefined) s.color = input.color;
      if (input.visibility !== undefined) s.isPrivate = input.visibility === "private";
      if (input.position !== undefined) s.position = input.position;
      s.updatedAt = new Date();
    }

    return this.getSpace(orgId, spaceId);
  }

  public async deleteSpace(orgId: string, spaceId: string) {
    const isDb = await checkDbConnection();
    const deletedAt = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.spaces)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(schema.spaces.id, spaceId),
            eq(schema.spaces.organizationId, orgId)
          )
        );

      // Cascade soft delete to collections
      await db
        .update(schema.collections)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(eq(schema.collections.spaceId, spaceId));
    } else {
      const s = memRepo.spaces.find(
        (sp) => sp.id === spaceId && sp.organizationId === orgId && !sp.deletedAt
      );
      if (!s) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Space not found." });
      }

      s.deletedAt = deletedAt;
      s.updatedAt = deletedAt;

      // Cascade to collections
      memRepo.collections
        .filter((c) => c.spaceId === spaceId)
        .forEach((c) => {
          c.deletedAt = deletedAt;
          c.updatedAt = deletedAt;
        });
    }

    return {
      deleted_at: deletedAt.toISOString(),
      purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
    };
  }

  // ===================== COLLECTIONS =====================
  public async listCollections(
    orgId: string,
    spaceId?: string,
    options: { includeDeleted?: boolean } = {}
  ) {
    const isDb = await checkDbConnection();
    const includeDeleted = options.includeDeleted === true;

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.collections.organizationId, orgId)];
      if (spaceId) {
        conditions.push(eq(schema.collections.spaceId, spaceId));
      }
      if (!includeDeleted) {
        conditions.push(isNull(schema.collections.deletedAt));
      }

      const rows = await db
        .select()
        .from(schema.collections)
        .where(and(...conditions));

      return rows.map((c) => ({
        id: c.id,
        space_id: c.spaceId,
        organization_id: c.organizationId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        position: c.position,
        is_starred: c.isStarred,
        default_view_mode: c.viewMode,
        item_count_cache: 0,
        group_count_cache: 0,
        deleted_at: c.deletedAt ? c.deletedAt.toISOString() : null,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      }));
    } else {
      const rows = memRepo.collections.filter((c) => {
        if (c.organizationId !== orgId) return false;
        if (spaceId && c.spaceId !== spaceId) return false;
        if (!includeDeleted && c.deletedAt) return false;
        return true;
      });

      return rows.map((c) => {
        const groupCount = memRepo.groups.filter(
          (g) => g.collectionId === c.id && !g.deletedAt
        ).length;

        return {
          id: c.id,
          space_id: c.spaceId,
          organization_id: c.organizationId,
          name: c.name,
          slug: c.slug || null,
          description: c.description || null,
          color: c.color || "#6366f1",
          position: c.position,
          is_starred: c.isStarred || false,
          default_view_mode: c.viewMode || "grid",
          item_count_cache: 0,
          group_count_cache: groupCount,
          deleted_at: c.deletedAt ? c.deletedAt.toISOString() : null,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString(),
        };
      });
    }
  }

  public async createCollection(
    orgId: string,
    accountId: string,
    input: CreateCollectionInput
  ) {
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Collection name is required.",
      });
    }

    // Verify space exists within org
    await this.getSpace(orgId, input.spaceId);

    const collectionId = uuidv7();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}-${collectionId.slice(0, 6)}`;
    const now = new Date();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.collections).values({
        id: collectionId,
        organizationId: orgId,
        spaceId: input.spaceId,
        name: cleanName,
        slug,
        description: input.description,
        color: input.color || "none",
        viewMode: input.viewMode || "grid",
        createdBy: accountId,
      });
    } else {
      memRepo.collections.push({
        id: collectionId,
        organizationId: orgId,
        spaceId: input.spaceId,
        name: cleanName,
        slug,
        description: input.description,
        color: input.color || "none",
        position: (memRepo.collections.filter((c) => c.spaceId === input.spaceId).length + 1) * 1024,
        viewMode: input.viewMode || "grid",
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return this.getCollection(orgId, collectionId);
  }

  public async getCollection(orgId: string, collectionId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.collections)
        .where(
          and(
            eq(schema.collections.id, collectionId),
            eq(schema.collections.organizationId, orgId),
            isNull(schema.collections.deletedAt)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Collection not found." });
      }

      const c = rows[0];
      return {
        id: c.id,
        space_id: c.spaceId,
        organization_id: c.organizationId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        position: c.position,
        is_starred: c.isStarred,
        default_view_mode: c.viewMode,
        item_count_cache: 0,
        group_count_cache: 0,
        deleted_at: c.deletedAt ? c.deletedAt.toISOString() : null,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      };
    } else {
      const c = memRepo.collections.find(
        (col) => col.id === collectionId && col.organizationId === orgId && !col.deletedAt
      );

      if (!c) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Collection not found." });
      }

      const groupCount = memRepo.groups.filter(
        (g) => g.collectionId === c.id && !g.deletedAt
      ).length;

      return {
        id: c.id,
        space_id: c.spaceId,
        organization_id: c.organizationId,
        name: c.name,
        slug: c.slug || null,
        description: c.description || null,
        color: c.color || "none",
        position: c.position,
        is_starred: c.isStarred || false,
        default_view_mode: c.viewMode || "grid",
        item_count_cache: 0,
        group_count_cache: groupCount,
        deleted_at: c.deletedAt ? c.deletedAt.toISOString() : null,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      };
    }
  }

  public async updateCollection(
    orgId: string,
    collectionId: string,
    input: UpdateCollectionInput
  ) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.collections)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.isStarred !== undefined ? { isStarred: input.isStarred } : {}),
          ...(input.viewMode !== undefined ? { viewMode: input.viewMode } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.collections.id, collectionId),
            eq(schema.collections.organizationId, orgId)
          )
        );
    } else {
      const c = memRepo.collections.find(
        (col) => col.id === collectionId && col.organizationId === orgId && !col.deletedAt
      );
      if (!c) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Collection not found." });
      }

      if (input.name !== undefined) c.name = input.name;
      if (input.description !== undefined) c.description = input.description;
      if (input.color !== undefined) c.color = input.color;
      if (input.isStarred !== undefined) c.isStarred = input.isStarred;
      if (input.viewMode !== undefined) c.viewMode = input.viewMode;
      if (input.position !== undefined) c.position = input.position;
      c.updatedAt = new Date();
    }

    return this.getCollection(orgId, collectionId);
  }

  public async moveCollection(orgId: string, collectionId: string, toSpaceId: string) {
    // Validate target space exists in org
    await this.getSpace(orgId, toSpaceId);
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.collections)
        .set({ spaceId: toSpaceId, updatedAt: new Date() })
        .where(
          and(
            eq(schema.collections.id, collectionId),
            eq(schema.collections.organizationId, orgId)
          )
        );
    } else {
      const c = memRepo.collections.find(
        (col) => col.id === collectionId && col.organizationId === orgId && !col.deletedAt
      );
      if (!c) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Collection not found." });
      }
      c.spaceId = toSpaceId;
      c.updatedAt = new Date();
    }

    return this.getCollection(orgId, collectionId);
  }

  public async deleteCollection(orgId: string, collectionId: string) {
    const isDb = await checkDbConnection();
    const deletedAt = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.collections)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(schema.collections.id, collectionId),
            eq(schema.collections.organizationId, orgId)
          )
        );

      // Cascade soft delete to groups
      await db
        .update(schema.groups)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(eq(schema.groups.collectionId, collectionId));
    } else {
      const c = memRepo.collections.find(
        (col) => col.id === collectionId && col.organizationId === orgId && !col.deletedAt
      );
      if (!c) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Collection not found." });
      }

      c.deletedAt = deletedAt;
      c.updatedAt = deletedAt;

      // Cascade to groups
      memRepo.groups
        .filter((g) => g.collectionId === collectionId)
        .forEach((g) => {
          g.deletedAt = deletedAt;
          g.updatedAt = deletedAt;
        });
    }

    return {
      deleted_at: deletedAt.toISOString(),
      purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
    };
  }

  // ===================== GROUPS =====================
  public async listGroups(
    orgId: string,
    collectionId: string,
    options: { includeDeleted?: boolean } = {}
  ) {
    const isDb = await checkDbConnection();
    const includeDeleted = options.includeDeleted === true;

    if (isDb) {
      const db = getDb();
      const conditions = [
        eq(schema.groups.organizationId, orgId),
        eq(schema.groups.collectionId, collectionId),
      ];
      if (!includeDeleted) {
        conditions.push(isNull(schema.groups.deletedAt));
      }

      const rows = await db
        .select()
        .from(schema.groups)
        .where(and(...conditions));

      return rows.map((g) => ({
        id: g.id,
        collection_id: g.collectionId,
        space_id: g.spaceId,
        organization_id: g.organizationId,
        name: g.name,
        color: g.color,
        position: g.position,
        is_starred: false,
        is_hidden: false,
        item_count_cache: 0,
        deleted_at: g.deletedAt ? g.deletedAt.toISOString() : null,
        created_at: g.createdAt.toISOString(),
        updated_at: g.updatedAt.toISOString(),
      }));
    } else {
      const rows = memRepo.groups.filter((g) => {
        if (g.organizationId !== orgId) return false;
        if (g.collectionId !== collectionId) return false;
        if (!includeDeleted && g.deletedAt) return false;
        return true;
      });

      return rows.map((g) => ({
        id: g.id,
        collection_id: g.collectionId,
        space_id: g.spaceId || null,
        organization_id: g.organizationId,
        name: g.name,
        color: g.color || "none",
        position: g.position,
        is_starred: false,
        is_hidden: false,
        item_count_cache: 0,
        deleted_at: g.deletedAt ? g.deletedAt.toISOString() : null,
        created_at: g.createdAt.toISOString(),
        updated_at: g.updatedAt.toISOString(),
      }));
    }
  }

  public async createGroup(orgId: string, accountId: string, input: CreateGroupInput) {
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Group name is required.",
      });
    }

    // Verify parent collection belongs to org
    const col = await this.getCollection(orgId, input.collectionId);

    const groupId = uuidv7();
    const now = new Date();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.groups).values({
        id: groupId,
        organizationId: orgId,
        spaceId: col.space_id,
        collectionId: input.collectionId,
        name: cleanName,
        color: input.color || "none",
        createdBy: accountId,
      });
    } else {
      memRepo.groups.push({
        id: groupId,
        organizationId: orgId,
        spaceId: col.space_id || undefined,
        collectionId: input.collectionId,
        name: cleanName,
        color: input.color || "none",
        position: (memRepo.groups.filter((g) => g.collectionId === input.collectionId).length + 1) * 1024,
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return this.getGroup(orgId, groupId);
  }

  public async getGroup(orgId: string, groupId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.groups)
        .where(
          and(
            eq(schema.groups.id, groupId),
            eq(schema.groups.organizationId, orgId),
            isNull(schema.groups.deletedAt)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Group not found." });
      }

      const g = rows[0];
      return {
        id: g.id,
        collection_id: g.collectionId,
        space_id: g.spaceId,
        organization_id: g.organizationId,
        name: g.name,
        color: g.color,
        position: g.position,
        is_starred: false,
        is_hidden: false,
        item_count_cache: 0,
        deleted_at: g.deletedAt ? g.deletedAt.toISOString() : null,
        created_at: g.createdAt.toISOString(),
        updated_at: g.updatedAt.toISOString(),
      };
    } else {
      const g = memRepo.groups.find(
        (grp) => grp.id === groupId && grp.organizationId === orgId && !grp.deletedAt
      );

      if (!g) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Group not found." });
      }

      return {
        id: g.id,
        collection_id: g.collectionId,
        space_id: g.spaceId || null,
        organization_id: g.organizationId,
        name: g.name,
        color: g.color || "none",
        position: g.position,
        is_starred: false,
        is_hidden: false,
        item_count_cache: 0,
        deleted_at: g.deletedAt ? g.deletedAt.toISOString() : null,
        created_at: g.createdAt.toISOString(),
        updated_at: g.updatedAt.toISOString(),
      };
    }
  }

  public async updateGroup(orgId: string, groupId: string, input: UpdateGroupInput) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.groups)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.groups.id, groupId),
            eq(schema.groups.organizationId, orgId)
          )
        );
    } else {
      const g = memRepo.groups.find(
        (grp) => grp.id === groupId && grp.organizationId === orgId && !grp.deletedAt
      );
      if (!g) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Group not found." });
      }

      if (input.name !== undefined) g.name = input.name;
      if (input.color !== undefined) g.color = input.color;
      if (input.position !== undefined) g.position = input.position;
      g.updatedAt = new Date();
    }

    return this.getGroup(orgId, groupId);
  }

  public async moveGroup(orgId: string, groupId: string, toCollectionId: string) {
    // Validate target collection belongs to same org
    const targetCol = await this.getCollection(orgId, toCollectionId);
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.groups)
        .set({
          collectionId: toCollectionId,
          spaceId: targetCol.space_id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.groups.id, groupId),
            eq(schema.groups.organizationId, orgId)
          )
        );
    } else {
      const g = memRepo.groups.find(
        (grp) => grp.id === groupId && grp.organizationId === orgId && !grp.deletedAt
      );
      if (!g) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Group not found." });
      }
      g.collectionId = toCollectionId;
      g.spaceId = targetCol.space_id || undefined;
      g.updatedAt = new Date();
    }

    return this.getGroup(orgId, groupId);
  }

  public async deleteGroup(orgId: string, groupId: string) {
    const isDb = await checkDbConnection();
    const deletedAt = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.groups)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(schema.groups.id, groupId),
            eq(schema.groups.organizationId, orgId)
          )
        );

      // Invariant: items.group_id ON DELETE SET NULL (items survive group deletion)
      await db
        .update(schema.items)
        .set({ groupId: null, updatedAt: deletedAt })
        .where(eq(schema.items.groupId, groupId));
    } else {
      const g = memRepo.groups.find(
        (grp) => grp.id === groupId && grp.organizationId === orgId && !grp.deletedAt
      );
      if (!g) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Group not found." });
      }

      g.deletedAt = deletedAt;
      g.updatedAt = deletedAt;

      // Invariant: items.group_id ON DELETE SET NULL (items survive group deletion)
      memRepo.items
        .filter((it) => it.groupId === groupId)
        .forEach((it) => {
          it.groupId = null;
          it.updatedAt = deletedAt;
        });
    }

    return {
      deleted_at: deletedAt.toISOString(),
      purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
    };
  }
}

export const workspaceService = new WorkspaceService();
