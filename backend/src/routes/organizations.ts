import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireOwner, requireAdminOrOwner } from "../middleware/rbac.js";
import { organizationService } from "../services/organizationService.js";

const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  theme: z.string().optional(),
  brand_color: z.string().max(7).optional(),
  avatar_image_url: z.string().url().nullable().optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  theme: z.string().optional(),
  brand_color: z.string().max(7).optional(),
  avatar_image_url: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  default_space_id: z.string().uuid().optional(),
});

const transferOwnershipSchema = z.object({
  new_owner_account_id: z.string().uuid("Invalid new owner account ID"),
  current_password: z.string().optional(),
});

const deleteOrgSchema = z.object({
  confirm_text: z.string().min(1, "Confirmation text is required"),
  current_password: z.string().optional(),
});

export const organizationRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/organizations - List my organizations
  app.get("/v1/organizations", { preHandler: [requireAuth] }, async (request, reply) => {
    const list = await organizationService.listMyOrganizations(request.account!.id);
    return reply.status(200).send({ data: list });
  });

  // POST /v1/organizations - Create organization
  app.post("/v1/organizations", { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = createOrgSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid payload",
        details: { errors: parseResult.error.format() },
      });
    }

    const org = await organizationService.createOrganization(request.account!.id, {
      name: parseResult.data.name,
      theme: parseResult.data.theme,
      brandColor: parseResult.data.brand_color,
      avatarImageUrl: parseResult.data.avatar_image_url || undefined,
    });

    return reply.status(201).send({ data: org });
  });

  // GET /v1/organizations/:id - Get organization
  app.get("/v1/organizations/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const org = await organizationService.getOrganization(params.id, request.account!.id);
    return reply.status(200).send({ data: org });
  });

  // PATCH /v1/organizations/:id - Update organization (Owner or Admin)
  app.patch(
    "/v1/organizations/:id",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateOrgSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const updated = await organizationService.updateOrganization(
        params.id,
        request.account!.id,
        {
          name: parseResult.data.name,
          theme: parseResult.data.theme,
          brandColor: parseResult.data.brand_color,
          avatarImageUrl: parseResult.data.avatar_image_url || undefined,
          description: parseResult.data.description || undefined,
          defaultSpaceId: parseResult.data.default_space_id,
        }
      );

      return reply.status(200).send({ data: updated });
    }
  );

  // POST /v1/organizations/:id/transfer-ownership (Owner only)
  app.post(
    "/v1/organizations/:id/transfer-ownership",
    { preHandler: [requireAuth, requireOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = transferOwnershipSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const updated = await organizationService.transferOwnership(
        params.id,
        request.account!.id,
        parseResult.data.new_owner_account_id
      );

      return reply.status(200).send({ data: updated });
    }
  );

  // DELETE /v1/organizations/:id (Owner only)
  app.delete(
    "/v1/organizations/:id",
    { preHandler: [requireAuth, requireOwner] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = deleteOrgSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const result = await organizationService.deleteOrganization(
        params.id,
        request.account!.id,
        parseResult.data.confirm_text
      );

      return reply.status(202).send({ data: result });
    }
  );
};
