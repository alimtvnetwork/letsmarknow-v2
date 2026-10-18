import { createHash } from "node:crypto";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../errors/AppError.js";
import { memoryIdempotencyStore } from "../adapters/memoryIdempotencyStore.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hashPayload(payload: unknown): string {
  const jsonStr = payload ? JSON.stringify(payload) : "";
  return createHash("sha256").update(jsonStr).digest("hex");
}

/**
 * Idempotency plugin handling 24-hour response caching for mutating POST endpoints.
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §6
 */
const idempotencyPluginAsync: FastifyPluginAsync = async (fastify) => {
  // Store pending cache hashes on request
  fastify.decorateRequest("idempotencyKey", undefined);

  // Hook to check cached response
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Only applies to POST requests
    if (request.method !== "POST") return;

    const rawKey = request.headers["idempotency-key"];
    if (!rawKey || typeof rawKey !== "string") return;

    const key = rawKey.trim();

    if (!UUID_REGEX.test(key)) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        field: "idempotency-key",
        message: "Idempotency-Key must be a valid UUID",
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const accountId = request.account?.id || null;
    const currentHash = hashPayload(request.body);

    const cached = await memoryIdempotencyStore.get(accountId, key);

    if (cached) {
      if (cached.requestPayloadHash !== currentHash) {
        throw new AppError({
          statusCode: 400,
          code: "IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY",
          message:
            "This Idempotency-Key was already used with a different request payload within 24 hours",
          docUrl:
            "https://docs.letsmarknow.com/errors/idempotency_key_reused_different_body",
        });
      }

      // Return cached response directly
      reply.header("X-Idempotent-Replay", "true");
      reply.status(cached.statusCode).send(cached.body);
      return reply;
    }

    request.idempotencyKey = key;
  });

  // Hook to cache outgoing successful response
  fastify.addHook(
    "onSend",
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      if (request.method !== "POST" || !request.idempotencyKey) return payload;

      // Only cache successful or client error responses, not 5xx internal errors
      if (reply.statusCode >= 500) return payload;

      const accountId = request.account?.id || null;
      const requestPayloadHash = hashPayload(request.body);

      let parsedBody: unknown = payload;
      if (typeof payload === "string") {
        try {
          parsedBody = JSON.parse(payload);
        } catch {
          // keep as string
        }
      }

      await memoryIdempotencyStore.set(accountId, request.idempotencyKey, {
        statusCode: reply.statusCode,
        headers: {},
        body: parsedBody,
        requestPayloadHash,
      });

      return payload;
    }
  );
};

export const idempotencyPlugin = fp(idempotencyPluginAsync, {
  name: "idempotency-plugin",
});
