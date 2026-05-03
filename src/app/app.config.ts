import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  type ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideServiceWorker } from "@angular/service-worker";
import { GlobalErrorHandler } from "./core/error/global-error.handler";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
};
