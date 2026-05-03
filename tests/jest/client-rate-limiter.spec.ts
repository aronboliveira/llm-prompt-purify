import {
  ClientRateLimiter,
  ClientRateLimitError,
} from "@core/utils/client-rate-limiter";

describe("ClientRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("check()", () => {
    it("allows the first call with full quota remaining", () => {
      const limiter = new ClientRateLimiter({
        limit: 5,
        windowMs: 60_000,
        throttleMs: 1_000,
      });

      const result = limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.retryAfterMs).toBe(0);
    });

    it("decreases remaining count with each accepted call", () => {
      const limiter = new ClientRateLimiter({
        limit: 5,
        windowMs: 60_000,
        throttleMs: 0,
      });

      let result = limiter.check();
      expect(result).toMatchObject({ allowed: true, remaining: 4 });

      result = limiter.check();
      expect(result).toMatchObject({ allowed: true, remaining: 3 });

      result = limiter.check();
      expect(result).toMatchObject({ allowed: true, remaining: 2 });

      result = limiter.check();
      expect(result).toMatchObject({ allowed: true, remaining: 1 });

      result = limiter.check();
      expect(result).toMatchObject({ allowed: true, remaining: 0 });
    });

    it("rejects calls after the window quota is exhausted and reports correct retryAfterMs", () => {
      const limiter = new ClientRateLimiter({
        limit: 2,
        windowMs: 60_000,
        throttleMs: 0,
      });

      limiter.check(); // 1
      limiter.check(); // 2 — quota exhausted

      const result = limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    });

    it("resets the window counter after windowMs elapses", () => {
      const limiter = new ClientRateLimiter({
        limit: 2,
        windowMs: 60_000,
        throttleMs: 0,
      });

      limiter.check(); // 1
      limiter.check(); // 2 — exhausted

      expect(limiter.check().allowed).toBe(false);

      jest.advanceTimersByTime(60_000);

      const result = limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.retryAfterMs).toBe(0);
    });

    it("rejects calls within the throttle window and reports correct retryAfterMs", () => {
      const limiter = new ClientRateLimiter({
        limit: 10,
        windowMs: 60_000,
        throttleMs: 2_000,
      });

      limiter.check(); // accepted — starts throttle timer

      // Advance 500ms — still within throttle
      jest.advanceTimersByTime(500);

      const result = limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBe(1_500);
    });

    it("accepts calls after throttle window passes", () => {
      const limiter = new ClientRateLimiter({
        limit: 10,
        windowMs: 60_000,
        throttleMs: 2_000,
      });

      limiter.check();

      jest.advanceTimersByTime(2_000);

      const result = limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.retryAfterMs).toBe(0);
    });

    it("does not count throttled calls toward the window quota", () => {
      const limiter = new ClientRateLimiter({
        limit: 2,
        windowMs: 60_000,
        throttleMs: 1_000,
      });

      limiter.check(); // count=1, lastAllowedAt=0
      jest.advanceTimersByTime(100);

      // Throttled — not counted against the window quota
      expect(limiter.check().allowed).toBe(false);

      jest.advanceTimersByTime(2_000); // now 2100ms from start

      // Throttle has passed, still have 1 remaining slot
      const result = limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("reports correct retryAfterMs for throttle", () => {
      const limiter = new ClientRateLimiter({
        limit: 10,
        windowMs: 60_000,
        throttleMs: 5_000,
      });

      limiter.check();

      jest.advanceTimersByTime(2_000);

      const result = limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBe(3_000);
    });

    it("reports correct retryAfterMs for window exhaustion", () => {
      const limiter = new ClientRateLimiter({
        limit: 1,
        windowMs: 30_000,
        throttleMs: 0,
      });

      limiter.check(); // quota consumed

      jest.advanceTimersByTime(10_000);

      const result = limiter.check();

      expect(result.allowed).toBe(false);
      // 30_000 (windowStart + windowMs) - 10_000 (now) = 20_000
      expect(result.retryAfterMs).toBe(20_000);
    });

    it("resets count but preserves lastAllowedAt across window boundaries", () => {
      const limiter = new ClientRateLimiter({
        limit: 3,
        windowMs: 10_000,
        throttleMs: 3_000,
      });

      limiter.check(); // 1

      jest.advanceTimersByTime(2_000);

      // Throttle holds (2000 < 3000)
      expect(limiter.check().allowed).toBe(false);

      jest.advanceTimersByTime(1_000); // 3_000 from first — throttle clears

      limiter.check(); // 2 — accepted
      limiter.check(); // 3 — last accepted, window exhausted

      expect(limiter.check().allowed).toBe(false); // window exhausted

      jest.advanceTimersByTime(8_000); // 11_000 from start — window resets

      const result = limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe("guard()", () => {
    it("does not throw when the request is allowed", () => {
      const limiter = new ClientRateLimiter({
        limit: 5,
        windowMs: 60_000,
        throttleMs: 1_000,
      });

      expect(() => limiter.guard()).not.toThrow();
    });

    it("throws ClientRateLimitError when the window quota is exhausted", () => {
      const limiter = new ClientRateLimiter({
        limit: 1,
        windowMs: 60_000,
        throttleMs: 0,
      });

      limiter.guard(); // consumes the only slot

      expect(() => limiter.guard()).toThrow(ClientRateLimitError);
    });

    it("throws ClientRateLimitError when throttled", () => {
      const limiter = new ClientRateLimiter({
        limit: 10,
        windowMs: 60_000,
        throttleMs: 2_000,
      });

      limiter.guard();

      expect(() => limiter.guard()).toThrow(ClientRateLimitError);
    });

    it("ClientRateLimitError contains retryAfterMs and remaining", () => {
      const limiter = new ClientRateLimiter({
        limit: 1,
        windowMs: 60_000,
        throttleMs: 0,
      });

      limiter.guard();

      try {
        limiter.guard();
        fail("Expected guard() to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ClientRateLimitError);

        const rateLimitError = error as ClientRateLimitError;
        expect(rateLimitError.retryAfterMs).toBeGreaterThan(0);
        expect(rateLimitError.retryAfterMs).toBeLessThanOrEqual(60_000);
        expect(rateLimitError.remaining).toBe(0);
        expect(rateLimitError.message).toContain("Rate limited");
        expect(rateLimitError.name).toBe("ClientRateLimitError");
      }
    });

    it("ClientRateLimitError message contains approximate seconds", () => {
      const limiter = new ClientRateLimiter({
        limit: 1,
        windowMs: 15_000,
        throttleMs: 0,
      });

      limiter.guard();

      try {
        limiter.guard();
        fail("Expected guard() to throw");
      } catch (error) {
        const rateLimitError = error as ClientRateLimitError;
        expect(rateLimitError.message).toMatch(/Rate limited\. Try again in \d+s\./);
      }
    });
  });
});
