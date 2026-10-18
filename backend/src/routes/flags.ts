import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { flagService } from "../services/flagService.js";
import { AppError } from "../errors/AppError.js";

const evaluateFlagsSchema = z.object({
  flags: z.array(z.string()).min(1).max(100),
  context: z
    .object({
      surface: z.string().optional(),
      url_host: z.string().optional(),
      locale: z.string().optional(),
      client_version: z.string().optional(),
      session_age_minutes: z.number().optional(),
      client_id: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const flagRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/flags - List all feature flags and evaluated variants for caller
  app.get(
    "/v1/flags",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const evaluation = flagService.listAllFlags(
        request.account?.id,
        request.organizationId,
        request.query as any
      );
      return reply.status(200).send({ data: evaluation });
    }
  );

  // POST /v1/flags/evaluate - Deterministic runtime flag evaluation
  app.post(
    "/v1/flags/evaluate",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = evaluateFlagsSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const evaluation = flagService.evaluateFlags(
        parseResult.data.flags,
        request.account?.id,
        request.organizationId,
        parseResult.data.context
      );

      return reply.status(200).send({ data: evaluation });
    }
  );
};
