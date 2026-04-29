export type FeedbackCategoryId =
  | "appraisal"
  | "bug-report"
  | "contact-developers"
  | "general-feedback";

export type FeedbackDeliveryStatus = "emailed" | "not-delivered" | "queued";

export type FeedbackFieldId =
  | "category"
  | "email"
  | "message"
  | "name"
  | "rating"
  | "subject";

export type FeedbackFieldErrorMap = Partial<Record<FeedbackFieldId, string>>;

export interface FeedbackCategoryOption {
  helper: string;
  id: FeedbackCategoryId;
  label: string;
}

export interface FeedbackDraft {
  category: FeedbackCategoryId;
  email: string;
  message: string;
  name: string;
  rating: number | null;
  subject: string;
  wantsReply: boolean;
}

export interface FeedbackSubmissionRequest {
  category: FeedbackCategoryId;
  email: string | null;
  message: string;
  name: string | null;
  rating: number | null;
  subject: string | null;
  wantsReply: boolean;
}

export interface FeedbackSubmissionResponse {
  createdAtUtc: string;
  deliveryStatus: FeedbackDeliveryStatus;
  id: string;
  message: string;
}
