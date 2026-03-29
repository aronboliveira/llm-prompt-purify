import type {
  FeedbackCategoryId,
  FeedbackCategoryOption,
  FeedbackDraft,
} from "../declarations/feedback.types";
import { deepFreeze } from "@shared/utils/deep-freeze.utils";

export const EMAIL_PATTERN = Object.freeze(/^[^\s@]+@[^\s@]+\.[^\s@]+$/u);

export const FEEDBACK_MESSAGE_MAX = 4000;

export const FEEDBACK_CATEGORY_OPTIONS: readonly FeedbackCategoryOption[] =
  deepFreeze([
    {
      helper: "Broad product or workflow comments.",
      id: "general-feedback",
      label: "General feedback",
    },
    {
      helper: "Rate the current experience from 1 to 5.",
      id: "appraisal",
      label: "Appraisal",
    },
    {
      helper: "Call out broken or misleading behavior.",
      id: "bug-report",
      label: "Bug report",
    },
    {
      helper: "Send a direct note to the maintainers.",
      id: "contact-developers",
      label: "Contact developers",
    },
  ]);

export const FEEDBACK_CATEGORY_IDS: readonly FeedbackCategoryId[] =
  Object.freeze(FEEDBACK_CATEGORY_OPTIONS.map(option => option.id));

export const FEEDBACK_RATING_OPTIONS: readonly number[] = Object.freeze([
  1, 2, 3, 4, 5,
]);

export const DEFAULT_FEEDBACK_DRAFT: FeedbackDraft = deepFreeze({
  category: "general-feedback",
  email: "",
  message: "",
  name: "",
  rating: null,
  subject: "",
  wantsReply: false,
});
