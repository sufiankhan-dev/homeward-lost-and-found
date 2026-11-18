import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { readFileSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";
import { processUpload } from "../src/lib/image-processing";
import { deleteObject, getStorageMode, putObject } from "../src/lib/storage-core";
import { DEMO_ITEMS, DEMO_USERS, CATEGORIES } from "./seed-data";

/**
 * DEMO DATA ONLY. Populates categories (needed in every environment) and,
 * unless --categories-only is passed, demo users and listings.
 * Refuses to load demo users/listings when NODE_ENV=production unless
 * --allow-production is passed.
 */
const args = new Set(process.argv.slice(2));

type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Demo photos ship with the repository in scripts/seed-images. They are given
 * exactly the same treatment as a real upload: type checked by signature,
 * resized and re-encoded to WebP, which drops EXIF metadata.
 */
const SEED_IMAGE_DIR = path.resolve("scripts/seed-images");

async function attachDemoPhoto(
  db: SeedDb,
  input: { itemReportId: string; uploaderId: string; altText: string; image: string },
): Promise<void> {
  const file = path.join(SEED_IMAGE_DIR, `${input.image}.jpg`);
  let bytes: Buffer;
  try {
    bytes = readFileSync(file);
  } catch {
    throw new Error(
      `Missing demo photo ${path.relative(process.cwd(), file)}. Run: npx tsx scripts/fetch-seed-images.ts`,
    );
  }
  const processed = await processUpload(bytes);
  const id = crypto.randomUUID();
  const storageKey = `${id}.webp`;
  const thumbKey = `${id}-thumb.webp`;
  await putObject(storageKey, processed.full);
  await putObject(thumbKey, processed.thumb);
  await db.insert(schema.itemImage).values({
    id,
    itemReportId: input.itemReportId,
    uploaderId: input.uploaderId,
    storageKey,
    thumbKey,
    mimeType: "image/webp",
    width: processed.width,
    height: processed.height,
    sizeBytes: processed.full.byteLength,
    altText: input.altText,
  });
}

async function getDb(): Promise<{ db: SeedDb; close: () => Promise<void> }> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Driver-specific HKTs differ; both are PostgreSQL databases with this schema.
    return { db: drizzle({ client: pool, schema }) as unknown as SeedDb, close: () => pool.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite(
    path.resolve(process.env.PGLITE_DIR ?? ".data/pglite"),
  );
  return { db: drizzle({ client, schema }) as unknown as SeedDb, close: () => client.close() };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const { db, close } = await getDb();

  try {
    await db
      .insert(schema.category)
      .values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
      .onConflictDoNothing({ target: schema.category.slug });
    console.log(`✓ ${CATEGORIES.length} categories ensured`);

    if (args.has("--categories-only")) return;

    if (process.env.NODE_ENV === "production" && !args.has("--allow-production")) {
      console.log("Skipping demo users and listings in production.");
      return;
    }

    // Seeding a hosted database while photos go to this machine's disk would
    // leave the deployed site with image rows whose files it cannot read.
    if (process.env.DATABASE_URL && getStorageMode() === "local" && !args.has("--local-photos")) {
      throw new Error(
        "DATABASE_URL points at a hosted database but BLOB_READ_WRITE_TOKEN is not set, so demo photos would only be saved on this computer. Add the Vercel Blob token to .env.local (or pass --local-photos if this database is only used locally).",
      );
    }

    const existing = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
    if (existing.length > 0 && !args.has("--reset")) {
      console.log("Users already exist; skipping demo data (pass --reset to replace it).");
      return;
    }
    if (args.has("--reset")) {
      // Remove the files behind the rows we are about to drop, so repeated
      // resets do not leave unreachable photos in the upload folder.
      const stored = await db
        .select({ storageKey: schema.itemImage.storageKey, thumbKey: schema.itemImage.thumbKey })
        .from(schema.itemImage);
      await Promise.all(
        stored.flatMap(({ storageKey, thumbKey }) => [deleteObject(storageKey), deleteObject(thumbKey)]),
      );
      await db.execute(
        sql`TRUNCATE "activity_event", "moderation_record", "listing_flag", "claim_message", "claim_request", "item_image", "item_report", "session", "account", "verification", "user" CASCADE`,
      );
    }

    const categories = await db.select().from(schema.category);
    const categoryId = (slug: string) => {
      const found = categories.find((c) => c.slug === slug);
      if (!found) throw new Error(`Unknown category ${slug}`);
      return found.id;
    };

    for (const u of DEMO_USERS) {
      const hash = await hashPassword(u.password);
      await db.insert(schema.user).values({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
      });
      await db.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: hash,
      });
    }
    console.log(`✓ ${DEMO_USERS.length} demo users`);

    const itemIds: string[] = [];
    let photoCount = 0;
    for (const item of DEMO_ITEMS) {
      const created = daysAgo(item.daysAgo);
      const [row] = await db
        .insert(schema.itemReport)
        .values({
          userId: item.userId,
          reportType: item.reportType,
          title: item.title,
          description: item.description,
          categoryId: categoryId(item.category),
          generalLocation: item.location,
          eventDate: daysAgo(item.daysAgo + (item.eventOffset ?? 0))
            .toISOString()
            .slice(0, 10),
          distinguishingFeatures: item.features ?? null,
          verificationDetails: item.verification ?? null,
          contactPreference: item.contact ?? "IN_APP",
          status: item.status ?? "OPEN",
          resolvedAt: item.status === "RESOLVED" ? created : null,
          createdAt: created,
          updatedAt: created,
        })
        .returning({ id: schema.itemReport.id });
      itemIds.push(row.id);
      if (item.image) {
        await attachDemoPhoto(db, {
          itemReportId: row.id,
          uploaderId: item.userId,
          altText: item.title,
          image: item.image,
        });
        photoCount += 1;
      }
    }
    console.log(`✓ ${DEMO_ITEMS.length} demo listings (${photoCount} with photos, stored in ${getStorageMode() === "blob" ? "Vercel Blob" : "local uploads folder"})`);

    // One realistic claim conversation so dashboards are not empty.
    const walletIndex = DEMO_ITEMS.findIndex((i) => i.title.startsWith("Brown leather wallet"));
    if (walletIndex >= 0) {
      const [claim] = await db
        .insert(schema.claimRequest)
        .values({
          itemReportId: itemIds[walletIndex],
          requesterId: "demo-user-alex",
          message:
            "Hi! I think this is my wallet. I lost it near the library café on Tuesday afternoon.",
          verificationAnswer:
            "There's a blue library card and a photo of a golden retriever inside.",
          status: "PENDING",
          createdAt: daysAgo(1),
          updatedAt: daysAgo(1),
        })
        .returning({ id: schema.claimRequest.id });
      await db.insert(schema.activityEvent).values([
        {
          userId: "demo-user-sam",
          itemReportId: itemIds[walletIndex],
          claimRequestId: claim.id,
          message: "Alex Morgan sent a claim request for “Brown leather wallet”.",
          createdAt: daysAgo(1),
        },
        {
          userId: "demo-user-alex",
          itemReportId: itemIds[walletIndex],
          claimRequestId: claim.id,
          message: "You sent a claim request for “Brown leather wallet”.",
          createdAt: daysAgo(1),
        },
      ]);
    }

    console.log("\nDemo accounts (password for all: see scripts/seed-data.ts):");
    for (const u of DEMO_USERS) console.log(`  ${u.email}  (${u.role})`);
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
