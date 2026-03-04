import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer } from "@angular/platform-browser";

import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";
import type { HelpTopic } from "../../declarations/help-topic.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-help-modal",
  standalone: true,
  styleUrl: "./help-modal.component.scss",
  templateUrl: "./help-modal.component.html",
})
export class HelpModalComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly topic = input<HelpTopic | null>(null);
  readonly closed = output<void>();

  protected readonly icons = createTrustedHtmlMap(this.#sanitizer, MATERIAL_ICONS);

  protected close(): void {
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
