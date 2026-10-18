import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { authService } from "../services/authService.js";

const updatePreferencesSchema = z.object({
  default_view: z
    .enum(["list", "grid", "compact", "mindmap", "column"])
    .optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.string().max(16).optional(),
  timezone: z.string().max(64).optional(),
  layout: z
    .object({
      sidebar_width_px: z.number().optional(),
      right_pane_width_px: z.number().optional(),
      section_heights_px: z.record(z.number()).optional(),
    })
    .optional(),
  keyboard_layout: z.enum(["qwerty", "dvorak", "colemak"]).optional(),
  notifications: z
    .object({
      email_digest: z.enum(["off", "daily", "weekly"]).optional(),
      in_app: z.boolean().optional(),
    })
    .optional(),
  experiments: z.record(z.boolean()).optional(),
});

const gdprExportSchema = z.object({
  destination_email: z.string().email().optional(),
  include_orgs: z.array(z.string().uuid()).optional(),
});

export const accountRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/account/preferences - Fetch account preferences
  app.get(
    "/v1/account/preferences",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await authService.getPreferences(request.account!.id);
      return reply.send({ data: result });
    }
  );

  // PATCH /v1/account/preferences - Update account preferences with optimistic concurrency check
  app.patch(
    "/v1/account/preferences",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = updatePreferencesSchema.safeParse(request.body);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: issue?.message || "Invalid preferences payload",
          field: issue?.path.join("."),
        });
      }

      const ifMatch = request.headers["if-match"] as string | undefined;

      const result = await authService.updatePreferences(
        request.account!.id,
        parseResult.data,
        ifMatch
      );

      return reply.send({ data: result });
    }
  );

  // POST /v1/me/gdpr-export - Trigger GDPR export
  app.post(
    "/v1/me/gdpr-export",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = gdprExportSchema.safeParse(request.body || {});
      const valid = parseResult.success ? parseResult.data : {};

      const result = await authService.triggerGdprExport(
        request.account!.id,
        valid.destination_email,
        valid.include_orgs
      );

      return reply.status(202).send({ data: result });
    }
  );
};
