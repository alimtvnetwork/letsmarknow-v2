import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env.js";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log("⏳ Running database migrations...");

  try {
    const migrationsFolder = path.resolve(__dirname, "./migrations");
    await migrate(db, { migrationsFolder });

    // Also run custom extensions and FTS migrations if present
    const ftsMigrationPath = path.resolve(migrationsFolder, "0001_search_tsv_and_extensions.sql");
    if (fs.existsSync(ftsMigrationPath)) {
      const ftsSql = fs.readFileSync(ftsMigrationPath, "utf-8");
      await sql.unsafe(ftsSql);
      console.log("✓ Applied FTS tsvector and pg_trgm extensions");
    }

    console.log("✓ All migrations executed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
