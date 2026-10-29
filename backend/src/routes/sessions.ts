import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { itemService } from "../services/itemService.js";

const tabSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  favicon_data_url: z.string().optional(),
  pinned: z.boolean().optional(),
  active: z.boolean().optional(),
  window_position: z.number().optional(),
});

const saveSessionSchema = z.object({
  destination: z.object({
    kind: z.enum(["new_collection", "existing_collection", "new_group", "existing_group"]),
    space_id: z.string().uuid().optional(),
    collection_id: z.string().uuid().optional(),
    group_id: z.string().uuid().optional(),
    name: z.string().max(120).optional(),
    color: z.string().max(32).optional(),
  }),
  tabs: z.array(tabSchema).min(1, "At least one tab must be provided"),
  options: z
    .object({
      close_tabs_after_save: z.boolean().optional(),
      exclude_pinned: z.boolean().optional(),
      exclude_chrome_internal: z.boolean().optional(),
      dedupe_within_session: z.boolean().optional(),
      dedupe_against_collection: z.boolean().optional(),
    })
    .optional(),
  client: z
    .object({
      window_id: z.number().optional(),
      saved_at: z.string().optional(),
      extension_version: z.string().optional(),
      browser: z.string().optional(),
    })
    .optional(),
});

const previewSessionSchema = z.object({
  destination: z.object({
    kind: z.enum(["new_collection", "existing_collection", "new_group", "existing_group"]),
    space_id: z.string().uuid().optional(),
    collection_id: z.string().uuid().optional(),
    group_id: z.string().uuid().optional(),
    name: z.string().max(120).optional(),
    color: z.string().max(32).optional(),
  }),
  tabs: z.array(tabSchema).min(1, "At least one tab must be provided"),
  options: z
    .object({
      close_tabs_after_save: z.boolean().optional(),
      exclude_pinned: z.boolean().optional(),
      exclude_chrome_internal: z.boolean().optional(),
      dedupe_within_session: z.boolean().optional(),
      dedupe_against_collection: z.boolean().optional(),
    })
    .optional(),
});

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  // POST /v1/sessions/save - Save open browser tabs to collection/group
  app.post(
    "/v1/sessions/save",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = saveSessionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const result = await itemService.saveSession(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(201).send({ data: result });
    }
  );

  // POST /v1/sessions/save/preview - Preview tabs that would be saved
  app.post(
    "/v1/sessions/save/preview",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const parseResult = previewSessionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const preview = itemService.previewSaveSession(parseResult.data);
      return reply.status(200).send({ data: preview });
    }
  );
};
