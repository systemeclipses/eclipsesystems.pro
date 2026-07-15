import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  process.env.DIRECT_URL ??
  (process.env.NEXT_PHASE === "phase-production-build"
    ? "postgres://build:build@127.0.0.1:5432/eclipse_build"
    : undefined);

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required");
}

const client = postgres(connectionString, {
  max: 1,
  prepare: false
});

export const db = drizzle(client, { schema });
