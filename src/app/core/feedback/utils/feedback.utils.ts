/**
 * Utility functions for feedback feature
 */
import type {
  FeedbackCategoryId,
  FeedbackFieldId,
} from "../declarations/feedback.types";
import { FEEDBACK_CATEGORY_IDS } from "../constants/feedback.constants";

const FEEDBACK_FIELD_IDS: readonly string[] = Object.freeze([
  "category",
  "email",
  "message",
  "name",
  "rating",
  "subject",
]);

/**
 * Type guard to check if a value is a valid FeedbackCategoryId
 */
export function isFeedbackCategoryId(
  value: string,
): value is FeedbackCategoryId {
  return FEEDBACK_CATEGORY_IDS.includes(value as FeedbackCategoryId);
}

/**
 * Type guard to check if a value is a valid FeedbackFieldId
 */
export function isFeedbackFieldId(value: string): value is FeedbackFieldId {
  return FEEDBACK_FIELD_IDS.includes(value);
}
