import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import type { DetectionMode } from "@core/masking/declarations/masking.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-masking-settings-modal",
  standalone: true,
  styleUrl: "./masking-settings-modal.component.scss",
  templateUrl: "./masking-settings-modal.component.html",
})
export class MaskingSettingsModalComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly detectionMode = input<DetectionMode>("selected-plus-global");
  readonly isOpen = input(false);
  readonly closed = output<void>();
  readonly detectionModeChanged = output<DetectionMode>();
  readonly helpRequested = output<void>();

  protected readonly icons = createTrustedHtmlMap(this.#sanitizer, MATERIAL_ICONS);

  protected close(): void {
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  protected onGlobalOnlyChange(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.detectionModeChanged.emit(
      inputElement.checked ? "global-only" : "selected-plus-global"
    );
  }

  protected openHelp(): void {
    this.helpRequested.emit();
  }
}
