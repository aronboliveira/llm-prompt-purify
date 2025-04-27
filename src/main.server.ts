import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { config } from "./app/app.config.server";
import { importProvidersFrom } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialogModule } from "@angular/material/dialog";
import { A11yModule } from "@angular/cdk/a11y";

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      importProvidersFrom(
        BrowserModule,
        BrowserAnimationsModule,
        MatDialogModule,
        A11yModule
      ),
    ],
  });

export default bootstrap;
