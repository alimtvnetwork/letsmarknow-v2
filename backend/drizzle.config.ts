import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const isPg = process.env.DB_DRIVER === "postgres";

export default defineConfig({
  schema: isPg ? "./src/db/schema/pg/index.ts" : "./src/db/schema/sqlite/index.ts",
  out: isPg ? "./src/db/migrations/pg" : "./src/db/migrations/sqlite",
  dialect: isPg ? "postgresql" : "sqlite",
  dbCredentials: isPg
    ? {
        url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/letsmarknow",
      }
    : {
        url: process.env.DATABASE_URL || "file:./data/letsmarknow.db",
      },
  verbose: true,
  strict: true,
});
