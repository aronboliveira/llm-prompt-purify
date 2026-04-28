import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  type ApplicationConfig,
  ErrorHandler,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { GlobalErrorHandler } from "./core/error/global-error.handler";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
