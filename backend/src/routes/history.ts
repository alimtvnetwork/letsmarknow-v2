import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import {
  requireEditorOrAbove,
  requireViewerOrAbove,
  requireAdminOrOwner,
} from "../middleware/rbac.js";
import { historyService } from "../services/historyService.js";

const undoSchema = z.object({
  undo_entire_batch: z.boolean().optional(),
});

const restoreTrashSchema = z.object({
  entity_ids: z.array(z.string().uuid("Invalid entity_id")).min(1, "At least one entity_id is required"),
});

const purgeTrashSchema = z.object({
  entity_ids: z.array(z.string().uuid("Invalid entity_id")).min(1, "At least one entity_id is required"),
  current_password: z.string().optional(),
});

const emptyTrashSchema = z.object({
  current_password: z.string().optional(),
});

export const historyRoutes: FastifyPluginAsync = async (app) => {
  // =========================================================================
  // HISTORY AUDIT & TIMELINE
  // =========================================================================

  // GET /v1/history - List history events
  app.get(
    "/v1/history",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        actor_account_id?: string;
        entity_type?: string;
        entity_id?: string;
        event_type?: string;
        since?: string;
        until?: string;
        batch_id?: string;
        include_undone?: string;
        limit?: string;
        cursor?: string;
      };

      const result = await historyService.listEvents(request.organizationId!, {
        actor_account_id: query.actor_account_id,
        entity_type: query.entity_type,
        entity_id: query.entity_id,
        event_type: query.event_type,
        since: query.since,
        until: query.until,
        batch_id: query.batch_id,
        include_undone: query.include_undone !== "false",
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        cursor: query.cursor,
      });

      return reply.status(200).send(result);
    }
  );

  // GET /v1/history/for/:entity_type/:entity_id - Per-entity history convenience wrapper
  app.get(
    "/v1/history/for/:entity_type/:entity_id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { entity_type, entity_id } = request.params as {
        entity_type: string;
        entity_id: string;
      };
      const query = request.query as {
        limit?: string;
        cursor?: string;
        include_undone?: string;
      };

      const result = await historyService.listEvents(request.organizationId!, {
        entity_type,
        entity_id,
        include_undone: query.include_undone !== "false",
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        cursor: query.cursor,
      });

      return reply.status(200).send(result);
    }
  );

  // GET /v1/items/:id/history - Per-item history alias
  app.get(
    "/v1/items/:id/history",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const query = request.query as {
        limit?: string;
        cursor?: string;
        include_undone?: string;
      };

      const result = await historyService.listEvents(request.organizationId!, {
        entity_type: "item",
        entity_id: id,
        include_undone: query.include_undone !== "false",
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        cursor: query.cursor,
      });

      return reply.status(200).send(result);
    }
  );

  // GET /v1/history/:id - Get single history event
  app.get(
    "/v1/history/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const event = await historyService.getEvent(request.organizationId!, id);
      return reply.status(200).send({ data: event });
    }
  );

  // =========================================================================
  // UNDO & REDO ENGINE
  // =========================================================================

  // POST /v1/history/:id/undo - Undo event (or entire batch)
  app.post(
    "/v1/history/:id/undo",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = undoSchema.safeParse(request.body || {});
      const undoEntireBatch = parseResult.success
        ? parseResult.data.undo_entire_batch
        : false;

      const result = await historyService.undoEvent(
        request.organizationId!,
        request.account!.id,
        id,
        undoEntireBatch
      );

      return reply.status(200).send({ data: result });
    }
  );

  // POST /v1/history/:id/redo - Redo previously undone event
  app.post(
    "/v1/history/:id/redo",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const result = await historyService.redoEvent(
        request.organizationId!,
        request.account!.id,
        id
      );

      return reply.status(200).send({ data: result });
    }
  );

  // =========================================================================
  // TRASH LIFECYCLE
  // =========================================================================

  // GET /v1/trash - List soft-deleted entities
  app.get(
    "/v1/trash",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        entity_type?: string;
        purges_before?: string;
        limit?: string;
        cursor?: string;
      };

      const result = await historyService.getTrash(request.organizationId!, {
        entity_type: query.entity_type,
        purges_before: query.purges_before,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        cursor: query.cursor,
      });

      return reply.status(200).send(result);
    }
  );

  // POST /v1/trash/restore - Restore soft-deleted entities
  app.post(
    "/v1/trash/restore",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = restoreTrashSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const result = await historyService.restoreTrash(
        request.organizationId!,
        request.account!.id,
        parseResult.data.entity_ids
      );

      return reply.status(200).send({ data: result });
    }
  );

  // POST /v1/trash/purge - Hard-delete selected entities from trash (Owner / Admin)
  app.post(
    "/v1/trash/purge",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = purgeTrashSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const result = await historyService.purgeTrash(
        request.organizationId!,
        parseResult.data.entity_ids
      );

      return reply.status(200).send({ data: result });
    }
  );

  // POST /v1/trash/empty - Hard-delete all trash in Org (Owner / Admin)
  app.post(
    "/v1/trash/empty",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = emptyTrashSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Invalid payload",
        });
      }

      const result = await historyService.emptyTrash(request.organizationId!);
      return reply.status(202).send({ data: result });
    }
  );
};
