import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

/**
 * Storage for item photographs. Only storage keys and metadata are kept in
 * PostgreSQL; the bytes live here.
 *
 * - With BLOB_READ_WRITE_TOKEN: a private Vercel Blob store. Required on
 *   serverless hosting, where the filesystem is read-only and not shared
 *   between instances. Blobs are private, so photos are still only served
 *   through the access-checked /api/images route.
 * - Without it: local disk (UPLOAD_DIR, default .data/uploads), for local
 *   development and automated tests.
 *
 * This module has no "server-only" guard so the seed script can share it.
 * App code imports it through src/lib/storage.ts, which adds the guard.
 */

const BLOB_PREFIX = "item-photos/";

/** Keys are generated server-side; anything else is rejected outright. */
function assertKey(key: string): void {
  if (!/^[a-f0-9-]{36}(-thumb)?\.webp$/.test(key)) {
    throw new Error("Invalid storage key");
  }
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function localPath(key: string): string {
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? ".data/uploads");
  return path.join(root, key);
}

export function getStorageMode(): "blob" | "local" {
  return hasBlobToken() ? "blob" : "local";
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  assertKey(key);
  if (hasBlobToken()) {
    await put(BLOB_PREFIX + key, data, {
      access: "private",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  if (isServerless()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Serverless deployments need a Vercel Blob store for photo uploads.",
    );
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

export async function getObject(key: string): Promise<Buffer | null> {
  assertKey(key);
  try {
    if (hasBlobToken()) {
      const result = await get(BLOB_PREFIX + key, { access: "private" });
      if (!result || result.statusCode !== 200) return null;
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    }
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  assertKey(key);
  try {
    if (hasBlobToken()) {
      await del(BLOB_PREFIX + key);
      return;
    }
    await unlink(localPath(key));
  } catch {
    /* already gone */
  }
}
