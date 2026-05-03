import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { validateFeedbackRequest } from "./shared/feedback-validator.js";
import {
  createFeedbackOutboxEntry,
  recordFeedbackEmailResult,
} from "./shared/feedback-outbox.js";
import { sendFeedbackEmail } from "./shared/feedback-mailer.js";
import { sanitize, sanitizeAndTrim } from "./shared/input-sanitizer.js";
import {
  corsHeaders,
  apiHeaders,
  json,
  preflight,
  rateLimit,
} from "./shared/response-helpers.js";
import { logFunctionEvent } from "./shared/logger.js";
import type {
  FeedbackEntry,
  FeedbackSubmissionRequest,
  FeedbackSubmissionResponse,
} from "./shared/types.js";

const FN = "feedback";
const RATE_LIMIT = { limit: 5, windowMs: 15 * 60_000, throttleMs: 8_000 } as const;

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

  let body: FeedbackSubmissionRequest;
  try {
    body = (await request.json()) as FeedbackSubmissionRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  const normalized: FeedbackSubmissionRequest = {
    category: (body.category ?? "").trim().toLowerCase(),
    email: body.email?.trim(),
    message: sanitizeAndTrim(body.message),
    name: sanitize(body.name?.trim()) ?? undefined,
    rating: body.rating,
    subject: sanitize(body.subject?.trim()) ?? undefined,
    wantsReply: !!body.wantsReply,
  };

  const errors = validateFeedbackRequest(normalized);
  if (Object.keys(errors).length > 0) {
    logFunctionEvent(FN, "validation_failed", "info", {
      fields: Object.keys(errors),
    });
    return json({ errors }, 422, headers);
  }

  const now = new Date().toISOString();
  const entry: FeedbackEntry = {
    id: randomUUID(),
    category: normalized.category,
    email: normalized.email?.trim() || null,
    message: normalized.message,
    name: normalized.name?.trim() || null,
    rating: normalized.rating ?? null,
    source: "web-app",
    subject: normalized.subject?.trim() || null,
    wantsReply: normalized.wantsReply,
    createdAtUtc: now,
    deliveryStatus: "queued",
    deliveryError: null,
  };

  const outbox = await createFeedbackOutboxEntry(entry);
  const dispatch = await sendFeedbackEmail(entry);
  if (outbox.status === "stored") {
    await recordFeedbackEmailResult(entry, dispatch);
  }

  entry.deliveryStatus =
    dispatch.status === "emailed"
      ? "emailed"
      : outbox.status === "stored"
        ? "queued"
        : "not-delivered";
  entry.deliveryError = dispatch.error;

  logFunctionEvent(
    FN,
    "submission_processed",
    dispatch.status === "failed" && outbox.status === "failed" ? "error" : "info",
    {
      feedbackId: entry.id,
      category: entry.category,
      outboxStatus: outbox.status,
      smtpStatus: dispatch.status,
      deliveryStatus: entry.deliveryStatus,
      outboxError: outbox.error,
      smtpError: dispatch.error,
    },
  );

  const response: FeedbackSubmissionResponse = {
    createdAtUtc: entry.createdAtUtc,
    deliveryStatus: entry.deliveryStatus,
    id: entry.id,
    message:
      entry.deliveryStatus === "emailed"
        ? outbox.status === "stored"
          ? "Feedback saved and emailed to the developers."
          : "Feedback emailed to the developers."
        : entry.deliveryStatus === "queued"
          ? "Feedback saved to the outbox and queued for email retry."
          : "Feedback validated, but no durable outbox or email delivery is configured.",
  };

  return json(response, 201, headers);
}

export const config: Config = {
  path: "/api/feedback",
  method: ["POST", "OPTIONS"],
};
