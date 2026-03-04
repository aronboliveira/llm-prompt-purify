import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MaskGroupPanelComponent } from "../mask-group-panel/mask-group-panel.component";
import type {
  MaskGroupId,
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MaskGroupPanelComponent],
  selector: "app-controls-panel",
  standalone: true,
  styleUrl: "./controls-panel.component.scss",
  templateUrl: "./controls-panel.component.html",
})
export class ControlsPanelComponent {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly groups = input.required<readonly MaskGroupSummary[]>();
  readonly matches = input.required<readonly ScanMatch[]>();

  readonly helpRequested = output<void>();
  readonly groupAlwaysOnToggled = output<{
    alwaysOn: boolean;
    groupId: MaskGroupId;
  }>();
  readonly groupEnabledToggled = output<{
    enabled: boolean;
    groupId: MaskGroupId;
  }>();
  readonly matchRegenerated = output<string>();
  readonly matchToggled = output<{ enabled: boolean; matchId: string }>();

  protected requestHelp(): void {
    this.helpRequested.emit();
  }
}
