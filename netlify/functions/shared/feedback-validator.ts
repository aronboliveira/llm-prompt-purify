import type {
  FeedbackSubmissionRequest,
  ValidationErrors,
} from "./types.js";

const KNOWN_CATEGORIES = new Set([
  "general-feedback",
  "appraisal",
  "bug-report",
  "contact-developers",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFeedbackRequest(
  request: FeedbackSubmissionRequest
): ValidationErrors {
  const errors: Record<string, string[]> = {};

  const addError = (key: string, message: string) => {
    (errors[key] ??= []).push(message);
  };

  const category = request.category?.trim().toLowerCase() ?? "";
  if (!category) {
    addError("category", "Choose the kind of feedback you want to send.");
  } else if (!KNOWN_CATEGORIES.has(category)) {
    addError("category", "The selected feedback category is not supported.");
  }

  if (!request.message?.trim()) {
    addError("message", "Write a short message before submitting feedback.");
  } else if (request.message.length > 4000) {
    addError("message", "Keep the message under 4000 characters.");
  }

  if (request.name && request.name.length > 80) {
    addError("name", "Keep the name under 80 characters.");
  }

  if (request.subject && request.subject.length > 160) {
    addError("subject", "Keep the subject under 160 characters.");
  }

  if (
    request.rating !== undefined &&
    request.rating !== null &&
    (request.rating < 1 || request.rating > 5)
  ) {
    addError("rating", "Ratings must be between 1 and 5.");
  }

  if (category === "appraisal" && request.rating == null) {
    addError("rating", "Appraisals need a 1 to 5 rating.");
  }

  const emailRequired =
    request.wantsReply || category === "contact-developers";

  if (emailRequired && !request.email?.trim()) {
    addError(
      "email",
      "Add an email address when you want the developers to reply."
    );
  } else if (request.email?.trim() && !EMAIL_RE.test(request.email.trim())) {
    addError("email", "Use a valid email address.");
  }

  if (category === "contact-developers" && !request.subject?.trim()) {
    addError(
      "subject",
      "Add a subject for messages directed to the developers."
    );
  }

  return errors;
}
