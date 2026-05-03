import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import type {
  MaskGroupId,
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";
import { buildMaskControlSections, formatMaskControlValue } from "../../utils/mask-control.utils";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    selector: "app-mask-group-panel",
    styleUrl: "./mask-group-panel.component.scss",
    templateUrl: "./mask-group-panel.component.html"
})
export class MaskGroupPanelComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly groups = input.required<readonly MaskGroupSummary[]>();
  readonly matches = input.required<readonly ScanMatch[]>();
  readonly groupAlwaysOnToggled = output<{ alwaysOn: boolean; groupId: MaskGroupId }>();
  readonly groupEnabledToggled = output<{ enabled: boolean; groupId: MaskGroupId }>();
  readonly matchRegenerated = output<string>();
  readonly matchToggled = output<{ enabled: boolean; matchId: string }>();

  protected readonly icons = createTrustedHtmlMap(this.#sanitizer, MATERIAL_ICONS);
  protected readonly sections = computed(() =>
    buildMaskControlSections(this.groups(), this.matches())
  );

  protected formatMatchValue(match: ScanMatch): string {
    return formatMaskControlValue(match);
  }

  protected onAlwaysOnToggle(groupId: MaskGroupId, event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.groupAlwaysOnToggled.emit({
      alwaysOn: inputElement.checked,
      groupId,
    });
  }

  protected onEnabledToggle(groupId: MaskGroupId, event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.groupEnabledToggled.emit({
      enabled: inputElement.checked,
      groupId,
    });
  }

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
}
