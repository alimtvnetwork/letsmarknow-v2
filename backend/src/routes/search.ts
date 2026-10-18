import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../errors/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { requireViewerOrAbove } from "../middleware/rbac.js";
import { searchService } from "../services/searchService.js";

export const searchRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/search/quick - Omnibox & Command Palette quick-find
  app.get(
    "/v1/search/quick",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { q?: string; limit?: string };
      if (!query.q) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Query parameter 'q' is required.",
          details: { field: "q" },
        });
      }

      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const results = await searchService.searchQuick(
        request.organizationId!,
        query.q,
        limit
      );

      return reply.status(200).send({ data: results });
    }
  );

  // GET /v1/search/suggest - Autocomplete suggestions
  app.get(
    "/v1/search/suggest",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { q?: string; limit?: string };
      if (!query.q) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Query parameter 'q' is required.",
          details: { field: "q" },
        });
      }

      const limit = query.limit ? parseInt(query.limit, 10) : 8;
      const suggestions = await searchService.suggest(
        request.organizationId!,
        query.q,
        limit
      );

      return reply.status(200).send({ data: suggestions });
    }
  );

  // GET /v1/search/recent - List recent searches for account in org
  app.get(
    "/v1/search/recent",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const recents = searchService.listRecentSearches(
        request.organizationId!,
        request.account!.id
      );

      return reply.status(200).send({ data: recents });
    }
  );

  // DELETE /v1/search/recent - Clear recent searches
  app.delete(
    "/v1/search/recent",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as { q?: string };
      searchService.deleteRecentSearches(
        request.organizationId!,
        request.account!.id,
        query.q
      );

      return reply.status(204).send();
    }
  );

  // GET /v1/search - Global full-text and structured search
  app.get(
    "/v1/search",
    { preHandler: [requireAuth, requireViewerOrAbove] },
    async (request, reply) => {
      const query = request.query as {
        q?: string;
        types?: string;
        limit?: string;
        highlight?: string;
      };

      if (!query.q) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Query parameter 'q' is required.",
          details: { field: "q" },
        });
      }

      const types = query.types
        ? query.types.split(",").map((t) => t.trim().toLowerCase())
        : undefined;
      const limit = query.limit ? parseInt(query.limit, 10) : 25;
      const highlight = query.highlight !== "false";

      const results = await searchService.searchGlobal(
        request.organizationId!,
        request.account!.id,
        {
          q: query.q,
          types,
          limit,
          highlight,
        }
      );

      return reply.status(200).send(results);
    }
  );
};
