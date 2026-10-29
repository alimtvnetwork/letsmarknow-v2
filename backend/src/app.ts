import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { env } from "./config/env.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { idempotencyPlugin } from "./middleware/idempotency.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { organizationRoutes } from "./routes/organizations.js";
import { memberRoutes } from "./routes/members.js";
import { spaceRoutes } from "./routes/spaces.js";
import { collectionRoutes } from "./routes/collections.js";
import { groupRoutes } from "./routes/groups.js";
import { itemRoutes } from "./routes/items.js";
import { sessionRoutes } from "./routes/sessions.js";
import { tagRoutes } from "./routes/tags.js";
import { bulkRoutes } from "./routes/bulk.js";
import { searchRoutes } from "./routes/search.js";
import { importExportRoutes } from "./routes/importExport.js";
import { shareRoutes } from "./routes/shares.js";
import { historyRoutes } from "./routes/history.js";
import { mindmapRoutes } from "./routes/mindmap.js";
import { accountRoutes } from "./routes/account.js";
import { jobRoutes } from "./routes/jobs.js";
import { flagRoutes } from "./routes/flags.js";
import { billingRoutes } from "./routes/billing.js";
import { nextQueueRoutes } from "./routes/nextQueue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function locateWebDirectory(): string | null {
  const candidates = [
    // Next to backend/ as web/ (installer layout: AppData/Local/LetsMarkNow/web)
    path.resolve(process.cwd(), "../web"),
    path.resolve(__dirname, "../../web"),
    // Inside backend/web
    path.resolve(process.cwd(), "web"),
    path.resolve(__dirname, "../web"),
    path.resolve(__dirname, "web"),
    // Repository root dist/web (development / build output)
    path.resolve(process.cwd(), "../dist/web"),
    path.resolve(process.cwd(), "dist/web"),
    path.resolve(__dirname, "../../dist/web"),
    path.resolve(__dirname, "../../../dist/web"),
    // LocalAppData fallback
    process.env.LOCALAPPDATA
      ? path.resolve(process.env.LOCALAPPDATA, "LetsMarkNow/web")
      : "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }
  return null;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
      transport:
        env.NODE_ENV === "development" && process.stdout?.isTTY
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
    genReqId: (req) => {
      const headerId = req.headers["x-request-id"];
      return typeof headerId === "string" ? headerId : randomUUID();
    },
    requestIdHeader: "x-request-id",
  });

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Handled per-surface
  });

  // CORS Configuration - Allows web dashboard, extension, and local dev
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, extension background scripts)
      if (!origin) {
        cb(null, true);
        return;
      }
      // Allow Chrome extensions
      if (origin.startsWith("chrome-extension://")) {
        cb(null, true);
        return;
      }
      // Allow listed development origins
      if (
        env.CORS_ORIGINS.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        cb(null, true);
        return;
      }
      cb(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Organization-Id",
      "X-Request-Id",
      "X-Client",
      "Idempotency-Key",
      "If-Match",
    ],
    exposedHeaders: [
      "X-Request-Id",
      "ETag",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "Retry-After",
    ],
  });

  // Cookie Support
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });

  // Development In-Memory Rate Limiting (Spec: 1000/min read, 200/min write)
  await app.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute",
    allowList: ["127.0.0.1", "localhost"],
  });

  // Idempotency caching for POST requests (24h TTL)
  await app.register(idempotencyPlugin);

  // Locate and register static web dashboard if available
  const webDir = locateWebDirectory();
  if (webDir) {
    await app.register(fastifyStatic, {
      root: webDir,
      prefix: "/",
    });
  }

  // Uniform Error Handling
  app.setErrorHandler(globalErrorHandler);

  // Uniform 404 / SPA Fallback Handling
  app.setNotFoundHandler(async (request, reply) => {
    const isApiRequest =
      request.url.startsWith("/v1/") ||
      request.url === "/v1" ||
      request.url.startsWith("/health");

    // Serve SPA index.html for non-API GET requests when web dashboard is present
    if (webDir && !isApiRequest && request.method === "GET") {
      return reply.sendFile("index.html");
    }

    const requestId =
      (request.headers["x-request-id"] as string) ||
      request.id ||
      "unknown-request-id";
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
        request_id: requestId,
        doc_url: "https://docs.letsmarknow.com/errors/not_found",
      },
    });
  });

  // Register Core Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(organizationRoutes);
  await app.register(memberRoutes);
  await app.register(spaceRoutes);
  await app.register(collectionRoutes);
  await app.register(groupRoutes);
  await app.register(itemRoutes);
  await app.register(sessionRoutes);
  await app.register(tagRoutes);
  await app.register(bulkRoutes);
  await app.register(searchRoutes);
  await app.register(importExportRoutes);
  await app.register(shareRoutes);
  await app.register(historyRoutes);
  await app.register(mindmapRoutes);
  await app.register(accountRoutes);
  await app.register(jobRoutes);
  await app.register(flagRoutes);
  await app.register(billingRoutes);
  await app.register(nextQueueRoutes);

  return app;
}
