/**
 * IP-based in-process rate limiter for Netlify serverless functions.
 *
 * --- Durability note ---
 * This rate limiter stores state in an in-memory Map that resets on every cold
 * start and does not coordinate across parallel function instances. Netlify
 * serverless functions can run multiple concurrent containers under load, so
 * the effective rate limit may be higher than configured.
 *
 * This best-effort approach is acceptable for moderate-traffic deployments. For
 * production workloads that require durable, cross-instance rate limiting,
 * connect an external store such as Upstash Redis (@upstash/redis with
 * @upstash/ratelimit) or an edge-backed counter. The function interface
 * (checkRateLimit / rateLimitResponse) is intentionally narrow so the
 * implementation can be swapped without touching call sites.
 *
 * --- Mechanics ---
 * Each IP entry tracks:
 *   - firstSeenAt   — when this IP was first registered; entry is deleted after 24 h.
 *   - windowStart   — start of the current sliding rate-limit window.
 *   - count         — requests accepted in the current window.
 *   - lastAllowedAt — timestamp of the last accepted request (throttle guard).
 *
 * State persists across warm invocations of the same function container.
 * A cold start resets everything.
 *
 * Two housekeeping routines run on every request:
 *   - Per-entry TTL: if an entry is older than 24 h it is deleted immediately.
 *   - Hourly sweep: walks the whole map and evicts any remaining stale entries.
 */

interface IpEntry {
  readonly firstSeenAt: number;
  windowStart: number;
  count: number;
  lastAllowedAt: number;
}

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
  readonly throttleMs: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly ip: string;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfter: number;
  readonly reset: number;
}

const ENTRY_TTL_MS = 24 * 60 * 60 * 1_000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1_000;

const store = new Map<string, IpEntry>();
let lastSweepAt = Date.now();

function sweep(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [ip, entry] of store) {
    if (now - entry.firstSeenAt >= ENTRY_TTL_MS) store.delete(ip);
  }
}

function extractIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): RateLimitResult {
  sweep();

  const now = Date.now();
  const ip = extractIp(request);
  const { limit, windowMs, throttleMs } = options;

  let entry = store.get(ip);

  // Delete and forget entries older than 24 h — fresh start on next request.
  if (entry !== undefined && now - entry.firstSeenAt >= ENTRY_TTL_MS) {
    store.delete(ip);
    entry = undefined;
  }

  // Initialise a new entry for this IP.
  if (entry === undefined) {
    entry = { firstSeenAt: now, windowStart: now, count: 0, lastAllowedAt: 0 };
  }

  // Reset window counter once the window duration has elapsed.
  if (now - entry.windowStart >= windowMs) {
    entry = { ...entry, windowStart: now, count: 0 };
  }

  const windowReset = entry.windowStart + windowMs;

  // Throttle guard: reject if the minimum gap between requests has not passed.
  if (throttleMs > 0 && entry.lastAllowedAt > 0) {
    const gap = now - entry.lastAllowedAt;
    if (gap < throttleMs) {
      store.set(ip, entry);
      return {
        allowed: false,
        ip,
        limit,
        remaining: Math.max(0, limit - entry.count),
        retryAfter: Math.ceil((throttleMs - gap) / 1_000),
        reset: Math.floor(windowReset / 1_000),
      };
    }
  }

  // Rate-limit guard: reject if the window quota is exhausted.
  if (entry.count >= limit) {
    store.set(ip, entry);
    return {
      allowed: false,
      ip,
      limit,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((windowReset - now) / 1_000)),
      reset: Math.floor(windowReset / 1_000),
    };
  }

  // Accept the request.
  entry = { ...entry, count: entry.count + 1, lastAllowedAt: now };
  store.set(ip, entry);

  return {
    allowed: true,
    ip,
    limit,
    remaining: limit - entry.count,
    retryAfter: 0,
    reset: Math.floor(windowReset / 1_000),
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please slow down.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
