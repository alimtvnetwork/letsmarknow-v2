import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/AppError.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Middleware ensuring X-Organization-Id header is present and valid on Org-scoped routes.
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §2.2
 */
export async function requireOrganization(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const orgHeader = request.headers["x-organization-id"];

  if (!orgHeader || typeof orgHeader !== "string" || !orgHeader.trim()) {
    throw new AppError({
      statusCode: 400,
      code: "ORG_HEADER_REQUIRED",
      message: "Missing required X-Organization-Id header for this organization-scoped resource",
      docUrl: "https://docs.letsmarknow.com/errors/org_header_required",
    });
  }

  const cleanOrgId = orgHeader.trim();

  if (!UUID_REGEX.test(cleanOrgId)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_FAILED",
      field: "x-organization-id",
      message: "Header X-Organization-Id must be a valid UUID",
      docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
    });
  }

  request.organizationId = cleanOrgId;
}
