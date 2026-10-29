import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { memRepo } from "../db/memRepo.js";
import { itemService } from "../services/itemService.js";
import { workspaceService } from "../services/workspaceService.js";
import { importExportService } from "../services/importExportService.js";

describe("Background Jobs & Link Health Checker Endpoints (Step 15)", () => {
  let app: FastifyInstance;
  let token = "";
  let accountId = "";
  let orgId = "";
  let otherOrgId = "";
  let otherToken = "";
  let spaceId = "";
  let collectionId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // 1. Sign up Primary User
    const primaryRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `job_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Job Tester",
      },
    });
    const primaryBody = primaryRes.json();
    token = primaryBody.data.access_token;
    accountId = primaryBody.data.account_id;
    orgId = primaryBody.data.default_organization_id;

    // 2. Sign up Secondary User (for cross-org 403 tests)
    const secondaryRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `other_job_user_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Other User",
      },
    });
    const secondaryBody = secondaryRes.json();
    otherToken = secondaryBody.data.access_token;
    otherOrgId = secondaryBody.data.default_organization_id;

    // 3. Create Space and Collection for testing link health
    const spaceRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "Job Test Space" },
    });
    spaceId = spaceRes.json().data.id;

    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Job Test Collection" },
    });
    collectionId = colRes.json().data.id;

    // 4. Seed test items (healthy, dead 404, redirect 301, timeout, and missing favicon)
    await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        title: "Healthy Item",
        url: "https://example.com/docs",
      },
    });

    await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        title: "Broken 404 Link",
        url: "https://example.com/404-page-not-found",
      },
    });

    await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        title: "Redirect Link",
        url: "https://example.com/redirect-to-new-location",
      },
    });

    await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        title: "Timeout Link",
        url: "https://example.com/timeout-request",
      },
    });
  });

  it("POST /v1/jobs/link-health - triggers link health check and audits items", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/jobs/link-health",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        collection_id: collectionId,
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.data.job_id).toBeDefined();
    expect(body.data.status).toBe("succeeded");
    expect(body.data.phase).toBe("complete");
    expect(body.data.progress.total).toBe(4);
    expect(body.data.progress.processed).toBe(4);
    expect(body.data.result_summary.ok_count).toBe(1);
    expect(body.data.result_summary.broken_count).toBe(1);
    expect(body.data.result_summary.redirect_count).toBe(1);
    expect(body.data.result_summary.timeout_count).toBe(1);
    expect(body.data.result_summary.broken_items.length).toBe(2); // 404 + timeout
  });

  it("GET /v1/jobs/link-health/stats - returns aggregated health overview metrics", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/jobs/link-health/stats",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.total_items).toBe(4);
    expect(body.data.healthy).toBe(1);
    expect(body.data.broken).toBe(1);
    expect(body.data.redirects).toBe(1);
    expect(body.data.timeouts).toBe(1);
    expect(body.data.last_checked_at).toBeDefined();
  });

  it("POST /v1/jobs/favicon-fetch - resolves missing favicons with DDG proxy fallback", async () => {
    // Assert items initially lack favicon
    const itemsBefore = await itemService.listItems(orgId, { collectionId });
    const missingFavicons = itemsBefore.filter((i) => !i.favicon_url);
    expect(missingFavicons.length).toBeGreaterThan(0);

    const res = await app.inject({
      method: "POST",
      url: "/v1/jobs/favicon-fetch",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        collection_id: collectionId,
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.data.job_id).toBeDefined();
    expect(body.data.status).toBe("succeeded");
    expect(body.data.result_summary.favicons_resolved).toBe(4);

    // Verify items now have DuckDuckGo fallback favicons (NEVER Google s2 per spec 18-favicon-pipeline.md)
    const itemsAfter = await itemService.listItems(orgId, { collectionId });
    for (const item of itemsAfter) {
      expect(item.favicon_url).toBe("https://icons.duckduckgo.com/ip3/example.com.ico");
    }
  });

  it("GET /v1/jobs - lists all recent jobs for the organization", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/jobs",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    const kinds = body.data.map((j: any) => j.kind);
    expect(kinds).toContain("link_health");
    expect(kinds).toContain("favicon_fetch");
  });

  it("GET /v1/jobs/:job_id - retrieves normalized job status envelope", async () => {
    // Fetch recent jobs to get an ID
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/jobs?kind=link_health",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    const job = listRes.json().data[0];

    const res = await app.inject({
      method: "GET",
      url: `/v1/jobs/${job.job_id}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.job_id).toBe(job.job_id);
    expect(body.data.kind).toBe("link_health");
    expect(body.data.status).toBe("succeeded");
    expect(body.data.organization_id).toBe(orgId);
    expect(body.data.created_at).toBeDefined();
    expect(body.data.expires_at).toBeDefined();
  });

  it("GET /v1/jobs/:job_id with ?stream=sse - returns text/event-stream upgrade", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/jobs",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    const jobId = listRes.json().data[0].job_id;

    const res = await app.inject({
      method: "GET",
      url: `/v1/jobs/${jobId}?stream=sse`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.body).toContain(`"job_id":"${jobId}"`);
  });

  it("Cross-domain resolution: GET /v1/jobs/:job_id can poll import & export jobs", async () => {
    // 1. Create an import job
    const importJob = await importExportService.createImportJob(orgId, accountId, {
      source: "chrome",
    });

    const importPollerRes = await app.inject({
      method: "GET",
      url: `/v1/jobs/${importJob.id}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(importPollerRes.statusCode).toBe(200);
    const importBody = importPollerRes.json();
    expect(importBody.data.job_id).toBe(importJob.id);
    expect(importBody.data.kind).toBe("import");

    // 2. Create an export job
    const exportJob = await importExportService.createExport(orgId, accountId, {
      format: "lmn_native_json",
    });

    const exportPollerRes = await app.inject({
      method: "GET",
      url: `/v1/jobs/${exportJob.id}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(exportPollerRes.statusCode).toBe(200);
    const exportBody = exportPollerRes.json();
    expect(exportBody.data.job_id).toBe(exportJob.id);
    expect(exportBody.data.kind).toBe("export");
    expect(exportBody.data.status).toBe("succeeded");
    expect(exportBody.data.result_url).toBe(exportJob.downloadUrl);
  });

  it("POST /v1/jobs/:job_id/cancel - cancels a queued/running job", async () => {
    // Create a queued job directly in memory
    const queuedJob = {
      id: "0190a4f1-6c5e-7c2a-9b3f-queuedjob01",
      organizationId: orgId,
      createdByAccountId: accountId,
      kind: "bulk_delete",
      status: "queued" as const,
      phase: "waiting",
      progress: { processed: 0, total: 100, percent: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    };
    memRepo.jobs.unshift(queuedJob);

    const cancelRes = await app.inject({
      method: "POST",
      url: `/v1/jobs/${queuedJob.id}/cancel`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(cancelRes.statusCode).toBe(200);
    const cancelBody = cancelRes.json();
    expect(cancelBody.data.job_id).toBe(queuedJob.id);
    expect(cancelBody.data.status).toBe("canceled");

    // Canceling already canceled job throws 409 CONFLICT
    const secondCancelRes = await app.inject({
      method: "POST",
      url: `/v1/jobs/${queuedJob.id}/cancel`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    expect(secondCancelRes.statusCode).toBe(409);
    expect(secondCancelRes.json().error.code).toBe("CONFLICT");
  });

  it("GET /v1/jobs/:job_id - throws 404 for unknown job", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/jobs/0190a4f1-6c5e-7c2a-9b3f-nonexistent0",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("GET /v1/jobs/:job_id - throws 403 when queried across organizations", async () => {
    // Create job in primary org
    const jobRes = await app.inject({
      method: "POST",
      url: "/v1/jobs/link-health",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    const jobId = jobRes.json().data.job_id;

    // Attempt to access with other user from other org
    const crossRes = await app.inject({
      method: "GET",
      url: `/v1/jobs/${jobId}`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        "x-organization-id": otherOrgId,
      },
    });

    expect(crossRes.statusCode).toBe(403);
    expect(crossRes.json().error.code).toBe("FORBIDDEN");
  });
});
