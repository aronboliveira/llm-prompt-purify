import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  selector: "app-raw-prompt-pane",
  standalone: true,
  styleUrl: "./raw-prompt-pane.component.scss",
  templateUrl: "./raw-prompt-pane.component.html",
  encapsulation: ViewEncapsulation.None
})
export class RawPromptPaneComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly sourceText = input.required<string>();
  readonly placeholder = input<string>(
    "Paste the content you want to protect before sending it to a web LLM.",
  );

  readonly helpRequested = output<void>();
  readonly sourceTextChanged = output<string>();

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );

  protected requestHelp(): void {
    this.helpRequested.emit();
  }

  protected updateSourceText(value: string): void {
    this.sourceTextChanged.emit(value);
  }
}
