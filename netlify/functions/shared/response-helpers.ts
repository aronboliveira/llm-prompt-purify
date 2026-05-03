import { logFunctionEvent } from "./logger.js";
import type { RateLimitOptions } from "./rate-limiter.js";
import { checkRateLimit, rateLimitResponse } from "./rate-limiter.js";
import { SECURITY_HEADERS } from "./security-headers.js";

const ALLOWED_ORIGIN =
  process.env["ALLOWED_ORIGIN"] ?? "https://llm-prompt-purify.netlify.app";

export function corsHeaders(
  methods = "POST, OPTIONS",
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function apiHeaders(
  cors: Record<string, string> = {},
): Record<string, string> {
  return { ...SECURITY_HEADERS, ...cors };
}

export function json(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...extraHeaders, "Content-Type": "application/json" },
  });
}

export function preflight(
  request: Request,
  headers: Record<string, string>,
): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  return null;
}

export function rateLimit(
  fn: string,
  request: Request,
  options: RateLimitOptions,
  headers: Record<string, string>,
): Response | null {
  const result = checkRateLimit(request, options);
  if (result.allowed) return null;

  logFunctionEvent(fn, "rate_limited", "warn", {
    ip: result.ip,
    retryAfter: result.retryAfter,
  });
  return rateLimitResponse(result, headers);
}
