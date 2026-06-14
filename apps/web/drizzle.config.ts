import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ""
  }
});
