import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

import { ToastCenterService } from "./core/feedback/toast-center.service";
import { DETECTION_MODE_COPY } from "./core/masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
} from "./core/masking/declarations/masking.types";
import { isKnownCountryProfileId } from "./core/masking/utils/country-scope.utils";
import { ScanSessionService } from "./core/state/scan-session.service";
import { HELP_TOPICS } from "./features/scanner/constants/help-topics.constants";
import { WORKFLOW_SNIPPETS } from "./features/scanner/constants/workflow-snippets.constants";
import { HelpModalComponent } from "./features/scanner/components/help-modal/help-modal.component";
import { MaskGroupPanelComponent } from "./features/scanner/components/mask-group-panel/mask-group-panel.component";
import { MatchReviewComponent } from "./features/scanner/components/match-review.component";
import { ToastStackComponent } from "./features/scanner/components/toast-stack/toast-stack.component";
import type { HelpTopic, HelpTopicId } from "./features/scanner/declarations/help-topic.types";
import { MATERIAL_ICONS } from "./shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "./shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HelpModalComponent,
    MaskGroupPanelComponent,
    MatchReviewComponent,
    ToastStackComponent,
  ],
  selector: "app-root",
  standalone: true,
  styleUrl: "./app.component.scss",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  readonly #activeHelpTopic = signal<HelpTopic | null>(null);
  readonly #scanSession = inject(ScanSessionService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #toastCenter = inject(ToastCenterService);

  protected readonly activeHelpTopic = this.#activeHelpTopic.asReadonly();
  protected readonly icons = createTrustedHtmlMap(this.#sanitizer, MATERIAL_ICONS);
  protected readonly toasts = this.#toastCenter.toasts;
  protected readonly vm = computed(() => this.#scanSession.viewModel());
  protected readonly workflowSnippets = WORKFLOW_SNIPPETS;

  protected clear(): void {
    this.#scanSession.clear();
    this.#toastCenter.push(
      "The raw prompt and generated output were cleared from this local session.",
      "Workspace reset",
      "info"
    );
  }

  protected async copyMaskedOutput(): Promise<void> {
    const { maskedText } = this.vm();
    if (!maskedText) return;

    try {
      await navigator.clipboard.writeText(maskedText);
      this.#toastCenter.push(
        "Only the protected output was copied, so you can paste it back into the LLM safely.",
        "Protected prompt copied",
        "success"
      );
    } catch {
      this.#toastCenter.push(
        "Clipboard access failed. Select the output block manually and copy from there.",
        "Copy failed",
        "error"
      );
    }
  }

  protected dismissToast(toastId: string): void {
    this.#toastCenter.dismiss(toastId);
  }

  protected openHelp(topicId: HelpTopicId): void {
    this.#activeHelpTopic.set(HELP_TOPICS[topicId]);
  }

  protected closeHelp(): void {
    this.#activeHelpTopic.set(null);
  }

  protected regenerateAllMasks(): void {
    this.#scanSession.regenerateAllMasks();
    this.#toastCenter.push(
      "Fresh random replacements were generated for every detected sensitive value.",
      "Masks regenerated",
      "success"
    );
  }

  protected regenerateMatch(matchId: string): void {
    this.#scanSession.regenerateMatch(matchId);
    this.#toastCenter.push(
      "That sensitive value now uses a new random replacement in the protected output.",
      "Mask regenerated",
      "info"
    );
  }

  protected async runScan(): Promise<void> {
    const scanSucceeded = await this.#scanSession.runScan(),
      { detectionMode, hasMatches, matchCount, selectedCountryProfile } = this.vm();

    if (!scanSucceeded) {
      this.#toastCenter.push(
        "Add the original prompt first, then run the local scan again.",
        "Nothing to scan yet",
        "error"
      );
      return;
    }

    if (hasMatches) {
      this.#toastCenter.push(
        `${matchCount} sensitive patterns were masked locally using ${selectedCountryProfile.flagEmoji} ${selectedCountryProfile.label} and ${DETECTION_MODE_COPY[detectionMode].toLowerCase()}. Review or regenerate them before copying.`,
        "Protected output ready",
        "success"
      );
      return;
    }

    this.#toastCenter.push(
      "No supported sensitive patterns were found in this pass, so the output matches the original prompt.",
      "No masks were needed",
      "info"
    );
  }

  protected snippetState(snippetId: string): "active" | "done" | "idle" {
    const viewModel = this.vm();

    switch (snippetId) {
      case "paste":
        return viewModel.selectedCountryProfile ? "done" : "active";
      case "scan":
        return viewModel.sourceText ? "done" : "active";
      case "review":
        if (viewModel.isScanning) return "active";
        return viewModel.hasResult ? "done" : "idle";
      case "copy":
        if (!viewModel.hasResult) return "idle";
        return viewModel.matchCount ? "active" : "done";
      default:
        return "idle";
    }
  }

  protected statusTone(): "error" | "info" | "success" {
    const viewModel = this.vm();
    if (viewModel.errorMessage) return "error";
    if (viewModel.hasResult) return "success";
    return "info";
  }

  protected toggleAllEditable(enabled: boolean): void {
    this.#scanSession.setAllEditableMatchesEnabled(enabled);
    this.#toastCenter.push(
      enabled
        ? "Every editable mask is active again in the protected output."
        : "Only locked mask groups remain active in the protected output.",
      enabled ? "Optional masks enabled" : "Optional masks disabled",
      "info"
    );
  }

  protected toggleGroupAlwaysOn(event: { alwaysOn: boolean; groupId: MaskGroupId }): void {
    this.#scanSession.toggleGroupAlwaysOn(event.groupId, event.alwaysOn);
    this.#toastCenter.push(
      event.alwaysOn
        ? "This group will stay masked even during per-match review."
        : "This group can now be adjusted per match again.",
      event.alwaysOn ? "Group locked on" : "Group unlocked",
      "info"
    );
  }

  protected toggleGroupEnabled(event: { enabled: boolean; groupId: MaskGroupId }): void {
    this.#scanSession.toggleGroupEnabled(event.groupId, event.enabled);
    this.#toastCenter.push(
      event.enabled
        ? "This mask group is active for the current prompt."
        : "This mask group is currently passing through unchanged values.",
      event.enabled ? "Group enabled" : "Group disabled",
      "info"
    );
  }

  protected toggleMatch(event: { enabled: boolean; matchId: string }): void {
    this.#scanSession.toggleMatch(event.matchId, event.enabled);
  }

  protected async updateCountryProfile(value: string): Promise<void> {
    if (!isKnownCountryProfileId(value)) return;

    this.#scanSession.setCountryProfile(value as CountryProfileId);
    const { selectedCountryProfile, sourceText } = this.vm();

    this.#toastCenter.push(
      `Country focus set to ${selectedCountryProfile.flagEmoji} ${selectedCountryProfile.label}.`,
      "Country focus updated",
      "info"
    );

    if (sourceText.trim()) await this.runScan();
  }

  protected async updateDetectionMode(event: Event): Promise<void> {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    const detectionMode: DetectionMode = inputElement.checked
      ? "global-only"
      : "country-plus-global";

    this.#scanSession.setDetectionMode(detectionMode);
    this.#toastCenter.push(
      inputElement.checked
        ? "The scan will now track only shared global identifiers and ignore country-specific document patterns."
        : "The scan will now combine shared global rules with the selected country profile.",
      inputElement.checked ? "Global-only scan enabled" : "Country rules enabled",
      "info"
    );

    if (this.vm().sourceText.trim()) await this.runScan();
  }

  protected updateSourceText(value: string): void {
    this.#scanSession.updateSourceText(value);
  }
}
