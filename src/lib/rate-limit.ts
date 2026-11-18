/**
 * Small fixed-window, in-memory rate limiter.
 *
 * Limitation: state is per server process, so in a multi-instance deployment
 * each instance enforces its own window. Swap the store for Redis/Upstash if
 * the app is deployed to several instances.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  if (process.env.DISABLE_RATE_LIMIT === "1") return { ok: true };

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) prune(now);
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export const LIMITS = {
  createReport: { limit: 10, windowMs: 60 * 60 * 1000 },
  claimRequest: { limit: 10, windowMs: 60 * 60 * 1000 },
  claimMessage: { limit: 60, windowMs: 10 * 60 * 1000 },
  upload: { limit: 30, windowMs: 60 * 60 * 1000 },
  flag: { limit: 20, windowMs: 60 * 60 * 1000 },
  chat: { limit: 20, windowMs: 60 * 1000 },
} as const;
