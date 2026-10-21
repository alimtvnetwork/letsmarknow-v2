import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, and } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { memRepo } from "../db/memRepo.js";
import type { OrgRole } from "../types/fastify.js";

/**
 * RBAC guard middleware factory that requires the authenticated caller to have one of the allowed roles
 * within the targeted organization.
 * Spec: 02-spec/21-app/08-sharing-collab/05-permissions-matrix.md
 */
export function requireOrgRole(allowedRoles: OrgRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // 1. Ensure caller is authenticated
    if (!request.account || !request.account.id) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Authentication required.",
        docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
      });
    }

    // 2. Resolve organizationId from header or route params
    const headerOrgId = request.headers["x-organization-id"] as string | undefined;
    const params = request.params as { orgId?: string; id?: string } | undefined;
    const organizationId = headerOrgId || params?.orgId || params?.id;

    if (!organizationId) {
      throw new AppError({
        statusCode: 400,
        code: "ORG_HEADER_REQUIRED",
        message: "X-Organization-Id header or organization route parameter is required.",
        docUrl: "https://docs.letsmarknow.com/errors/org_header_required",
      });
    }

    const isDb = await checkDbConnection();
    let memberRow: {
      id: string;
      organizationId: string;
      accountId: string | null;
      role: OrgRole;
      status: string;
    } | null = null;

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.organizationId, organizationId),
            eq(schema.orgMembers.accountId, request.account.id),
            eq(schema.orgMembers.status, "active")
          )
        )
        .limit(1);

      if (rows.length > 0) {
        memberRow = {
          id: rows[0].id,
          organizationId: rows[0].organizationId,
          accountId: rows[0].accountId,
          role: rows[0].role as OrgRole,
          status: rows[0].status,
        };
      }
    }

    if (!memberRow) {
      const found = memRepo.members.find(
        (m) =>
          m.organizationId === organizationId &&
          m.accountId === request.account!.id &&
          m.status === "active"
      );
      if (found) memberRow = found;
    }

    // Spec convention: If caller is not an active member, return uniform 404 NOT_FOUND to avoid Org enumeration
    if (!memberRow) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Organization not found or you are not an active member.",
        docUrl: "https://docs.letsmarknow.com/errors/not_found",
      });
    }

    // Check if role is authorized
    if (!allowedRoles.includes(memberRow.role)) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: `Forbidden. Role '${memberRow.role}' is insufficient for this action. Required: ${allowedRoles.join(", ")}.`,
        docUrl: "https://docs.letsmarknow.com/errors/forbidden",
      });
    }

    // Attach to request context
    request.organizationId = organizationId;
    request.orgMember = {
      id: memberRow.id,
      organizationId: memberRow.organizationId,
      role: memberRow.role,
    };
  };
}

export const requireOwner = requireOrgRole(["owner"]);
export const requireAdminOrOwner = requireOrgRole(["owner", "admin"]);
export const requireEditorOrAbove = requireOrgRole(["owner", "admin", "editor"]);
export const requireViewerOrAbove = requireOrgRole(["owner", "admin", "editor", "viewer"]);
