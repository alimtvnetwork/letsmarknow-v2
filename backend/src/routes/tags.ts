import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { tagService } from "../services/tagService.js";

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(40, "Name must be <= 40 chars"),
  color: z.string().max(32).optional(),
  description: z.string().max(500).optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  color: z.string().max(32).optional(),
  description: z.string().max(500).optional(),
});

export const tagRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/tags/suggest - Autocomplete suggestions
  app.get(
    "/v1/tags/suggest",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { q?: string; limit?: string };
      if (!query.q) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Query parameter 'q' is required for tag suggestions.",
        });
      }

      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const suggestions = await tagService.suggestTags(request.organizationId!, query.q, limit);
      return reply.status(200).send({ data: suggestions });
    }
  );

  // GET /v1/tags - List tags
  app.get(
    "/v1/tags",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        q?: string;
        sort?: "name" | "-usage_count" | "-created_at";
        limit?: string;
      };

      const limit = query.limit ? parseInt(query.limit, 10) : 100;
      const tags = await tagService.listTags(request.organizationId!, {
        q: query.q,
        sort: query.sort,
        limit,
      });

      return reply.status(200).send({ data: tags });
    }
  );

  // POST /v1/tags - Create tag
  app.post(
    "/v1/tags",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createTagSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const tag = await tagService.createTag(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(201).send({ data: tag });
    }
  );

  // GET /v1/tags/:id - Get tag
  app.get(
    "/v1/tags/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const tag = await tagService.getTag(request.organizationId!, params.id);
      return reply.status(200).send({ data: tag });
    }
  );

  // PATCH /v1/tags/:id - Update tag
  app.patch(
    "/v1/tags/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateTagSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const tag = await tagService.updateTag(
        request.organizationId!,
        params.id,
        parseResult.data
      );

      return reply.status(200).send({ data: tag });
    }
  );

  // DELETE /v1/tags/:id - Delete tag
  app.delete(
    "/v1/tags/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const params = request.params as { id: string };
      await tagService.deleteTag(request.organizationId!, params.id);
      return reply.status(204).send();
    }
  );
};
