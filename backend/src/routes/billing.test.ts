import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Licenses & Billing Endpoints (Step 16)", () => {
  let app: FastifyInstance;
  let token = "";
  let accountId = "";
  let orgId = "";
  let otherToken = "";
  let otherOrgId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // 1. Sign up Primary User
    const primaryRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `billing_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Billing Tester",
      },
    });
    const primaryBody = primaryRes.json();
    token = primaryBody.data.access_token;
    accountId = primaryBody.data.account_id;
    orgId = primaryBody.data.default_organization_id;

    // 2. Sign up Secondary User
    const secondaryRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `other_billing_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Other Billing",
      },
    });
    const secondaryBody = secondaryRes.json();
    otherToken = secondaryBody.data.access_token;
    otherOrgId = secondaryBody.data.default_organization_id;
  });

  it("GET /v1/me/entitlements - returns account entitlements across organizations", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/me/entitlements",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.account_id).toBe(accountId);
    expect(body.data.entitlements_hash).toBeDefined();
    expect(body.data.by_organization.length).toBeGreaterThanOrEqual(1);

    const primaryOrgEntitlement = body.data.by_organization.find(
      (o: any) => o.organization_id === orgId
    );
    expect(primaryOrgEntitlement).toBeDefined();
    expect(primaryOrgEntitlement.plan).toBe("free");
    expect(primaryOrgEntitlement.features.max_spaces_per_org).toBe(3);
    expect(primaryOrgEntitlement.features.max_items_per_org).toBe(500);
    expect(primaryOrgEntitlement.features.password_share).toBe(false);
  });

  it("GET /v1/organizations/:id/billing - returns organization billing summary", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/organizations/${orgId}/billing`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.plan).toBe("free");
    expect(body.data.status).toBe("active");
    expect(body.data.seats).toBeGreaterThanOrEqual(1);
    expect(body.data.default_payment_method).toBeDefined();
  });

  it("POST /v1/organizations/:id/billing/checkout - generates checkout session", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${orgId}/billing/checkout`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        plan: "pro",
        interval: "month",
        seats: 1,
        success_url: "https://app.letsmarknow.com/billing/success",
        cancel_url: "https://app.letsmarknow.com/billing",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.checkout_url).toContain("checkout.stripe.com");
    expect(body.data.session_id).toBeDefined();
  });

  it("POST /v1/organizations/:id/billing/portal - generates billing portal session", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${orgId}/billing/portal`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        return_url: "https://app.letsmarknow.com/billing",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.portal_url).toContain("billing.stripe.com");
  });

  it("POST /v1/organizations/:id/billing/change - updates plan and prorates", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${orgId}/billing/change`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        plan: "team",
        interval: "year",
        seats: 5,
        prorate: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.applied).toBe(true);
    expect(body.data.subscription_id).toBeDefined();

    // Verify billing summary reflects updated plan
    const summaryRes = await app.inject({
      method: "GET",
      url: `/v1/organizations/${orgId}/billing`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    expect(summaryRes.json().data.plan).toBe("team");
    expect(summaryRes.json().data.seats).toBe(5);
  });

  it("POST /v1/organizations/:id/billing/cancel - marks subscription for cancellation", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${orgId}/billing/cancel`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        at_period_end: true,
        reason: "too_expensive",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.cancel_at_period_end).toBe(true);
  });

  it("POST /v1/organizations/:id/billing/lifetime/redeem - redeems lifetime deal code", async () => {
    const code = "LMNL-ABCD-1234-WXYZ";

    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${otherOrgId}/billing/lifetime/redeem`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        "x-organization-id": otherOrgId,
      },
      payload: { code },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.plan).toBe("pro");
    expect(body.data.status).toBe("lifetime");
    expect(body.data.lifetime_license.code_masked).toBe("LMNL-****-****-WXYZ");
    expect(body.data.lifetime_license.stacked_seats).toBe(1);

    // Redeeming the same code again throws 409 CONFLICT already_redeemed
    const repeatRes = await app.inject({
      method: "POST",
      url: `/v1/organizations/${orgId}/billing/lifetime/redeem`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: { code },
    });
    expect(repeatRes.statusCode).toBe(409);
    expect(repeatRes.json().error.details.reason).toBe("already_redeemed");

    // Redeeming another code on otherOrgId throws 409 org_already_lifetime
    const secondCodeRes = await app.inject({
      method: "POST",
      url: `/v1/organizations/${otherOrgId}/billing/lifetime/redeem`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        "x-organization-id": otherOrgId,
      },
      payload: { code: "LMNL-EFGH-5678-QWER" },
    });
    expect(secondCodeRes.statusCode).toBe(409);
    expect(secondCodeRes.json().error.details.reason).toBe("org_already_lifetime");
  });

  it("POST /v1/organizations/:id/billing/lifetime/stack - stacks additional license code to add seats", async () => {
    const stackCode = "LMNL-STCK-9999-STCK";

    const res = await app.inject({
      method: "POST",
      url: `/v1/organizations/${otherOrgId}/billing/lifetime/stack`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        "x-organization-id": otherOrgId,
      },
      payload: { code: stackCode },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.lifetime_license.stacked_seats).toBe(2);
  });

  it("GET /v1/billing/invoices/:id/pdf - returns 200 with JSON or 302 redirect", async () => {
    // 1. JSON metadata request
    const jsonRes = await app.inject({
      method: "GET",
      url: "/v1/billing/invoices/inv_test_123/pdf",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
        accept: "application/json",
      },
    });

    expect(jsonRes.statusCode).toBe(200);
    const jsonBody = jsonRes.json();
    expect(jsonBody.data.invoice_id).toBe("inv_test_123");
    expect(jsonBody.data.pdf_url).toContain("stripe.com");

    // 2. Direct browser download request (302 redirect per spec 16-licenses.md §213)
    const redirectRes = await app.inject({
      method: "GET",
      url: "/v1/billing/invoices/inv_test_123/pdf",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(redirectRes.statusCode).toBe(302);
    expect(redirectRes.headers.location).toContain("stripe.com");
  });
});
