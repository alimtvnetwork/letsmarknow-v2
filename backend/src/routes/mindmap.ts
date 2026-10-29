import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireEditorOrAbove, requireViewerOrAbove } from "../middleware/rbac.js";
import { mindmapService } from "../services/mindmapService.js";

const nodeSchema = z.object({
  id: z.string(),
  kind: z.enum(["item", "group", "collection", "tag", "note"]),
  ref_id: z.string().optional(),
  x: z.number(),
  y: z.number(),
  collapsed: z.boolean().optional(),
  color: z.string().nullable().optional(),
  pinned: z.boolean().optional(),
});

const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.string(),
  label: z.string().optional(),
  weight: z.number().optional(),
});

const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

const createLayoutSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(80, "Name cannot exceed 80 characters"),
  scope_type: z.enum(["space", "collection", "group"]),
  scope_id: z.string().uuid("scope_id must be a valid UUID"),
  is_default: z.boolean().optional(),
  shared_with_org: z.boolean().optional(),
  viewport: viewportSchema.optional(),
  nodes: z.array(nodeSchema).max(5000, "Node count cannot exceed 5000").optional(),
  edges: z.array(edgeSchema).optional(),
});

const updateLayoutSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(80, "Name cannot exceed 80 characters").optional(),
  is_default: z.boolean().optional(),
  shared_with_org: z.boolean().optional(),
  viewport: viewportSchema.optional(),
  nodes: z.array(nodeSchema).max(5000, "Node count cannot exceed 5000").optional(),
  edges: z.array(edgeSchema).optional(),
});

export const mindmapRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/mindmap-layouts - List layouts for a scope
  app.get(
    "/v1/mindmap-layouts",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        scope_type?: string;
        scope_id?: string;
        include_shared?: string;
      };

      if (!query.scope_type || !query.scope_id) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Both scope_type and scope_id query parameters are required",
        });
      }

      const result = await mindmapService.listLayouts(
        request.organizationId!,
        request.account!.id,
        {
          scope_type: query.scope_type,
          scope_id: query.scope_id,
          include_shared: query.include_shared !== "false",
        }
      );

      return reply.send(result);
    }
  );

  // GET /v1/mindmap-layouts/:id - Get a single layout with full payload
  app.get(
    "/v1/mindmap-layouts/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const layout = await mindmapService.getLayout(
        request.organizationId!,
        request.account!.id,
        request.orgMember?.role || "viewer",
        id
      );

      return reply.send({ data: layout });
    }
  );

  // POST /v1/mindmap-layouts - Create a layout
  app.post(
    "/v1/mindmap-layouts",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const parseResult = createLayoutSchema.safeParse(request.body);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: issue?.message || "Invalid layout payload",
          field: issue?.path.join("."),
        });
      }

      const layout = await mindmapService.createLayout(
        request.organizationId!,
        request.account!.id,
        parseResult.data
      );

      return reply.status(201).send({ data: layout });
    }
  );

  // PATCH /v1/mindmap-layouts/:id - Update a layout
  app.patch(
    "/v1/mindmap-layouts/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = updateLayoutSchema.safeParse(request.body);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: issue?.message || "Invalid layout payload",
          field: issue?.path.join("."),
        });
      }

      const layout = await mindmapService.updateLayout(
        request.organizationId!,
        request.account!.id,
        request.orgMember?.role || "viewer",
        id,
        parseResult.data
      );

      return reply.send({ data: layout });
    }
  );

  // DELETE /v1/mindmap-layouts/:id - Delete a layout
  app.delete(
    "/v1/mindmap-layouts/:id",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await mindmapService.deleteLayout(
        request.organizationId!,
        request.account!.id,
        request.orgMember?.role || "viewer",
        id
      );

      return reply.send({ data: result });
    }
  );
};
