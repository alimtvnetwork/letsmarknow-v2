import { createHmac, randomBytes } from "node:crypto";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemShare } from "../db/memRepo.js";
import { hashPassword, verifyPassword } from "../utils/crypto.js";
import { env } from "../config/env.js";

const RESERVED_SLUGS = new Set([
  "t",
  "app",
  "api",
  "admin",
  "pricing",
  "docs",
  "vs",
  "login",
  "signup",
  "account",
  "lmk",
  "new",
  "edit",
  "share",
  "shares",
  "public",
  "settings",
  "dashboard",
  "null",
  "undefined",
]);

export function createShareCookieToken(slug: string): string {
  return createHmac("sha256", env.COOKIE_SECRET)
    .update(`share:${slug.toLowerCase()}`)
    .digest("hex");
}

export function generateRandomSlug(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    slug += chars[bytes[i] % chars.length];
  }
  return slug;
}

export interface CreateShareParams {
  target_type: "space" | "collection" | "group" | "item";
  target_id: string;
  mode?: "public" | "password" | "invite_only";
  slug?: string | null;
  title_override?: string | null;
  description_override?: string | null;
  expires_at?: string | null;
  password?: string | null;
  allowed_emails?: string[];
  allow_clone_to_my_account?: boolean;
  show_branding?: boolean;
  analytics_enabled?: boolean;
  default_view_mode?: string;
}

export interface UpdateShareParams {
  mode?: "public" | "password" | "invite_only";
  title_override?: string | null;
  description_override?: string | null;
  expires_at?: string | null;
  password?: string | null;
  allowed_emails?: string[];
  allow_clone_to_my_account?: boolean;
  show_branding?: boolean;
  analytics_enabled?: boolean;
  default_view_mode?: string;
}

export interface ShareDto {
  id: string;
  slug: string;
  url: string;
  target_type: string;
  target_id: string;
  organization_id: string;
  mode: string;
  created_by: string | null;
  title_override: string | null;
  description_override: string | null;
  expires_at: string | null;
  allow_clone_to_my_account: boolean;
  show_branding: boolean;
  analytics_enabled: boolean;
  default_view_mode: string;
  password_set: boolean;
  allowed_emails: string[];
  view_count: number;
  unique_viewer_count: number;
  click_count: number;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ShareService {
  /**
   * Format a MemShare or DB Share row into the public/management DTO.
   * Invariant: password_hash is NEVER leaked in any API response.
   */
  public toDto(s: {
    id: string;
    slug: string;
    targetType: string;
    targetId: string;
    organizationId: string;
    mode: string;
    createdBy?: string | null;
    titleOverride?: string | null;
    descriptionOverride?: string | null;
    expiresAt?: Date | string | null;
    allowCloneToMyAccount?: boolean;
    showBranding?: boolean;
    analyticsEnabled?: boolean;
    defaultViewMode?: string | null;
    passwordHash?: string | null;
    allowedEmails?: string[] | null;
    viewCount?: number;
    uniqueViewerCount?: number;
    clickCount?: number;
    revokedAt?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): ShareDto {
    const toIso = (d: Date | string | null | undefined): string | null => {
      if (!d) return null;
      return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
    };

    return {
      id: s.id,
      slug: s.slug,
      url: `https://letsmarknow.com/t/${s.slug}`,
      target_type: s.targetType,
      target_id: s.targetId,
      organization_id: s.organizationId,
      mode: s.mode,
      created_by: s.createdBy ?? null,
      title_override: s.titleOverride ?? null,
      description_override: s.descriptionOverride ?? null,
      expires_at: toIso(s.expiresAt),
      allow_clone_to_my_account: s.allowCloneToMyAccount ?? true,
      show_branding: s.showBranding ?? true,
      analytics_enabled: s.analyticsEnabled ?? true,
      default_view_mode: s.defaultViewMode || "grid",
      password_set: Boolean(s.passwordHash),
      allowed_emails: s.allowedEmails || [],
      view_count: s.viewCount || 0,
      unique_viewer_count: s.uniqueViewerCount || 0,
      click_count: s.clickCount || 0,
      revoked_at: toIso(s.revokedAt),
      created_at: toIso(s.createdAt)!,
      updated_at: toIso(s.updatedAt)!,
    };
  }

  /**
   * Validate custom or generated slug
   */
  public validateSlug(slug: string): void {
    const normalized = slug.trim().toLowerCase();
    if (normalized.length < 3 || normalized.length > 64) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Slug must be between 3 and 64 characters long.",
        field: "slug",
      });
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized)) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Slug may only contain lowercase letters, numbers, and hyphens (no leading or trailing hyphens).",
        field: "slug",
      });
    }

    if (RESERVED_SLUGS.has(normalized)) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: `Slug '${normalized}' is reserved by the system.`,
        field: "slug",
        details: { reason: "reserved_slug" },
      });
    }
  }

  /**
   * Ensure slug is unique across active and non-purged shares
   */
  private async ensureSlugAvailable(slug: string, excludeShareId?: string): Promise<void> {
    const normalized = slug.trim().toLowerCase();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const existing = await db
        .select({ id: schema.shares.id })
        .from(schema.shares)
        .where(eq(schema.shares.slug, normalized))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== excludeShareId) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `Slug '${normalized}' is already in use.`,
          field: "slug",
          details: { reason: "slug_taken" },
        });
      }
    } else {
      const existing = memRepo.shares.find(
        (s) => s.slug.toLowerCase() === normalized && s.id !== excludeShareId
      );
      if (existing) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: `Slug '${normalized}' is already in use.`,
          field: "slug",
          details: { reason: "slug_taken" },
        });
      }
    }
  }

  /**
   * Verify target entity exists in organization and is active
   */
  public async verifyTargetExists(
    orgId: string,
    targetType: string,
    targetId: string
  ): Promise<{ name: string; description?: string | null; color?: string | null }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      if (targetType === "space") {
        const rows = await db
          .select()
          .from(schema.spaces)
          .where(and(eq(schema.spaces.id, targetId), eq(schema.spaces.organizationId, orgId), isNull(schema.spaces.deletedAt)))
          .limit(1);
        if (rows.length === 0) {
          throw new AppError({
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Target space not found or has been deleted.",
          });
        }
        return { name: rows[0].name, description: rows[0].description, color: rows[0].color };
      }

      if (targetType === "collection") {
        const rows = await db
          .select()
          .from(schema.collections)
          .where(and(eq(schema.collections.id, targetId), eq(schema.collections.organizationId, orgId), isNull(schema.collections.deletedAt)))
          .limit(1);
        if (rows.length === 0) {
          throw new AppError({
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Target collection not found or has been deleted.",
          });
        }
        return { name: rows[0].name, description: rows[0].description, color: rows[0].color };
      }

      if (targetType === "group") {
        const rows = await db
          .select()
          .from(schema.groups)
          .where(and(eq(schema.groups.id, targetId), eq(schema.groups.organizationId, orgId), isNull(schema.groups.deletedAt)))
          .limit(1);
        if (rows.length === 0) {
          throw new AppError({
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Target group not found or has been deleted.",
          });
        }
        return { name: rows[0].name, color: rows[0].color };
      }

      if (targetType === "item") {
        const rows = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.id, targetId), eq(schema.items.organizationId, orgId), isNull(schema.items.deletedAt)))
          .limit(1);
        if (rows.length === 0) {
          throw new AppError({
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Target item not found or has been deleted.",
          });
        }
        return { name: rows[0].title, description: rows[0].description };
      }
    } else {
      if (targetType === "space") {
        const s = memRepo.spaces.find((x) => x.id === targetId && x.organizationId === orgId && !x.deletedAt);
        if (!s) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Target space not found." });
        return { name: s.name, description: s.description, color: s.color };
      }

      if (targetType === "collection") {
        const c = memRepo.collections.find((x) => x.id === targetId && x.organizationId === orgId && !x.deletedAt);
        if (!c) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Target collection not found." });
        return { name: c.name, description: c.description, color: c.color };
      }

      if (targetType === "group") {
        const g = memRepo.groups.find((x) => x.id === targetId && x.organizationId === orgId && !x.deletedAt);
        if (!g) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Target group not found." });
        return { name: g.name, color: g.color };
      }

      if (targetType === "item") {
        const i = memRepo.items.find((x) => x.id === targetId && x.organizationId === orgId && !x.deletedAt);
        if (!i) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Target item not found." });
        return { name: i.title, description: i.description };
      }
    }

    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_FAILED",
      message: `Invalid target_type '${targetType}'.`,
      field: "target_type",
    });
  }

  /**
   * Create a new Share link
   */
  public async createShare(
    orgId: string,
    accountId: string,
    params: CreateShareParams
  ): Promise<ShareDto> {
    await this.verifyTargetExists(orgId, params.target_type, params.target_id);

    const mode = params.mode || "public";
    let passwordHash: string | null = null;

    if (mode === "password") {
      if (!params.password || params.password.length < 6) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Password is required for password-gated shares (min 6 characters).",
          field: "password",
        });
      }
      passwordHash = await hashPassword(params.password);
    }

    if (mode === "invite_only") {
      if (!params.allowed_emails || params.allowed_emails.length === 0) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "At least one allowed email is required for invite-only shares.",
          field: "allowed_emails",
        });
      }
    }

    let expiresAt: Date | null = null;
    if (params.expires_at) {
      expiresAt = new Date(params.expires_at);
      if (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "expires_at must be a valid future ISO timestamp.",
          field: "expires_at",
        });
      }
    }

    // Determine slug
    let slug = params.slug?.trim().toLowerCase();
    let isCustomSlug = false;
    if (slug) {
      this.validateSlug(slug);
      await this.ensureSlugAvailable(slug);
      isCustomSlug = true;
    } else {
      // Generate random unique slug
      let attempts = 0;
      do {
        slug = generateRandomSlug(10);
        attempts++;
        if (attempts > 10) break;
      } while (
        RESERVED_SLUGS.has(slug) ||
        (await this.isSlugTaken(slug))
      );
    }

    const shareId = uuidv7();
    const now = new Date();

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const [inserted] = await db
        .insert(schema.shares)
        .values({
          id: shareId,
          organizationId: orgId,
          targetType: params.target_type,
          targetId: params.target_id,
          mode,
          passwordHash,
          slug,
          permission: "view",
          allowCloneToMyAccount: params.allow_clone_to_my_account ?? true,
          showBranding: params.show_branding ?? true,
          analyticsEnabled: params.analytics_enabled ?? true,
          defaultViewMode: params.default_view_mode || "grid",
          titleOverride: params.title_override || null,
          descriptionOverride: params.description_override || null,
          allowedEmails: params.allowed_emails || [],
          expiresAt,
          createdBy: accountId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return this.toDto(inserted);
    }

    const memShare: MemShare = {
      id: shareId,
      organizationId: orgId,
      targetType: params.target_type,
      targetId: params.target_id,
      mode,
      passwordHash,
      slug,
      isCustomSlug,
      permission: "view",
      allowCloneToMyAccount: params.allow_clone_to_my_account ?? true,
      showBranding: params.show_branding ?? true,
      analyticsEnabled: params.analytics_enabled ?? true,
      defaultViewMode: params.default_view_mode || "grid",
      titleOverride: params.title_override || null,
      descriptionOverride: params.description_override || null,
      allowedEmails: params.allowed_emails || [],
      expiresAt,
      revokedAt: null,
      viewCount: 0,
      uniqueViewerCount: 0,
      clickCount: 0,
      createdBy: accountId,
      createdAt: now,
      updatedAt: now,
    };

    memRepo.shares.push(memShare);
    return this.toDto(memShare);
  }

  private async isSlugTaken(slug: string): Promise<boolean> {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const rows = await db
        .select({ id: schema.shares.id })
        .from(schema.shares)
        .where(eq(schema.shares.slug, slug))
        .limit(1);
      return rows.length > 0;
    }
    return memRepo.shares.some((s) => s.slug.toLowerCase() === slug.toLowerCase());
  }

  /**
   * List shares for an entity or org
   */
  public async listShares(
    orgId: string,
    options: {
      space_id?: string;
      collection_id?: string;
      group_id?: string;
      item_id?: string;
      include_revoked?: boolean;
    }
  ): Promise<ShareDto[]> {
    const isDb = await checkDbConnection();

    let targetType: string | undefined;
    let targetId: string | undefined;

    if (options.space_id) {
      targetType = "space";
      targetId = options.space_id;
    } else if (options.collection_id) {
      targetType = "collection";
      targetId = options.collection_id;
    } else if (options.group_id) {
      targetType = "group";
      targetId = options.group_id;
    } else if (options.item_id) {
      targetType = "item";
      targetId = options.item_id;
    }

    if (isDb) {
      const db = getDb();
      const conditions = [eq(schema.shares.organizationId, orgId)];

      if (targetType && targetId) {
        conditions.push(
          eq(schema.shares.targetType, targetType as any),
          eq(schema.shares.targetId, targetId)
        );
      }

      if (!options.include_revoked) {
        conditions.push(isNull(schema.shares.revokedAt));
      }

      const rows = await db
        .select()
        .from(schema.shares)
        .where(and(...conditions))
        .orderBy(desc(schema.shares.createdAt));

      return rows.map((r) => this.toDto(r));
    }

    let filtered = memRepo.shares.filter((s) => s.organizationId === orgId);
    if (targetType && targetId) {
      filtered = filtered.filter(
        (s) => s.targetType === targetType && s.targetId === targetId
      );
    }
    if (!options.include_revoked) {
      filtered = filtered.filter((s) => !s.revokedAt);
    }

    return filtered.map((s) => this.toDto(s));
  }

  /**
   * Get single share by ID
   */
  public async getShare(orgId: string, shareId: string): Promise<ShareDto> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.shares)
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Share link not found.",
        });
      }
      return this.toDto(rows[0]);
    }

    const share = memRepo.shares.find((s) => s.id === shareId && s.organizationId === orgId);
    if (!share) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Share link not found.",
      });
    }

    return this.toDto(share);
  }

  /**
   * Update mutable fields of a share
   */
  public async updateShare(
    orgId: string,
    shareId: string,
    params: UpdateShareParams
  ): Promise<ShareDto> {
    const isDb = await checkDbConnection();

    let passwordHashUpdate: string | null | undefined = undefined;
    if (params.password !== undefined) {
      if (params.password === null || params.password === "") {
        passwordHashUpdate = null;
      } else {
        if (params.password.length < 6) {
          throw new AppError({
            statusCode: 400,
            code: "VALIDATION_FAILED",
            message: "Password must be at least 6 characters.",
            field: "password",
          });
        }
        passwordHashUpdate = await hashPassword(params.password);
      }
    }

    let expiresAtUpdate: Date | null | undefined = undefined;
    if (params.expires_at !== undefined) {
      if (params.expires_at === null) {
        expiresAtUpdate = null;
      } else {
        const d = new Date(params.expires_at);
        if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
          throw new AppError({
            statusCode: 400,
            code: "VALIDATION_FAILED",
            message: "expires_at must be a valid future ISO timestamp.",
            field: "expires_at",
          });
        }
        expiresAtUpdate = d;
      }
    }

    const now = new Date();

    if (isDb) {
      const db = getDb();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (params.mode !== undefined) updateData.mode = params.mode;
      if (passwordHashUpdate !== undefined) updateData.passwordHash = passwordHashUpdate;
      if (expiresAtUpdate !== undefined) updateData.expiresAt = expiresAtUpdate;
      if (params.title_override !== undefined) updateData.titleOverride = params.title_override;
      if (params.description_override !== undefined) updateData.descriptionOverride = params.description_override;
      if (params.allowed_emails !== undefined) updateData.allowedEmails = params.allowed_emails;
      if (params.allow_clone_to_my_account !== undefined) updateData.allowCloneToMyAccount = params.allow_clone_to_my_account;
      if (params.show_branding !== undefined) updateData.showBranding = params.show_branding;
      if (params.analytics_enabled !== undefined) updateData.analyticsEnabled = params.analytics_enabled;
      if (params.default_view_mode !== undefined) updateData.defaultViewMode = params.default_view_mode;

      const [updated] = await db
        .update(schema.shares)
        .set(updateData)
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
      }

      return this.toDto(updated);
    }

    const share = memRepo.shares.find((s) => s.id === shareId && s.organizationId === orgId);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
    }

    if (params.mode !== undefined) share.mode = params.mode;
    if (passwordHashUpdate !== undefined) share.passwordHash = passwordHashUpdate;
    if (expiresAtUpdate !== undefined) share.expiresAt = expiresAtUpdate;
    if (params.title_override !== undefined) share.titleOverride = params.title_override;
    if (params.description_override !== undefined) share.descriptionOverride = params.description_override;
    if (params.allowed_emails !== undefined) share.allowedEmails = params.allowed_emails;
    if (params.allow_clone_to_my_account !== undefined) share.allowCloneToMyAccount = params.allow_clone_to_my_account;
    if (params.show_branding !== undefined) share.showBranding = params.show_branding;
    if (params.analytics_enabled !== undefined) share.analyticsEnabled = params.analytics_enabled;
    if (params.default_view_mode !== undefined) share.defaultViewMode = params.default_view_mode;
    share.updatedAt = now;

    return this.toDto(share);
  }

  /**
   * Rotate slug: invalidates old slug, issues a new unique slug
   */
  public async rotateSlug(orgId: string, shareId: string, newSlug?: string | null): Promise<ShareDto> {
    let slug = newSlug?.trim().toLowerCase();
    if (slug) {
      this.validateSlug(slug);
      await this.ensureSlugAvailable(slug, shareId);
    } else {
      let attempts = 0;
      do {
        slug = generateRandomSlug(10);
        attempts++;
        if (attempts > 10) break;
      } while (RESERVED_SLUGS.has(slug) || (await this.isSlugTaken(slug)));
    }

    const now = new Date();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const [updated] = await db
        .update(schema.shares)
        .set({ slug, updatedAt: now })
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
      }

      return this.toDto(updated);
    }

    const share = memRepo.shares.find((s) => s.id === shareId && s.organizationId === orgId);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
    }

    share.slug = slug!;
    share.updatedAt = now;
    return this.toDto(share);
  }

  /**
   * Revoke share: public hits return 410 GONE
   */
  public async revokeShare(orgId: string, shareId: string): Promise<ShareDto> {
    const now = new Date();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const [updated] = await db
        .update(schema.shares)
        .set({ revokedAt: now, updatedAt: now })
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
      }

      return this.toDto(updated);
    }

    const share = memRepo.shares.find((s) => s.id === shareId && s.organizationId === orgId);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
    }

    share.revokedAt = now;
    share.updatedAt = now;
    return this.toDto(share);
  }

  /**
   * Restore revoked share within 7 days
   */
  public async restoreShare(orgId: string, shareId: string): Promise<ShareDto> {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.shares)
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
      }

      const share = rows[0];
      if (!share.revokedAt) return this.toDto(share);

      const daysDiff = (Date.now() - share.revokedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        throw new AppError({
          statusCode: 400,
          code: "RESTORE_WINDOW_EXPIRED",
          message: "Share links cannot be restored after 7 days of revocation.",
        });
      }

      const [updated] = await db
        .update(schema.shares)
        .set({ revokedAt: null, updatedAt: new Date() })
        .where(eq(schema.shares.id, shareId))
        .returning();

      return this.toDto(updated);
    }

    const share = memRepo.shares.find((s) => s.id === shareId && s.organizationId === orgId);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Share link not found." });
    }

    if (!share.revokedAt) return this.toDto(share);

    const daysDiff = (Date.now() - share.revokedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      throw new AppError({
        statusCode: 400,
        code: "RESTORE_WINDOW_EXPIRED",
        message: "Share links cannot be restored after 7 days of revocation.",
      });
    }

    share.revokedAt = null;
    share.updatedAt = new Date();
    return this.toDto(share);
  }

  /**
   * Hard delete (purge) share
   */
  public async purgeShare(orgId: string, shareId: string, confirmSlug: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.shares)
        .where(and(eq(schema.shares.id, shareId), eq(schema.shares.organizationId, orgId)))
        .limit(1);

      if (rows.length === 0) {
        return { already_purged: true };
      }

      const s = rows[0];
      if (s.slug !== confirmSlug.trim().toLowerCase()) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: `confirm_slug '${confirmSlug}' does not match current slug '${s.slug}'.`,
          field: "confirm_slug",
        });
      }

      await db.delete(schema.shares).where(eq(schema.shares.id, shareId));

      return {
        share_id: s.id,
        slug_at_purge: s.slug,
        purged_at: new Date().toISOString(),
        analytics_rows_deleted: s.viewCount || 0,
        invite_emails_deleted: (s.allowedEmails || []).length,
      };
    }

    const idx = memRepo.shares.findIndex((s) => s.id === shareId && s.organizationId === orgId);
    if (idx === -1) {
      return { already_purged: true };
    }

    const s = memRepo.shares[idx];
    if (s.slug !== confirmSlug.trim().toLowerCase()) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: `confirm_slug '${confirmSlug}' does not match current slug '${s.slug}'.`,
        field: "confirm_slug",
      });
    }

    memRepo.shares.splice(idx, 1);

    return {
      share_id: s.id,
      slug_at_purge: s.slug,
      purged_at: new Date().toISOString(),
      analytics_rows_deleted: s.viewCount || 0,
      invite_emails_deleted: s.allowedEmails.length,
    };
  }

  /**
   * Analytics breakdown for a share link
   */
  public async getAnalytics(orgId: string, shareId: string, range = "30d") {
    const share = await this.getShare(orgId, shareId);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    return {
      range,
      view_count: share.view_count,
      unique_viewer_count: share.unique_viewer_count,
      click_count: share.click_count,
      top_items: [
        {
          item_id: share.target_type === "item" ? share.target_id : "aggregate",
          title: share.title_override || "Shared Target",
          clicks: share.click_count,
        },
      ],
      by_day: [
        {
          date: dateStr,
          views: share.view_count,
          clicks: share.click_count,
        },
      ],
      top_referrers: [
        {
          host: "direct",
          views: share.view_count,
        },
      ],
    };
  }

  /**
   * Resend invite emails (invite_only mode)
   */
  public async resendInvites(orgId: string, shareId: string, emails?: string[]) {
    const share = await this.getShare(orgId, shareId);
    if (share.mode !== "invite_only") {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_MODE",
        message: "Invite resending is only applicable to invite_only shares.",
      });
    }

    const targetEmails =
      emails && emails.length > 0
        ? emails.filter((e) => share.allowed_emails.includes(e))
        : share.allowed_emails;

    return { sent: targetEmails.length };
  }

  // =========================================================================
  // PUBLIC VIEWER API
  // =========================================================================

  /**
   * Find a share by slug (or memorableSlug) across all organizations
   */
  public async findBySlug(slug: string): Promise<MemShare | null> {
    const normalized = slug.trim().toLowerCase();
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.shares)
        .where(eq(schema.shares.slug, normalized))
        .limit(1);

      if (rows.length === 0) return null;

      const r = rows[0];
      return {
        id: r.id,
        organizationId: r.organizationId,
        targetType: r.targetType as any,
        targetId: r.targetId,
        mode: r.mode as any,
        passwordHash: r.passwordHash,
        slug: r.slug,
        permission: r.permission as any,
        allowCloneToMyAccount: r.allowCloneToMyAccount,
        showBranding: r.showBranding,
        analyticsEnabled: r.analyticsEnabled,
        defaultViewMode: r.defaultViewMode,
        titleOverride: r.titleOverride,
        descriptionOverride: r.descriptionOverride,
        allowedEmails: r.allowedEmails || [],
        expiresAt: r.expiresAt,
        revokedAt: r.revokedAt,
        viewCount: r.viewCount,
        uniqueViewerCount: r.uniqueViewerCount,
        clickCount: r.clickCount,
        lastViewedAt: r.lastViewedAt,
        createdBy: r.createdBy || "",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    }

    const found = memRepo.shares.find(
      (s) =>
        s.slug.toLowerCase() === normalized ||
        (s.memorableSlug && s.memorableSlug.toLowerCase() === normalized)
    );
    return found || null;
  }

  /**
   * Resolve public metadata for /v1/public/shares/:slug
   */
  public async resolvePublicShare(slug: string) {
    const share = await this.findBySlug(slug);
    if (!share) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: `Share '${slug}' not found.`,
      });
    }

    if (share.revokedAt) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "This shared link has been revoked by its owner.",
        details: { reason: "revoked" },
      });
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "This shared link has expired.",
        details: { reason: "expired" },
      });
    }

    // Resolve target entity details
    let targetInfo: { name: string; description?: string | null; color?: string | null };
    try {
      targetInfo = await this.verifyTargetExists(share.organizationId, share.targetType, share.targetId);
    } catch {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "The target content for this shared link is no longer available.",
        details: { reason: "target_deleted" },
      });
    }

    // Resolve owner organization branding
    let orgName = "Lets Mark Now";
    let brandColor = "#e94560";
    let avatarImageUrl: string | null = null;

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const orgs = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, share.organizationId))
        .limit(1);
      if (orgs.length > 0) {
        orgName = orgs[0].name;
        brandColor = orgs[0].brandColor || brandColor;
        avatarImageUrl = orgs[0].logoUrl || null;
      }
    } else {
      const org = memRepo.organizations.get(share.organizationId);
      if (org) {
        orgName = org.name;
        brandColor = org.brandColor || brandColor;
        avatarImageUrl = org.avatarImageUrl || null;
      }
    }

    const title = share.titleOverride || targetInfo.name;
    const description = share.descriptionOverride || targetInfo.description || null;

    return {
      slug: share.slug,
      mode: share.mode,
      target_type: share.targetType,
      title,
      description,
      owner: {
        organization_name: orgName,
        avatar_token: orgName.substring(0, 2).toUpperCase(),
        avatar_color: brandColor,
        avatar_image_url: avatarImageUrl,
        show_branding: share.showBranding,
      },
      expires_at: share.expiresAt ? new Date(share.expiresAt).toISOString() : null,
      requires_password: share.mode === "password",
      requires_invite_auth: share.mode === "invite_only",
      allow_clone_to_my_account: share.allowCloneToMyAccount,
      analytics_enabled: share.analyticsEnabled,
      meta: {
        title: share.titleOverride || null,
        description: share.descriptionOverride || null,
        image_url: null,
      },
    };
  }

  /**
   * Unlock a password-protected share and return token
   */
  public async unlockShare(slug: string, password?: string) {
    const share = await this.findBySlug(slug);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: `Share '${slug}' not found.` });
    }

    if (share.revokedAt) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "This share link has been revoked.",
        details: { reason: "revoked" },
      });
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "This share link has expired.",
        details: { reason: "expired" },
      });
    }

    if (share.mode !== "password") {
      const token = createShareCookieToken(share.slug);
      return { unlocked: true, token, expires_in: 86400 };
    }

    if (!password) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Password is required to unlock this share.",
        field: "password",
      });
    }

    if (!share.passwordHash) {
      const token = createShareCookieToken(share.slug);
      return { unlocked: true, token, expires_in: 86400 };
    }

    const matches = await verifyPassword(share.passwordHash, password);
    if (!matches) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Incorrect password for this shared link.",
      });
    }

    const token = createShareCookieToken(share.slug);
    return { unlocked: true, token, expires_in: 86400 };
  }

  /**
   * Verify access for /contents and /items
   */
  public async verifyAccess(
    share: MemShare,
    cookies: Record<string, string | undefined>,
    accountEmail?: string
  ): Promise<void> {
    if (share.mode === "public") return;

    if (share.mode === "password") {
      const cookieName = `lmn_share_${share.slug}`;
      const cookieVal = cookies[cookieName];
      const expected = createShareCookieToken(share.slug);

      if (!cookieVal || cookieVal !== expected) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHENTICATED",
          message: "Password required. Please unlock the share first.",
        });
      }
      return;
    }

    if (share.mode === "invite_only") {
      if (!accountEmail) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHENTICATED",
          message: "Authentication required to view this invite-only share.",
        });
      }

      const emailNormalized = accountEmail.toLowerCase().trim();
      const isAllowed = share.allowedEmails.some(
        (e) => e.toLowerCase().trim() === emailNormalized
      );

      if (!isAllowed) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "You do not have access to this shared resource.",
        });
      }
    }
  }

  /**
   * Hydrate full contents tree for GET /v1/public/shares/:slug/contents
   */
  public async getShareContents(
    slug: string,
    options: { view?: string; expand?: string },
    cookies: Record<string, string | undefined>,
    accountEmail?: string
  ) {
    const share = await this.findBySlug(slug);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: `Share '${slug}' not found.` });
    }

    if (share.revokedAt) {
      throw new AppError({ statusCode: 410, code: "GONE", message: "Share link revoked.", details: { reason: "revoked" } });
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new AppError({ statusCode: 410, code: "GONE", message: "Share link expired.", details: { reason: "expired" } });
    }

    await this.verifyAccess(share, cookies, accountEmail);

    const isDb = await checkDbConnection();
    const orgId = share.organizationId;
    const targetType = share.targetType;
    const targetId = share.targetId;

    if (isDb) {
      const db = getDb();

      if (targetType === "collection") {
        const [coll] = await db
          .select()
          .from(schema.collections)
          .where(and(eq(schema.collections.id, targetId), eq(schema.collections.organizationId, orgId), isNull(schema.collections.deletedAt)))
          .limit(1);

        if (!coll) {
          throw new AppError({ statusCode: 410, code: "GONE", message: "Target collection deleted.", details: { reason: "target_deleted" } });
        }

        const groups = await db
          .select()
          .from(schema.groups)
          .where(and(eq(schema.groups.collectionId, targetId), eq(schema.groups.organizationId, orgId), isNull(schema.groups.deletedAt)))
          .orderBy(schema.groups.position);

        const items = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.collectionId, targetId), eq(schema.items.organizationId, orgId), isNull(schema.items.deletedAt)))
          .orderBy(schema.items.position);

        const mappedGroups = groups.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          items: items
            .filter((i) => i.groupId === g.id)
            .map((i) => ({
              id: i.id,
              title: i.title,
              url: i.url,
              favicon_url: i.faviconUrl,
              description: i.description,
            })),
        }));

        const rootItems = items
          .filter((i) => !i.groupId)
          .map((i) => ({
            id: i.id,
            title: i.title,
            url: i.url,
            favicon_url: i.faviconUrl,
            description: i.description,
          }));

        return {
          slug: share.slug,
          target_type: "collection",
          target: {
            id: coll.id,
            name: share.titleOverride || coll.name,
            color: coll.color,
            description: share.descriptionOverride || coll.description,
          },
          groups: mappedGroups,
          items: rootItems,
        };
      }

      if (targetType === "group") {
        const [grp] = await db
          .select()
          .from(schema.groups)
          .where(and(eq(schema.groups.id, targetId), eq(schema.groups.organizationId, orgId), isNull(schema.groups.deletedAt)))
          .limit(1);

        if (!grp) {
          throw new AppError({ statusCode: 410, code: "GONE", message: "Target group deleted." });
        }

        const items = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.groupId, targetId), eq(schema.items.organizationId, orgId), isNull(schema.items.deletedAt)))
          .orderBy(schema.items.position);

        return {
          slug: share.slug,
          target_type: "group",
          target: {
            id: grp.id,
            name: share.titleOverride || grp.name,
            color: grp.color,
          },
          groups: [],
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            url: i.url,
            favicon_url: i.faviconUrl,
            description: i.description,
          })),
        };
      }

      if (targetType === "item") {
        const [it] = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.id, targetId), eq(schema.items.organizationId, orgId), isNull(schema.items.deletedAt)))
          .limit(1);

        if (!it) {
          throw new AppError({ statusCode: 410, code: "GONE", message: "Target item deleted." });
        }

        return {
          slug: share.slug,
          target_type: "item",
          target: {
            id: it.id,
            title: share.titleOverride || it.title,
            url: it.url,
            favicon_url: it.faviconUrl,
            description: share.descriptionOverride || it.description,
          },
          groups: [],
          items: [],
        };
      }

      // Space target type
      const [sp] = await db
        .select()
        .from(schema.spaces)
        .where(and(eq(schema.spaces.id, targetId), eq(schema.spaces.organizationId, orgId), isNull(schema.spaces.deletedAt)))
        .limit(1);

      if (!sp) {
        throw new AppError({ statusCode: 410, code: "GONE", message: "Target space deleted." });
      }

      const collections = await db
        .select()
        .from(schema.collections)
        .where(and(eq(schema.collections.spaceId, targetId), eq(schema.collections.organizationId, orgId), isNull(schema.collections.deletedAt)))
        .orderBy(schema.collections.position);

      const collIds = collections.map((c) => c.id);
      const items = collIds.length > 0
        ? await db
            .select()
            .from(schema.items)
            .where(and(inArray(schema.items.collectionId, collIds), isNull(schema.items.deletedAt)))
            .orderBy(schema.items.position)
        : [];

      return {
        slug: share.slug,
        target_type: "space",
        target: {
          id: sp.id,
          name: share.titleOverride || sp.name,
          color: sp.color,
          description: share.descriptionOverride || sp.description,
        },
        groups: collections.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          items: items
            .filter((i) => i.collectionId === c.id)
            .map((i) => ({
              id: i.id,
              title: i.title,
              url: i.url,
              favicon_url: i.faviconUrl,
              description: i.description,
            })),
        })),
        items: [],
      };
    }

    // In-Memory MemRepo resolution
    if (targetType === "collection") {
      const coll = memRepo.collections.find((c) => c.id === targetId && c.organizationId === orgId && !c.deletedAt);
      if (!coll) {
        throw new AppError({ statusCode: 410, code: "GONE", message: "Target collection deleted.", details: { reason: "target_deleted" } });
      }

      const groups = memRepo.groups.filter((g) => g.collectionId === targetId && g.organizationId === orgId && !g.deletedAt);
      const items = memRepo.items.filter((i) => i.collectionId === targetId && i.organizationId === orgId && !i.deletedAt);

      const mappedGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        items: items
          .filter((i) => i.groupId === g.id)
          .map((i) => ({
            id: i.id,
            title: i.title,
            url: i.url,
            favicon_url: i.faviconUrl,
            description: i.description,
          })),
      }));

      const rootItems = items
        .filter((i) => !i.groupId)
        .map((i) => ({
          id: i.id,
          title: i.title,
          url: i.url,
          favicon_url: i.faviconUrl,
          description: i.description,
        }));

      return {
        slug: share.slug,
        target_type: "collection",
        target: {
          id: coll.id,
          name: share.titleOverride || coll.name,
          color: coll.color,
          description: share.descriptionOverride || coll.description,
        },
        groups: mappedGroups,
        items: rootItems,
      };
    }

    if (targetType === "group") {
      const grp = memRepo.groups.find((g) => g.id === targetId && g.organizationId === orgId && !g.deletedAt);
      if (!grp) {
        throw new AppError({ statusCode: 410, code: "GONE", message: "Target group deleted." });
      }

      const items = memRepo.items.filter((i) => i.groupId === targetId && i.organizationId === orgId && !i.deletedAt);

      return {
        slug: share.slug,
        target_type: "group",
        target: {
          id: grp.id,
          name: share.titleOverride || grp.name,
          color: grp.color,
        },
        groups: [],
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          url: i.url,
          favicon_url: i.faviconUrl,
          description: i.description,
        })),
      };
    }

    if (targetType === "item") {
      const it = memRepo.items.find((i) => i.id === targetId && i.organizationId === orgId && !i.deletedAt);
      if (!it) {
        throw new AppError({ statusCode: 410, code: "GONE", message: "Target item deleted." });
      }

      return {
        slug: share.slug,
        target_type: "item",
        target: {
          id: it.id,
          title: share.titleOverride || it.title,
          url: it.url,
          favicon_url: it.faviconUrl,
          description: share.descriptionOverride || it.description,
        },
        groups: [],
        items: [],
      };
    }

    // Space in memRepo
    const sp = memRepo.spaces.find((s) => s.id === targetId && s.organizationId === orgId && !s.deletedAt);
    if (!sp) {
      throw new AppError({ statusCode: 410, code: "GONE", message: "Target space deleted." });
    }

    const colls = memRepo.collections.filter((c) => c.spaceId === targetId && c.organizationId === orgId && !c.deletedAt);
    const collIds = new Set(colls.map((c) => c.id));
    const items = memRepo.items.filter((i) => collIds.has(i.collectionId) && !i.deletedAt);

    return {
      slug: share.slug,
      target_type: "space",
      target: {
        id: sp.id,
        name: share.titleOverride || sp.name,
        color: sp.color,
        description: share.descriptionOverride || sp.description,
      },
      groups: colls.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        items: items
          .filter((i) => i.collectionId === c.id)
          .map((i) => ({
            id: i.id,
            title: i.title,
            url: i.url,
            favicon_url: i.faviconUrl,
            description: i.description,
          })),
      })),
      items: [],
    };
  }

  /**
   * Paginated flat items list for GET /v1/public/shares/:slug/items
   */
  public async getShareItems(
    slug: string,
    options: {
      cursor?: string;
      limit?: number;
      group_id?: string;
      tag?: string | string[];
      q?: string;
      sort?: "position" | "created_at_desc" | "title_asc";
    },
    cookies: Record<string, string | undefined>,
    accountEmail?: string
  ) {
    const share = await this.findBySlug(slug);
    if (!share) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: `Share '${slug}' not found.` });
    }

    if (share.revokedAt) {
      throw new AppError({ statusCode: 410, code: "GONE", message: "Share link revoked.", details: { reason: "revoked" } });
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new AppError({ statusCode: 410, code: "GONE", message: "Share link expired.", details: { reason: "expired" } });
    }

    await this.verifyAccess(share, cookies, accountEmail);

    const limit = Math.min(Math.max(options.limit || 50, 1), 200);

    // Retrieve all candidates
    let allItems: Array<{
      id: string;
      title: string;
      url: string;
      favicon_url: string | null;
      description: string | null;
      group_id?: string | null;
      position: number;
      created_at: Date | string;
    }> = [];

    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      if (share.targetType === "collection") {
        const rows = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.collectionId, share.targetId), isNull(schema.items.deletedAt)));
        allItems = rows.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          favicon_url: r.faviconUrl,
          description: r.description,
          group_id: r.groupId,
          position: r.position,
          created_at: r.createdAt,
        }));
      } else if (share.targetType === "group") {
        const rows = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.groupId, share.targetId), isNull(schema.items.deletedAt)));
        allItems = rows.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          favicon_url: r.faviconUrl,
          description: r.description,
          group_id: r.groupId,
          position: r.position,
          created_at: r.createdAt,
        }));
      } else if (share.targetType === "item") {
        const rows = await db
          .select()
          .from(schema.items)
          .where(and(eq(schema.items.id, share.targetId), isNull(schema.items.deletedAt)));
        allItems = rows.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          favicon_url: r.faviconUrl,
          description: r.description,
          group_id: r.groupId,
          position: r.position,
          created_at: r.createdAt,
        }));
      }
    } else {
      if (share.targetType === "collection") {
        allItems = memRepo.items
          .filter((i) => i.collectionId === share.targetId && !i.deletedAt)
          .map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            favicon_url: r.faviconUrl || null,
            description: r.description || null,
            group_id: r.groupId,
            position: r.position,
            created_at: r.createdAt,
          }));
      } else if (share.targetType === "group") {
        allItems = memRepo.items
          .filter((i) => i.groupId === share.targetId && !i.deletedAt)
          .map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            favicon_url: r.faviconUrl || null,
            description: r.description || null,
            group_id: r.groupId,
            position: r.position,
            created_at: r.createdAt,
          }));
      } else if (share.targetType === "item") {
        allItems = memRepo.items
          .filter((i) => i.id === share.targetId && !i.deletedAt)
          .map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            favicon_url: r.faviconUrl || null,
            description: r.description || null,
            group_id: r.groupId,
            position: r.position,
            created_at: r.createdAt,
          }));
      }
    }

    // Filter by group_id
    if (options.group_id) {
      allItems = allItems.filter((i) => i.group_id === options.group_id);
    }

    // Filter by full-text q
    if (options.q) {
      const q = options.q.toLowerCase().trim();
      allItems = allItems.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          i.url.toLowerCase().includes(q)
      );
    }

    // Sort
    const sort = options.sort || "position";
    if (sort === "created_at_desc") {
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "title_asc") {
      allItems.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      allItems.sort((a, b) => a.position - b.position);
    }

    // Cursor pagination (offset-based or id-based)
    let startIndex = 0;
    if (options.cursor) {
      const parsedOffset = parseInt(Buffer.from(options.cursor, "base64").toString("utf-8"), 10);
      if (!isNaN(parsedOffset)) {
        startIndex = parsedOffset;
      }
    }

    const paged = allItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allItems.length;
    const nextCursor = hasMore
      ? Buffer.from(String(startIndex + limit)).toString("base64")
      : null;

    const data = paged.map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      favicon_url: i.favicon_url,
      description: i.description,
      tags: [],
      group: i.group_id ? { id: i.group_id, name: "Group" } : null,
      position: i.position,
    }));

    return {
      data,
      page: {
        next_cursor: nextCursor,
        has_more: hasMore,
        limit,
      },
    };
  }

  /**
   * Track share view (analytics)
   */
  public async recordView(slug: string, meta?: { client_id?: string; referrer?: string }) {
    const share = await this.findBySlug(slug);
    if (!share || !share.analyticsEnabled || share.revokedAt) return;

    const isDb = await checkDbConnection();
    const now = new Date();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.shares)
        .set({
          viewCount: (share.viewCount || 0) + 1,
          uniqueViewerCount: meta?.client_id
            ? (share.uniqueViewerCount || 0) + 1
            : share.uniqueViewerCount || 1,
          lastViewedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.shares.id, share.id));
    } else {
      share.viewCount += 1;
      if (meta?.client_id) {
        share.uniqueViewerCount += 1;
      }
      share.lastViewedAt = now;
      share.updatedAt = now;
    }
  }

  /**
   * Track item click (analytics)
   */
  public async recordClick(slug: string, itemId: string, _meta?: { client_id?: string }) {
    const share = await this.findBySlug(slug);
    if (!share || !share.analyticsEnabled || share.revokedAt) return;

    // Verify item belongs to target
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const [it] = await db
        .select()
        .from(schema.items)
        .where(and(eq(schema.items.id, itemId), isNull(schema.items.deletedAt)))
        .limit(1);

      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }

      await db
        .update(schema.shares)
        .set({
          clickCount: (share.clickCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.shares.id, share.id));
    } else {
      const it = memRepo.items.find((i) => i.id === itemId && !i.deletedAt);
      if (!it) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Item not found." });
      }

      share.clickCount += 1;
      share.updatedAt = new Date();
    }
  }
}

export const shareService = new ShareService();
