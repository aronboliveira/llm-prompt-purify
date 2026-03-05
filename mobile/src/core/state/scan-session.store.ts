/**
 * Zustand store replacing Angular's ScanSessionService.
 *
 * Converts Angular signals + @Injectable to a plain Zustand store
 * that React Native components can subscribe to with selectors.
 */
import { create } from "zustand";

import {
  COUNTRY_PROFILE_DEFINITIONS,
  COUNTRY_PROFILE_ORDER,
  DEFAULT_COUNTRY_PROFILE_IDS,
  MASK_GROUP_DEFINITIONS,
  MASK_GROUP_ORDER,
} from "../masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
  ScanResult,
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

// ---------------------------------------------------------------------------
// Mask-safety hardening stub
// ---------------------------------------------------------------------------

/**
 * In the Angular app, MaskSafetyHardeningService calls a backend API
 * to validate that generated masks aren't compromising real identifiers.
 *
 * For the React Native offline-first version we stub this out as a
 * pass-through so the scan pipeline works identically. A real
 * implementation can be plugged in later via `setMaskSafetyHardener`.
 */
interface MaskSafetyHardener {
  hardenMatches(
    matches: readonly import("../masking/declarations/masking.types").ScanMatch[],
  ): Promise<{
    matches: readonly import("../masking/declarations/masking.types").ScanMatch[];
  }>;
}

const noopHardener: MaskSafetyHardener = {
  hardenMatches: async matches => ({ matches }),
};

let maskSafetyHardener: MaskSafetyHardener = noopHardener;

/** Plug in a real mask-safety hardener at runtime. */
export function setMaskSafetyHardener(hardener: MaskSafetyHardener): void {
  maskSafetyHardener = hardener;
}

// ---------------------------------------------------------------------------
// Engine singleton
// ---------------------------------------------------------------------------

const engine = new MaskingEngine();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

let refreshRequestId = 0;
let queuedRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function clearQueuedRefresh(): void {
  if (!queuedRefreshTimer) return;
  clearTimeout(queuedRefreshTimer);
  queuedRefreshTimer = null;
}

function cancelRefreshes(): void {
  clearQueuedRefresh();
  refreshRequestId += 1;
}

function hasSameCountrySelection(
  left: readonly CountryProfileId[],
  right: readonly CountryProfileId[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, i) => id === right[i]);
}

async function hardenResult(localResult: ScanResult): Promise<ScanResult> {
  const { matches } = await maskSafetyHardener.hardenMatches(
    localResult.matches,
  );
  return engine.rebuild(localResult.sourceText, matches, localResult.scannedAt);
}

// ---------------------------------------------------------------------------
// Store actions interface
// ---------------------------------------------------------------------------

interface ScanSessionActions {
  clear(): void;
  refreshMaskedOutput(): Promise<boolean>;
  regenerateAllMasks(): Promise<void>;
  regenerateMatch(matchId: string): Promise<void>;
  runScan(): Promise<boolean>;
  scheduleRefresh(delayMs?: number): void;
  setAllEditableMatchesEnabled(enabled: boolean): void;
  setCountryProfile(countryProfileId: CountryProfileId): void;
  setCountryProfiles(countryProfileIds: readonly CountryProfileId[]): void;
  setDetectionMode(detectionMode: DetectionMode): void;
  toggleGroupAlwaysOn(groupId: MaskGroupId, alwaysOn: boolean): void;
  toggleGroupEnabled(groupId: MaskGroupId, enabled: boolean): void;
  toggleMatch(matchId: string, enabled: boolean): void;
  updateSourceText(sourceText: string): void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ScanSessionStore = ScanSessionState & ScanSessionActions;

export const useScanSessionStore = create<ScanSessionStore>()((set, get) => ({
  // ---- Initial state ----
  countryProfileIds: loadPersistedCountryProfileIds(),
  detectionMode: loadPersistedDetectionMode(),
  errorMessage: null,
  groupPreferences: loadPersistedGroupPreferences(),
  isScanning: false,
  result: null,
  scanPhase: "idle" as ScanPhase,
  sourceText: loadPersistedSourceText(),
  statusMessage: SCAN_PHASE_MESSAGES.idle,

  // ---- Actions ----

  clear() {
    cancelRefreshes();
    set({
      errorMessage: null,
      isScanning: false,
      result: null,
      scanPhase: "idle",
      sourceText: "",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistSourceText("");
  },

  async refreshMaskedOutput(): Promise<boolean> {
    clearQueuedRefresh();
    const { sourceText } = get();
    if (!sourceText.trim()) {
      set({
        errorMessage: null,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      });
      return false;
    }

    const scannedAt = new Date().toISOString();
    const localRequestId = ++refreshRequestId;
    set({
      errorMessage: null,
      isScanning: true,
      scanPhase: "detecting",
      statusMessage: SCAN_PHASE_MESSAGES.detecting,
    });

    try {
      const { groupPreferences, countryProfileIds, detectionMode } = get();
      const localResult = engine.scan(
        sourceText,
        groupPreferences,
        buildScanScopeSelection(countryProfileIds, detectionMode),
        scannedAt,
      );

      set({
        scanPhase: "validating",
        statusMessage: SCAN_PHASE_MESSAGES.validating,
      });

      const [result] = await Promise.all([
        hardenResult(localResult),
        waitFor(SCAN_TIMINGS.minimumSpinnerMs),
      ]);

      if (localRequestId !== refreshRequestId) return false;

      set({
        errorMessage: null,
        isScanning: false,
        result,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      });
      return true;
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "The local scan failed before a protected output could be produced.",
        isScanning: false,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      });
      return false;
    }
  },

  async runScan(): Promise<boolean> {
    return get().refreshMaskedOutput();
  },

  async regenerateAllMasks(): Promise<void> {
    const { result } = get();
    if (!result) return;

    set({
      errorMessage: null,
      isScanning: true,
      scanPhase: "validating",
      statusMessage: SCAN_PHASE_MESSAGES.validating,
    });

    try {
      const nextResult = await hardenResult(
        engine.regenerateAll(
          result.sourceText,
          result.matches,
          result.scannedAt,
        ),
      );
      set({
        isScanning: false,
        result: nextResult,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      });
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "The local mask regeneration failed before a new protected output could be produced.",
        isScanning: false,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      });
    }
  },

  async regenerateMatch(matchId: string): Promise<void> {
    const { result } = get();
    if (!result) return;

    set({
      errorMessage: null,
      isScanning: true,
      scanPhase: "validating",
      statusMessage: SCAN_PHASE_MESSAGES.validating,
    });

    try {
      const nextResult = await hardenResult(
        engine.regenerateMatch(
          result.sourceText,
          result.matches,
          result.scannedAt,
          matchId,
        ),
      );
      set({
        isScanning: false,
        result: nextResult,
        scanPhase: "ready",
        statusMessage: SCAN_PHASE_MESSAGES.ready,
      });
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "That mask could not be regenerated safely.",
        isScanning: false,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      });
    }
  },

  scheduleRefresh(delayMs = SCAN_TIMINGS.autoRefreshDebounceMs) {
    clearQueuedRefresh();
    const { sourceText } = get();

    if (!sourceText.trim()) {
      set({
        errorMessage: null,
        isScanning: false,
        result: null,
        scanPhase: "idle",
        statusMessage: SCAN_PHASE_MESSAGES.idle,
      });
      return;
    }

    set({
      errorMessage: null,
      isScanning: true,
      scanPhase: "detecting",
      statusMessage: SCAN_PHASE_MESSAGES.detecting,
    });

    queuedRefreshTimer = setTimeout(() => {
      queuedRefreshTimer = null;
      void get().refreshMaskedOutput();
    }, delayMs);
  },

  setCountryProfile(countryProfileId: CountryProfileId) {
    get().setCountryProfiles([countryProfileId]);
  },

  setCountryProfiles(countryProfileIds: readonly CountryProfileId[]) {
    const currentState = get();
    const normalized = normalizeCountryProfileIds(countryProfileIds).length
      ? normalizeCountryProfileIds(countryProfileIds)
      : DEFAULT_COUNTRY_PROFILE_IDS;

    if (hasSameCountrySelection(currentState.countryProfileIds, normalized))
      return;

    set({
      countryProfileIds: normalized,
      errorMessage: null,
      scanPhase: "idle",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistCountryProfileIds(normalized);

    if (currentState.sourceText.trim()) get().scheduleRefresh();
  },

  setDetectionMode(detectionMode: DetectionMode) {
    const currentState = get();
    if (currentState.detectionMode === detectionMode) return;

    set({
      detectionMode,
      errorMessage: null,
      scanPhase: "idle",
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistDetectionMode(detectionMode);

    if (currentState.sourceText.trim()) get().scheduleRefresh();
  },

  setAllEditableMatchesEnabled(enabled: boolean) {
    const { result, groupPreferences } = get();
    if (!result) return;

    const matches = setAllEditableMatchesEnabled(
      result.matches,
      groupPreferences,
      enabled,
    );
    set({
      result: engine.rebuild(result.sourceText, matches, result.scannedAt),
    });
  },

  toggleGroupAlwaysOn(groupId: MaskGroupId, alwaysOn: boolean) {
    const { groupPreferences, result } = get();
    const nextPreferences = computeNextAlwaysOnPreferences(
      groupPreferences,
      groupId,
      alwaysOn,
    );

    const nextResult = result
      ? engine.rebuild(
          result.sourceText,
          applyAlwaysOnToMatches(result.matches, groupId, alwaysOn),
          result.scannedAt,
        )
      : null;

    set({ groupPreferences: nextPreferences, result: nextResult });
    persistGroupPreferences(nextPreferences);
  },

  toggleGroupEnabled(groupId: MaskGroupId, enabled: boolean) {
    const { groupPreferences, result } = get();
    const nextPreferences = computeNextEnabledPreferences(
      groupPreferences,
      groupId,
      enabled,
    );

    const nextResult = result
      ? engine.rebuild(
          result.sourceText,
          applyEnabledToMatches(
            result.matches,
            groupId,
            enabled,
            nextPreferences[groupId].alwaysOn,
          ),
          result.scannedAt,
        )
      : null;

    set({ groupPreferences: nextPreferences, result: nextResult });
    persistGroupPreferences(nextPreferences);
  },

  toggleMatch(matchId: string, enabled: boolean) {
    const { result } = get();
    if (!result) return;

    const matches = toggleMatchEnabled(result.matches, matchId, enabled);
    set({
      result: engine.rebuild(result.sourceText, matches, result.scannedAt),
    });
  },

  updateSourceText(sourceText: string) {
    set({
      errorMessage: null,
      isScanning: false,
      result: sourceText.trim() ? get().result : null,
      scanPhase: "idle",
      sourceText,
      statusMessage: SCAN_PHASE_MESSAGES.idle,
    });
    persistSourceText(sourceText);

    if (sourceText.trim()) get().scheduleRefresh();
    else cancelRefreshes();
  },
}));

// ---------------------------------------------------------------------------
// Derived view model selector
// ---------------------------------------------------------------------------

/**
 * Derives the ScanSessionViewModel from the store state.
 * Use with `useScanSessionStore(selectViewModel)`.
 */
export function selectViewModel(state: ScanSessionStore): ScanSessionViewModel {
  const result = state.result;
  const countryProfiles = COUNTRY_PROFILE_ORDER.map(countryProfileId => {
    const definition = COUNTRY_PROFILE_DEFINITIONS[countryProfileId];
    return {
      ...definition,
      selected: state.countryProfileIds.includes(definition.id),
    };
  });
  const selectedCountryProfiles = countryProfiles.filter(cp => cp.selected);
  const groups = MASK_GROUP_ORDER.map(groupId => {
    const preference = state.groupPreferences[groupId];
    const definition = MASK_GROUP_DEFINITIONS[groupId];
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
    editableMatches: result?.matches.filter(m => !m.locked).length ?? 0,
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
}
