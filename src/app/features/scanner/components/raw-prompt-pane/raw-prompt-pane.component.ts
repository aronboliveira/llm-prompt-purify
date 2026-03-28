import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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
  readonly sourceTextChanged = output<{
    value: string;
    inputType?: string;
    isComposing?: boolean;
  }>();

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );

  /** Tracks the latest InputEvent.inputType for adaptive debounce. */
  #lastInputType: string | undefined;
  /** Tracks whether the last InputEvent was during IME composition. */
  #lastIsComposing = false;

  protected onInput(event: Event): void {
    const inputEvent = event as InputEvent;
    if (inputEvent.inputType) {
      this.#lastInputType = inputEvent.inputType;
    }
    this.#lastIsComposing = inputEvent.isComposing ?? false;
  }

  protected requestHelp(): void {
    this.helpRequested.emit();
  }

  protected updateSourceText(value: string): void {
    const inputType = this.#lastInputType,
      isComposing = this.#lastIsComposing;
    this.#lastInputType = undefined;
    this.#lastIsComposing = false;
    this.sourceTextChanged.emit({ value, inputType, isComposing });
  }
}
