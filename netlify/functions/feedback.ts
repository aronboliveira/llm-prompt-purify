import type { Config, Context } from "@netlify/functions";
import * as nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { validateFeedbackRequest } from "./shared/feedback-validator.js";
import { sanitize, sanitizeAndTrim } from "./shared/input-sanitizer.js";
import type {
  FeedbackEntry,
  FeedbackSubmissionRequest,
  FeedbackSubmissionResponse,
} from "./shared/types.js";

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

function buildSubject(entry: FeedbackEntry): string {
  const prefix = `[${entry.category}]`;
  return entry.subject
    ? `${prefix} ${entry.subject}`
    : `${prefix} New LLM Prompt Purify feedback`;
}

function buildBody(entry: FeedbackEntry): string {
  return [
    "A new feedback submission was received from the LLM Prompt Purify web app.",
    "",
    `Submission ID: ${entry.id}`,
    `Category: ${entry.category}`,
    `Rating: ${entry.rating ?? "none"}`,
    `Wants reply: ${entry.wantsReply}`,
    `Name: ${entry.name ?? "anonymous"}`,
    `Email: ${entry.email ?? "not provided"}`,
    `Subject: ${entry.subject ?? "none"}`,
    `Submitted at (UTC): ${entry.createdAtUtc}`,
    "",
    "Message:",
    entry.message,
  ].join("\n");
}

async function sendEmail(
  entry: FeedbackEntry
): Promise<{ status: "emailed" | "stored-only"; error: string | null }> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  const recipient = process.env.DEVELOPER_EMAIL_TO;
  const sender = process.env.SMTP_SENDER_EMAIL || user;

  if (!host || !user || !pass || !recipient) {
    return {
      status: "stored-only",
      error: "SMTP is not configured for developer email delivery.",
    };
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: sender,
    to: recipient,
    subject: buildSubject(entry),
    text: buildBody(entry),
    ...(entry.email ? { replyTo: entry.email } : {}),
  };

  try {
    await transport.sendMail(mailOptions);
    return { status: "emailed", error: null };
  } catch (err) {
    return {
      status: "stored-only",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function handler(
  request: Request,
  _context: Context
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
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
    deliveryStatus: "stored-only",
    deliveryError: null,
  };

  const dispatch = await sendEmail(entry);
  entry.deliveryStatus = dispatch.status;
  entry.deliveryError = dispatch.error;

  const response: FeedbackSubmissionResponse = {
    createdAtUtc: entry.createdAtUtc,
    deliveryStatus: entry.deliveryStatus,
    id: entry.id,
    message:
      entry.deliveryStatus === "emailed"
        ? "Feedback saved and emailed to the developers."
        : "Feedback saved, but the developer email could not be delivered from this environment.",
  };

  return jsonResponse(response, 201);
}

export const config: Config = {
  path: "/api/feedback",
  method: ["POST", "OPTIONS"],
};
