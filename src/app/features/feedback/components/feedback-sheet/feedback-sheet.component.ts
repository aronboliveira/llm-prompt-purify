import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

import {
  DEFAULT_FEEDBACK_DRAFT,
  EMAIL_PATTERN,
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_RATING_OPTIONS,
} from "@core/feedback/constants/feedback.constants";
import type {
  FeedbackDraft,
  FeedbackFieldErrorMap,
  FeedbackFieldId,
  FeedbackSubmissionRequest,
} from "@core/feedback/declarations/feedback.types";
import { FeedbackApiService } from "@core/feedback/feedback-api.service";
import { ToastCenterService } from "@core/feedback/toast-center.service";
import {
  isFeedbackCategoryId,
  isFeedbackFieldId,
} from "@core/feedback/utils/feedback.utils";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  selector: "app-feedback-sheet",
  standalone: true,
  templateUrl: "./feedback-sheet.component.html",
})
export class FeedbackSheetComponent {
  readonly #feedbackApi = inject(FeedbackApiService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #toastCenter = inject(ToastCenterService);
  readonly #draft = signal<FeedbackDraft>(DEFAULT_FEEDBACK_DRAFT);
  readonly #fieldErrors = signal<FeedbackFieldErrorMap>({});
  readonly #isOpen = signal(false);
  readonly #isSubmitting = signal(false);

  protected readonly categoryOptions = FEEDBACK_CATEGORY_OPTIONS;
  protected readonly categoryHelper = computed(() => {
    return (
      this.categoryOptions.find(option => option.id === this.#draft().category)
        ?.helper ?? ""
    );
  });
  protected readonly draft = this.#draft.asReadonly();
  protected readonly fieldErrors = this.#fieldErrors.asReadonly();
  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );
  protected readonly isAppraisal = computed(
    () => this.#draft().category === "appraisal",
  );
  protected readonly isOpen = this.#isOpen.asReadonly();
  protected readonly isSubmitting = this.#isSubmitting.asReadonly();
  protected readonly maxMessageLength = FEEDBACK_MESSAGE_MAX;
  protected readonly needsEmail = computed(() => {
    const draft = this.#draft();
    return draft.wantsReply || draft.category === "contact-developers";
  });
  protected readonly needsSubject = computed(() => {
    return this.#draft().category === "contact-developers";
  });
  protected readonly ratingOptions = FEEDBACK_RATING_OPTIONS;
  protected readonly remainingCharacters = computed(() => {
    return FEEDBACK_MESSAGE_MAX - this.#draft().message.length;
  });

  protected close(): void {
    this.#isOpen.set(false);
    this.#fieldErrors.set({});
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.#isSubmitting())
      this.close();
  }

  protected open(): void {
    this.#isOpen.set(true);
  }

  protected setCategory(value: string): void {
    if (!isFeedbackCategoryId(value)) return;

    this.#draft.update(draft => ({
      ...draft,
      category: value,
      rating: value === "appraisal" ? draft.rating : null,
    }));
    this.#clearFieldError("category");
    if (value !== "contact-developers") this.#clearFieldError("subject");
    if (value !== "appraisal") this.#clearFieldError("rating");
  }

  protected setRating(value: number): void {
    this.#draft.update(draft => ({ ...draft, rating: value }));
    this.#clearFieldError("rating");
  }

  protected async submit(): Promise<void> {
    const fieldErrors = this.#validateDraft();
    if (Object.keys(fieldErrors).length) {
      this.#fieldErrors.set(fieldErrors);
      this.#toastCenter.push(
        "Some feedback fields still need attention before the note can be sent.",
        "Check the feedback form",
        "error",
      );
      return;
    }

    this.#fieldErrors.set({});
    this.#isSubmitting.set(true);

    try {
      const response = await this.#feedbackApi.submit(
        this.#toRequest(this.#draft()),
      );
      this.#toastCenter.push(
        response.deliveryStatus === "emailed"
          ? "The note was stored and forwarded to the developers."
          : "The note was stored, but email forwarding is not configured in this environment.",
        response.deliveryStatus === "emailed"
          ? "Feedback sent"
          : "Feedback stored",
        response.deliveryStatus === "emailed" ? "success" : "info",
      );
      this.#draft.set(DEFAULT_FEEDBACK_DRAFT);
      this.close();
    } catch (error) {
      if (
        error instanceof HttpErrorResponse &&
        this.#hasValidationErrors(error.error)
      ) {
        this.#fieldErrors.set(this.#mapServerErrors(error.error.errors));
        this.#toastCenter.push(
          "The backend rejected this submission because one or more fields are incomplete.",
          "Fix the feedback form",
          "error",
        );
      } else {
        this.#toastCenter.push(
          "The feedback endpoint could not be reached. Start the backend container and try again.",
          "Feedback failed",
          "error",
        );
      }
    } finally {
      this.#isSubmitting.set(false);
    }
  }

  protected toggleReply(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.#draft.update(draft => ({
      ...draft,
      wantsReply: inputElement.checked,
    }));
    if (
      !inputElement.checked &&
      this.#draft().category !== "contact-developers"
    )
      this.#clearFieldError("email");
  }

  protected updateTextField(
    field: "email" | "message" | "name" | "subject",
    value: string,
  ): void {
    this.#draft.update(draft => ({ ...draft, [field]: value }));
    this.#clearFieldError(field);
  }

  #clearFieldError(field: FeedbackFieldId): void {
    this.#fieldErrors.update(errors => {
      if (!errors[field]) return errors;

      const nextErrors = { ...errors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  #hasValidationErrors(
    errorBody: unknown,
  ): errorBody is { errors: Record<string, readonly string[]> } {
    if (!errorBody || typeof errorBody !== "object") return false;

    return (
      "errors" in errorBody &&
      !!(errorBody as { errors?: unknown }).errors &&
      typeof (errorBody as { errors?: unknown }).errors === "object"
    );
  }

  #mapServerErrors(
    errors: Record<string, readonly string[]>,
  ): FeedbackFieldErrorMap {
    return Object.entries(errors).reduce<FeedbackFieldErrorMap>(
      (carry, [field, messages]) => {
        const firstMessage = messages[0];
        if (!firstMessage || !isFeedbackFieldId(field)) return carry;

        carry[field] = firstMessage;
        return carry;
      },
      {},
    );
  }

  #toRequest(draft: FeedbackDraft): FeedbackSubmissionRequest {
    return {
      category: draft.category,
      email: draft.email.trim() || null,
      message: draft.message.trim(),
      name: draft.name.trim() || null,
      rating: draft.rating,
      subject: draft.subject.trim() || null,
      wantsReply: draft.wantsReply,
    };
  }

  #validateDraft(): FeedbackFieldErrorMap {
    const draft = this.#draft(),
      errors: FeedbackFieldErrorMap = {};

    if (!draft.message.trim())
      errors.message = "Write a short note before submitting feedback.";
    else if (draft.message.length > FEEDBACK_MESSAGE_MAX)
      errors.message = `Keep the note under ${FEEDBACK_MESSAGE_MAX} characters.`;

    if (draft.name.trim().length > 80)
      errors.name = "Keep the name under 80 characters.";

    if (draft.subject.trim().length > 160)
      errors.subject = "Keep the subject under 160 characters.";

    if (this.needsEmail()) {
      if (!draft.email.trim())
        errors.email =
          "Add an email address if you want the developers to reply.";
      else if (!EMAIL_PATTERN.test(draft.email.trim()))
        errors.email = "Use a valid email address.";
    } else if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim())) {
      errors.email = "Use a valid email address.";
    }

    if (this.needsSubject() && !draft.subject.trim())
      errors.subject = "Add a subject for direct developer messages.";

    if (this.isAppraisal() && draft.rating === null)
      errors.rating = "Choose a rating from 1 to 5.";

    return errors;
  }
}
