import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { workspaceService } from "../services/workspaceService.js";

const createCollectionSchema = z.object({
  space_id: z.string().uuid("Invalid space_id"),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(32).optional(),
  view_mode: z.enum(["list", "grid", "compact", "mindmap", "column"]).optional(),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  is_starred: z.boolean().optional(),
  view_mode: z.enum(["list", "grid", "compact", "mindmap", "column"]).optional(),
  position: z.number().optional(),
});

const moveCollectionSchema = z.object({
  to_space_id: z.string().uuid("Invalid to_space_id"),
});

export const collectionRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/collections - List collections (optionally filtered by space_id)
  app.get(
    "/v1/collections",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { space_id?: string; include_deleted?: string };
      const collections = await workspaceService.listCollections(
        request.organizationId!,
        query.space_id,
        { includeDeleted: query.include_deleted === "true" }
      );

      return reply.status(200).send({ data: collections });
    }
  );

  // POST /v1/collections - Create collection
  app.post(
    "/v1/collections",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createCollectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const col = await workspaceService.createCollection(
        request.organizationId!,
        request.account!.id,
        {
          spaceId: parseResult.data.space_id,
          name: parseResult.data.name,
          description: parseResult.data.description,
          color: parseResult.data.color,
          viewMode: parseResult.data.view_mode,
        }
      );

      return reply.status(201).send({ data: col });
    }
  );

  // GET /v1/collections/:id - Get collection
  app.get(
    "/v1/collections/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const col = await workspaceService.getCollection(request.organizationId!, params.id);
      return reply.status(200).send({ data: col });
    }
  );

  // PATCH /v1/collections/:id - Update collection
  app.patch(
    "/v1/collections/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateCollectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const col = await workspaceService.updateCollection(
        request.organizationId!,
        params.id,
        {
          name: parseResult.data.name,
          description: parseResult.data.description || undefined,
          color: parseResult.data.color || undefined,
          isStarred: parseResult.data.is_starred,
          viewMode: parseResult.data.view_mode,
          position: parseResult.data.position,
        }
      );

      return reply.status(200).send({ data: col });
    }
  );

  // POST /v1/collections/:id/move - Move collection across spaces
  app.post(
    "/v1/collections/:id/move",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = moveCollectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Valid to_space_id is required.",
        });
      }

      const col = await workspaceService.moveCollection(
        request.organizationId!,
        params.id,
        parseResult.data.to_space_id
      );

      return reply.status(200).send({ data: col });
    }
  );

  // DELETE /v1/collections/:id - Soft-delete collection
  app.delete(
    "/v1/collections/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const res = await workspaceService.deleteCollection(request.organizationId!, params.id);
      return reply.status(200).send({ data: res });
    }
  );
};
