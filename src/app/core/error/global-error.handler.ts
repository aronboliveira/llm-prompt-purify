import { isPlatformBrowser } from "@angular/common";
import { type ErrorHandler, Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { showGlobalErrorOverlay } from "./global-error-overlay";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  readonly #isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.#isBrowser = isPlatformBrowser(platformId);
  }

  handleError(error: unknown): void {
    if (this.#isBrowser) {
      showGlobalErrorOverlay("Application error", error);
    }
  }
}
