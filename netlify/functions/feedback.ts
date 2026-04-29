import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { validateFeedbackRequest } from "./shared/feedback-validator.js";
import {
  createFeedbackOutboxEntry,
  recordFeedbackEmailResult,
} from "./shared/feedback-outbox.js";
import { sendFeedbackEmail } from "./shared/feedback-mailer.js";
import { sanitize, sanitizeAndTrim } from "./shared/input-sanitizer.js";
import { checkRateLimit, rateLimitResponse } from "./shared/rate-limiter.js";
import type {
  FeedbackEntry,
  FeedbackSubmissionRequest,
  FeedbackSubmissionResponse,
} from "./shared/types.js";

// 5 submissions per 15 minutes per IP; minimum 8 s gap between calls.
const RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1_000, throttleMs: 8_000 } as const;

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

  let body: FeedbackSubmissionRequest;
  try {
    body = (await request.json()) as FeedbackSubmissionRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
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
    return jsonResponse({ errors }, 422);
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

  const outbox = await createFeedbackOutboxEntry(entry),
    dispatch = await sendFeedbackEmail(entry);
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

  return jsonResponse(response, 201);
}

export const config: Config = {
  path: "/api/feedback",
  method: ["POST", "OPTIONS"],
};
