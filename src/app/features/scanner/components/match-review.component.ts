import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { MASK_CATEGORY_LABELS, MASK_LOCALE_LABELS } from "../../../core/masking/masking.constants";
import { redactPreview } from "../../../core/masking/masking.utils";
import type { ScanMatch } from "../../../core/masking/masking.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-match-review",
  standalone: true,
  templateUrl: "./match-review.component.html",
  styleUrl: "./match-review.component.scss",
})
export class MatchReviewComponent {
  readonly matches = input.required<readonly ScanMatch[]>();
  readonly matchToggled = output<{ enabled: boolean; matchId: string }>();

  protected readonly categoryLabels = MASK_CATEGORY_LABELS;
  protected readonly localeLabels = MASK_LOCALE_LABELS;

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
