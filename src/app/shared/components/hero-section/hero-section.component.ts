import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation
} from "@angular/core";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-hero-section",
  standalone: true,
  styleUrl: "./hero-section.component.scss",
  templateUrl: "./hero-section.component.html",
  encapsulation: ViewEncapsulation.None
})
export class HeroSectionComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly body = input.required<string>();
  readonly noticeIcon = input.required<SafeHtml>();
  readonly noticeTitle = input.required<string>();
  readonly noticeBody = input.required<string>();
  readonly helpRequested = output<void>();

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );

  protected requestHelp(): void {
    this.helpRequested.emit();
  }
}
