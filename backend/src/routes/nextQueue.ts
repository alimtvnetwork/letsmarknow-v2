import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { nextQueueService, nextQueueEvents } from "../services/nextQueueService.js";

const addToNextSchema = z.object({
  item_id: z.string().optional().nullable(),
  url: z.string().min(1, "URL is required"),
  title: z.string().optional().nullable(),
  favicon_url: z.string().optional().nullable(),
  source_kind: z
    .enum(["collection", "browser_tab", "manual", "session", "bulk"])
    .optional(),
  source_collection_id: z.string().optional().nullable(),
  position: z.number().optional(),
  insert_position: z.enum(["top", "bottom"]).optional(),
});

const patchNextSchema = z.object({
  is_done: z.boolean().optional(),
  position: z.number().optional(),
  title: z.string().optional(),
});

export const nextQueueRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/next - List items in the account's Next queue
  app.get(
    "/v1/next",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;
      const query = request.query as { include_done?: string };
      const includeDone = query.include_done !== "false";

      const result = await nextQueueService.listNextItems(accountId, {
        includeDone,
      });

      return reply.send({
        data: {
          items: result.items,
          total_count: result.totalCount,
          open_count: result.openCount,
        },
      });
    }
  );

  // POST /v1/next - Add to Next (canonical verb: "Add to Next")
  app.post(
    "/v1/next",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;
      const parsed = addToNextSchema.safeParse(request.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: issue?.message || "Invalid payload for Add to Next",
          field: issue?.path.join("."),
        });
      }

      const item = await nextQueueService.addToNext(accountId, {
        itemId: parsed.data.item_id,
        url: parsed.data.url,
        title: parsed.data.title,
        faviconUrl: parsed.data.favicon_url,
        sourceKind: parsed.data.source_kind,
        sourceCollectionId: parsed.data.source_collection_id,
        position: parsed.data.position,
        insertPosition: parsed.data.insert_position,
      });

      const statusCode = item.isExisting || item.reopened ? 200 : 201;
      return reply.status(statusCode).send({
        data: item,
        message: item.isExisting
          ? "Already in Next"
          : item.reopened
          ? "Reopened in Next"
          : "Added to Next",
      });
    }
  );

  // PATCH /v1/next/:id - Update item status or position
  app.patch(
    "/v1/next/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;
      const { id } = request.params as { id: string };

      const parsed = patchNextSchema.safeParse(request.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: issue?.message || "Invalid update payload",
          field: issue?.path.join("."),
        });
      }

      const updated = await nextQueueService.updateNextItem(accountId, id, {
        isDone: parsed.data.is_done,
        position: parsed.data.position,
        titleSnapshot: parsed.data.title,
      });

      return reply.send({ data: updated });
    }
  );

  // DELETE /v1/next/:id - Remove item from Next
  app.delete(
    "/v1/next/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;
      const { id } = request.params as { id: string };

      const result = await nextQueueService.removeNextItem(accountId, id);
      return reply.send({ data: result });
    }
  );

  // POST /v1/next/clear-completed - Clear completed items
  app.post(
    "/v1/next/clear-completed",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;
      const result = await nextQueueService.clearCompleted(accountId);
      return reply.send({ data: result });
    }
  );

  // GET /v1/next/events - Server-Sent Events stream for realtime sync
  // Spec: realtime channel account:{account_id}:next
  app.get(
    "/v1/next/events",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const accountId = request.account!.id;

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");
      reply.raw.flushHeaders?.();

      // Handshake
      reply.raw.write(
        `event: connected\ndata: ${JSON.stringify({
          channel: `account:${accountId}:next`,
          status: "connected",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Subscribe to real-time events for this account
      const unsubscribe = nextQueueEvents.subscribe(accountId, (event) => {
        try {
          reply.raw.write(`event: next\ndata: ${JSON.stringify(event)}\n\n`);
        } catch {
          // Connection likely closed
        }
      });

      // Keepalive heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          reply.raw.write(`: keep-alive\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });

      // Keep response open for stream
      await new Promise<void>((resolve) => {
        request.raw.on("close", resolve);
      });
    }
  );
};
