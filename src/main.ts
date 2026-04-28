import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import {
  showGlobalErrorOverlay,
} from "./app/core/error/global-error-overlay";
import {
  installGlobalErrorListeners,
} from "./app/core/error/install-window-listeners";

installGlobalErrorListeners();

bootstrapApplication(AppComponent, appConfig).catch(error =>
  showGlobalErrorOverlay("Application failed to start", error),
);
