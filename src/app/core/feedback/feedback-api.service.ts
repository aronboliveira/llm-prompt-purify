import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import type {
  FeedbackSubmissionRequest,
  FeedbackSubmissionResponse,
} from "./declarations/feedback.types";

@Injectable({ providedIn: "root" })
export class FeedbackApiService {
  readonly #http = inject(HttpClient);

  public submit(
    request: FeedbackSubmissionRequest
  ): Promise<FeedbackSubmissionResponse> {
    return firstValueFrom(
      this.#http.post<FeedbackSubmissionResponse>("/api/feedback", request)
    );
  }
}
