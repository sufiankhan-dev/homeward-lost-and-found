import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Applies SQL migrations from ./drizzle.
 * Neon when DATABASE_URL is set, otherwise the local PGlite data directory.
 */
async function main() {
  const migrationsFolder = path.resolve("drizzle");

  if (process.env.DATABASE_URL) {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await migrate(drizzle({ client: pool }), { migrationsFolder });
    await pool.end();
    console.log("✓ Migrations applied to Neon");
    return;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = path.resolve(process.env.PGLITE_DIR ?? ".data/pglite");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await migrate(drizzle({ client }), { migrationsFolder });
  await client.close();
  console.log(`✓ Migrations applied to local PGlite (${dir})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
