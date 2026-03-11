import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from "@angular/core";
import { type SafeHtml } from "@angular/platform-browser";

import type { StatusTone } from "../../declarations/mask-control.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-masked-output-pane",
  standalone: true,
  styleUrl: "./masked-output-pane.component.scss",
  templateUrl: "./masked-output-pane.component.html",
  encapsulation: ViewEncapsulation.None
})
export class MaskedOutputPaneComponent {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly maskedText = input.required<string>();
  readonly emptyPlaceholder = input.required<string>();
  readonly statusMessage = input.required<string>();
  readonly detectionModeLabel = input.required<string>();
  readonly statusTone = input.required<StatusTone>();
  readonly copyIcon = input.required<SafeHtml>();
  readonly helpIcon = input.required<SafeHtml>();
  readonly refreshIcon = input.required<SafeHtml>();
  readonly isScanning = input.required<boolean>();
  readonly hasResult = input.required<boolean>();
  readonly canCopy = input.required<boolean>();
  readonly hasMatches = input.required<boolean>();
  readonly hasSourceText = input.required<boolean>();

  readonly helpRequested = output<void>();
  readonly copyRequested = output<void>();
  readonly regenerateRequested = output<void>();
  readonly clearRequested = output<void>();

  protected requestHelp(): void {
    this.helpRequested.emit();
  }

  protected requestCopy(): void {
    this.copyRequested.emit();
  }

  protected requestRegenerate(): void {
    this.regenerateRequested.emit();
  }

  protected requestClear(): void {
    this.clearRequested.emit();
  }
}
