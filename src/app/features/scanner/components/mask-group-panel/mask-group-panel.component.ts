import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

import type { MaskGroupId, MaskGroupSummary } from "../../../../core/masking/declarations/masking.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-mask-group-panel",
  standalone: true,
  styleUrl: "./mask-group-panel.component.scss",
  templateUrl: "./mask-group-panel.component.html",
})
export class MaskGroupPanelComponent {
  readonly groups = input.required<readonly MaskGroupSummary[]>();
  readonly groupAlwaysOnToggled = output<{ alwaysOn: boolean; groupId: MaskGroupId }>();
  readonly groupEnabledToggled = output<{ enabled: boolean; groupId: MaskGroupId }>();

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
}
