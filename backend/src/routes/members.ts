import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  requireAdminOrOwner,
  requireViewerOrAbove,
} from "../middleware/rbac.js";
import { memberService } from "../services/memberService.js";
import type { OrgRole } from "../types/fastify.js";

const inviteRoleEnum = z.enum(["admin", "editor", "viewer", "billing"]);

const inviteItemSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: inviteRoleEnum,
  message: z.string().max(500).optional(),
});

const inviteBodySchema = z.object({
  invites: z.array(inviteItemSchema).min(1, "At least one invite is required").max(50),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

const changeRoleSchema = z.object({
  role: z.enum(["admin", "editor", "viewer", "billing", "guest"]),
});

export const memberRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/members - List members of active organization
  app.get(
    "/v1/members",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { include_pending?: string; role?: string; q?: string };
      const members = await memberService.listMembers(request.organizationId!, {
        includePending: query.include_pending !== "false",
        role: query.role,
        q: query.q,
      });

      return reply.status(200).send({ data: members });
    }
  );

  // POST /v1/members/invites - Invite members (Owner or Admin)
  app.post(
    "/v1/members/invites",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = inviteBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid invite payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const response = await memberService.inviteMembers(
        request.organizationId!,
        request.account!.id,
        parseResult.data.invites as Array<{ email: string; role: OrgRole; message?: string }>
      );

      return reply.status(207).send({ data: response });
    }
  );

  // DELETE /v1/members/:id/invite - Cancel pending invite
  app.delete(
    "/v1/members/:id/invite",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      await memberService.cancelInvite(request.organizationId!, params.id);
      return reply.status(204).send();
    }
  );

  // POST /v1/members/invites/accept - Accept invitation
  app.post(
    "/v1/members/invites/accept",
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const parseResult = acceptInviteSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Token is required to accept invitation.",
        });
      }

      const result = await memberService.acceptInvite(
        parseResult.data.token,
        request.account?.id
      );

      return reply.status(200).send({ data: result });
    }
  );

  // PATCH /v1/members/:id - Change member role
  app.patch(
    "/v1/members/:id",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = changeRoleSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Valid member role is required.",
        });
      }

      await memberService.changeMemberRole(
        request.organizationId!,
        params.id,
        parseResult.data.role as OrgRole,
        request.orgMember!.role
      );

      return reply.status(200).send({
        data: {
          id: params.id,
          role: parseResult.data.role,
        },
      });
    }
  );

  // DELETE /v1/members/:id - Remove member
  app.delete(
    "/v1/members/:id",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      await memberService.removeMember(request.organizationId!, params.id);
      return reply.status(204).send();
    }
  );

  // POST /v1/members/me/leave - Leave organization
  app.post(
    "/v1/members/me/leave",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      await memberService.leaveOrganization(
        request.organizationId!,
        request.account!.id
      );
      return reply.status(204).send();
    }
  );
};
