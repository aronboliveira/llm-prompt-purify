import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  ClientRateLimiter,
} from "@core/utils/client-rate-limiter";
import type {
  FeedbackSubmissionRequest,
  FeedbackSubmissionResponse,
} from "./declarations/feedback.types";

// Mirrors the server-side limit: 5 per 15 min, minimum 8 s between calls.
const LIMITER = new ClientRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1_000,
  throttleMs: 8_000,
});

@Injectable({ providedIn: "root" })
export class FeedbackApiService {
  readonly #http = inject(HttpClient);

  /**
   * Submits feedback.
   * Throws ClientRateLimitError if the client-side pre-flight check fails.
   * Propagates HttpErrorResponse (including 429) on server rejection.
   */
  public submit(
    request: FeedbackSubmissionRequest,
  ): Promise<FeedbackSubmissionResponse> {
    LIMITER.guard();
    return firstValueFrom(
      this.#http.post<FeedbackSubmissionResponse>("/api/feedback", request),
    );
  }
}
