import "server-only";
import { createDatabase, type Database } from "./client";

/**
 * Server-only database handle. Never import this from client components.
 *
 * - Lazy: nothing connects until the first query, so `next build` (which
 *   imports route modules in several workers) never opens the database.
 * - Shared: the instance is cached on globalThis in every environment.
 *   Next.js bundles route handlers and pages separately, and an embedded
 *   PGlite engine must be shared by all of them (two engines on one data
 *   directory would not see each other's writes). It also survives dev hot
 *   reloads.
 */
const globalForDb = globalThis as unknown as { __homewardDb?: Database };

function getDatabase(): Database {
  return (globalForDb.__homewardDb ??= createDatabase());
}

export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const real = getDatabase();
    const value = Reflect.get(real, property, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * as tables from "./schema";
