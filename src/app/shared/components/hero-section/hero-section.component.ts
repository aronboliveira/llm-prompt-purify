import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-hero-section",
  standalone: true,
  styleUrl: "./hero-section.component.scss",
  templateUrl: "./hero-section.component.html",
})
export class HeroSectionComponent {
  readonly body = input.required<string>();
  readonly noticeIcon = input.required<SafeHtml>();
  readonly noticeTitle = input.required<string>();
  readonly noticeBody = input.required<string>();
  readonly helpRequested = output<void>();

  protected requestHelp(): void {
    this.helpRequested.emit();
  }
}
