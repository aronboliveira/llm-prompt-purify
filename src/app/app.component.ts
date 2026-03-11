import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

import { ToastCenterService } from "./core/feedback/toast-center.service";
import { DETECTION_MODE_COPY } from "./core/masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
  MaskingStrategy,
  XmlWrapTag,
} from "./core/masking/declarations/masking.types";
import {
  hasMixedLanguageSelection,
  summarizeCountrySelection,
  summarizeSelectedLanguages,
} from "./core/masking/utils/country-selection.utils";
import { ScanSessionService } from "./core/state/scan-session.service";
import { FeedbackSheetComponent } from "./features/feedback/components/feedback-sheet/feedback-sheet.component";
import { ControlsPanelComponent } from "./features/scanner/components/controls-panel/controls-panel.component";
import { CountryScopeModalComponent } from "./features/scanner/components/country-scope-modal/country-scope-modal.component";
import { HelpModalComponent } from "./features/scanner/components/help-modal/help-modal.component";
import { MaskedOutputPaneComponent } from "./features/scanner/components/masked-output-pane/masked-output-pane.component";
import { MaskingSettingsModalComponent } from "./features/scanner/components/masking-settings-modal/masking-settings-modal.component";
import { RawPromptPaneComponent } from "./features/scanner/components/raw-prompt-pane/raw-prompt-pane.component";
import { ScannerToolbarComponent } from "./features/scanner/components/scanner-toolbar/scanner-toolbar.component";
import { ToastStackComponent } from "./features/scanner/components/toast-stack/toast-stack.component";
import { HELP_TOPICS } from "./features/scanner/constants/help-topics.constants";
import { WORKFLOW_SNIPPETS } from "./features/scanner/constants/workflow-snippets.constants";
import { WORKSPACE_COPY } from "./features/scanner/constants/workspace.constants";
import type {
  HelpTopic,
  HelpTopicId,
} from "./features/scanner/declarations/help-topic.types";
import { toggleCountrySelection } from "./features/scanner/utils/country-selection-form.utils";
import { HeroSectionComponent } from "./shared/components/hero-section/hero-section.component";
import { ProductHeaderComponent } from "./shared/components/product-header/product-header.component";
import { WorkflowStripComponent } from "./shared/components/workflow-strip/workflow-strip.component";
import { MATERIAL_ICONS } from "./shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "./shared/utils/trusted-html.utils";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ControlsPanelComponent,
    CountryScopeModalComponent,
    FeedbackSheetComponent,
    FormsModule,
    HelpModalComponent,
    HeroSectionComponent,
    MaskedOutputPaneComponent,
    MaskingSettingsModalComponent,
    ProductHeaderComponent,
    RawPromptPaneComponent,
    ScannerToolbarComponent,
    ToastStackComponent,
    WorkflowStripComponent,
  ],
  selector: "app-root",
  standalone: true,
  styleUrl: "./app.component.scss",
  templateUrl: "./app.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  readonly #activeHelpTopic = signal<HelpTopic | null>(null);
  readonly #isCountryModalOpen = signal(false);
  readonly #isSettingsModalOpen = signal(false);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #scanSession = inject(ScanSessionService);
  readonly #toastCenter = inject(ToastCenterService);

  public constructor() {
    if (this.#scanSession.state().sourceText.trim())
      this.#scanSession.scheduleRefresh(0);
  }

  protected readonly activeHelpTopic = this.#activeHelpTopic.asReadonly();
  protected readonly copy = WORKSPACE_COPY;
  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );
  protected readonly isCountryModalOpen = this.#isCountryModalOpen.asReadonly();
  protected readonly isSettingsModalOpen =
    this.#isSettingsModalOpen.asReadonly();
  protected readonly hasMixedLanguageSelection = computed(() => {
    return hasMixedLanguageSelection(this.vm().selectedCountryProfiles);
  });
  protected readonly selectedCountrySummary = computed(() => {
    return summarizeCountrySelection(this.vm().selectedCountryProfiles);
  });
  protected readonly selectedLanguageSummary = computed(() => {
    return summarizeSelectedLanguages(this.vm().selectedCountryProfiles);
  });
  protected readonly toasts = this.#toastCenter.toasts;
  protected readonly vm = computed(() => this.#scanSession.viewModel());
  protected readonly workflowSnippets = WORKFLOW_SNIPPETS;

  protected clear(): void {
    this.#scanSession.clear();
    this.#toastCenter.push(
      "The raw prompt and protected output were cleared from this local session.",
      "Workspace reset",
      "info",
    );
  }

  protected closeCountryModal(): void {
    this.#isCountryModalOpen.set(false);
  }

  protected closeHelp(): void {
    this.#activeHelpTopic.set(null);
  }

  protected closeSettingsModal(): void {
    this.#isSettingsModalOpen.set(false);
  }

  protected async copyMaskedOutput(): Promise<void> {
    const { maskedText } = this.vm();
    if (!maskedText) {
      this.#toastCenter.push(
        "The protected output is still empty. Paste the raw prompt first and wait for the local masking pass.",
        "Nothing to copy",
        "error",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(maskedText);
      this.#toastCenter.push(
        "Only the masked output was copied, so you can paste it back into the LLM without exposing the raw prompt.",
        "Protected prompt copied",
        "success",
      );
    } catch {
      this.#toastCenter.push(
        "Clipboard access failed. Select the output block manually and copy from there.",
        "Copy failed",
        "error",
      );
    }
  }

  protected dismissToast(toastId: string): void {
    this.#toastCenter.dismiss(toastId);
  }

  protected openCountryModal(): void {
    this.#isCountryModalOpen.set(true);
  }

  protected openHelp(topicId: HelpTopicId): void {
    this.#activeHelpTopic.set(HELP_TOPICS[topicId]);
  }

  protected openSettingsModal(): void {
    this.#isSettingsModalOpen.set(true);
  }

  protected async regenerateAllMasks(): Promise<void> {
    await this.#scanSession.regenerateAllMasks();
    this.#toastCenter.push(
      "Fresh random replacements were generated for every active mask in the protected output.",
      "Masks regenerated",
      "success",
    );
  }

  protected async regenerateMatch(matchId: string): Promise<void> {
    await this.#scanSession.regenerateMatch(matchId);
    this.#toastCenter.push(
      "That mask now uses a new random replacement in the protected output.",
      "Mask regenerated",
      "info",
    );
  }

  protected snippetState(snippetId: string): "active" | "done" | "idle" {
    const viewModel = this.vm();

    switch (snippetId) {
      case "paste":
        return viewModel.sourceText ? "done" : "active";
      case "scan":
        if (viewModel.isScanning) return "active";
        return viewModel.hasResult ? "done" : "idle";
      case "review":
        if (!viewModel.hasResult) return "idle";
        return viewModel.hasMatches ? "active" : "done";
      case "copy":
        if (!viewModel.hasResult) return "idle";
        return viewModel.canCopy ? "active" : "idle";
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

  protected toggleCountryProfile(event: {
    countryProfileId: CountryProfileId;
    selected: boolean;
  }): void {
    const currentSelection = this.vm().selectedCountryProfiles.map(
        countryProfile => countryProfile.id,
      ),
      nextSelection = toggleCountrySelection(
        currentSelection,
        event.countryProfileId,
        event.selected,
      );

    this.#scanSession.setCountryProfiles(nextSelection);
    const nextSelectedCountryProfiles =
      this.#scanSession.viewModel().selectedCountryProfiles;

    this.#toastCenter.push(
      `Country scope updated to ${summarizeCountrySelection(nextSelectedCountryProfiles)}.`,
      "Country scope updated",
      "info",
    );

    if (
      hasMixedLanguageSelection(nextSelectedCountryProfiles) &&
      this.vm().detectionMode !== "global-only"
    ) {
      this.#toastCenter.push(
        "Mixed-language country scopes are enabled. This can reduce precision, so keep the selection narrow when possible.",
        "Mixed language scope",
        "info",
      );
    }
  }

  protected toggleGroupAlwaysOn(event: {
    alwaysOn: boolean;
    groupId: MaskGroupId;
  }): void {
    this.#scanSession.toggleGroupAlwaysOn(event.groupId, event.alwaysOn);
    this.#toastCenter.push(
      event.alwaysOn
        ? "This group will stay masked until you explicitly unlock it."
        : "This group can now be adjusted per individual match again.",
      event.alwaysOn ? "Group locked on" : "Group unlocked",
      "info",
    );
  }

  protected toggleGroupEnabled(event: {
    enabled: boolean;
    groupId: MaskGroupId;
  }): void {
    this.#scanSession.toggleGroupEnabled(event.groupId, event.enabled);
    this.#toastCenter.push(
      event.enabled
        ? "This group is active again in the protected output."
        : "This group is currently passing through original values.",
      event.enabled ? "Group enabled" : "Group disabled",
      "info",
    );
  }

  protected toggleMatch(event: { enabled: boolean; matchId: string }): void {
    this.#scanSession.toggleMatch(event.matchId, event.enabled);
  }

  protected updateDetectionMode(detectionMode: DetectionMode): void {
    this.#scanSession.setDetectionMode(detectionMode);
    this.#toastCenter.push(
      detectionMode === "global-only"
        ? "The detector is now limited to global identifiers and shared credential patterns."
        : "The detector is now combining the selected countries with shared global rules.",
      detectionMode === "global-only"
        ? "Global-only mode enabled"
        : "Country rules enabled",
      "info",
    );
  }

  protected updateGlobalIgnoreList(terms: readonly string[]): void {
    this.#scanSession.updateGlobalIgnoreList(terms);
  }

  protected updateKeywordBlocklist(keywords: readonly string[]): void {
    this.#scanSession.updateKeywordBlocklist(keywords);
  }

  protected updateMaskingStrategy(strategy: MaskingStrategy): void {
    this.#scanSession.setMaskingStrategy(strategy);
    this.#toastCenter.push(
      `Masking strategy changed. All detected values will now use the "${strategy}" replacement method.`,
      "Strategy updated",
      "info",
    );
  }

  protected updateSourceText(value: string): void {
    this.#scanSession.updateSourceText(value);
  }

  protected updateXmlWrapEnabled(enabled: boolean): void {
    this.#scanSession.setXmlWrapEnabled(enabled);
    this.#toastCenter.push(
      enabled
        ? "The protected output will be wrapped in an XML tag pair."
        : "XML wrapping has been removed from the output.",
      enabled ? "XML wrapping enabled" : "XML wrapping disabled",
      "info",
    );
  }

  protected updateXmlWrapTag(tag: XmlWrapTag): void {
    this.#scanSession.setXmlWrapTag(tag);
  }

  protected scopeCopy(): string {
    const selectedCountrySummary = this.selectedCountrySummary();

    if (this.vm().detectionMode === "global-only") {
      return `${selectedCountrySummary} selected, but only global identifiers are active.`;
    }

    return `${selectedCountrySummary} plus shared global rules.`;
  }

  protected detectionModeCopy(): string {
    return DETECTION_MODE_COPY[this.vm().detectionMode];
  }
}
