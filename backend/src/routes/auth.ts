import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { env } from "../config/env.js";
import { authService } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(1).max(120).optional(),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
  active_organization_id: z.string().uuid().optional(),
  refresh_token: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatar_url: z.string().url().optional(),
});

const googleAuthSchema = z.object({
  credential: z.string().optional(),
  token: z.string().optional(),
  mock_profile: z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      avatar_url: z.string().url().optional(),
      sub: z.string().optional(),
    })
    .optional(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /v1/auth/signup
  app.post("/v1/auth/signup", async (request, reply) => {
    const parseResult = signupSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid signup payload",
        details: { errors: parseResult.error.format() },
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const result = await authService.signup(parseResult.data);

    reply.setCookie("lmn_refresh", result.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return reply.status(201).send({
      data: {
        account_id: result.account_id,
        email_verified: false,
        default_organization_id: result.default_organization_id,
        access_token: result.access_token,
        expires_in: result.expires_in,
      },
    });
  });

  // POST /v1/auth/signin
  app.post("/v1/auth/signin", async (request, reply) => {
    const parseResult = signinSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid signin payload",
        details: { errors: parseResult.error.format() },
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const result = await authService.signin({
      ...parseResult.data,
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    });

    reply.setCookie("lmn_refresh", result.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      data: {
        account_id: result.account_id,
        default_organization_id: result.default_organization_id,
        mfa_required: false,
        mfa_challenge_id: null,
        access_token: result.access_token,
        expires_in: result.expires_in,
      },
    });
  });

  // POST /v1/auth/google
  app.post("/v1/auth/google", async (request, reply) => {
    const parseResult = googleAuthSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid Google auth payload",
        details: { errors: parseResult.error.format() },
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const result = await authService.googleAuth(parseResult.data);

    reply.setCookie("lmn_refresh", result.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      data: {
        account_id: result.account_id,
        default_organization_id: result.default_organization_id,
        access_token: result.access_token,
        expires_in: result.expires_in,
        user: {
          email: result.email,
          name: result.name,
          avatar_url: result.avatar_url,
        },
      },
    });
  });

  // POST /v1/auth/token
  app.post("/v1/auth/token", async (request, reply) => {
    const body = (request.body as { active_organization_id?: string; refresh_token?: string }) || {};
    const parseResult = refreshTokenSchema.safeParse(body);
    const validBody = parseResult.success ? parseResult.data : {};

    const rawRefreshToken = request.cookies.lmn_refresh || validBody.refresh_token;

    if (!rawRefreshToken) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Refresh token is missing or expired.",
        docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
      });
    }

    const result = await authService.refreshToken(
      rawRefreshToken,
      validBody.active_organization_id
    );

    reply.setCookie("lmn_refresh", result.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      data: {
        access_token: result.access_token,
        expires_in: result.expires_in,
        active_organization_id: result.active_organization_id,
        entitlements_hash: "sha256:dev-entitlements",
      },
    });
  });

  // POST /v1/auth/signout
  app.post("/v1/auth/signout", async (request, reply) => {
    const body = (request.body as { refresh_token?: string }) || {};
    const rawRefreshToken = request.cookies.lmn_refresh || body.refresh_token;

    await authService.signout(rawRefreshToken);
    reply.clearCookie("lmn_refresh", { path: "/v1/auth" });
    return reply.status(204).send();
  });

  // GET /v1/auth/verify?token=...
  app.get("/v1/auth/verify", async (request, reply) => {
    const query = request.query as { token?: string };
    if (!query.token) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Verification token query parameter is required.",
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const verifiedAt = await authService.verifyEmail(query.token);

    return reply.status(200).send({
      data: {
        email_verified_at: verifiedAt.toISOString(),
      },
    });
  });

  // GET /v1/auth/sessions
  app.get("/v1/auth/sessions", { preHandler: [requireAuth] }, async (request, reply) => {
    const sessions = await authService.listSessions(
      request.account!.id,
      request.cookies.lmn_refresh
    );
    return reply.status(200).send({ data: sessions });
  });

  // DELETE /v1/auth/sessions/:id
  app.delete("/v1/auth/sessions/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    await authService.revokeSession(
      request.account!.id,
      params.id,
      request.cookies.lmn_refresh
    );
    return reply.status(204).send();
  });

  // GET /v1/account
  app.get("/v1/account", { preHandler: [requireAuth] }, async (request, reply) => {
    const account = await authService.getAccount(request.account!.id);
    return reply.status(200).send({ data: account });
  });

  // PATCH /v1/account
  app.patch("/v1/account", { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = updateAccountSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid account update payload",
        details: { errors: parseResult.error.format() },
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    const updated = await authService.updateAccount(request.account!.id, {
      displayName: parseResult.data.name,
      avatarUrl: parseResult.data.avatar_url,
    });

    return reply.status(200).send({ data: updated });
  });

  // POST /v1/auth/password/change
  app.post("/v1/auth/password/change", { preHandler: [requireAuth] }, async (request, reply) => {
    const schema = z.object({
      current_password: z.string().min(1, "Current password is required"),
      new_password: z.string().min(8, "New password must be at least 8 characters long"),
    });

    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: parseResult.error.issues[0]?.message || "Invalid password payload",
        details: { errors: parseResult.error.format() },
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    await authService.changePassword(
      request.account!.id,
      parseResult.data.current_password,
      parseResult.data.new_password,
      request.cookies.lmn_refresh
    );

    return reply.status(204).send();
  });

  // POST /v1/auth/signout-all
  app.post("/v1/auth/signout-all", { preHandler: [requireAuth] }, async (request, reply) => {
    await authService.signoutAll(request.account!.id);
    reply.clearCookie("lmn_refresh", { path: "/v1/auth" });
    return reply.status(204).send();
  });
};
