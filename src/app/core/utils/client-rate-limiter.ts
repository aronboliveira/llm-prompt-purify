/**
 * Client-side rate limiter that mirrors the server-side IP bucket strategy.
 *
 * Each instance owns a single bucket with:
 *   - windowStart    — start of the current window (resets after windowMs).
 *   - count          — requests accepted in the current window.
 *   - lastAllowedAt  — timestamp of the last accepted call (throttle guard).
 *
 * Two guards run on every check():
 *   1. Throttle guard  — rejects if the minimum gap between calls has not passed.
 *   2. Window guard    — rejects if the per-window quota is exhausted.
 *
 * When rejected, `retryAfterMs` tells callers how long to wait before retrying.
 */

export interface ClientRateLimiterOptions {
  readonly limit: number;
  readonly windowMs: number;
  /** Minimum milliseconds that must elapse between two accepted calls. */
  readonly throttleMs: number;
}

export interface ClientRateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  /** 0 when allowed; positive ms to wait before the next call will be accepted. */
  readonly retryAfterMs: number;
}

/** Thrown by service methods that are guarded by a ClientRateLimiter. */
export class ClientRateLimitError extends Error {
  readonly retryAfterMs: number;
  readonly remaining: number;

  constructor(retryAfterMs: number, remaining: number) {
    const secs = Math.ceil(retryAfterMs / 1_000);
    super(`Rate limited. Try again in ${secs}s.`);
    this.name = "ClientRateLimitError";
    this.retryAfterMs = retryAfterMs;
    this.remaining = remaining;
  }
}

interface Bucket {
  windowStart: number;
  count: number;
  lastAllowedAt: number;
}

export class ClientRateLimiter {
  readonly #options: ClientRateLimiterOptions;
  #bucket: Bucket;

  constructor(options: ClientRateLimiterOptions) {
    this.#options = options;
    this.#bucket = { windowStart: Date.now(), count: 0, lastAllowedAt: 0 };
  }

  check(): ClientRateLimitResult {
    const now = Date.now();
    const { limit, windowMs, throttleMs } = this.#options;

    // Reset window counter once the window has elapsed.
    if (now - this.#bucket.windowStart >= windowMs) {
      this.#bucket = {
        windowStart: now,
        count: 0,
        lastAllowedAt: this.#bucket.lastAllowedAt,
      };
    }

    // Throttle guard: the minimum inter-call gap has not passed yet.
    if (throttleMs > 0 && this.#bucket.lastAllowedAt > 0) {
      const gap = now - this.#bucket.lastAllowedAt;
      if (gap < throttleMs) {
        return {
          allowed: false,
          remaining: Math.max(0, limit - this.#bucket.count),
          retryAfterMs: throttleMs - gap,
        };
      }
    }

    // Window guard: quota exhausted.
    if (this.#bucket.count >= limit) {
      const windowReset = this.#bucket.windowStart + windowMs;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, windowReset - now),
      };
    }

    // Accept.
    this.#bucket.count += 1;
    this.#bucket.lastAllowedAt = now;
    return {
      allowed: true,
      remaining: limit - this.#bucket.count,
      retryAfterMs: 0,
    };
  }

  /**
   * Convenience wrapper: calls check() and throws ClientRateLimitError when
   * the request is rejected. Service methods can simply `await limiter.guard()`.
   */
  guard(): void {
    const result = this.check();
    if (!result.allowed) {
      throw new ClientRateLimitError(result.retryAfterMs, result.remaining);
    }
  }
}
