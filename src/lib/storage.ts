import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage boundary for item photographs. Only storage keys and metadata are
 * kept in PostgreSQL. This adapter writes to local disk (outside /public, so
 * files are served through an access-checked route). To deploy on serverless
 * hosting, implement the same three functions against an object store
 * (e.g. S3, R2 or Vercel Blob).
 */
const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? ".data/uploads");

function resolveKey(key: string): string {
  if (!/^[a-f0-9-]{36}(-thumb)?\.webp$/.test(key)) {
    throw new Error("Invalid storage key");
  }
  return path.join(root, key);
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  await mkdir(root, { recursive: true });
  await writeFile(resolveKey(key), data);
}

export async function getObject(key: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveKey(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await unlink(resolveKey(key));
  } catch {
    /* already gone */
  }
}
