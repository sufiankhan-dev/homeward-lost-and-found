import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * Starts an isolated server for end-to-end tests: a fresh PGlite database and
 * upload folder in .data-test, seeded with demo data. Never touches .data.
 */
const root = path.resolve(".data-test");
rmSync(root, { recursive: true, force: true });

const env = {
  ...process.env,
  DATABASE_URL: "",
  // Keep test uploads on local disk, never in a real Blob store.
  BLOB_READ_WRITE_TOKEN: "",
  PGLITE_DIR: path.join(root, "pglite"),
  UPLOAD_DIR: path.join(root, "uploads"),
  DISABLE_RATE_LIMIT: "1",
  BETTER_AUTH_URL: "http://localhost:3200",
  BETTER_AUTH_SECRET: "e2e-only-secret-not-for-production-0123456789",
  ANTHROPIC_API_KEY: "",
};

for (const script of ["scripts/migrate.ts", "scripts/seed.ts"]) {
  const result = spawnSync("npx", ["tsx", script], { env, stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const server = spawn("npx", ["next", "start", "-p", "3200"], { env, stdio: "inherit", shell: true });
const stop = () => server.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => process.exit(code ?? 0));
