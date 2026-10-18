import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { itemService } from "../services/itemService.js";

import { tagService } from "../services/tagService.js";

const createItemSchema = z.object({
  collection_id: z.string().uuid().optional(),
  group_id: z.string().uuid().nullable().optional(),
  url: z.string().min(1, "URL is required"),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  favicon_url: z.string().optional(),
  color: z.string().max(32).optional(),
  source: z.string().max(32).optional(),
});

const updateItemSchema = z.object({
  title: z.string().max(255).optional(),
  url: z.string().url().optional(),
  description: z.string().max(1000).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  is_starred: z.boolean().optional(),
  position: z.number().optional(),
});

const moveItemSchema = z.object({
  to_collection_id: z.string().uuid().optional(),
  to_group_id: z.string().uuid().nullable().optional(),
});

const setItemTagsSchema = z.object({
  add: z.array(z.string().uuid()).optional(),
  remove: z.array(z.string().uuid()).optional(),
  create: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        color: z.string().optional(),
      })
    )
    .optional(),
});

export const itemRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/items - List items
  app.get(
    "/v1/items",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        collection_id?: string;
        group_id?: string;
        include_groups?: string;
        is_starred?: string;
        include_deleted?: string;
        tag?: string;
        tag_id?: string;
        q?: string;
      };

      if (!query.collection_id && !query.group_id && !query.q && !query.tag && !query.tag_id && query.is_starred === undefined) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "A filter (collection_id, group_id, is_starred, tag, tag_id, or search query 'q') must be provided.",
        });
      }

      const items = await itemService.listItems(request.organizationId!, {
        collectionId: query.collection_id,
        groupId: query.group_id,
        includeGroups: query.include_groups === "true",
        isStarred: query.is_starred !== undefined ? query.is_starred === "true" : undefined,
        includeDeleted: query.include_deleted === "true",
        tagId: query.tag_id,
        tag: query.tag,
        q: query.q,
      });

      return reply.status(200).send({
        data: items,
        page: { next_cursor: null, has_more: false, limit: 50 },
      });
    }
  );

  // POST /v1/items - Create single item
  app.post(
    "/v1/items",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createItemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const item = await itemService.createItem(
        request.organizationId!,
        request.account!.id,
        {
          collectionId: parseResult.data.collection_id,
          groupId: parseResult.data.group_id,
          url: parseResult.data.url,
          title: parseResult.data.title,
          description: parseResult.data.description,
          faviconUrl: parseResult.data.favicon_url,
          color: parseResult.data.color,
          source: parseResult.data.source,
        }
      );

      return reply.status(201).send({ data: item });
    }
  );

  // GET /v1/items/:id - Get item
  app.get(
    "/v1/items/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const item = await itemService.getItem(request.organizationId!, params.id);
      return reply.status(200).send({ data: item });
    }
  );

  // PATCH /v1/items/:id - Update item
  app.patch(
    "/v1/items/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateItemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const item = await itemService.updateItem(
        request.organizationId!,
        params.id,
        {
          title: parseResult.data.title,
          url: parseResult.data.url,
          description: parseResult.data.description || undefined,
          color: parseResult.data.color || undefined,
          isStarred: parseResult.data.is_starred,
          position: parseResult.data.position,
        }
      );

      return reply.status(200).send({ data: item });
    }
  );

  // POST /v1/items/:id/move - Move item
  app.post(
    "/v1/items/:id/move",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = moveItemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Valid destination is required.",
        });
      }

      const item = await itemService.moveItem(
        request.organizationId!,
        params.id,
        {
          toCollectionId: parseResult.data.to_collection_id,
          toGroupId: parseResult.data.to_group_id,
        }
      );

      return reply.status(200).send({ data: item });
    }
  );

  // POST /v1/items/:id/star - Star item
  app.post(
    "/v1/items/:id/star",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      await itemService.updateItem(request.organizationId!, params.id, { isStarred: true });
      return reply.status(204).send();
    }
  );

  // POST /v1/items/:id/unstar - Unstar item
  app.post(
    "/v1/items/:id/unstar",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      await itemService.updateItem(request.organizationId!, params.id, { isStarred: false });
      return reply.status(204).send();
    }
  );

  // DELETE /v1/items/:id - Soft-delete item
  app.delete(
    "/v1/items/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const res = await itemService.deleteItem(request.organizationId!, params.id);
      return reply.status(200).send({ data: res });
    }
  );

  // POST /v1/items/:id/restore - Restore soft-deleted item
  app.post(
    "/v1/items/:id/restore",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const item = await itemService.restoreItem(request.organizationId!, params.id);
      return reply.status(200).send({ data: item });
    }
  );

  // POST /v1/items/:id/tags - Manage tags on item
  app.post(
    "/v1/items/:id/tags",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = setItemTagsSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      // Verify item exists and belongs to org
      await itemService.getItem(request.organizationId!, params.id);

      const tagIds = await tagService.setItemTags(
        request.organizationId!,
        request.account!.id,
        params.id,
        parseResult.data
      );

      return reply.status(200).send({ data: { item_id: params.id, tag_ids: tagIds } });
    }
  );
};
