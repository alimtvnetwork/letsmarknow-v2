import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import {
  requireEditorOrAbove,
  requireViewerOrAbove,
} from "../middleware/rbac.js";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";

/**
 * Bug-report persistence API for the frontend bug-session recorder.
 *
 * Screenshots are stored inline as data: URLs (v1 simplification — no blob
 * store, no thumbnails). To bound DB growth:
 *   - any single screenshot `dataUrl` larger than MAX_SCREENSHOT_DATA_URL_BYTES
 *     (2 MiB) is rejected with 413 SCREENSHOT_TOO_LARGE;
 *   - at most MAX_SCREENSHOTS_PER_SESSION screenshots per upsert;
 *   - at most MAX_EVENTS_PER_SESSION events per upsert (the recorder sends the
 *     full accumulated log each time).
 */
const MAX_SCREENSHOT_DATA_URL_BYTES = 2 * 1024 * 1024; // 2 MiB
const MAX_SCREENSHOTS_PER_SESSION = 100;
const MAX_EVENTS_PER_SESSION = 10_000;

const screenshotSchema = z.object({
  title: z.string().max(255).optional(),
  dataUrl: z.string().min(1, "dataUrl is required"),
  source: z.string().max(64).optional(),
});

const upsertBugReportSchema = z.object({
  // Client-generated idempotency/upsert key. When supplied and already owned by
  // the caller, the session is updated; otherwise a new session is created.
  sessionId: z.string().min(1).max(64).optional(),
  title: z.string().min(1).max(255),
  category: z.string().min(1).max(64),
  description: z.string().max(10_000).optional(),
  expectedBehavior: z.string().max(10_000).optional(),
  actualBehavior: z.string().max(10_000).optional(),
  initialRoute: z.string().min(1).max(512),
  finalRoute: z.string().max(512).optional(),
  durationMs: z.number().int().nonnegative().optional(),
  events: z.array(z.unknown()).optional(),
  screenshots: z.array(screenshotSchema).max(MAX_SCREENSHOTS_PER_SESSION).optional(),
  // Error entries are counted into error_count only; the raw payloads are not
  // persisted (v1 simplification).
  errors: z.array(z.unknown()).optional(),
});

function validationError(parseResult: z.SafeParseError<unknown>): AppError {
  return new AppError({
    statusCode: 400,
    code: "VALIDATION_FAILED",
    message: parseResult.error.issues[0]?.message || "Invalid payload",
    details: { errors: parseResult.error.format() },
  });
}

type BugSessionRow = typeof schema.bugSessions.$inferSelect;
type BugScreenshotRow = typeof schema.bugScreenshots.$inferSelect;

function toSessionSummary(row: BugSessionRow) {
  return {
    sessionId: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    expectedBehavior: row.expectedBehavior,
    actualBehavior: row.actualBehavior,
    initialRoute: row.initialRoute,
    finalRoute: row.finalRoute,
    durationMs: row.durationMs,
    eventCount: row.eventCount,
    screenshotCount: row.screenshotCount,
    errorCount: row.errorCount,
    createdAt: row.createdAt.toISOString(),
    persistedAt: row.updatedAt.toISOString(),
  };
}

export const bugReportRoutes: FastifyPluginAsync = async (app) => {
  // =========================================================================
  // BUG REPORT PERSISTENCE
  // =========================================================================

  // POST /v1/bug-reports - Create or update a bug session (upsert by account + sessionId)
  // NOTE: route-level bodyLimit (16 MiB) deliberately exceeds Fastify's 1 MiB
  // default so the per-screenshot 2 MiB cap below is reachable — a recorder
  // session with a few full-page PNG screenshots legitimately exceeds 1 MiB.
  // Payloads above the route limit are rejected by Fastify's body parser.
  app.post(
    "/v1/bug-reports",
    {
      preHandler: [requireAuth, requireEditorOrAbove],
      bodyLimit: 16 * 1024 * 1024,
    },
    async (request, reply) => {
      const parseResult = upsertBugReportSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw validationError(parseResult);
      }
      const body = parseResult.data;
      const accountId = request.account!.id;
      const db = getDb();

      const events = body.events ?? [];
      if (events.length > MAX_EVENTS_PER_SESSION) {
        throw new AppError({
          statusCode: 413,
          code: "TOO_MANY_EVENTS",
          message: `Event log exceeds the per-session limit of ${MAX_EVENTS_PER_SESSION} events.`,
        });
      }

      const screenshots = body.screenshots ?? [];
      for (const shot of screenshots) {
        // data: URLs are ASCII (base64), so string length ≈ byte length.
        if (shot.dataUrl.length > MAX_SCREENSHOT_DATA_URL_BYTES) {
          throw new AppError({
            statusCode: 413,
            code: "SCREENSHOT_TOO_LARGE",
            message: `Screenshot "${shot.title ?? "untitled"}" exceeds the ${MAX_SCREENSHOT_DATA_URL_BYTES / (1024 * 1024)} MiB per-screenshot dataUrl limit.`,
          });
        }
      }

      const now = new Date();
      const sessionFields = {
        title: body.title,
        category: body.category,
        description: body.description ?? null,
        expectedBehavior: body.expectedBehavior ?? null,
        actualBehavior: body.actualBehavior ?? null,
        initialRoute: body.initialRoute,
        finalRoute: body.finalRoute ?? null,
        durationMs: body.durationMs ?? null,
        eventsJson: events,
        eventCount: events.length,
        screenshotCount: screenshots.length,
        errorCount: (body.errors ?? []).length,
        updatedAt: now,
      };

      let sessionId = body.sessionId;

      if (sessionId) {
        const existing = await db
          .select()
          .from(schema.bugSessions)
          .where(
            and(
              eq(schema.bugSessions.id, sessionId),
              eq(schema.bugSessions.accountId, accountId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update path: replace the session fields and the whole screenshot
          // set (the recorder re-sends the full session each persist).
          await db
            .update(schema.bugSessions)
            .set(sessionFields)
            .where(
              and(
                eq(schema.bugSessions.id, sessionId),
                eq(schema.bugSessions.accountId, accountId)
              )
            );
          await db
            .delete(schema.bugScreenshots)
            .where(eq(schema.bugScreenshots.sessionId, sessionId));
        } else {
          // Unknown to this account: create with the client-supplied id so the
          // recorder's first persist (which generates the id client-side) is
          // idempotent across retries.
          await db.insert(schema.bugSessions).values({
            id: sessionId,
            accountId,
            createdAt: now,
            ...sessionFields,
          });
        }
      } else {
        sessionId = uuidv7();
        await db.insert(schema.bugSessions).values({
          id: sessionId,
          accountId,
          createdAt: now,
          ...sessionFields,
        });
      }

      if (screenshots.length > 0) {
        await db.insert(schema.bugScreenshots).values(
          screenshots.map((shot, i) => ({
            id: uuidv7(),
            sessionId: sessionId!,
            seqNumber: i,
            title: shot.title ?? null,
            dataUrl: shot.dataUrl,
            source: shot.source ?? null,
            createdAt: now,
          }))
        );
      }

      return reply.status(200).send({ sessionId });
    }
  );

  // GET /v1/bug-reports/sessions - List caller's bug sessions, newest first
  app.get(
    "/v1/bug-reports/sessions",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        limit?: string;
        offset?: string;
        category?: string;
      };
      const limit = Math.min(
        200,
        Math.max(1, query.limit ? parseInt(query.limit, 10) : 100) || 100
      );
      const offset = Math.max(0, query.offset ? parseInt(query.offset, 10) : 0) || 0;
      const accountId = request.account!.id;
      const db = getDb();

      const conditions = [eq(schema.bugSessions.accountId, accountId)];
      if (query.category) {
        conditions.push(eq(schema.bugSessions.category, query.category));
      }

      const rows = await db
        .select()
        .from(schema.bugSessions)
        .where(and(...conditions))
        .orderBy(desc(schema.bugSessions.createdAt))
        .limit(limit)
        .offset(offset);

      return reply.status(200).send(rows.map(toSessionSummary));
    }
  );

  // GET /v1/bug-reports/sessions/:sessionId - Full session detail (events + screenshots)
  app.get(
    "/v1/bug-reports/sessions/:sessionId",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      const accountId = request.account!.id;
      const db = getDb();

      const rows = await db
        .select()
        .from(schema.bugSessions)
        .where(
          and(
            eq(schema.bugSessions.id, sessionId),
            eq(schema.bugSessions.accountId, accountId)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Bug session not found.",
        });
      }
      const row = rows[0];

      const shots = await db
        .select()
        .from(schema.bugScreenshots)
        .where(eq(schema.bugScreenshots.sessionId, sessionId))
        .orderBy(schema.bugScreenshots.seqNumber);

      return reply.status(200).send({
        ...toSessionSummary(row),
        events: row.eventsJson ?? [],
        screenshots: shots.map((s: BugScreenshotRow) => ({
          id: s.id,
          title: s.title,
          dataUrl: s.dataUrl,
          source: s.source,
          seqNumber: s.seqNumber,
        })),
      });
    }
  );
};
