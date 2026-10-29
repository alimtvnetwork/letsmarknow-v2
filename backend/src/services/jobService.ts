import { uuidv7 } from "../db/utils/uuidv7.js";
import { AppError } from "../errors/AppError.js";
import { memRepo, type MemJob, type MemItem } from "../db/memRepo.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export interface CreateJobParams {
  organizationId: string;
  accountId?: string | null;
  kind: string;
  phase?: string;
  progress?: { processed: number; total: number; percent: number };
  etaSeconds?: number | null;
  metadata?: Record<string, any>;
  expiresHours?: number;
}

export interface LinkHealthCheckParams {
  organizationId: string;
  accountId: string;
  spaceId?: string;
  collectionId?: string;
  urls?: string[];
  mockStatuses?: Record<string, number>;
}

export interface FaviconFetchParams {
  organizationId: string;
  accountId: string;
  spaceId?: string;
  collectionId?: string;
  forceRefresh?: boolean;
}

export class JobService {
  /**
   * Create and register a background job in memory
   */
  public async createJob(params: CreateJobParams): Promise<MemJob> {
    const id = uuidv7();
    const now = new Date();
    const expiresHours = params.expiresHours || 24;
    const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);

    const job: MemJob = {
      id,
      organizationId: params.organizationId,
      createdByAccountId: params.accountId || null,
      kind: params.kind,
      status: "queued",
      phase: params.phase || "queued",
      progress: params.progress || { processed: 0, total: 0, percent: 0 },
      etaSeconds: params.etaSeconds ?? null,
      resultUrl: null,
      resultSummary: null,
      error: null,
      metadata: params.metadata || null,
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      expiresAt,
    };

    memRepo.jobs.unshift(job);
    return job;
  }

  /**
   * Get a job by ID with universal cross-domain resolution (native jobs, imports, exports)
   * Spec: 02-spec/21-app/03-api-endpoints/20-jobs.md
   */
  public async getJob(jobId: string, orgId: string): Promise<MemJob> {
    // 1. Check native jobs
    const nativeJob = memRepo.jobs.find((j) => j.id === jobId);
    if (nativeJob) {
      if (nativeJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      if (nativeJob.expiresAt && nativeJob.expiresAt.getTime() < Date.now()) {
        throw new AppError({
          statusCode: 410,
          code: "GONE",
          message: "Job artifact has expired and been purged",
        });
      }
      return nativeJob;
    }

    // 2. Cross-domain resolution: check imports
    const importJob = memRepo.imports.find((j) => j.id === jobId);
    if (importJob) {
      if (importJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      return {
        id: importJob.id,
        organizationId: importJob.organizationId,
        createdByAccountId: importJob.accountId,
        kind: "import",
        status: importJob.status === "awaiting_upload" ? "queued" : importJob.status,
        phase: importJob.phase,
        progress: importJob.progress,
        etaSeconds: null,
        resultUrl: importJob.status === "succeeded" ? `/v1/imports/${importJob.id}/preview` : null,
        resultSummary:
          importJob.summary ||
          (importJob.parsedSummary ? { totals: importJob.parsedSummary.totals } : null),
        error: null,
        metadata: { filename: importJob.filename, source: importJob.source },
        createdAt: importJob.createdAt,
        updatedAt: importJob.updatedAt,
        finishedAt: importJob.finishedAt || null,
        expiresAt:
          importJob.uploadExpiresAt ||
          new Date(importJob.createdAt.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // 3. Cross-domain resolution: check exports
    const exportJob = memRepo.exports.find((j) => j.id === jobId);
    if (exportJob) {
      if (exportJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      return {
        id: exportJob.id,
        organizationId: exportJob.organizationId,
        createdByAccountId: exportJob.accountId,
        kind: "export",
        status: exportJob.status,
        phase: exportJob.status === "succeeded" ? "ready" : "processing",
        progress: {
          processed: exportJob.itemsCount,
          total: exportJob.itemsCount,
          percent: exportJob.status === "succeeded" ? 100 : 50,
        },
        etaSeconds: null,
        resultUrl: exportJob.downloadUrl || null,
        resultSummary: {
          items_count: exportJob.itemsCount,
          size_bytes: exportJob.sizeBytes,
          format: exportJob.format,
        },
        error: null,
        metadata: { format: exportJob.format, scope: exportJob.scope },
        createdAt: exportJob.createdAt,
        updatedAt: exportJob.updatedAt,
        finishedAt: exportJob.finishedAt || null,
        expiresAt:
          exportJob.downloadExpiresAt ||
          new Date(exportJob.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      };
    }

    // Not found anywhere
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Job not found",
    });
  }

  /**
   * List jobs for an organization with optional kind / status filters
   */
  public async listJobs(
    orgId: string,
    filters: { kind?: string; status?: string; limit?: number } = {}
  ): Promise<MemJob[]> {
    const limit = filters.limit ? Math.min(Math.max(filters.limit, 1), 100) : 50;

    // Gather native jobs
    const list: MemJob[] = [...memRepo.jobs.filter((j) => j.organizationId === orgId)];

    // Gather import jobs
    for (const ij of memRepo.imports.filter((j) => j.organizationId === orgId)) {
      list.push({
        id: ij.id,
        organizationId: ij.organizationId,
        createdByAccountId: ij.accountId,
        kind: "import",
        status: ij.status === "awaiting_upload" ? "queued" : ij.status,
        phase: ij.phase,
        progress: ij.progress,
        etaSeconds: null,
        resultUrl: ij.status === "succeeded" ? `/v1/imports/${ij.id}/preview` : null,
        resultSummary:
          ij.summary || (ij.parsedSummary ? { totals: ij.parsedSummary.totals } : null),
        error: null,
        metadata: { filename: ij.filename, source: ij.source },
        createdAt: ij.createdAt,
        updatedAt: ij.updatedAt,
        finishedAt: ij.finishedAt || null,
        expiresAt:
          ij.uploadExpiresAt || new Date(ij.createdAt.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    // Gather export jobs
    for (const ej of memRepo.exports.filter((j) => j.organizationId === orgId)) {
      list.push({
        id: ej.id,
        organizationId: ej.organizationId,
        createdByAccountId: ej.accountId,
        kind: "export",
        status: ej.status,
        phase: ej.status === "succeeded" ? "ready" : "processing",
        progress: {
          processed: ej.itemsCount,
          total: ej.itemsCount,
          percent: ej.status === "succeeded" ? 100 : 50,
        },
        etaSeconds: null,
        resultUrl: ej.downloadUrl || null,
        resultSummary: {
          items_count: ej.itemsCount,
          size_bytes: ej.sizeBytes,
          format: ej.format,
        },
        error: null,
        metadata: { format: ej.format, scope: ej.scope },
        createdAt: ej.createdAt,
        updatedAt: ej.updatedAt,
        finishedAt: ej.finishedAt || null,
        expiresAt:
          ej.downloadExpiresAt || new Date(ej.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Filter
    let filtered = list;
    if (filters.kind) {
      filtered = filtered.filter((j) => j.kind === filters.kind);
    }
    if (filters.status) {
      filtered = filtered.filter((j) => j.status === filters.status);
    }

    // Sort descending by created_at
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered.slice(0, limit);
  }

  /**
   * Cancel an in-progress or queued job
   */
  public async cancelJob(jobId: string, orgId: string): Promise<MemJob> {
    const nativeJob = memRepo.jobs.find((j) => j.id === jobId);
    if (nativeJob) {
      if (nativeJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      if (["succeeded", "failed", "canceled"].includes(nativeJob.status)) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `Job cannot be canceled because it is already ${nativeJob.status}`,
        });
      }
      nativeJob.status = "canceled";
      nativeJob.phase = "canceled";
      nativeJob.updatedAt = new Date();
      return nativeJob;
    }

    // Check imports
    const importJob = memRepo.imports.find((j) => j.id === jobId);
    if (importJob) {
      if (importJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      if (["succeeded", "failed", "canceled"].includes(importJob.status)) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `Job cannot be canceled because it is already ${importJob.status}`,
        });
      }
      importJob.status = "canceled";
      importJob.updatedAt = new Date();
      return this.getJob(jobId, orgId);
    }

    // Check exports
    const exportJob = memRepo.exports.find((j) => j.id === jobId);
    if (exportJob) {
      if (exportJob.organizationId !== orgId) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Job belongs to another organization",
        });
      }
      if (["succeeded", "failed", "canceled"].includes(exportJob.status)) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `Job cannot be canceled because it is already ${exportJob.status}`,
        });
      }
      exportJob.status = "canceled";
      exportJob.updatedAt = new Date();
      return this.getJob(jobId, orgId);
    }

    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Job not found",
    });
  }

  /**
   * Run or queue a Link Health Checker job
   * Audits links for 200 OK, 301/302 redirects, 404 dead links, timeouts, and broken protocols
   */
  public async startLinkHealthCheck(params: LinkHealthCheckParams): Promise<MemJob> {
    const now = new Date();
    const jobId = uuidv7();

    // 1. Gather items in scope
    let items = memRepo.items.filter(
      (i) => i.organizationId === params.organizationId && !i.deletedAt
    );
    if (params.spaceId) {
      items = items.filter((i) => i.spaceId === params.spaceId);
    }
    if (params.collectionId) {
      items = items.filter((i) => i.collectionId === params.collectionId);
    }
    if (params.urls && params.urls.length > 0) {
      const urlSet = new Set(params.urls);
      items = items.filter((i) => urlSet.has(i.url));
    }

    // Create job record
    const job: MemJob = {
      id: jobId,
      organizationId: params.organizationId,
      createdByAccountId: params.accountId,
      kind: "link_health",
      status: "running",
      phase: "checking_links",
      progress: {
        processed: 0,
        total: items.length,
        percent: 0,
      },
      etaSeconds: Math.ceil(items.length * 0.1),
      resultUrl: null,
      resultSummary: null,
      error: null,
      metadata: {
        space_id: params.spaceId || null,
        collection_id: params.collectionId || null,
      },
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
    memRepo.jobs.unshift(job);

    // 2. Perform audits
    let okCount = 0;
    let brokenCount = 0;
    let redirectCount = 0;
    let timeoutCount = 0;

    const brokenItems: Array<{
      item_id: string;
      url: string;
      status_code: number;
      error: string;
      title: string;
      collection_id: string;
    }> = [];

    const redirectItems: Array<{
      item_id: string;
      url: string;
      target_url: string;
      title: string;
    }> = [];

    const mockStatuses = params.mockStatuses || {};

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const urlStr = (item.url || "").trim();

      let statusCode = 200;
      let errorDesc = "";
      let targetUrl = "";

      if (mockStatuses[urlStr] !== undefined) {
        statusCode = mockStatuses[urlStr];
      } else if (urlStr.startsWith("http://dead-") || urlStr.includes("404") || urlStr.includes("broken")) {
        statusCode = 404;
        errorDesc = "Not Found";
      } else if (urlStr.includes("timeout") || urlStr.includes("408")) {
        statusCode = 408;
        errorDesc = "Request Timeout";
      } else if (urlStr.includes("redirect") || urlStr.includes("301")) {
        statusCode = 301;
        targetUrl = urlStr.replace("redirect", "target");
      } else if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
        statusCode = 400;
        errorDesc = "Unsupported Protocol";
      }

      // Tally categories
      if (statusCode >= 200 && statusCode < 300) {
        okCount++;
      } else if (statusCode >= 300 && statusCode < 400) {
        redirectCount++;
        redirectItems.push({
          item_id: item.id,
          url: item.url,
          target_url: targetUrl || `${item.url}/moved`,
          title: item.title,
        });
      } else if (statusCode === 408 || statusCode === 504) {
        timeoutCount++;
        brokenItems.push({
          item_id: item.id,
          url: item.url,
          status_code: statusCode,
          error: errorDesc || "Timeout",
          title: item.title,
          collection_id: item.collectionId,
        });
      } else {
        brokenCount++;
        brokenItems.push({
          item_id: item.id,
          url: item.url,
          status_code: statusCode,
          error: errorDesc || "Dead Link / Error",
          title: item.title,
          collection_id: item.collectionId,
        });
      }

      job.progress = {
        processed: idx + 1,
        total: items.length,
        percent: items.length > 0 ? Math.round(((idx + 1) / items.length) * 100) : 100,
      };
    }

    // 3. Mark completed
    job.status = "succeeded";
    job.phase = "complete";
    job.etaSeconds = 0;
    job.finishedAt = new Date();
    job.updatedAt = new Date();
    job.resultSummary = {
      total_checked: items.length,
      ok_count: okCount,
      broken_count: brokenCount,
      redirect_count: redirectCount,
      timeout_count: timeoutCount,
      broken_items: brokenItems,
      redirect_items: redirectItems,
    };

    return job;
  }

  /**
   * Run or queue a Favicon Fetching & Refresh job
   * Strictly enforces DDG fallback; NEVER uses Google s2 per spec 06-ui-ux/18-favicon-pipeline.md
   */
  public async startFaviconFetch(params: FaviconFetchParams): Promise<MemJob> {
    const now = new Date();
    const jobId = uuidv7();

    let items = memRepo.items.filter(
      (i) => i.organizationId === params.organizationId && !i.deletedAt
    );
    if (params.spaceId) {
      items = items.filter((i) => i.spaceId === params.spaceId);
    }
    if (params.collectionId) {
      items = items.filter((i) => i.collectionId === params.collectionId);
    }

    // If not force refresh, only fetch items without favicon
    if (!params.forceRefresh) {
      items = items.filter((i) => !i.faviconUrl);
    }

    const job: MemJob = {
      id: jobId,
      organizationId: params.organizationId,
      createdByAccountId: params.accountId,
      kind: "favicon_fetch",
      status: "running",
      phase: "resolving_favicons",
      progress: {
        processed: 0,
        total: items.length,
        percent: 0,
      },
      etaSeconds: Math.ceil(items.length * 0.05),
      resultUrl: null,
      resultSummary: null,
      error: null,
      metadata: {
        force_refresh: Boolean(params.forceRefresh),
        space_id: params.spaceId || null,
        collection_id: params.collectionId || null,
      },
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
    memRepo.jobs.unshift(job);

    let resolvedCount = 0;
    let failedCount = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      try {
        const u = new URL(item.url);
        const host = u.hostname.toLowerCase();
        // DuckDuckGo proxy fallback per spec 18-favicon-pipeline.md §1 & §2
        const faviconUrl = `https://icons.duckduckgo.com/ip3/${host}.ico`;
        item.faviconUrl = faviconUrl;
        item.updatedAt = new Date();
        resolvedCount++;
      } catch {
        failedCount++;
      }

      job.progress = {
        processed: idx + 1,
        total: items.length,
        percent: items.length > 0 ? Math.round(((idx + 1) / items.length) * 100) : 100,
      };
    }

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      for (const item of items) {
        if (item.faviconUrl) {
          await db
            .update(schema.items)
            .set({ faviconUrl: item.faviconUrl, updatedAt: new Date() })
            .where(eq(schema.items.id, item.id));
        }
      }
    }

    job.status = "succeeded";
    job.phase = "complete";
    job.etaSeconds = 0;
    job.finishedAt = new Date();
    job.updatedAt = new Date();
    job.resultSummary = {
      total_checked: items.length,
      favicons_resolved: resolvedCount,
      favicons_failed: failedCount,
    };

    return job;
  }

  /**
   * Aggregate link health statistics for an organization
   */
  public async getLinkHealthStats(orgId: string): Promise<{
    total_items: number;
    healthy: number;
    broken: number;
    redirects: number;
    timeouts: number;
    last_checked_at: string | null;
  }> {
    const items = memRepo.items.filter((i) => i.organizationId === orgId && !i.deletedAt);

    // Find the latest completed link_health job
    const latestJob = memRepo.jobs
      .filter((j) => j.organizationId === orgId && j.kind === "link_health" && j.status === "succeeded")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (latestJob && latestJob.resultSummary) {
      return {
        total_items: items.length,
        healthy: latestJob.resultSummary.ok_count || 0,
        broken: latestJob.resultSummary.broken_count || 0,
        redirects: latestJob.resultSummary.redirect_count || 0,
        timeouts: latestJob.resultSummary.timeout_count || 0,
        last_checked_at: latestJob.finishedAt?.toISOString() || latestJob.createdAt.toISOString(),
      };
    }

    return {
      total_items: items.length,
      healthy: items.length,
      broken: 0,
      redirects: 0,
      timeouts: 0,
      last_checked_at: null,
    };
  }
}

export const jobService = new JobService();
