import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { ContentPurifier } from "@core/purification/purification.service";
import type { ThreatType } from "@core/purification/declarations/purification.types";
import {
  SOURCE_FILE_ACCEPT_ATTR,
} from "@features/scanner/constants/source-input.constants";
import { loadSourceFile } from "@features/scanner/utils/source-file-loader.utils";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

export interface SourceFileLoadEvent {
  readonly fileName: string;
  readonly text: string;
  readonly threatCount: number;
  readonly threatTypes: readonly ThreatType[];
}

export interface SourceFileRejectionEvent {
  readonly message: string;
}

export interface PasteThreatEvent {
  readonly threatCount: number;
  readonly threatTypes: readonly ThreatType[];
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    selector: "app-raw-prompt-pane",
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
  readonly sourceTextChanged = output<{
    value: string;
    inputType?: string;
    isComposing?: boolean;
  }>();
  readonly fileLoaded = output<SourceFileLoadEvent>();
  readonly fileRejected = output<SourceFileRejectionEvent>();
  readonly pasteThreatDetected = output<PasteThreatEvent>();

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );

  protected readonly fileAccept = SOURCE_FILE_ACCEPT_ATTR;

  protected readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>("fileInput");

  readonly #pasteScanner = new ContentPurifier({
    detectXss: true,
    detectXxe: true,
    detectSqlInjection: false,
    detectPathTraversal: false,
    stripThreats: false,
    encodeHtml: false,
  });

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

  protected onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (!pasted) return;
    const threats = this.#pasteScanner.detect(pasted);
    if (threats.length === 0) return;
    const threatTypes = Array.from(
      new Set(threats.map(t => t.type)),
    ) as ThreatType[];
    this.pasteThreatDetected.emit({
      threatCount: threats.length,
      threatTypes,
    });
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

  protected triggerFileLoad(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const result = await loadSourceFile(file);
    if (!result.ok) {
      this.fileRejected.emit({ message: result.message });
      return;
    }
    this.fileLoaded.emit({
      fileName: result.fileName,
      text: result.text,
      threatCount: result.threatCount,
      threatTypes: result.threatTypes,
    });
  }
}
