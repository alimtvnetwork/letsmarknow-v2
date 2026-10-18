import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  requireEditorOrAbove,
  requireViewerOrAbove,
  requireAdminOrOwner,
} from "../middleware/rbac.js";
import { shareService } from "../services/shareService.js";
import { env } from "../config/env.js";

const createShareSchema = z.object({
  target_type: z.enum(["space", "collection", "group", "item"]),
  target_id: z.string().uuid("Invalid target_id"),
  mode: z.enum(["public", "password", "invite_only"]).default("public"),
  slug: z.string().min(3).max(64).nullable().optional(),
  title_override: z.string().max(120).nullable().optional(),
  description_override: z.string().max(500).nullable().optional(),
  expires_at: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  allowed_emails: z.array(z.string().email()).optional(),
  allow_clone_to_my_account: z.boolean().optional(),
  show_branding: z.boolean().optional(),
  analytics_enabled: z.boolean().optional(),
  default_view_mode: z.string().optional(),
});

const updateShareSchema = z.object({
  mode: z.enum(["public", "password", "invite_only"]).optional(),
  title_override: z.string().max(120).nullable().optional(),
  description_override: z.string().max(500).nullable().optional(),
  expires_at: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  allowed_emails: z.array(z.string().email()).optional(),
  allow_clone_to_my_account: z.boolean().optional(),
  show_branding: z.boolean().optional(),
  analytics_enabled: z.boolean().optional(),
  default_view_mode: z.string().optional(),
});

const rotateSlugSchema = z.object({
  new_slug: z.string().min(3).max(64).nullable().optional(),
});

const purgeShareSchema = z.object({
  confirm_slug: z.string().min(1, "confirm_slug is required"),
});

const unlockShareSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const shareRoutes: FastifyPluginAsync = async (app) => {
  // =========================================================================
  // MANAGEMENT ENDPOINTS (/v1/shares)
  // All require bearer auth + X-Organization-Id
  // =========================================================================

  // GET /v1/shares - List shares for entity or org
  app.get(
    "/v1/shares",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        space_id?: string;
        collection_id?: string;
        group_id?: string;
        item_id?: string;
        include_revoked?: string;
      };

      const shares = await shareService.listShares(request.organizationId!, {
        space_id: query.space_id,
        collection_id: query.collection_id,
        group_id: query.group_id,
        item_id: query.item_id,
        include_revoked: query.include_revoked === "true",
      });

      return reply.status(200).send({ data: shares });
    }
  );

  // POST /v1/shares - Create share
  app.post(
    "/v1/shares",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createShareSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const share = await shareService.createShare(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(201).send({ data: share });
    }
  );

  // GET /v1/shares/:id - Get single share
  app.get(
    "/v1/shares/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const share = await shareService.getShare(request.organizationId!, id);
      return reply.status(200).send({ data: share });
    }
  );

  // PATCH /v1/shares/:id - Update share
  app.patch(
    "/v1/shares/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateShareSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const updated = await shareService.updateShare(
        request.organizationId!,
        id,
        parseResult.data
      );

      return reply.status(200).send({ data: updated });
    }
  );

  // POST /v1/shares/:id/rotate-slug - Rotate slug
  app.post(
    "/v1/shares/:id/rotate-slug",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = rotateSlugSchema.safeParse(request.body || {});
      const newSlug = parseResult.success ? parseResult.data.new_slug : undefined;

      const updated = await shareService.rotateSlug(
        request.organizationId!,
        id,
        newSlug
      );

      return reply.status(200).send({ data: updated });
    }
  );

  // POST /v1/shares/:id/revoke - Revoke share
  app.post(
    "/v1/shares/:id/revoke",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = await shareService.revokeShare(request.organizationId!, id);
      return reply.status(200).send({ data: updated });
    }
  );

  // POST /v1/shares/:id/restore - Restore share
  app.post(
    "/v1/shares/:id/restore",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = await shareService.restoreShare(request.organizationId!, id);
      return reply.status(200).send({ data: updated });
    }
  );

  // GET /v1/shares/:id/analytics - Get share analytics
  app.get(
    "/v1/shares/:id/analytics",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const query = request.query as { range?: string };
      const range = (["24h", "7d", "30d", "all"].includes(query.range || "")
        ? query.range
        : "30d") as "24h" | "7d" | "30d" | "all";

      const analytics = await shareService.getAnalytics(
        request.organizationId!,
        id,
        range
      );

      return reply.status(200).send({ data: analytics });
    }
  );

  // POST /v1/shares/:id/invites/resend - Resend invite emails
  app.post(
    "/v1/shares/:id/invites/resend",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { emails?: string[] } | undefined;

      const res = await shareService.resendInvites(
        request.organizationId!,
        id,
        body?.emails
      );

      return reply.status(202).send({ data: res });
    }
  );

  // POST /v1/shares/:id/purge - Hard-delete share
  app.post(
    "/v1/shares/:id/purge",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = purgeShareSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "confirm_slug is required",
          field: "confirm_slug",
        });
      }

      const res = await shareService.purgeShare(
        request.organizationId!,
        id,
        parseResult.data.confirm_slug
      );

      return reply.status(200).send({ data: res });
    }
  );

  // POST /v1/shares/links/:id/revoke - Forward-compatibility v2 multi-link stub
  app.post(
    "/v1/shares/links/:id/revoke",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (_request, _reply) => {
      throw new AppError({
        statusCode: 403,
        code: "FEATURE_NOT_AVAILABLE",
        message: "Multi-link share model is not yet available in v1.",
      });
    }
  );

  // =========================================================================
  // PUBLIC VIEWER ENDPOINTS (/v1/public/shares)
  // Unauthenticated or cookie/bearer gated
  // =========================================================================

  // GET /v1/public/shares/:slug - Resolve share metadata
  app.get("/v1/public/shares/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const data = await shareService.resolvePublicShare(slug);
    return reply.status(200).send({ data });
  });

  // POST /v1/public/shares/:slug/unlock - Unlock password-protected share
  app.post("/v1/public/shares/:slug/unlock", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const parseResult = unlockShareSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Password is required to unlock this share.",
        field: "password",
      });
    }

    const result = await shareService.unlockShare(slug, parseResult.data.password);

    // Set signed cookie for this share
    reply.setCookie(`lmn_share_${slug}`, result.token, {
      path: "/",
      maxAge: result.expires_in,
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    });

    return reply.status(200).send({
      data: {
        unlocked: result.unlocked,
        expires_in: result.expires_in,
      },
    });
  });

  // GET /v1/public/shares/:slug/contents - Get full shared contents tree
  app.get(
    "/v1/public/shares/:slug/contents",
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const query = request.query as { view?: string; expand?: string };
      const cookies = (request.cookies || {}) as Record<string, string | undefined>;
      const accountEmail = request.account?.email;

      const contents = await shareService.getShareContents(
        slug,
        query,
        cookies,
        accountEmail
      );

      return reply.status(200).send({
        data: contents,
        page: {
          next_cursor: null,
          has_more: false,
          limit: 200,
        },
      });
    }
  );

  // GET /v1/public/shares/:slug/items - Paginated items list
  app.get(
    "/v1/public/shares/:slug/items",
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const query = request.query as {
        cursor?: string;
        limit?: string;
        group_id?: string;
        tag?: string;
        q?: string;
        sort?: "position" | "created_at_desc" | "title_asc";
      };
      const cookies = (request.cookies || {}) as Record<string, string | undefined>;
      const accountEmail = request.account?.email;

      const res = await shareService.getShareItems(
        slug,
        {
          cursor: query.cursor,
          limit: query.limit ? parseInt(query.limit, 10) : undefined,
          group_id: query.group_id,
          tag: query.tag,
          q: query.q,
          sort: query.sort,
        },
        cookies,
        accountEmail
      );

      return reply.status(200).send(res);
    }
  );

  // POST /v1/public/shares/:slug/views - Track view
  app.post("/v1/public/shares/:slug/views", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = request.body as { client_id?: string; referrer?: string } | undefined;

    await shareService.recordView(slug, body);
    return reply.status(204).send();
  });

  // POST /v1/public/shares/:slug/items/:item_id/clicks - Track item click
  app.post(
    "/v1/public/shares/:slug/items/:item_id/clicks",
    async (request, reply) => {
      const { slug, item_id } = request.params as { slug: string; item_id: string };
      const body = request.body as { client_id?: string } | undefined;

      await shareService.recordClick(slug, item_id, body);
      return reply.status(204).send();
    }
  );

  // POST /v1/public/shares/:slug/comments - Phase 2 stub
  app.post("/v1/public/shares/:slug/comments", async (_request, _reply) => {
    throw new AppError({
      statusCode: 403,
      code: "FEATURE_NOT_AVAILABLE",
      message: "Comments on shared links are part of Phase 2 collaboration features.",
    });
  });
};
