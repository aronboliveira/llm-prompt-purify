import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  ClientRateLimiter,
} from "@core/utils/client-rate-limiter";
import type {
  MaskSafetyClient,
  MaskSafetyValidationRequest,
  MaskSafetyValidationResponse,
} from "./declarations/mask-safety.types";

// Mirrors the server-side limit: 60 per minute, minimum 500 ms between calls.
const LIMITER = new ClientRateLimiter({
  limit: 60,
  windowMs: 60 * 1_000,
  throttleMs: 500,
});

@Injectable({ providedIn: "root" })
export class MaskSafetyApiService implements MaskSafetyClient {
  readonly #http = inject(HttpClient);

  /**
   * Validates mask candidates against the safety API.
   * Throws ClientRateLimitError if the client-side pre-flight check fails.
   * Propagates HttpErrorResponse (including 429) on server rejection.
   * MaskSafetyHardeningService already catches and falls back on any error.
   */
  public validate(
    request: MaskSafetyValidationRequest,
  ): Promise<MaskSafetyValidationResponse> {
    LIMITER.guard();
    return firstValueFrom(
      this.#http.post<MaskSafetyValidationResponse>(
        "/api/mask-safety/validate",
        request,
      ),
    );
  }
}
