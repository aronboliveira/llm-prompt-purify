import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatchReviewComponent } from "./features/scanner/components/match-review.component";
import { ScanSessionService } from "./core/state/scan-session.service";

type CopyFeedbackState = "error" | "idle" | "success";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatchReviewComponent],
  selector: "app-root",
  standalone: true,
  styleUrl: "./app.component.scss",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnDestroy {
  readonly #copyFeedback = signal<CopyFeedbackState>("idle");
  readonly #scanSession = inject(ScanSessionService);
  #copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly copyFeedback = this.#copyFeedback.asReadonly();
  protected readonly vm = computed(() => this.#scanSession.viewModel());

  ngOnDestroy(): void {
    if (this.#copyResetTimer) clearTimeout(this.#copyResetTimer);
  }

  protected async copyMaskedOutput(): Promise<void> {
    const { maskedText } = this.vm();
    if (!maskedText) return;

    try {
      await navigator.clipboard.writeText(maskedText);
      this.#setCopyFeedback("success");
    } catch {
      this.#setCopyFeedback("error");
    }
  }

  protected clear(): void {
    this.#scanSession.clear();
    this.#setCopyFeedback("idle");
  }

  protected runScan(): void {
    this.#scanSession.runScan();
    this.#setCopyFeedback("idle");
  }

  protected toggleAll(enabled: boolean): void {
    this.#scanSession.setAllMatchesEnabled(enabled);
    this.#setCopyFeedback("idle");
  }

  protected toggleMatch(event: { enabled: boolean; matchId: string }): void {
    this.#scanSession.toggleMatch(event.matchId, event.enabled);
    this.#setCopyFeedback("idle");
  }

  protected updateSourceText(value: string): void {
    this.#scanSession.updateSourceText(value);
    this.#setCopyFeedback("idle");
  }

  #setCopyFeedback(state: CopyFeedbackState): void {
    this.#copyFeedback.set(state);
    if (this.#copyResetTimer) clearTimeout(this.#copyResetTimer);
    if (state === "idle") return;

    this.#copyResetTimer = setTimeout(() => this.#copyFeedback.set("idle"), 2200);
  }
}
