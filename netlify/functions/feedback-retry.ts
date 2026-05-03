import type { Config, Context } from "@netlify/functions";
import { retryPendingFeedbackEmails } from "./shared/feedback-outbox.js";
import { sendFeedbackEmail } from "./shared/feedback-mailer.js";
import { logFunctionEvent } from "./shared/logger.js";
import { apiHeaders, json, rateLimit } from "./shared/response-helpers.js";

const FN = "feedback-retry";
const AUTH_HEADER = "x-feedback-retry-secret";
const RATE_LIMIT = { limit: 10, windowMs: 60_000, throttleMs: 2_000 } as const;
const HEADERS = apiHeaders();

function isScheduledInvocation(request: Request): boolean {
  return request.headers.get("x-netlify-event") === "schedule";
}

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const expected = process.env["FEEDBACK_RETRY_SECRET"];
  if (!expected) {
    logFunctionEvent(FN, "config_missing", "error", {
      message: "FEEDBACK_RETRY_SECRET is not configured.",
    });
    return json({ error: "Retry endpoint is not configured." }, 503, HEADERS);
  }

  const provided = request.headers.get(AUTH_HEADER);
  if (!isScheduledInvocation(request) && provided !== expected) {
    logFunctionEvent(FN, "auth_rejected", "warn", {
      hasHeader: provided !== null,
    });
    return json({ error: "Unauthorized" }, 401, HEADERS);
  }

  const limited = rateLimit(FN, request, RATE_LIMIT, HEADERS);
  if (limited) return limited;

  const result = await retryPendingFeedbackEmails(sendFeedbackEmail);
  logFunctionEvent(FN, "batch_completed", "info", result);
  return json(result, 200, HEADERS);
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
