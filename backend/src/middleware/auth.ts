import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../utils/crypto.js";

/**
 * Authentication guard middleware requiring a valid Bearer JWT.
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §2.1
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const queryToken = (request.query as { token?: string })?.token;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (queryToken && typeof queryToken === "string") {
    token = queryToken.trim();
  }

  if (!token) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required. Bearer token missing.",
      docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
    });
  }

  try {
    const payload = await verifyAccessToken(token);
    request.account = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (err: unknown) {
    const errorName = (err as { code?: string })?.code || (err as Error)?.name;
    if (errorName === "ERR_JWT_EXPIRED") {
      throw new AppError({
        statusCode: 401,
        code: "TOKEN_EXPIRED",
        message: "Access token expired. Please refresh your session.",
        docUrl: "https://docs.letsmarknow.com/errors/token_expired",
      });
    }

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Invalid access token.",
      docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
    });
  }
}

/**
 * Optional authentication middleware that attaches request.account if token is present, but doesn't fail.
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return;

  const token = authHeader.substring(7).trim();
  try {
    const payload = await verifyAccessToken(token);
    request.account = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Ignore invalid optional token
  }
}
