import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove } from "../middleware/rbac.js";
import { bulkService } from "../services/bulkService.js";

const bulkItemsSchema = z.object({
  all_or_nothing: z.boolean().optional(),
  operations: z
    .array(
      z.object({
        op: z.enum(["create", "update", "move", "delete", "star", "tag"]),
        id: z.string().uuid().optional(),
        data: z.record(z.unknown()).optional(),
        if_match: z.string().optional(),
      })
    )
    .min(1, "At least one operation must be specified"),
});

export const bulkRoutes: FastifyPluginAsync = async (app) => {
  // POST /v1/bulk/items - Execute batch operations across items (207 Multi-Status)
  app.post(
    "/v1/bulk/items",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = bulkItemsSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const { results } = await bulkService.executeBulkItems(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(207).send({
        data: {
          results,
        },
      });
    }
  );
};
