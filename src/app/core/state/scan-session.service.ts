import { computed, Injectable, signal } from "@angular/core";
import {
  MASK_GROUP_DEFINITIONS,
  MASK_GROUP_ORDER,
} from "../masking/constants/masking.constants";
import { MaskingEngine } from "../masking/masking.engine";
import type { MaskGroupId } from "../masking/declarations/masking.types";
import { createGroupPreferenceMap } from "../masking/utils/mask-group.utils";
import { SCAN_PHASE_MESSAGES, SCAN_TIMINGS } from "./constants/scan-session.constants";
import type {
  ScanPhase,
  ScanSessionState,
  ScanSessionViewModel,
} from "./declarations/scan-session.types";
import {
  loadPersistedGroupPreferences,
  loadPersistedSourceText,
  persistGroupPreferences,
  persistSourceText,
} from "./utils/scan-session-storage.utils";
import { waitFor } from "./utils/timing.utils";

@Injectable({ providedIn: "root" })
export class ScanSessionService {
  readonly #engine = new MaskingEngine();
  readonly #state = signal<ScanSessionState>({
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
      sourceText: state.sourceText,
      statusMessage: state.errorMessage ?? state.statusMessage,
    };
  });

  public clear(): void {
    this.#state.set({
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

  public async runScan(): Promise<boolean> {
    const sourceText = this.#state().sourceText;
    if (!sourceText.trim()) {
      this.#state.update(state => ({
        ...state,
        errorMessage: "Paste the original prompt before running the local scan.",
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      }));
      return false;
    }

    const scannedAt = new Date().toISOString();
    this.#state.update(state => ({
      ...state,
      errorMessage: null,
      isScanning: true,
      result: null,
      scanPhase: "detecting",
      statusMessage: SCAN_PHASE_MESSAGES.detecting,
    }));

    const phaseTimer = setTimeout(() => {
      this.#setPhase("masking");
    }, SCAN_TIMINGS.phaseSwapMs);

    try {
      const [result] = await Promise.all([
        Promise.resolve(
          this.#engine.scan(sourceText, this.#state().groupPreferences, scannedAt)
        ),
        waitFor(SCAN_TIMINGS.minimumSpinnerMs),
      ]);

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
      errorMessage: null,
      groupPreferences: currentState.groupPreferences,
      isScanning: false,
      result:
        currentState.result?.sourceText === sourceText
          ? currentState.result
          : null,
      scanPhase: "idle",
      sourceText,
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistSourceText(sourceText);
  }

  #setPhase(phase: ScanPhase): void {
    this.#state.update(state => ({
      ...state,
      scanPhase: phase,
      statusMessage: SCAN_PHASE_MESSAGES[phase],
    }));
  }
}
