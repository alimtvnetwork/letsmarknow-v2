import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireOrganization } from "../middleware/tenancy.js";
import { jobService } from "../services/jobService.js";
import { AppError } from "../errors/AppError.js";
import type { MemJob } from "../db/memRepo.js";

const linkHealthSchema = z.object({
  space_id: z.string().optional(),
  collection_id: z.string().optional(),
  urls: z.array(z.string()).optional(),
  mock_statuses: z.record(z.number()).optional(),
});

const faviconFetchSchema = z.object({
  space_id: z.string().optional(),
  collection_id: z.string().optional(),
  force_refresh: z.boolean().optional(),
});

function formatJob(job: MemJob) {
  return {
    job_id: job.id,
    kind: job.kind,
    status: job.status,
    phase: job.phase || null,
    progress: job.progress || { processed: 0, total: 0, percent: 0 },
    eta_seconds: job.etaSeconds ?? null,
    result_url: job.resultUrl || null,
    result_summary: job.resultSummary || null,
    error: job.error || null,
    organization_id: job.organizationId,
    created_by_account_id: job.createdByAccountId || null,
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
    finished_at: job.finishedAt ? job.finishedAt.toISOString() : null,
    expires_at: job.expiresAt.toISOString(),
  };
}

export const jobRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/jobs - List background jobs for active Org
  app.get(
    "/v1/jobs",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const query = request.query as {
        kind?: string;
        status?: string;
        limit?: string;
      };

      const limit = query.limit ? parseInt(query.limit, 10) : undefined;
      const jobs = await jobService.listJobs(request.organizationId!, {
        kind: query.kind,
        status: query.status,
        limit,
      });

      return reply.status(200).send({
        data: jobs.map(formatJob),
      });
    }
  );

  // GET /v1/jobs/link-health/stats - Link health summary metrics
  app.get(
    "/v1/jobs/link-health/stats",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const stats = await jobService.getLinkHealthStats(request.organizationId!);
      return reply.status(200).send({ data: stats });
    }
  );

  // GET /v1/jobs/:job_id - Canonical poller for any background job (SSE optional)
  app.get(
    "/v1/jobs/:job_id",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const { job_id } = request.params as { job_id: string };
      const query = request.query as { stream?: string };
      const acceptHeader = request.headers.accept || "";

      const job = await jobService.getJob(job_id, request.organizationId!);
      const formatted = formatJob(job);

      // SSE upgrade support per 20-jobs.md
      if (query.stream === "sse" || acceptHeader.includes("text/event-stream")) {
        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });

        reply.raw.write(`data: ${JSON.stringify({ data: formatted })}\n\n`);
        reply.raw.end();
        return;
      }

      return reply.status(200).send({ data: formatted });
    }
  );

  // POST /v1/jobs/:job_id/cancel - Cancel in-progress or queued job
  app.post(
    "/v1/jobs/:job_id/cancel",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const { job_id } = request.params as { job_id: string };
      const job = await jobService.cancelJob(job_id, request.organizationId!);

      return reply.status(200).send({ data: formatJob(job) });
    }
  );

  // POST /v1/jobs/link-health - Trigger link health check audit
  app.post(
    "/v1/jobs/link-health",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const parseResult = linkHealthSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const job = await jobService.startLinkHealthCheck({
        organizationId: request.organizationId!,
        accountId: request.account!.id,
        spaceId: parseResult.data.space_id,
        collectionId: parseResult.data.collection_id,
        urls: parseResult.data.urls,
        mockStatuses: parseResult.data.mock_statuses,
      });

      return reply.status(202).send({
        data: {
          job_id: job.id,
          status: job.status,
          phase: job.phase,
          progress: job.progress,
          result_summary: job.resultSummary,
        },
      });
    }
  );

  // POST /v1/jobs/favicon-fetch - Trigger favicon resolution & cache runner
  app.post(
    "/v1/jobs/favicon-fetch",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const parseResult = faviconFetchSchema.safeParse(request.body || {});
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const job = await jobService.startFaviconFetch({
        organizationId: request.organizationId!,
        accountId: request.account!.id,
        spaceId: parseResult.data.space_id,
        collectionId: parseResult.data.collection_id,
        forceRefresh: parseResult.data.force_refresh,
      });

      return reply.status(202).send({
        data: {
          job_id: job.id,
          status: job.status,
          phase: job.phase,
          progress: job.progress,
          result_summary: job.resultSummary,
        },
      });
    }
  );
};
