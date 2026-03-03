import { computed, Injectable, signal } from "@angular/core";
import {
  COUNTRY_PROFILE_DEFINITIONS,
  DEFAULT_COUNTRY_PROFILE_IDS,
  COUNTRY_PROFILE_ORDER,
  MASK_GROUP_DEFINITIONS,
  MASK_GROUP_ORDER,
} from "../masking/constants/masking.constants";
import { MaskingEngine } from "../masking/masking.engine";
import {
  buildScanScopeSelection,
  normalizeCountryProfileIds,
} from "../masking/utils/country-scope.utils";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
} from "../masking/declarations/masking.types";
import { createGroupPreferenceMap } from "../masking/utils/mask-group.utils";
import { SCAN_PHASE_MESSAGES, SCAN_TIMINGS } from "./constants/scan-session.constants";
import type {
  ScanPhase,
  ScanSessionState,
  ScanSessionViewModel,
} from "./declarations/scan-session.types";
import {
  loadPersistedCountryProfileIds,
  loadPersistedDetectionMode,
  loadPersistedGroupPreferences,
  loadPersistedSourceText,
  persistCountryProfileIds,
  persistDetectionMode,
  persistGroupPreferences,
  persistSourceText,
} from "./utils/scan-session-storage.utils";
import { waitFor } from "./utils/timing.utils";

@Injectable({ providedIn: "root" })
export class ScanSessionService {
  readonly #engine = new MaskingEngine();
  #queuedRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  #refreshRequestId = 0;
  readonly #state = signal<ScanSessionState>({
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
      selectedCountryProfiles = countryProfiles.filter(countryProfile => countryProfile.selected),
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
      canCopy: !!result && !state.isScanning,
      countryProfiles,
      detectionMode: state.detectionMode,
      editableMatches: result?.matches.filter(match => !match.locked).length ?? 0,
      errorMessage: state.errorMessage,
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
    const sourceText = this.#state().sourceText;
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

    const phaseTimer = setTimeout(() => {
      if (refreshRequestId !== this.#refreshRequestId) return;
      this.#setPhase("masking");
    }, SCAN_TIMINGS.phaseSwapMs);

    try {
      const [result] = await Promise.all([
        Promise.resolve(
          this.#engine.scan(
            sourceText,
            this.#state().groupPreferences,
            buildScanScopeSelection(
              this.#state().countryProfileIds,
              this.#state().detectionMode
            ),
            scannedAt
          )
        ),
        waitFor(SCAN_TIMINGS.minimumSpinnerMs),
      ]);

      if (refreshRequestId !== this.#refreshRequestId) {
        clearTimeout(phaseTimer);
        return false;
      }

      clearTimeout(phaseTimer);
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
      clearTimeout(phaseTimer);
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

  public regenerateAllMasks(): void {
    const result = this.#state().result;
    if (!result) return;

    this.#state.update(state => ({
      ...state,
      result: this.#engine.regenerateAll(result.sourceText, result.matches, result.scannedAt),
    }));
  }

  public regenerateMatch(matchId: string): void {
    const result = this.#state().result;
    if (!result) return;

    this.#state.update(state => ({
      ...state,
      result: this.#engine.regenerateMatch(
        result.sourceText,
        result.matches,
        result.scannedAt,
        matchId
      ),
    }));
  }

  public scheduleRefresh(delayMs: number = SCAN_TIMINGS.autoRefreshDebounceMs): void {
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

  public setCountryProfiles(countryProfileIds: readonly CountryProfileId[]): void {
    const currentState = this.#state(),
      normalizedCountryProfileIds = normalizeCountryProfileIds(countryProfileIds).length
        ? normalizeCountryProfileIds(countryProfileIds)
        : DEFAULT_COUNTRY_PROFILE_IDS;
    if (
      hasSameCountrySelection(currentState.countryProfileIds, normalizedCountryProfileIds)
    ) return;

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

    const matches = result.matches.map(match => {
      if (match.locked || !state.groupPreferences[match.groupId].enabled) return match;
      return { ...match, enabled };
    });

    this.#state.update(state => ({
      ...state,
      result: this.#engine.rebuild(result.sourceText, matches, result.scannedAt),
    }));
  }

  public toggleGroupAlwaysOn(groupId: MaskGroupId, alwaysOn: boolean): void {
    const nextPreferences = createGroupPreferenceMap({
      ...this.#state().groupPreferences,
      [groupId]: {
        alwaysOn,
        enabled: alwaysOn ? true : this.#state().groupPreferences[groupId].enabled,
      },
    });

    this.#state.update(state => {
      const currentResult = state.result,
        nextResult = currentResult
          ? this.#engine.rebuild(
              currentResult.sourceText,
              currentResult.matches.map(match => {
                if (match.groupId !== groupId) return match;
                return {
                  ...match,
                  enabled: alwaysOn ? true : match.enabled,
                  locked: alwaysOn,
                };
              }),
              currentResult.scannedAt
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
      nextPreferences = createGroupPreferenceMap({
        ...currentPreferences,
        [groupId]: {
          alwaysOn: enabled ? currentPreferences[groupId].alwaysOn : false,
          enabled,
        },
      });

    this.#state.update(state => {
      const currentResult = state.result,
        nextResult = currentResult
          ? this.#engine.rebuild(
              currentResult.sourceText,
              currentResult.matches.map(match => {
                if (match.groupId !== groupId) return match;
                return {
                  ...match,
                  enabled,
                  locked: enabled ? nextPreferences[groupId].alwaysOn : false,
                };
              }),
              currentResult.scannedAt
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

    const matches = result.matches.map(match => {
      if (match.id !== matchId || match.locked) return match;
      return { ...match, enabled };
    });

    this.#state.update(state => ({
      ...state,
      result: this.#engine.rebuild(result.sourceText, matches, result.scannedAt),
    }));
  }

  public updateSourceText(sourceText: string): void {
    const currentState = this.#state();

    this.#state.set({
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

  #setPhase(phase: ScanPhase): void {
    this.#state.update(state => ({
      ...state,
      scanPhase: phase,
      statusMessage: SCAN_PHASE_MESSAGES[phase],
    }));
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
  rightCountryProfileIds: readonly CountryProfileId[]
): boolean {
  if (leftCountryProfileIds.length !== rightCountryProfileIds.length) return false;
  return leftCountryProfileIds.every((countryProfileId, index) => {
    return countryProfileId === rightCountryProfileIds[index];
  });
}
