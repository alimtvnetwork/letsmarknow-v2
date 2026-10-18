import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { workspaceService } from "../services/workspaceService.js";

const createSpaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  icon: z.string().max(64).optional(),
  color: z.string().max(32).optional(),
  visibility: z.enum(["private", "org"]).optional(),
});

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(64).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  visibility: z.enum(["private", "org"]).optional(),
  position: z.number().optional(),
});

export const spaceRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/spaces - List spaces in active organization
  app.get(
    "/v1/spaces",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { include_deleted?: string };
      const spaces = await workspaceService.listSpaces(request.organizationId!, {
        includeDeleted: query.include_deleted === "true",
      });

      return reply.status(200).send({ data: spaces });
    }
  );

  // POST /v1/spaces - Create space
  app.post(
    "/v1/spaces",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createSpaceSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const space = await workspaceService.createSpace(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(201).send({ data: space });
    }
  );

  // GET /v1/spaces/:id - Get space details
  app.get(
    "/v1/spaces/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const space = await workspaceService.getSpace(request.organizationId!, params.id);
      return reply.status(200).send({ data: space });
    }
  );

  // PATCH /v1/spaces/:id - Update space
  app.patch(
    "/v1/spaces/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateSpaceSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const space = await workspaceService.updateSpace(
        request.organizationId!,
        params.id,
        {
          name: parseResult.data.name,
          description: parseResult.data.description || undefined,
          icon: parseResult.data.icon || undefined,
          color: parseResult.data.color || undefined,
          visibility: parseResult.data.visibility,
          position: parseResult.data.position,
        }
      );

      return reply.status(200).send({ data: space });
    }
  );

  // DELETE /v1/spaces/:id - Soft-delete space
  app.delete(
    "/v1/spaces/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const res = await workspaceService.deleteSpace(request.organizationId!, params.id);
      return reply.status(200).send({ data: res });
    }
  );
};
