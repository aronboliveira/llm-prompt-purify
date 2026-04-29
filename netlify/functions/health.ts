import type { Config, Context } from "@netlify/functions";
import { checkRateLimit, rateLimitResponse } from "./shared/rate-limiter.js";
import { SECURITY_HEADERS } from "./shared/security-headers.js";

// 30 health checks per minute per IP; no throttle (polling clients are expected).
const RATE_LIMIT = { limit: 30, windowMs: 60 * 1_000, throttleMs: 0 } as const;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin":
    process.env["ALLOWED_ORIGIN"] ?? "https://llm-prompt-purify.netlify.app",
};

const RESPONSE_HEADERS: Record<string, string> = {
  ...SECURITY_HEADERS,
  ...CORS_HEADERS,
};

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const rateLimit = checkRateLimit(request, RATE_LIMIT);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, RESPONSE_HEADERS);
  }

  return new Response(
    JSON.stringify({ status: "ok", service: "feedback-api" }),
    {
      status: 200,
      headers: { ...RESPONSE_HEADERS, "Content-Type": "application/json" },
    },
  );
}

export const config: Config = {
  path: "/api/health",
};
