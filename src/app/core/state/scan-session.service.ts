import { computed, Inject, inject, Injectable, signal } from "@angular/core";

import type { MaskSafetyHardener } from "../mask-safety/declarations/mask-safety.types";
import { MaskSafetyHardeningService } from "../mask-safety/mask-safety-hardening.service";
import {
  COUNTRY_PROFILE_DEFINITIONS,
  COUNTRY_PROFILE_ORDER,
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_COUNTRY_PROFILE_IDS,
  MASK_GROUP_DEFINITIONS,
  MASK_GROUP_ORDER,
} from "../masking/constants/masking.constants";
import type {
  AdvancedMaskingPreferences,
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
  MaskingStrategy,
  ScanResult,
  XmlWrapTag,
} from "../masking/declarations/masking.types";
import { MaskingEngine } from "../masking/masking.engine";
import {
  buildScanScopeSelection,
  normalizeCountryProfileIds,
} from "../masking/utils/country-scope.utils";
import {
  SCAN_PHASE_MESSAGES,
  SCAN_TIMINGS,
} from "./constants/scan-session.constants";
import type {
  ScanPhase,
  ScanSessionState,
  ScanSessionViewModel,
} from "./declarations/scan-session.types";
import {
  applyAlwaysOnToMatches,
  applyEnabledToMatches,
  computeNextAlwaysOnPreferences,
  computeNextEnabledPreferences,
} from "./utils/group-preference.utils";
import {
  setAllEditableMatchesEnabled,
  toggleMatchEnabled,
} from "./utils/match-control.utils";
import {
  loadPersistedAdvancedPreferences,
  loadPersistedCountryProfileIds,
  loadPersistedDetectionMode,
  loadPersistedGroupPreferences,
  loadPersistedSourceText,
  persistAdvancedPreferences,
  persistCountryProfileIds,
  persistDetectionMode,
  persistGroupPreferences,
  persistSourceText,
} from "./utils/scan-session-storage.utils";
import { waitFor } from "./utils/timing.utils";

@Injectable({ providedIn: "root" })
export class ScanSessionService {
  readonly #engine = new MaskingEngine();
  readonly #maskSafetyHardener: MaskSafetyHardener;
  #queuedRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  #refreshRequestId = 0;
  readonly #state = signal<ScanSessionState>({
    advancedPreferences: loadPersistedAdvancedPreferences(),
    countryProfileIds: loadPersistedCountryProfileIds(),
    detectionMode: loadPersistedDetectionMode(),
    errorMessage: null,
    groupPreferences: loadPersistedGroupPreferences(),
    isScanning: false,
    result: null,
    scanPhase: "idle",
    sourceText: loadPersistedSourceText(),
    statusMessage: SCAN_PHASE_MESSAGES.idle,
  });

  public constructor(
    @Inject(MaskSafetyHardeningService) maskSafetyHardener?: MaskSafetyHardener,
  ) {
    this.#maskSafetyHardener =
      maskSafetyHardener ?? inject(MaskSafetyHardeningService);
  }

  public readonly state = this.#state.asReadonly();

  public readonly viewModel = computed<ScanSessionViewModel>(() => {
    const state = this.#state(),
      result = state.result,
      countryProfiles = COUNTRY_PROFILE_ORDER.map(countryProfileId => {
        const definition = COUNTRY_PROFILE_DEFINITIONS[countryProfileId];

        return {
          ...definition,
          selected: state.countryProfileIds.includes(definition.id),
        };
      }),
      selectedCountryProfiles = countryProfiles.filter(
        countryProfile => countryProfile.selected,
      ),
      groups = MASK_GROUP_ORDER.map(groupId => {
        const preference = state.groupPreferences[groupId],
          definition = MASK_GROUP_DEFINITIONS[groupId];

        return {
          ...definition,
          alwaysOn: preference.alwaysOn,
          enabled: preference.enabled,
          matchCount: result?.groupCounts[groupId] ?? 0,
        };
      });

    return {
      activeMatches: result?.enabledMatches ?? 0,
      advancedPreferences: state.advancedPreferences,
      canCopy: !!result && !state.isScanning,
      countryProfiles,
      detectionMode: state.detectionMode,
      editableMatches:
        result?.matches.filter(match => !match.locked).length ?? 0,
      errorMessage: state.errorMessage,
      groupPreferences: state.groupPreferences,
      groups,
      hasMatches: !!result?.hasMatches,
      hasResult: !!result,
      isScanning: state.isScanning,
      maskedText: result?.maskedText ?? "",
      matchCount: result?.totalMatches ?? 0,
      matches: result?.matches ?? [],
      scannedAt: result?.scannedAt ?? null,
      scanPhase: state.scanPhase,
      selectedCountryProfile: selectedCountryProfiles[0] ?? null,
      selectedCountryProfiles,
      sourceText: state.sourceText,
      statusMessage: state.errorMessage ?? state.statusMessage,
    };
  });

  public clear(): void {
    this.#cancelRefreshes();
    this.#state.set({
      advancedPreferences: this.#state().advancedPreferences,
      countryProfileIds: this.#state().countryProfileIds,
      detectionMode: this.#state().detectionMode,
      errorMessage: null,
      groupPreferences: this.#state().groupPreferences,
      isScanning: false,
      result: null,
      scanPhase: "idle",
      sourceText: "",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistSourceText("");
  }

  public async refreshMaskedOutput(): Promise<boolean> {
    this.#clearQueuedRefresh();
    const currentState = this.#state();
    const sourceText = currentState.sourceText;
    if (!sourceText.trim()) {
      this.#state.update(state => ({
        ...state,
        errorMessage: null,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
      return false;
    }

    const scannedAt = new Date().toISOString(),
      refreshRequestId = ++this.#refreshRequestId;
    this.#state.update(state => ({
      ...state,
      errorMessage: null,
      isScanning: true,
      scanPhase: "detecting",
      statusMessage: SCAN_PHASE_MESSAGES.detecting,
    }));

    try {
      const localResult = this.#engine.scan(
        sourceText,
        currentState.groupPreferences,
        buildScanScopeSelection(
          currentState.countryProfileIds,
          currentState.detectionMode,
        ),
        scannedAt,
        currentState.advancedPreferences,
      );
      this.#setPhase("validating");

      const [result] = await Promise.all([
        this.#hardenResult(localResult),
        waitFor(SCAN_TIMINGS.minimumSpinnerMs),
      ]);

      if (refreshRequestId !== this.#refreshRequestId) {
        return false;
      }

      this.#state.update(state => ({
        ...state,
        errorMessage: null,
        isScanning: false,
        result,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      }));
      return true;
    } catch (error) {
      this.#state.update(state => ({
        ...state,
        errorMessage:
          error instanceof Error
            ? error.message
            : "The local scan failed before a protected output could be produced.",
        isScanning: false,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
      return false;
    }
  }

  public async runScan(): Promise<boolean> {
    return this.refreshMaskedOutput();
  }

  public async regenerateAllMasks(): Promise<void> {
    const result = this.#state().result;
    if (!result) return;

    this.#state.update(state => ({
      ...state,
      errorMessage: null,
      isScanning: true,
      scanPhase: "validating",
      statusMessage: SCAN_PHASE_MESSAGES.validating,
    }));

    try {
      const nextResult = await this.#hardenResult(
        this.#engine.regenerateAll(
          result.sourceText,
          result.matches,
          result.scannedAt,
          this.#state().advancedPreferences.maskingStrategy,
          this.#state().advancedPreferences,
        ),
      );

      this.#state.update(state => ({
        ...state,
        isScanning: false,
        result: nextResult,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      }));
    } catch (error) {
      this.#state.update(state => ({
        ...state,
        errorMessage:
          error instanceof Error
            ? error.message
            : "The local mask regeneration failed before a new protected output could be produced.",
        isScanning: false,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
    }
  }

  public async regenerateMatch(matchId: string): Promise<void> {
    const result = this.#state().result;
    if (!result) return;

    this.#state.update(state => ({
      ...state,
      errorMessage: null,
      isScanning: true,
      scanPhase: "validating",
      statusMessage: SCAN_PHASE_MESSAGES.validating,
    }));

    try {
      const nextResult = await this.#hardenResult(
        this.#engine.regenerateMatch(
          result.sourceText,
          result.matches,
          result.scannedAt,
          matchId,
          this.#state().advancedPreferences.maskingStrategy,
          this.#state().advancedPreferences,
        ),
      );

      this.#state.update(state => ({
        ...state,
        isScanning: false,
        result: nextResult,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      }));
    } catch (error) {
      this.#state.update(state => ({
        ...state,
        errorMessage:
          error instanceof Error
            ? error.message
            : "That mask could not be regenerated safely.",
        isScanning: false,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
    }
  }

  public scheduleRefresh(
    delayMs: number = SCAN_TIMINGS.autoRefreshDebounceMs,
  ): void {
    this.#clearQueuedRefresh();

    if (!this.#state().sourceText.trim()) {
      this.#state.update(state => ({
        ...state,
        errorMessage: null,
        isScanning: false,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
      return;
    }

    this.#state.update(state => ({
      ...state,
      errorMessage: null,
      isScanning: true,
      scanPhase: "detecting",
      statusMessage: SCAN_PHASE_MESSAGES.detecting,
    }));

    this.#queuedRefreshTimer = setTimeout(() => {
      this.#queuedRefreshTimer = null;
      void this.refreshMaskedOutput();
    }, delayMs);
  }

  public setCountryProfile(countryProfileId: CountryProfileId): void {
    this.setCountryProfiles([countryProfileId]);
  }

  public setCountryProfiles(
    countryProfileIds: readonly CountryProfileId[],
  ): void {
    const currentState = this.#state(),
      normalizedCountryProfileIds = normalizeCountryProfileIds(
        countryProfileIds,
      ).length
        ? normalizeCountryProfileIds(countryProfileIds)
        : DEFAULT_COUNTRY_PROFILE_IDS;
    if (
      hasSameCountrySelection(
        currentState.countryProfileIds,
        normalizedCountryProfileIds,
      )
    )
      return;

    this.#state.set({
      ...currentState,
      countryProfileIds: normalizedCountryProfileIds,
      errorMessage: null,
      scanPhase: "idle",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistCountryProfileIds(normalizedCountryProfileIds);

    if (currentState.sourceText.trim()) this.scheduleRefresh();
  }

  public setDetectionMode(detectionMode: DetectionMode): void {
    const currentState = this.#state();
    if (currentState.detectionMode === detectionMode) return;

    this.#state.set({
      ...currentState,
      detectionMode,
      errorMessage: null,
      result: null,
      scanPhase: "idle",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistDetectionMode(detectionMode);

    if (currentState.sourceText.trim()) this.scheduleRefresh();
  }

  public setAllEditableMatchesEnabled(enabled: boolean): void {
    const state = this.#state(),
      result = state.result;
    if (!result) return;

    const matches = setAllEditableMatchesEnabled(
      result.matches,
      state.groupPreferences,
      enabled,
    );

    this.#state.update(state => ({
      ...state,
      result: this.#engine.rebuild(
        result.sourceText,
        matches,
        result.scannedAt,
        state.advancedPreferences,
      ),
    }));
  }

  public toggleGroupAlwaysOn(groupId: MaskGroupId, alwaysOn: boolean): void {
    const nextPreferences = computeNextAlwaysOnPreferences(
      this.#state().groupPreferences,
      groupId,
      alwaysOn,
    );

    this.#state.update(state => {
      const currentResult = state.result,
        nextResult = currentResult
          ? this.#engine.rebuild(
              currentResult.sourceText,
              applyAlwaysOnToMatches(currentResult.matches, groupId, alwaysOn),
              currentResult.scannedAt,
              state.advancedPreferences,
            )
          : null;

      return {
        ...state,
        groupPreferences: nextPreferences,
        result: nextResult,
      };
    });

    persistGroupPreferences(nextPreferences);
  }

  public toggleGroupEnabled(groupId: MaskGroupId, enabled: boolean): void {
    const currentPreferences = this.#state().groupPreferences,
      nextPreferences = computeNextEnabledPreferences(
        currentPreferences,
        groupId,
        enabled,
      );

    this.#state.update(state => {
      const currentResult = state.result,
        nextResult = currentResult
          ? this.#engine.rebuild(
              currentResult.sourceText,
              applyEnabledToMatches(
                currentResult.matches,
                groupId,
                enabled,
                nextPreferences[groupId].alwaysOn,
              ),
              currentResult.scannedAt,
              state.advancedPreferences,
            )
          : null;

      return {
        ...state,
        groupPreferences: nextPreferences,
        result: nextResult,
      };
    });

    persistGroupPreferences(nextPreferences);
  }

  public toggleMatch(matchId: string, enabled: boolean): void {
    const result = this.#state().result;
    if (!result) return;

    const matches = toggleMatchEnabled(result.matches, matchId, enabled);

    this.#state.update(state => ({
      ...state,
      result: this.#engine.rebuild(
        result.sourceText,
        matches,
        result.scannedAt,
        state.advancedPreferences,
      ),
    }));
  }

  public updateSourceText(sourceText: string): void {
    const currentState = this.#state();

    this.#state.set({
      advancedPreferences: currentState.advancedPreferences,
      countryProfileIds: currentState.countryProfileIds,
      detectionMode: currentState.detectionMode,
      errorMessage: null,
      groupPreferences: currentState.groupPreferences,
      isScanning: false,
      result: sourceText.trim() ? currentState.result : null,
      scanPhase: "idle",
      sourceText,
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistSourceText(sourceText);

    if (sourceText.trim()) this.scheduleRefresh();
    else this.#cancelRefreshes();
  }

  public setAdvancedPreferences(
    prefs: Partial<AdvancedMaskingPreferences>,
  ): void {
    const merged: AdvancedMaskingPreferences = {
      ...this.#state().advancedPreferences,
      ...prefs,
    };

    this.#state.update(state => {
      const nextResult = state.result
        ? this.#engine.rebuild(
            state.result.sourceText,
            state.result.matches,
            state.result.scannedAt,
            merged,
          )
        : null;

      return { ...state, advancedPreferences: merged, result: nextResult };
    });

    persistAdvancedPreferences(merged);

    if (
      prefs.keywordBlocklist !== undefined ||
      prefs.globalIgnoreList !== undefined ||
      prefs.maskingStrategy !== undefined ||
      prefs.polyglotMaskEnabled !== undefined ||
      prefs.polyglotEnabledFamilies !== undefined ||
      prefs.polyglotExcludedSubtypes !== undefined
    ) {
      this.scheduleRefresh();
    }
  }

  public setMaskingStrategy(strategy: MaskingStrategy): void {
    this.setAdvancedPreferences({ maskingStrategy: strategy });
  }

  public setXmlWrapEnabled(enabled: boolean): void {
    this.setAdvancedPreferences({ xmlWrapEnabled: enabled });
  }

  public setXmlWrapTag(tag: XmlWrapTag): void {
    this.setAdvancedPreferences({ xmlWrapTag: tag });
  }

  public updateKeywordBlocklist(keywords: readonly string[]): void {
    this.setAdvancedPreferences({ keywordBlocklist: [...keywords] });
  }

  public updateGlobalIgnoreList(terms: readonly string[]): void {
    this.setAdvancedPreferences({ globalIgnoreList: [...terms] });
  }

  public setPolyglotEnabled(enabled: boolean): void {
    this.setAdvancedPreferences({ polyglotMaskEnabled: enabled });
  }

  public setPolyglotFamilies(families: readonly string[]): void {
    this.setAdvancedPreferences({ polyglotEnabledFamilies: [...families] });
  }

  public setPolyglotExcludedSubtypes(subtypes: readonly string[]): void {
    this.setAdvancedPreferences({
      polyglotExcludedSubtypes: [...subtypes],
    });
  }

  #setPhase(phase: ScanPhase): void {
    this.#state.update(state => ({
      ...state,
      scanPhase: phase,
      statusMessage: SCAN_PHASE_MESSAGES[phase],
    }));
  }

  async #hardenResult(localResult: ScanResult): Promise<ScanResult> {
    const hardeningResult = await this.#maskSafetyHardener.hardenMatches(
      localResult.matches,
    );

    return this.#engine.rebuild(
      localResult.sourceText,
      hardeningResult.matches,
      localResult.scannedAt,
      this.#state().advancedPreferences,
    );
  }

  #cancelRefreshes(): void {
    this.#clearQueuedRefresh();
    this.#refreshRequestId += 1;
  }

  #clearQueuedRefresh(): void {
    if (!this.#queuedRefreshTimer) return;
    clearTimeout(this.#queuedRefreshTimer);
    this.#queuedRefreshTimer = null;
  }
}

function hasSameCountrySelection(
  leftCountryProfileIds: readonly CountryProfileId[],
  rightCountryProfileIds: readonly CountryProfileId[],
): boolean {
  if (leftCountryProfileIds.length !== rightCountryProfileIds.length)
    return false;
  return leftCountryProfileIds.every((countryProfileId, index) => {
    return countryProfileId === rightCountryProfileIds[index];
  });
}
