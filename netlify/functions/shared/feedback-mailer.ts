import * as nodemailer from "nodemailer";
import { logFunctionEvent } from "./logger.js";
import type { FeedbackEntry } from "./types.js";

const FN = "feedback-mailer";

export interface FeedbackEmailDispatchResult {
  readonly status: "emailed" | "failed";
  readonly error: string | null;
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

export async function sendFeedbackEmail(
  entry: FeedbackEntry,
): Promise<FeedbackEmailDispatchResult> {
  const host = process.env.SMTP_HOST,
    port = parseInt(process.env.SMTP_PORT ?? "587", 10),
    user = process.env.SMTP_USERNAME,
    pass = process.env.SMTP_PASSWORD,
    recipient = process.env.DEVELOPER_EMAIL_TO,
    sender = process.env.SMTP_SENDER_EMAIL || user;

  if (!host || !user || !pass || !recipient) {
    logFunctionEvent(FN, "smtp_not_configured", "warn", {
      feedbackId: entry.id,
    });
    return {
      status: "failed",
      error: "SMTP is not configured for developer email delivery.",
    };
  }

  const transport = nodemailer.createTransport({
      auth: { pass, user },
      host,
      port,
      secure: port === 465,
    }),
    mailOptions: nodemailer.SendMailOptions = {
      from: sender,
      subject: buildSubject(entry),
      text: buildBody(entry),
      to: recipient,
      ...(entry.email ? { replyTo: entry.email } : {}),
    };

  try {
    await transport.sendMail(mailOptions);
    logFunctionEvent(FN, "smtp_sent", "info", { feedbackId: entry.id });
    return { status: "emailed", error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logFunctionEvent(FN, "smtp_failed", "error", {
      feedbackId: entry.id,
      error: message,
    });
    return {
      status: "failed",
      error: message,
    };
  }
}
