import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

/** Creates .env.local from .env.example with a freshly generated auth secret. */
if (existsSync(".env.local")) {
  console.log("✓ .env.local already exists (left unchanged)");
} else {
  const template = readFileSync(".env.example", "utf8");
  const secret = randomBytes(32).toString("base64url");
  writeFileSync(
    ".env.local",
    template.replace("replace-with-a-long-random-secret", secret),
  );
  console.log("✓ Created .env.local with a generated BETTER_AUTH_SECRET");
}
