import { describe, expect, it } from "vitest";
import { formatDate, formatRelative } from "@/lib/format";
import { sniffImageMime } from "@/lib/image-processing";
import { rateLimit } from "@/lib/rate-limit";
import { browseHref } from "@/lib/search-params";

describe("sniffImageMime", () => {
  const pad = (bytes: number[]) => new Uint8Array([...bytes, ...new Array(16).fill(0)]);
  it("detects images by signature, not extension", () => {
    expect(sniffImageMime(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffImageMime(webp)).toBe("image/webp");
  });

  it("rejects non-images such as HTML or SVG", () => {
    expect(sniffImageMime(new TextEncoder().encode("<svg onload=alert(1)>....."))).toBeNull();
    expect(sniffImageMime(new TextEncoder().encode("<!doctype html><html>"))).toBeNull();
    expect(sniffImageMime(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows up to the limit, then blocks until the window resets", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 2, windowMs: 1000 };
    expect(rateLimit(key, opts, 0).ok).toBe(true);
    expect(rateLimit(key, opts, 10).ok).toBe(true);
    const blocked = rateLimit(key, opts, 20);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBe(1);
    expect(rateLimit(key, opts, 1001).ok).toBe(true);
  });
});

describe("browseHref", () => {
  it("removes a single filter while keeping the others", () => {
    expect(browseHref({ q: "keys", type: "LOST", page: 3 }, { type: undefined, page: undefined })).toBe("/browse?q=keys");
  });
  it("omits page 1", () => {
    expect(browseHref({ page: 1 })).toBe("/browse");
  });
});

describe("format", () => {
  it("formats ISO dates without timezone drift", () => {
    expect(formatDate("2026-03-01")).toBe("1 Mar 2026");
  });
  it("describes relative times in plain words", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(formatRelative(new Date("2026-03-10T11:59:30Z"), now)).toBe("just now");
    expect(formatRelative(new Date("2026-03-10T09:00:00Z"), now)).toBe("3 hours ago");
    expect(formatRelative(new Date("2026-03-09T12:00:00Z"), now)).toBe("yesterday");
  });
});
