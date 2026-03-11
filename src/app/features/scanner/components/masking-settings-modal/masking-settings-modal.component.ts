import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import {
  MASK_GROUP_DEFINITIONS,
  MASK_GROUP_ORDER,
  MASKING_STRATEGY_DESCRIPTIONS,
  MASKING_STRATEGY_LABELS,
  MASKING_STRATEGY_ORDER,
  XML_WRAP_TAG_LABELS,
  XML_WRAP_TAG_ORDER,
} from "@core/masking/constants/masking.constants";
import type {
  AdvancedMaskingPreferences,
  DetectionMode,
  MaskGroupId,
  MaskGroupPreferenceMap,
  MaskingStrategy,
  XmlWrapTag,
} from "@core/masking/declarations/masking.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { createTrustedHtmlMap } from "@shared/utils/trusted-html.utils";

const MASK_GROUP_ICONS: Record<MaskGroupId, keyof typeof MATERIAL_ICONS> = {
  credential: "key",
  financial: "payment",
  identifier: "badge",
  location: "location",
  personal: "person",
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-masking-settings-modal",
  standalone: true,
  templateUrl: "./masking-settings-modal.component.html",
})
export class MaskingSettingsModalComponent {
  readonly #sanitizer = inject(DomSanitizer);

  /* ── Inputs ─────────────────────────────────────────────── */

  readonly advancedPreferences = input<AdvancedMaskingPreferences>({
    globalIgnoreList: [],
    keywordBlocklist: [],
    maskingStrategy: "random",
    xmlWrapEnabled: false,
    xmlWrapTag: "document",
  });
  readonly detectionMode = input<DetectionMode>("selected-plus-global");
  readonly groupPreferences = input<MaskGroupPreferenceMap>({
    credential: { alwaysOn: true, enabled: true },
    financial: { alwaysOn: false, enabled: true },
    identifier: { alwaysOn: false, enabled: true },
    location: { alwaysOn: false, enabled: true },
    personal: { alwaysOn: false, enabled: true },
  });
  readonly isOpen = input(false);

  /* ── Outputs ────────────────────────────────────────────── */

  readonly closed = output<void>();
  readonly detectionModeChanged = output<DetectionMode>();
  readonly globalIgnoreListChanged = output<readonly string[]>();
  readonly groupPreferenceChanged = output<{
    groupId: MaskGroupId;
    enabled: boolean;
  }>();
  readonly helpRequested = output<void>();
  readonly keywordBlocklistChanged = output<readonly string[]>();
  readonly maskingStrategyChanged = output<MaskingStrategy>();
  readonly xmlWrapEnabledChanged = output<boolean>();
  readonly xmlWrapTagChanged = output<XmlWrapTag>();

  /* ── Template helpers ───────────────────────────────────── */

  protected readonly icons = createTrustedHtmlMap(
    this.#sanitizer,
    MATERIAL_ICONS,
  );
  protected readonly maskGroupDefinitions = MASK_GROUP_ORDER.map(
    id => MASK_GROUP_DEFINITIONS[id],
  );
  protected readonly strategyOrder = MASKING_STRATEGY_ORDER;
  protected readonly strategyLabels = MASKING_STRATEGY_LABELS;
  protected readonly strategyDescriptions = MASKING_STRATEGY_DESCRIPTIONS;
  protected readonly xmlTagOrder = XML_WRAP_TAG_ORDER;
  protected readonly xmlTagLabels = XML_WRAP_TAG_LABELS;

  /* ── Event handlers ─────────────────────────────────────── */

  protected close(): void {
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  protected getMaskGroupIcon(groupId: MaskGroupId) {
    const iconKey = MASK_GROUP_ICONS[groupId];
    return this.icons[iconKey] ?? this.icons.settings;
  }

  protected onGlobalOnlyChange(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.detectionModeChanged.emit(
      inputElement.checked ? "global-only" : "selected-plus-global",
    );
  }

  protected onMaskGroupChange(event: Event, groupId: MaskGroupId): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.groupPreferenceChanged.emit({
      groupId,
      enabled: inputElement.checked,
    });
  }

  protected onMaskingStrategyChange(strategy: MaskingStrategy): void {
    this.maskingStrategyChanged.emit(strategy);
  }

  protected onXmlWrapToggle(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;
    this.xmlWrapEnabledChanged.emit(inputElement.checked);
  }

  protected onXmlWrapTagChange(event: Event): void {
    const selectElement = event.target;
    if (!(selectElement instanceof HTMLSelectElement)) return;
    this.xmlWrapTagChanged.emit(selectElement.value as XmlWrapTag);
  }

  protected onBlocklistInput(event: Event): void {
    const textarea = event.target;
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    const keywords = textarea.value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
    this.keywordBlocklistChanged.emit(keywords);
  }

  protected onIgnoreListInput(event: Event): void {
    const textarea = event.target;
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    const terms = textarea.value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
    this.globalIgnoreListChanged.emit(terms);
  }

  protected openHelp(): void {
    this.helpRequested.emit();
  }
}
