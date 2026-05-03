import type { Config, Context } from "@netlify/functions";
import { VALIDATORS } from "./shared/identifier-validators.js";
import {
  corsHeaders,
  apiHeaders,
  json,
  preflight,
  rateLimit,
} from "./shared/response-helpers.js";
import type {
  MaskSafetyValidationItemRequest,
  MaskSafetyValidationItemResponse,
  MaskSafetyValidationRequest,
  MaskSafetyValidationResponse,
} from "./shared/types.js";

const FN = "mask-safety-validate";
const MAX_BATCH = 128;
const RATE_LIMIT = { limit: 60, windowMs: 60_000, throttleMs: 500 } as const;

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
  const headers = apiHeaders(corsHeaders());

  const preflightResponse = preflight(request, headers);
  if (preflightResponse) return preflightResponse;

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, headers);
  }

  const limited = rateLimit(FN, request, RATE_LIMIT, headers);
  if (limited) return limited;

  let body: MaskSafetyValidationRequest;
  try {
    body = (await request.json()) as MaskSafetyValidationRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  if (!Array.isArray(body.candidates)) {
    return json(
      { errors: { candidates: ["The candidates field must be an array."] } },
      422,
      headers,
    );
  }

  if (body.candidates.length > MAX_BATCH) {
    return json(
      {
        errors: {
          candidates: [
            `At most ${MAX_BATCH} validation candidates can be checked per request.`,
          ],
        },
      },
      422,
      headers,
    );
  }

  const results = body.candidates.slice(0, MAX_BATCH).map(evaluateCandidate);
  return json({ results } satisfies MaskSafetyValidationResponse, 200, headers);
}

export const config: Config = {
  path: "/api/mask-safety/validate",
  method: ["POST", "OPTIONS"],
};
