import type { Config, Context } from "@netlify/functions";
import { VALIDATORS } from "./shared/identifier-validators.js";
import { checkRateLimit, rateLimitResponse } from "./shared/rate-limiter.js";
import type {
  MaskSafetyValidationItemRequest,
  MaskSafetyValidationItemResponse,
  MaskSafetyValidationRequest,
  MaskSafetyValidationResponse,
} from "./shared/types.js";

const MAX_BATCH = 128;

// 60 validations per minute per IP; minimum 500 ms gap (called in retry loops).
const RATE_LIMIT = { limit: 60, windowMs: 60 * 1_000, throttleMs: 500 } as const;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin":
    process.env.ALLOWED_ORIGIN ?? "https://llm-prompt-purify.netlify.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function evaluateCandidate(
  candidate: MaskSafetyValidationItemRequest,
): MaskSafetyValidationItemResponse {
  const candidateValue = candidate.candidateValue?.trim() ?? "";
  const ruleId = candidate.ruleId?.trim() ?? "";

  if (!ruleId || !candidateValue) {
    return {
      candidateValue: candidate.candidateValue,
      decision: "unsupported",
      isCompromising: false,
      isSupported: false,
      message:
        "The candidate could not be validated because the rule id or candidate value is empty.",
      ruleId: candidate.ruleId,
    };
  }

  const validator = VALIDATORS[ruleId];
  if (!validator) {
    return {
      candidateValue,
      decision: "unsupported",
      isCompromising: false,
      isSupported: false,
      message:
        "This rule does not have an API-backed compromising-identifier validator yet.",
      ruleId,
    };
  }

  const isCompromising = validator(candidateValue);
  return {
    candidateValue,
    decision: isCompromising ? "compromising" : "safe",
    isCompromising,
    isSupported: true,
    message: isCompromising
      ? "The candidate still passes the target identifier validation and should be regenerated."
      : "The candidate no longer passes the target identifier validation.",
    ruleId,
  };
}

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const rateLimit = checkRateLimit(request, RATE_LIMIT);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, CORS_HEADERS);
  }

  let body: MaskSafetyValidationRequest;
  try {
    body = (await request.json()) as MaskSafetyValidationRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!Array.isArray(body.candidates)) {
    return jsonResponse(
      {
        errors: {
          candidates: ["The candidates field must be an array."],
        },
      },
      422,
    );
  }

  if (body.candidates.length > MAX_BATCH) {
    return jsonResponse(
      {
        errors: {
          candidates: [
            `At most ${MAX_BATCH} validation candidates can be checked per request.`,
          ],
        },
      },
      422,
    );
  }

  const results = body.candidates.slice(0, MAX_BATCH).map(evaluateCandidate);
  const response: MaskSafetyValidationResponse = { results };
  return jsonResponse(response, 200);
}

export const config: Config = {
  path: "/api/mask-safety/validate",
  method: ["POST", "OPTIONS"],
};
