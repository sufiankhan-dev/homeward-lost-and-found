import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Schema = typeof schema;

/**
 * Both drivers produce a PostgreSQL Drizzle database with the same schema, so
 * application code depends only on this shared type.
 */
export type Database = PgDatabase<PgQueryResultHKT, Schema>;

export function getDatabaseMode(): "neon" | "pglite" {
  return process.env.DATABASE_URL ? "neon" : "pglite";
}

export function getPgliteDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.PGLITE_DIR ?? ".data/pglite");
}

/**
 * - With DATABASE_URL (Neon): uses the Neon serverless driver over WebSockets,
 *   which supports transactions.
 * - Without it: uses PGlite, an embedded PostgreSQL engine persisted to disk.
 *   This keeps local development and automated tests runnable with no
 *   external services while executing the same SQL migrations.
 */
export function createDatabase(): Database {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Driver-specific result HKTs differ; the query API used by the app is identical.
    return drizzleNeon({ client: pool, schema }) as unknown as Database;
  }
  const client = new PGlite(getPgliteDir());
  return drizzlePglite({ client, schema }) as unknown as Database;
}
