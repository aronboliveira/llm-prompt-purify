import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from "@angular/core";
import type { SafeHtml } from "@angular/platform-browser";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-scanner-toolbar",
  standalone: true,
  styleUrl: "./scanner-toolbar.component.scss",
  templateUrl: "./scanner-toolbar.component.html",
  encapsulation: ViewEncapsulation.None
})
export class ScannerToolbarComponent {
  readonly countrySummary = input.required<string>();
  readonly scopeDescription = input.required<string>();
  readonly settingsIcon = input.required<SafeHtml>();
  readonly warning = input<string | null>();
  readonly showWarning = input<boolean>(false);

  readonly countryModalRequested = output<void>();
  readonly settingsModalRequested = output<void>();

  protected openCountryModal(): void {
    this.countryModalRequested.emit();
  }

  protected openSettingsModal(): void {
    this.settingsModalRequested.emit();
  }
}
