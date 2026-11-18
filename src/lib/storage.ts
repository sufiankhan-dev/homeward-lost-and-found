import "server-only";

/**
 * Server-only entry point for photo storage. See storage-core.ts for how the
 * backend (Vercel Blob or local disk) is chosen.
 */
export { deleteObject, getObject, getStorageMode, putObject } from "./storage-core";
