import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3000")
    .transform((val) => val.split(",").map((s) => s.trim())),
  API_PREFIX: z.string().default("/v1"),
  DB_DRIVER: z.enum(["sqlite", "postgres"]).default("sqlite"),
  DATABASE_URL: z
    .string()
    .default(
      process.env.NODE_ENV === "test"
        ? "file::memory:?cache=shared"
        : "file:./data/letsmarknow.db"
    ),
  JWT_SECRET: z.string().default("dev_jwt_access_secret_32_chars_long_minimum"),
  COOKIE_SECRET: z.string().default("dev_cookie_signing_secret_32_chars_long"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
