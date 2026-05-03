import type { Config, Context } from "@netlify/functions";
import { retryPendingFeedbackEmails } from "./shared/feedback-outbox.js";
import { sendFeedbackEmail } from "./shared/feedback-mailer.js";
import { logFunctionEvent } from "./shared/logger.js";
import { SECURITY_HEADERS } from "./shared/security-headers.js";

const FN = "feedback-retry";
const AUTH_HEADER = "x-feedback-retry-secret";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" },
  });
}

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
    return jsonResponse({ error: "Retry endpoint is not configured." }, 503);
  }

  const provided = request.headers.get(AUTH_HEADER);
  if (!isScheduledInvocation(request) && provided !== expected) {
    logFunctionEvent(FN, "auth_rejected", "warn", {
      hasHeader: provided !== null,
    });
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const result = await retryPendingFeedbackEmails(sendFeedbackEmail);
  logFunctionEvent(FN, "batch_completed", "info", result);
  return jsonResponse(result, 200);
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
