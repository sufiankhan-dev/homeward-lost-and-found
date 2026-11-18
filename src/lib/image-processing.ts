import sharp, { type Metadata } from "sharp";
import { UPLOAD_LIMITS } from "./constants";

export type DetectedMime = (typeof UPLOAD_LIMITS.acceptedMimeTypes)[number];

/**
 * Identify an image by its magic bytes. File names and the browser-supplied
 * Content-Type are never trusted.
 */
export function sniffImageMime(bytes: Uint8Array): DetectedMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export class ImageValidationError extends Error {}

export type ProcessedImage = {
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  sourceMime: DetectedMime;
};

/**
 * Validate and re-encode an uploaded photo:
 * - type checked by signature, size and dimensions bounded
 * - re-encoded to WebP, which strips EXIF metadata such as GPS location
 * - auto-rotated, resized to sensible display sizes
 */
export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength > UPLOAD_LIMITS.maxBytes) {
    throw new ImageValidationError("Photos must be 5 MB or smaller.");
  }
  const sourceMime = sniffImageMime(input);
  if (!sourceMime) {
    throw new ImageValidationError("Upload a JPG, PNG or WebP photo.");
  }

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new ImageValidationError("This file couldn't be read as an image.");
  }
  const { width = 0, height = 0 } = meta;
  if (
    width < UPLOAD_LIMITS.minDimension ||
    height < UPLOAD_LIMITS.minDimension
  ) {
    throw new ImageValidationError("This photo is too small to be useful.");
  }
  if (
    width > UPLOAD_LIMITS.maxDimension ||
    height > UPLOAD_LIMITS.maxDimension
  ) {
    throw new ImageValidationError(
      `Photos can be at most ${UPLOAD_LIMITS.maxDimension}px on each side.`,
    );
  }

  const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate();
  const full = await base
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: 640, height: 480, fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    full: full.data,
    thumb,
    width: full.info.width,
    height: full.info.height,
    sourceMime,
  };
}
