import type { Config, Context } from "@netlify/functions";
import { corsHeaders, apiHeaders, json, rateLimit } from "./shared/response-helpers.js";

const FN = "health";
const RATE_LIMIT = { limit: 30, windowMs: 60_000, throttleMs: 0 } as const;

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const headers = apiHeaders(corsHeaders("GET"));
  const limited = rateLimit(FN, request, RATE_LIMIT, headers);
  if (limited) return limited;

  return json({ status: "ok", service: "feedback-api" }, 200, headers);
}

export const config: Config = {
  path: "/api/health",
};
