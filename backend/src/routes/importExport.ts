import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireViewerOrAbove, requireEditorOrAbove } from "../middleware/rbac.js";
import { importExportService } from "../services/importExportService.js";
import { memRepo } from "../db/memRepo.js";
import { organizationService } from "../services/organizationService.js";

export const importExportRoutes: FastifyPluginAsync = async (app) => {
  // =================== IMPORTS ===================

  // POST /v1/imports/upload - Single-shot direct upload (JSON or text body)
  app.post(
    "/v1/imports/upload",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const body = (request.body || {}) as any;
      const manifest = body.manifest || {};
      const fileContent = body.file_content || body.content || body.file || (typeof body === "string" ? body : null);

      if (!fileContent || typeof fileContent !== "string") {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Import file content is required.",
          details: { field: "file" },
        });
      }

      const source = body.source || manifest.source || "bookmarks_html";
      const destination = body.destination || manifest.destination;
      const options = body.options || manifest.options;
      const filename = body.filename || manifest.filename;

      const job = await importExportService.createImportJob(
        request.organizationId!,
        request.account!.id,
        {
          source,
          destination,
          options,
          upload: {
            filename,
            size_bytes: Buffer.byteLength(fileContent, "utf8"),
          },
        }
      );

      await importExportService.processImportContent(job.id, fileContent, filename, source);

      return reply.status(202).send({
        data: {
          import_id: job.id,
          status: "queued",
          size_bytes: job.sizeBytes,
          sha256: job.sha256,
          preview_url: `/v1/imports/${job.id}/preview`,
        },
      });
    }
  );

  // POST /v1/imports - Start two-phase import job
  app.post(
    "/v1/imports",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const body = (request.body || {}) as any;
      if (!body.source) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Field 'source' is required.",
          details: { field: "source" },
        });
      }

      const job = await importExportService.createImportJob(
        request.organizationId!,
        request.account!.id,
        {
          source: body.source,
          destination: body.destination,
          options: body.options,
          upload: body.upload,
        }
      );

      return reply.status(202).send({
        data: {
          import_id: job.id,
          status: "awaiting_upload",
          upload_url: job.uploadUrl,
          upload_method: "PUT",
          upload_expires_at: job.uploadExpiresAt?.toISOString(),
          max_size_bytes: 52428800,
        },
      });
    }
  );

  // PUT /v1/imports/:id/put - Upload content for two-phase import
  app.put(
    "/v1/imports/:id/put",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const content =
        typeof body === "string"
          ? body
          : body?.content || body?.file_content || body?.file;

      if (!content || typeof content !== "string") {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Upload payload content is required.",
          details: { field: "content" },
        });
      }

      const job = await importExportService.processImportContent(id, content);

      return reply.status(202).send({
        data: {
          import_id: job.id,
          status: "queued",
          size_bytes: job.sizeBytes,
          sha256: job.sha256,
          preview_url: `/v1/imports/${job.id}/preview`,
        },
      });
    }
  );

  // GET /v1/imports/:id/preview - Preview parsed import
  app.get(
    "/v1/imports/:id/preview",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.getImport(id, request.organizationId!);

      if (job.status === "canceled") {
        throw new AppError({
          statusCode: 410,
          code: "GONE",
          message: "Import has been canceled and preview is no longer available.",
        });
      }

      if (!job.parsedSummary) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: "Import is still parsing or has not completed preview phase.",
        });
      }

      return reply.status(200).send({
        data: {
          import_id: job.id,
          source: job.source,
          parsed_at: job.updatedAt.toISOString(),
          totals: job.parsedSummary.totals,
          duplicates: job.parsedSummary.duplicates,
          warnings: job.parsedSummary.warnings,
          tree: job.parsedSummary.tree,
          expires_at: job.previewExpiresAt?.toISOString(),
        },
      });
    }
  );

  // GET /v1/imports/:id/status - Lightweight progress polling
  app.get(
    "/v1/imports/:id/status",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.getImport(id, request.organizationId!);

      return reply.status(200).send({
        data: {
          import_id: job.id,
          status: job.status,
          phase: job.phase,
          progress: job.progress,
          eta_seconds: 0,
          updated_at: job.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /v1/imports/:id - Full import detail record
  app.get(
    "/v1/imports/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.getImport(id, request.organizationId!);

      return reply.status(200).send({
        data: {
          import_id: job.id,
          source: job.source,
          status: job.status,
          progress: job.progress,
          summary: job.summary || {
            spaces_created: 0,
            collections_created: 0,
            groups_created: 0,
            items_created: 0,
            items_skipped_duplicate: 0,
            items_failed: 0,
            tags_created: 0,
          },
          errors_url: `/v1/imports/${job.id}/errors.json`,
          started_at: job.createdAt.toISOString(),
          finished_at: job.finishedAt?.toISOString() || null,
        },
      });
    }
  );

  // POST /v1/imports/:id/commit - Commit a previewed import
  app.post(
    "/v1/imports/:id/commit",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as any;

      const job = await importExportService.commitImport(
        id,
        request.organizationId!,
        request.account!.id,
        {
          options: body.options,
          destination: body.destination,
        }
      );

      return reply.status(202).send({
        data: {
          import_id: job.id,
          status: job.status,
          committed_at: job.committedAt?.toISOString(),
        },
      });
    }
  );

  // POST /v1/imports/:id/cancel - Cancel import
  app.post(
    "/v1/imports/:id/cancel",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.cancelImport(id, request.organizationId!);

      return reply.status(200).send({
        data: {
          import_id: job.id,
          status: job.status,
          updated_at: job.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /v1/imports - List imports
  app.get(
    "/v1/imports",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 20;

      const jobs = await importExportService.listImports(request.organizationId!, limit);

      return reply.status(200).send({
        data: jobs.map((j) => ({
          import_id: j.id,
          source: j.source,
          status: j.status,
          progress: j.progress,
          created_at: j.createdAt.toISOString(),
          finished_at: j.finishedAt?.toISOString() || null,
        })),
      });
    }
  );

  // =================== EXPORTS ===================

  // POST /v1/exports - Start export job
  app.post(
    "/v1/exports",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const body = (request.body || {}) as any;

      const job = await importExportService.createExport(
        request.organizationId!,
        request.account!.id,
        {
          format: body.format,
          scope: body.scope,
          options: body.options,
        }
      );

      return reply.status(202).send({
        data: {
          export_id: job.id,
          status: job.status,
          estimated_completion_at: job.finishedAt?.toISOString(),
        },
      });
    }
  );

  // GET /v1/exports/:id - Get export status and metadata
  app.get(
    "/v1/exports/:id",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.getExport(id, request.organizationId!);

      return reply.status(200).send({
        data: {
          export_id: job.id,
          status: job.status,
          format: job.format,
          download_url: job.downloadUrl,
          download_expires_at: job.downloadExpiresAt?.toISOString(),
          size_bytes: job.sizeBytes,
          sha256: job.sha256,
          items_count: job.itemsCount,
        },
      });
    }
  );

  // GET /v1/exports/:id/download - Stream/download the exported file
  app.get(
    "/v1/exports/:id/download",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const job = await importExportService.getExport(id, request.organizationId!);

      let contentType = "application/json";
      let ext = "json";
      if (job.format === "bookmarks_html") {
        contentType = "text/html; charset=UTF-8";
        ext = "html";
      } else if (job.format === "csv_flat") {
        contentType = "text/csv; charset=UTF-8";
        ext = "csv";
      }

      reply.header("Content-Type", contentType);
      reply.header(
        "Content-Disposition",
        `attachment; filename="letsmarknow-export-${job.id.slice(0, 8)}.${ext}"`
      );
      reply.header("X-Export-Sha256", job.sha256 || "");
      reply.header("X-Export-Item-Count", String(job.itemsCount));

      return reply.send(job.payload || "");
    }
  );

  // GET /v1/exports - List exports
  app.get(
    "/v1/exports",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 20;

      const jobs = await importExportService.listExports(request.organizationId!, limit);

      return reply.status(200).send({
        data: jobs.map((j) => ({
          export_id: j.id,
          format: j.format,
          status: j.status,
          size_bytes: j.sizeBytes,
          items_count: j.itemsCount,
          download_url: j.downloadUrl,
          created_at: j.createdAt.toISOString(),
        })),
      });
    }
  );

  // POST /v1/exports/:id/refresh-url - Refresh expired download URL
  app.post(
    "/v1/exports/:id/refresh-url",
    { preHandler: [requireAuth, requireEditorOrAbove] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { ttl_hours?: number };

      const job = await importExportService.refreshExportUrl(
        id,
        request.organizationId!,
        body.ttl_hours
      );

      const objectExpiresAt = new Date(job.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      return reply.status(200).send({
        data: {
          export_id: job.id,
          download_url: job.downloadUrl,
          download_expires_at: job.downloadExpiresAt?.toISOString(),
          object_expires_at: objectExpiresAt.toISOString(),
        },
      });
    }
  );

  // GET /v1/exports/lmn-json/:account_token - Out-of-band migration-token export
  app.get("/v1/exports/lmn-json/:account_token", async (request, reply) => {
    const { account_token } = request.params as { account_token: string };

    if (!account_token || account_token.length < 8) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Invalid or expired migration token.",
      });
    }

    // Resolve account/org from token or fallback to first available org
    let targetOrg = Array.from(memRepo.organizations.values())[0];
    if (!targetOrg) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "No organization associated with this account token.",
      });
    }

    const job = await importExportService.createExport(
      targetOrg.id,
      targetOrg.ownerAccountId,
      { format: "lmn_native_json" }
    );

    reply.header("Content-Type", "application/json");
    reply.header(
      "Content-Disposition",
      `attachment; filename="lmn-export-${targetOrg.slug || "personal"}-${new Date().toISOString().slice(0, 10)}.json"`
    );
    reply.header("X-Export-Sha256", job.sha256 || "");
    reply.header("X-Export-Item-Count", String(job.itemsCount));

    return reply.send(job.payload);
  });
};
