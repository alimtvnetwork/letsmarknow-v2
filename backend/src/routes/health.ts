import type { FastifyPluginAsync } from "fastify";
import { checkDbConnection } from "../db/client.js";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const handler = async () => {
    const isDbConnected = await checkDbConnection();

    return {
      status: "ok",
      version: "0.2.11",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: isDbConnected ? "healthy" : "disconnected",
        cache: "in_memory",
      },
    };
  };

  // Both versioned and unversioned per spec 03-api-endpoints/01-conventions.md §1
  fastify.get("/health", handler);
  fastify.get("/v1/health", handler);
};
