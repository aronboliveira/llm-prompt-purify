import type { Config, Context } from "@netlify/functions";
import { retryPendingFeedbackEmails } from "./shared/feedback-outbox.js";
import { sendFeedbackEmail } from "./shared/feedback-mailer.js";

export default async function handler(
  _request: Request,
  _context: Context,
): Promise<Response> {
  const result = await retryPendingFeedbackEmails(sendFeedbackEmail);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
