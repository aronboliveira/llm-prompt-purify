import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MaskGroupPanelComponent } from "../mask-group-panel/mask-group-panel.component";
import type {
  MaskGroupId,
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MaskGroupPanelComponent],
    selector: "app-controls-panel",
    styleUrl: "./controls-panel.component.scss",
    templateUrl: "./controls-panel.component.html",
    encapsulation: ViewEncapsulation.None
})
export class ControlsPanelComponent {
  readonly #sanitizer = inject(DomSanitizer);
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

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );

  protected requestHelp(): void {
    this.helpRequested.emit();
  }
}
