export interface FeedbackSubmissionRequest {
  category: string;
  email?: string;
  message: string;
  name?: string;
  rating?: number;
  subject?: string;
  wantsReply: boolean;
}

export interface FeedbackSubmissionResponse {
  createdAtUtc: string;
  deliveryStatus: FeedbackDeliveryStatus;
  id: string;
  message: string;
}

export type FeedbackDeliveryStatus = "emailed" | "not-delivered" | "queued";

export interface FeedbackEntry {
  id: string;
  category: string;
  email: string | null;
  message: string;
  name: string | null;
  rating: number | null;
  source: string;
  subject: string | null;
  wantsReply: boolean;
  createdAtUtc: string;
  deliveryStatus: FeedbackDeliveryStatus;
  deliveryError: string | null;
}

export interface MaskSafetyValidationItemRequest {
  candidateValue: string;
  ruleId: string;
}

export interface MaskSafetyValidationRequest {
  candidates: MaskSafetyValidationItemRequest[];
}

export interface MaskSafetyValidationItemResponse {
  candidateValue: string;
  decision: string;
  isCompromising: boolean;
  isSupported: boolean;
  message: string;
  ruleId: string;
}

export interface MaskSafetyValidationResponse {
  results: MaskSafetyValidationItemResponse[];
}

export interface ValidationErrors {
  [field: string]: string[];
}
