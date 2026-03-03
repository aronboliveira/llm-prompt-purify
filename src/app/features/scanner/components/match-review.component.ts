import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MASK_CATEGORY_LABELS, MASK_LOCALE_LABELS } from "../../../core/masking/constants/masking.constants";
import type { ScanMatch } from "../../../core/masking/declarations/masking.types";
import { redactPreview } from "../../../core/masking/utils/mask-format.utils";
import { MATERIAL_ICONS } from "../../../shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "../../../shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-match-review",
  standalone: true,
  templateUrl: "./match-review.component.html",
  styleUrl: "./match-review.component.scss",
})
export class MatchReviewComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly matches = input.required<readonly ScanMatch[]>();
  readonly matchRegenerated = output<string>();
  readonly matchToggled = output<{ enabled: boolean; matchId: string }>();

  protected readonly categoryLabels = MASK_CATEGORY_LABELS;
  protected readonly icons = createTrustedHtmlMap(this.#sanitizer, MATERIAL_ICONS);
  protected readonly localeLabels = MASK_LOCALE_LABELS;

  protected onMatchRegenerate(matchId: string): void {
    this.matchRegenerated.emit(matchId);
  }

  protected onMatchToggle(matchId: string, event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.matchToggled.emit({
      enabled: inputElement.checked,
      matchId,
    });
  }

  protected preview(value: string): string {
    return redactPreview(value);
  }
}
