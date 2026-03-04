import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import type {
  MaskSafetyClient,
  MaskSafetyValidationRequest,
  MaskSafetyValidationResponse,
} from "./declarations/mask-safety.types";

@Injectable({ providedIn: "root" })
export class MaskSafetyApiService implements MaskSafetyClient {
  readonly #http = inject(HttpClient);

  public validate(
    request: MaskSafetyValidationRequest
  ): Promise<MaskSafetyValidationResponse> {
    return firstValueFrom(
      this.#http.post<MaskSafetyValidationResponse>("/api/mask-safety/validate", request)
    );
  }
}
