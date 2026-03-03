import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";

import type { CountryProfileId, CountryProfileSummary } from "../../../../core/masking/declarations/masking.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-country-scope-modal",
  standalone: true,
  styleUrl: "./country-scope-modal.component.scss",
  templateUrl: "./country-scope-modal.component.html",
})
export class CountryScopeModalComponent {
  readonly countryProfiles = input<readonly CountryProfileSummary[]>([]);
  readonly isOpen = input(false);
  readonly mixedLanguageWarning = input(false);
  readonly selectedLanguageSummary = input("");
  readonly closed = output<void>();
  readonly countryToggled = output<{ countryProfileId: CountryProfileId; selected: boolean }>();
  readonly helpRequested = output<void>();

  protected readonly selectedCount = computed(() => {
    return this.countryProfiles().filter(countryProfile => countryProfile.selected).length;
  });

  protected close(): void {
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  protected onCountryToggle(countryProfileId: CountryProfileId, event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.countryToggled.emit({
      countryProfileId,
      selected: inputElement.checked,
    });
  }

  protected openHelp(): void {
    this.helpRequested.emit();
  }
}
