import { NextResponse } from "next/server";
import { db } from "@/db";
import { itemImage } from "@/db/schema";
import { ImageValidationError, processUpload } from "@/lib/image-processing";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { putObject } from "@/lib/storage";
import { UPLOAD_LIMITS } from "@/lib/constants";

/**
 * Upload one item photo. Returns an id that the report form attaches when the
 * report is saved. Files are validated by content, re-encoded and stripped of
 * metadata before storage.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to upload photos." }, { status: 401 });
  }
  const limited = rateLimit(`upload:${user.id}`, LIMITS.upload);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You've uploaded a lot of photos recently. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > UPLOAD_LIMITS.maxBytes + 64 * 1024) {
    return NextResponse.json({ error: "Photos must be 5 MB or smaller." }, { status: 413 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    file = null;
  }
  if (!file) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }

  try {
    const processed = await processUpload(Buffer.from(await file.arrayBuffer()));
    const id = crypto.randomUUID();
    const storageKey = `${id}.webp`;
    const thumbKey = `${id}-thumb.webp`;
    await putObject(storageKey, processed.full);
    await putObject(thumbKey, processed.thumb);
    await db.insert(itemImage).values({
      id,
      uploaderId: user.id,
      storageKey,
      thumbKey,
      mimeType: "image/webp",
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.full.byteLength,
    });
    return NextResponse.json({ id, width: processed.width, height: processed.height });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Upload failed", error);
    return NextResponse.json(
      { error: "The photo couldn't be saved. Please try again." },
      { status: 500 },
    );
  }
}
