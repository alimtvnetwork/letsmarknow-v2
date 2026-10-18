import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { workspaceService } from "../services/workspaceService.js";

const createGroupSchema = z.object({
  collection_id: z.string().uuid("Invalid collection_id"),
  name: z.string().min(1, "Name is required").max(120),
  color: z.string().max(32).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  color: z.string().max(32).nullable().optional(),
  position: z.number().optional(),
});

const moveGroupSchema = z.object({
  to_collection_id: z.string().uuid("Invalid to_collection_id"),
});

export const groupRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/groups - List groups in collection
  app.get(
    "/v1/groups",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { collection_id?: string; include_deleted?: string };
      if (!query.collection_id) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "collection_id query parameter is required.",
        });
      }

      const groups = await workspaceService.listGroups(
        request.organizationId!,
        query.collection_id,
        { includeDeleted: query.include_deleted === "true" }
      );

      return reply.status(200).send({ data: groups });
    }
  );

  // POST /v1/groups - Create group
  app.post(
    "/v1/groups",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createGroupSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const group = await workspaceService.createGroup(
        request.organizationId!,
        request.account!.id,
        {
          collectionId: parseResult.data.collection_id,
          name: parseResult.data.name,
          color: parseResult.data.color,
        }
      );

      return reply.status(201).send({ data: group });
    }
  );

  // GET /v1/groups/:id - Get group
  app.get(
    "/v1/groups/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const group = await workspaceService.getGroup(request.organizationId!, params.id);
      return reply.status(200).send({ data: group });
    }
  );

  // PATCH /v1/groups/:id - Update group
  app.patch(
    "/v1/groups/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateGroupSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const group = await workspaceService.updateGroup(
        request.organizationId!,
        params.id,
        {
          name: parseResult.data.name,
          color: parseResult.data.color || undefined,
          position: parseResult.data.position,
        }
      );

      return reply.status(200).send({ data: group });
    }
  );

  // POST /v1/groups/:id/move - Move group across collections
  app.post(
    "/v1/groups/:id/move",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = moveGroupSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Valid to_collection_id is required.",
        });
      }

      const group = await workspaceService.moveGroup(
        request.organizationId!,
        params.id,
        parseResult.data.to_collection_id
      );

      return reply.status(200).send({ data: group });
    }
  );

  // DELETE /v1/groups/:id - Soft-delete group (items inside survive!)
  app.delete(
    "/v1/groups/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const res = await workspaceService.deleteGroup(request.organizationId!, params.id);
      return reply.status(200).send({ data: res });
    }
  );
};
