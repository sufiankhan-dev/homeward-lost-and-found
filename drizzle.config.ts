import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { defineConfig } from "drizzle-kit";

// Migrations are generated from the schema and applied by `npm run db:migrate`,
// which targets Neon when DATABASE_URL is set and local PGlite otherwise.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(process.env.DATABASE_URL
    ? { dbCredentials: { url: process.env.DATABASE_URL } }
    : {}),
});
