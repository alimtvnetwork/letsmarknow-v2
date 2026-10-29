import { createHash } from "node:crypto";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemLicense, type MemSubscription, type MemOrg } from "../db/memRepo.js";
import { AppError } from "../errors/AppError.js";

export function maskCode(code: string): string {
  if (code.length < 8) return "LMNL-****-****";
  const first = code.slice(0, 5); // "LMNL-"
  const last = code.slice(-4);
  return `${first}****-****-${last}`;
}

export function getPlanFeatures(plan: string) {
  const isProOrAbove = ["pro", "pro_lifetime", "team", "enterprise"].includes(plan.toLowerCase());
  const isTeamOrAbove = ["team", "enterprise"].includes(plan.toLowerCase());

  if (isTeamOrAbove) {
    return {
      max_organizations: 50,
      max_spaces_per_org: 500,
      max_collections_per_org: 5000,
      max_groups_per_collection: 500,
      max_items_per_org: 250000,
      max_active_shares: 500,
      max_tags_per_org: 2000,
      password_share: true,
      expiring_share: true,
      invite_only_share: true,
      custom_share_slug: true,
      share_analytics: true,
      remove_branding: true,
      bulk_import: true,
      bulk_export: true,
      history_retention_days: 365,
      ai_tagging: true,
      priority_support: true,
    };
  }

  if (isProOrAbove) {
    return {
      max_organizations: 10,
      max_spaces_per_org: 50,
      max_collections_per_org: 500,
      max_groups_per_collection: 100,
      max_items_per_org: 50000,
      max_active_shares: 50,
      max_tags_per_org: 500,
      password_share: true,
      expiring_share: true,
      invite_only_share: true,
      custom_share_slug: true,
      share_analytics: true,
      remove_branding: true,
      bulk_import: true,
      bulk_export: true,
      history_retention_days: 90,
      ai_tagging: true,
      priority_support: false,
    };
  }

  // Free Tier
  return {
    max_organizations: 1,
    max_spaces_per_org: 3,
    max_collections_per_org: 20,
    max_groups_per_collection: 10,
    max_items_per_org: 500,
    max_active_shares: 3,
    max_tags_per_org: 50,
    password_share: false,
    expiring_share: false,
    invite_only_share: false,
    custom_share_slug: false,
    share_analytics: false,
    remove_branding: false,
    bulk_import: true,
    bulk_export: true,
    history_retention_days: 7,
    ai_tagging: false,
    priority_support: false,
  };
}

export class BillingService {
  /**
   * Get caller's entitlements across all memberships (GET /v1/me/entitlements)
   * Spec: 02-spec/21-app/03-api-endpoints/16-licenses.md
   */
  public async getEntitlements(accountId: string) {
    const memberships = memRepo.members.filter(
      (m) => m.accountId === accountId && m.status === "active"
    );

    const byOrganization = memberships.map((m) => {
      const org = memRepo.organizations.get(m.organizationId);
      const orgPlan = org?.plan || "free";
      const lic = memRepo.licenses.find(
        (l) => l.organizationId === m.organizationId && l.status !== "revoked"
      );
      const sub = memRepo.subscriptions.find((s) => s.organizationId === m.organizationId);

      const planEffective = lic?.status === "lifetime" ? "pro" : sub?.plan || orgPlan;
      const seatsUsed = memRepo.members.filter(
        (mem) => mem.organizationId === m.organizationId && mem.status === "active"
      ).length;

      const lifetimeInfo = lic && lic.status === "lifetime"
        ? {
            code_masked: maskCode(lic.key),
            tier: lic.tier || "pro_lifetime",
            stacked_seats: lic.stackedSeats || 1,
            redeemed_at: lic.createdAt.toISOString(),
            redeemed_by_account_id: lic.accountId,
          }
        : null;

      return {
        organization_id: m.organizationId,
        plan: planEffective,
        status: lic?.status === "lifetime" ? "lifetime" : sub?.status || "active",
        trial_ends_at: sub?.trialEndsAt?.toISOString() || null,
        current_period_end: sub?.currentPeriodEnd?.toISOString() || null,
        seats: lic?.stackedSeats ? lic.stackedSeats : sub?.seats || 1,
        seats_used: seatsUsed,
        features: getPlanFeatures(planEffective),
        lifetime_license: lifetimeInfo,
      };
    });

    const canonicalJson = JSON.stringify(byOrganization);
    const entitlementsHash = `sha256:${createHash("sha256").update(canonicalJson).digest("hex")}`;

    return {
      account_id: accountId,
      entitlements_hash: entitlementsHash,
      by_organization: byOrganization,
    };
  }

  /**
   * Get organization billing summary (GET /v1/organizations/:id/billing)
   */
  public async getBillingSummary(orgId: string) {
    const org = memRepo.organizations.get(orgId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    const sub = memRepo.subscriptions.find((s) => s.organizationId === orgId);
    const lic = memRepo.licenses.find(
      (l) => l.organizationId === orgId && l.status === "lifetime"
    );

    const plan = lic ? "pro" : sub?.plan || org.plan || "free";
    const status = lic ? "lifetime" : sub?.status || "active";
    const seatsUsed = memRepo.members.filter(
      (m) => m.organizationId === orgId && m.status === "active"
    ).length;

    const lifetimeLicense = lic
      ? {
          code_masked: maskCode(lic.key),
          tier: lic.tier || "pro_lifetime",
          stacked_seats: lic.stackedSeats || 1,
          redeemed_at: lic.createdAt.toISOString(),
          redeemed_by_account_id: lic.accountId,
        }
      : null;

    return {
      plan,
      status,
      billing_provider: sub?.provider || "stripe",
      customer_id: sub?.customerId || `cus_${orgId.slice(0, 12)}`,
      subscription_id: sub?.subscriptionId || (sub ? sub.id : null),
      interval: sub?.interval || "month",
      amount: {
        amount_cents: sub?.amountCents || (plan === "pro" ? 999 : 0),
        currency: sub?.currency || "USD",
      },
      seats: lic?.stackedSeats ? lic.stackedSeats : sub?.seats || 1,
      seats_used: seatsUsed,
      current_period_start: sub?.currentPeriodStart.toISOString() || org.createdAt.toISOString(),
      current_period_end:
        sub?.currentPeriodEnd.toISOString() ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: sub?.cancelAtPeriodEnd || false,
      trial_ends_at: sub?.trialEndsAt?.toISOString() || null,
      next_invoice_estimate: {
        amount_cents: sub?.amountCents || (plan === "pro" ? 999 : 0),
        currency: sub?.currency || "USD",
      },
      default_payment_method: {
        type: "card",
        brand: "visa",
        last4: "4242",
        exp_month: 12,
        exp_year: 2028,
      },
      lifetime_license: lifetimeLicense,
    };
  }

  /**
   * Start Checkout session (POST /v1/organizations/:id/billing/checkout)
   */
  public async createCheckoutSession(
    orgId: string,
    params: { plan?: string; interval?: string; seats?: number; success_url: string; cancel_url: string }
  ) {
    const sessionId = `cs_${uuidv7().replace(/-/g, "").slice(0, 24)}`;
    return {
      checkout_url: `https://checkout.stripe.com/c/pay/${sessionId}`,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Open Customer Portal session (POST /v1/organizations/:id/billing/portal)
   */
  public async openBillingPortal(orgId: string, returnUrl?: string) {
    return {
      portal_url: `https://billing.stripe.com/p/session/portal_${orgId.slice(0, 12)}`,
    };
  }

  /**
   * Change plan or seat count (POST /v1/organizations/:id/billing/change)
   */
  public async changePlan(
    orgId: string,
    params: { plan: "free" | "pro" | "team" | "enterprise"; interval?: "month" | "year"; seats?: number; prorate?: boolean }
  ) {
    const org = memRepo.organizations.get(orgId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    const seatsUsed = memRepo.members.filter(
      (m) => m.organizationId === orgId && m.status === "active"
    ).length;

    if (params.seats !== undefined && params.seats < seatsUsed) {
      throw new AppError({
        statusCode: 422,
        code: "BUSINESS_RULE_VIOLATION",
        message: "Cannot reduce seat count below current active member count",
        details: { reason: "seats_below_used", seats_used: seatsUsed },
      });
    }

    org.plan = params.plan;
    org.updatedAt = new Date();

    let sub = memRepo.subscriptions.find((s) => s.organizationId === orgId);
    if (!sub) {
      sub = {
        id: uuidv7(),
        organizationId: orgId,
        provider: "stripe",
        customerId: `cus_${orgId.slice(0, 12)}`,
        subscriptionId: `sub_${uuidv7().slice(0, 14)}`,
        status: "active",
        plan: params.plan,
        interval: params.interval || "month",
        amountCents: params.plan === "team" ? 2900 : 999,
        currency: "USD",
        seats: params.seats || 1,
        cancelAtPeriodEnd: false,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memRepo.subscriptions.push(sub);
    } else {
      sub.plan = params.plan;
      if (params.interval) sub.interval = params.interval;
      if (params.seats !== undefined) sub.seats = params.seats;
      sub.updatedAt = new Date();
    }

    return {
      applied: true,
      effective_at: "now",
      proration_amount: { amount_cents: 1234, currency: "USD" },
      subscription_id: sub.subscriptionId,
    };
  }

  /**
   * Cancel subscription (POST /v1/organizations/:id/billing/cancel)
   */
  public async cancelSubscription(orgId: string, params: { at_period_end?: boolean; reason?: string; feedback?: string }) {
    let sub = memRepo.subscriptions.find((s) => s.organizationId === orgId);
    if (!sub) {
      sub = {
        id: uuidv7(),
        organizationId: orgId,
        provider: "stripe",
        customerId: `cus_${orgId.slice(0, 12)}`,
        subscriptionId: `sub_${uuidv7().slice(0, 14)}`,
        status: "active",
        plan: "pro",
        interval: "month",
        amountCents: 999,
        currency: "USD",
        seats: 1,
        cancelAtPeriodEnd: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memRepo.subscriptions.push(sub);
    } else {
      sub.cancelAtPeriodEnd = true;
      sub.updatedAt = new Date();
    }

    return this.getBillingSummary(orgId);
  }

  /**
   * Redeem lifetime license code (POST /v1/organizations/:id/billing/lifetime/redeem)
   */
  public async redeemLifetimeLicense(orgId: string, accountId: string, code: string) {
    const trimmed = (code || "").trim().toUpperCase();

    if (!trimmed.startsWith("LMNL-") || trimmed.length < 15) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Invalid lifetime license format. Expected LMNL-XXXX-XXXX-XXXX",
      });
    }

    // Check if code was already redeemed in any Org
    const existingCode = memRepo.licenses.find((l) => l.key === trimmed);
    if (existingCode) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Lifetime code has already been redeemed",
        details: { reason: "already_redeemed" },
      });
    }

    // Check if this Org is already lifetime
    const orgLic = memRepo.licenses.find(
      (l) => l.organizationId === orgId && l.status === "lifetime"
    );
    if (orgLic) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Organization already has an active lifetime license. Use stack to add seats.",
        details: { reason: "org_already_lifetime" },
      });
    }

    const now = new Date();
    const newLic: MemLicense = {
      id: uuidv7(),
      organizationId: orgId,
      accountId,
      key: trimmed,
      plan: "pro",
      tier: "pro_lifetime",
      stackedSeats: 1,
      status: "lifetime",
      createdAt: now,
      updatedAt: now,
    };
    memRepo.licenses.push(newLic);

    // Update org plan
    const org = memRepo.organizations.get(orgId);
    if (org) {
      org.plan = "pro";
      org.updatedAt = now;
    }

    return {
      lifetime_license: {
        code_masked: maskCode(trimmed),
        tier: "pro_lifetime",
        stacked_seats: 1,
        redeemed_at: now.toISOString(),
        redeemed_by_account_id: accountId,
      },
      plan: "pro",
      status: "lifetime",
    };
  }

  /**
   * Stack additional lifetime code for seats/tier upgrade (POST /v1/organizations/:id/billing/lifetime/stack)
   */
  public async stackLifetimeLicense(orgId: string, accountId: string, code: string) {
    const trimmed = (code || "").trim().toUpperCase();

    if (!trimmed.startsWith("LMNL-") || trimmed.length < 15) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Invalid lifetime license format. Expected LMNL-XXXX-XXXX-XXXX",
      });
    }

    const existingCode = memRepo.licenses.find((l) => l.key === trimmed);
    if (existingCode) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Lifetime code has already been redeemed",
        details: { reason: "already_redeemed" },
      });
    }

    const orgLic = memRepo.licenses.find(
      (l) => l.organizationId === orgId && l.status === "lifetime"
    );
    if (!orgLic) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "No active lifetime license found for this organization to stack onto",
      });
    }

    orgLic.stackedSeats = (orgLic.stackedSeats || 1) + 1;
    orgLic.updatedAt = new Date();

    // Record consumption
    const newLicRecord: MemLicense = {
      id: uuidv7(),
      organizationId: orgId,
      accountId,
      key: trimmed,
      plan: "pro",
      tier: "pro_lifetime_stacked",
      stackedSeats: 1,
      status: "lifetime",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memRepo.licenses.push(newLicRecord);

    return {
      lifetime_license: {
        code_masked: maskCode(trimmed),
        tier: orgLic.tier || "pro_lifetime",
        stacked_seats: orgLic.stackedSeats,
        redeemed_at: new Date().toISOString(),
        redeemed_by_account_id: accountId,
      },
      plan: "pro",
      status: "lifetime",
    };
  }

  /**
   * Download or retrieve invoice details (GET /v1/billing/invoices/:id/pdf)
   */
  public async getInvoicePdf(invoiceId: string, orgId: string) {
    return {
      invoice_id: invoiceId,
      processor: "stripe",
      pdf_url: `https://files.stripe.com/v1/invoices/${invoiceId}.pdf`,
      pdf_url_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      number: "LMN-2026-04-00042",
      amount_total_cents: 1900,
      currency: "USD",
      issued_at: new Date().toISOString(),
    };
  }
}

export const billingService = new BillingService();
