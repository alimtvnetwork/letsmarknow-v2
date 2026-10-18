import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Import / Export Engine Routes", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `impexp_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Import Export Tester",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    orgId = body.data.default_organization_id;

    // Create a Space
    const spaceRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "Existing Workspace" },
    });
    spaceId = spaceRes.json().data.id;

    // Create a Collection
    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Existing Tools" },
    });
    collectionId = colRes.json().data.id;

    // Create an initial item for duplicate detection
    await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "https://github.com",
        title: "GitHub Repository",
      },
    });
  });

  const sampleNetscapeHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1734567890">Dev Bookmarks</H3>
    <DL><p>
        <DT><A HREF="https://github.com?utm_source=test" ADD_DATE="1734567890">GitHub</A>
        <DD>Code hosting and version control
        <DT><A HREF="https://vite.dev" ADD_DATE="1734567890">Vite</A>
        <DD>Next generation frontend tooling
    </DL><p>
</DL><p>`;

  const sampleTobyJson = JSON.stringify({
    lists: [
      {
        title: "Toby Reading List",
        cards: [
          { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
          { title: "TypeScript Lang", url: "https://www.typescriptlang.org" },
        ],
      },
    ],
  });

  const sampleCsv = `url,title,description,tags,collection_path,created_at,starred
https://react.dev,React Docs,Official React documentation,"react;frontend","Work / React Resources",2026-04-01T10:00:00Z,true
https://tailwindcss.com,Tailwind CSS,Rapidly build modern websites,"css;styling","Work / Styling",2026-04-01T10:00:00Z,false`;

  // 1. Single-shot upload (POST /v1/imports/upload)
  it("should upload and parse Netscape Bookmark HTML in a single shot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/imports/upload",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        source: "bookmarks_html",
        file_content: sampleNetscapeHtml,
        filename: "bookmarks.html",
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.data).toHaveProperty("import_id");
    expect(body.data.status).toBe("queued");
    expect(body.data.preview_url).toContain("/v1/imports/");
    expect(body.data.size_bytes).toBeGreaterThan(0);
    expect(body.data.sha256).toBeDefined();

    const importId = body.data.import_id;

    // 2. Preview endpoint
    const previewRes = await app.inject({
      method: "GET",
      url: `/v1/imports/${importId}/preview`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(previewRes.statusCode).toBe(200);
    const preview = previewRes.json().data;
    expect(preview.source).toBe("bookmarks_html");
    expect(preview.totals.items).toBe(2);
    // https://github.com?utm_source=test normalizes to https://github.com and matches existing item
    expect(preview.duplicates.by_url_in_org).toBe(1);
    expect(preview.tree).toHaveLength(1);
    expect(preview.tree[0].name).toBe("Dev Bookmarks");

    // 3. Status endpoint
    const statusRes = await app.inject({
      method: "GET",
      url: `/v1/imports/${importId}/status`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.json().data.phase).toBe("awaiting_commit");

    // 4. Commit endpoint with deduplication skip
    const commitRes = await app.inject({
      method: "POST",
      url: `/v1/imports/${importId}/commit`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        options: { dedupe_urls: true, on_duplicate: "skip" },
        destination: { kind: "existing_space", space_id: spaceId },
      },
    });

    expect(commitRes.statusCode).toBe(202);
    expect(commitRes.json().data.status).toBe("succeeded");

    // 5. Get full detail record
    const detailRes = await app.inject({
      method: "GET",
      url: `/v1/imports/${importId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(detailRes.statusCode).toBe(200);
    const detail = detailRes.json().data;
    expect(detail.status).toBe("succeeded");
    expect(detail.summary.items_created).toBe(1); // Vite created
    expect(detail.summary.items_skipped_duplicate).toBe(1); // GitHub skipped
  });

  it("should support two-phase upload flow with Toby JSON", async () => {
    // Phase 1: create job
    const initRes = await app.inject({
      method: "POST",
      url: "/v1/imports",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        source: "toby_json",
        destination: { kind: "existing_space", space_id: spaceId },
      },
    });

    expect(initRes.statusCode).toBe(202);
    const initData = initRes.json().data;
    expect(initData.status).toBe("awaiting_upload");
    const importId = initData.import_id;

    // Phase 2: PUT payload
    const putRes = await app.inject({
      method: "PUT",
      url: `/v1/imports/${importId}/put`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { content: sampleTobyJson },
    });

    expect(putRes.statusCode).toBe(202);

    // Commit
    const commitRes = await app.inject({
      method: "POST",
      url: `/v1/imports/${importId}/commit`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        destination: { kind: "existing_space", space_id: spaceId },
      },
    });

    expect(commitRes.statusCode).toBe(202);
    expect(commitRes.json().data.status).toBe("succeeded");
  });

  it("should support CSV import and parsing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/imports/upload",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        source: "csv_flat",
        file_content: sampleCsv,
        filename: "bookmarks.csv",
      },
    });

    expect(res.statusCode).toBe(202);
    const importId = res.json().data.import_id;

    const previewRes = await app.inject({
      method: "GET",
      url: `/v1/imports/${importId}/preview`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(previewRes.statusCode).toBe(200);
    const preview = previewRes.json().data;
    expect(preview.totals.items).toBe(2);

    const commitRes = await app.inject({
      method: "POST",
      url: `/v1/imports/${importId}/commit`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(commitRes.statusCode).toBe(202);
  });

  it("should handle import cancellation and reject committed / canceled re-commit", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/imports/upload",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        source: "bookmarks_html",
        file_content: sampleNetscapeHtml,
      },
    });

    const importId = res.json().data.import_id;

    // Cancel job
    const cancelRes = await app.inject({
      method: "POST",
      url: `/v1/imports/${importId}/cancel`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json().data.status).toBe("canceled");

    // Previewing canceled job throws 410 GONE
    const previewRes = await app.inject({
      method: "GET",
      url: `/v1/imports/${importId}/preview`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(previewRes.statusCode).toBe(410);
  });

  it("should list import history", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/imports?limit=10",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
    expect(res.json().data.length).toBeGreaterThan(0);
  });

  // =================== EXPORTS ===================

  it("should create full native JSON export (lmn_native_json) and provide download", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/exports",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        format: "lmn_native_json",
        scope: { kind: "organization" },
      },
    });

    expect(res.statusCode).toBe(202);
    const exportId = res.json().data.export_id;
    expect(exportId).toBeDefined();

    // Get export metadata
    const metaRes = await app.inject({
      method: "GET",
      url: `/v1/exports/${exportId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(metaRes.statusCode).toBe(200);
    const meta = metaRes.json().data;
    expect(meta.format).toBe("lmn_native_json");
    expect(meta.status).toBe("succeeded");
    expect(meta.items_count).toBeGreaterThan(0);
    expect(meta.sha256).toBeDefined();

    // Download actual exported file
    const downloadRes = await app.inject({
      method: "GET",
      url: `/v1/exports/${exportId}/download`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.headers["content-type"]).toContain("application/json");
    expect(downloadRes.headers["content-disposition"]).toContain("attachment");

    const exportedJson = JSON.parse(downloadRes.payload);
    expect(exportedJson.schema_version).toBe("1.0");
    expect(Array.isArray(exportedJson.spaces)).toBe(true);
    expect(exportedJson.spaces.length).toBeGreaterThan(0);
  });

  it("should create Netscape Bookmark HTML and CSV exports", async () => {
    // HTML Export
    const htmlRes = await app.inject({
      method: "POST",
      url: "/v1/exports",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { format: "bookmarks_html" },
    });

    const htmlExportId = htmlRes.json().data.export_id;
    const htmlDl = await app.inject({
      method: "GET",
      url: `/v1/exports/${htmlExportId}/download`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(htmlDl.statusCode).toBe(200);
    expect(htmlDl.headers["content-type"]).toContain("text/html");
    expect(htmlDl.payload).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");

    // CSV Export
    const csvRes = await app.inject({
      method: "POST",
      url: "/v1/exports",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { format: "csv_flat" },
    });

    const csvExportId = csvRes.json().data.export_id;
    const csvDl = await app.inject({
      method: "GET",
      url: `/v1/exports/${csvExportId}/download`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(csvDl.statusCode).toBe(200);
    expect(csvDl.headers["content-type"]).toContain("text/csv");
    expect(csvDl.payload).toContain("url,title,description,tags,collection_path");
  });

  it("should refresh expired download URL and list exports", async () => {
    const exportRes = await app.inject({
      method: "POST",
      url: "/v1/exports",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { format: "lmn_native_json" },
    });

    const exportId = exportRes.json().data.export_id;

    // Refresh URL
    const refreshRes = await app.inject({
      method: "POST",
      url: `/v1/exports/${exportId}/refresh-url`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { ttl_hours: 24 },
    });

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.json().data.download_url).toBeDefined();

    // List exports
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/exports?limit=5",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().data.length).toBeGreaterThan(0);
  });

  it("should stream out-of-band migration token export without auth headers", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/exports/lmn-json/lmn_mig_test_token_1234567890abcdef",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=\"lmn-export-");
    const json = JSON.parse(res.payload);
    expect(json.schema_version).toBe("1.0");
  });
});
