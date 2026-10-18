import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireAdminOrOwner } from "../middleware/rbac.js";
import { requireOrganization } from "../middleware/tenancy.js";
import { billingService } from "../services/billingService.js";
import { AppError } from "../errors/AppError.js";

const checkoutSchema = z.object({
  plan: z.enum(["pro", "team", "enterprise"]).optional(),
  interval: z.enum(["month", "year"]).optional(),
  seats: z.number().int().min(1).optional(),
  success_url: z.string().url("success_url must be a valid URL"),
  cancel_url: z.string().url("cancel_url must be a valid URL"),
});

const portalSchema = z.object({
  return_url: z.string().url().optional(),
});

const changePlanSchema = z.object({
  plan: z.enum(["free", "pro", "team", "enterprise"]),
  interval: z.enum(["month", "year"]).optional(),
  seats: z.number().int().min(1).optional(),
  prorate: z.boolean().optional(),
});

const cancelSubscriptionSchema = z.object({
  at_period_end: z.boolean().optional(),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

const redeemCodeSchema = z.object({
  code: z.string().min(5, "Code is required"),
});

export const billingRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/me/entitlements - Account entitlements across all Orgs
  app.get(
    "/v1/me/entitlements",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await billingService.getEntitlements(request.account!.id);
      return reply.status(200).send({ data: result });
    }
  );

  // GET /v1/organizations/:id/billing - Org billing summary
  app.get(
    "/v1/organizations/:id/billing",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const summary = await billingService.getBillingSummary(request.organizationId!);
      return reply.status(200).send({ data: summary });
    }
  );

  // POST /v1/organizations/:id/billing/checkout - Start checkout session
  app.post(
    "/v1/organizations/:id/billing/checkout",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = checkoutSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const session = await billingService.createCheckoutSession(
        request.organizationId!,
        parseResult.data
      );

      return reply.status(200).send({ data: session });
    }
  );

  // POST /v1/organizations/:id/billing/portal - Open customer billing portal
  app.post(
    "/v1/organizations/:id/billing/portal",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = portalSchema.safeParse(request.body || {});
      const session = await billingService.openBillingPortal(
        request.organizationId!,
        parseResult.success ? parseResult.data.return_url : undefined
      );

      return reply.status(200).send({ data: session });
    }
  );

  // POST /v1/organizations/:id/billing/change - Change plan or seats
  app.post(
    "/v1/organizations/:id/billing/change",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = changePlanSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
          details: { errors: parseResult.error.format() },
        });
      }

      const result = await billingService.changePlan(
        request.organizationId!,
        parseResult.data
      );

      return reply.status(200).send({ data: result });
    }
  );

  // POST /v1/organizations/:id/billing/cancel - Cancel recurring subscription
  app.post(
    "/v1/organizations/:id/billing/cancel",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = cancelSubscriptionSchema.safeParse(request.body || {});
      const updated = await billingService.cancelSubscription(
        request.organizationId!,
        parseResult.success ? parseResult.data : {}
      );

      return reply.status(200).send({ data: updated });
    }
  );

  // POST /v1/organizations/:id/billing/lifetime/redeem - Redeem lifetime license code
  app.post(
    "/v1/organizations/:id/billing/lifetime/redeem",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = redeemCodeSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const result = await billingService.redeemLifetimeLicense(
        request.organizationId!,
        request.account!.id,
        parseResult.data.code
      );

      return reply.status(200).send({ data: result });
    }
  );

  // POST /v1/organizations/:id/billing/lifetime/stack - Stack additional lifetime code
  app.post(
    "/v1/organizations/:id/billing/lifetime/stack",
    { preHandler: [requireAuth, requireAdminOrOwner] },
    async (request, reply) => {
      const parseResult = redeemCodeSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: parseResult.error.issues[0]?.message || "Invalid payload",
        });
      }

      const result = await billingService.stackLifetimeLicense(
        request.organizationId!,
        request.account!.id,
        parseResult.data.code
      );

      return reply.status(200).send({ data: result });
    }
  );

  // GET /v1/billing/invoices/:id/pdf - Invoice PDF download or JSON metadata
  app.get(
    "/v1/billing/invoices/:id/pdf",
    { preHandler: [requireAuth, requireOrganization] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invoice = await billingService.getInvoicePdf(id, request.organizationId!);

      const acceptHeader = request.headers.accept || "";
      if (acceptHeader.includes("application/json")) {
        return reply.status(200).send({ data: invoice });
      }

      // 302 redirect for browser PDF download per spec 16-licenses.md §213
      return reply.status(302).redirect(invoice.pdf_url);
    }
  );
};
