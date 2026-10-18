import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError, type ErrorEnvelope } from "../errors/AppError.js";

export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const requestId =
    (request.headers["x-request-id"] as string) ||
    request.id ||
    "unknown-request-id";

  // Handle custom AppError
  if (error instanceof AppError) {
    const response: ErrorEnvelope = {
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
        details: error.details,
        request_id: requestId,
        doc_url: error.docUrl,
      },
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const field = firstIssue?.path?.join(".") || undefined;
    const response: ErrorEnvelope = {
      error: {
        code: "VALIDATION_FAILED",
        message: firstIssue?.message || "Validation failed",
        field,
        details: { issues: error.issues },
        request_id: requestId,
        doc_url: "https://docs.letsmarknow.com/errors/validation_failed",
      },
    };
    reply.status(400).send(response);
    return;
  }

  // Handle Fastify built-in validation / rate-limit errors
  const fastifyErr = error as FastifyError;
  if (fastifyErr.statusCode === 429) {
    const response: ErrorEnvelope = {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        request_id: requestId,
        doc_url: "https://docs.letsmarknow.com/errors/rate_limited",
      },
    };
    reply.status(429).send(response);
    return;
  }

  // Log unexpected errors
  request.log.error(error);

  const response: ErrorEnvelope = {
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected internal server error occurred."
          : error.message || "An unexpected error occurred",
      request_id: requestId,
      doc_url: "https://docs.letsmarknow.com/errors/internal_error",
    },
  };

  reply.status(500).send(response);
}
