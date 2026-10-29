import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/AppError.js";

/**
 * Optimistic Concurrency helper
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §7
 */
export function assertConcurrency(
  request: FastifyRequest,
  reply: FastifyReply,
  currentUpdatedAt: Date | string | null | undefined
): void {
  if (!currentUpdatedAt) return;

  const currentEtag = new Date(currentUpdatedAt).toISOString();
  reply.header("ETag", currentEtag);

  const ifMatch = request.headers["if-match"];
  if (!ifMatch || typeof ifMatch !== "string") return;

  const cleanIfMatch = ifMatch.replace(/^"|"$/g, "").trim();

  if (cleanIfMatch !== currentEtag) {
    throw new AppError({
      statusCode: 409,
      code: "STALE_RESOURCE",
      message: "Resource was modified by another client since you loaded it",
      details: { current: currentEtag },
      docUrl: "https://docs.letsmarknow.com/errors/stale_resource",
    });
  }
}
