import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  selector: "app-raw-prompt-pane",
  standalone: true,
  styleUrl: "./raw-prompt-pane.component.scss",
  templateUrl: "./raw-prompt-pane.component.html",
})
export class RawPromptPaneComponent {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly sourceText = input.required<string>();
  readonly placeholder = input<string>(
    "Paste the content you want to protect before sending it to a web LLM.",
  );

  readonly helpRequested = output<void>();
  readonly sourceTextChanged = output<string>();

  protected requestHelp(): void {
    this.helpRequested.emit();
  }

  protected updateSourceText(value: string): void {
    this.sourceTextChanged.emit(value);
  }
}
