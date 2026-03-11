import { Injectable } from "@angular/core";

import type {
  ScanMatch,
  ScanResult,
} from "../masking/declarations/masking.types";
import { MaskingEngine } from "../masking/masking.engine";
import { buildScanScopeSelection } from "../masking/utils/country-scope.utils";
import type { ScanEngineParams } from "./declarations/scan-engine.types";

export type { ScanEngineParams } from "./declarations/scan-engine.types";

/**
 * LG-007: Extracted scan engine operations from ScanSessionService.
 * Handles pure scan logic without state management.
 */
@Injectable({ providedIn: "root" })
export class ScanEngineService {
  readonly #engine = new MaskingEngine();

  /**
   * Performs a fresh scan on the source text.
   */
  scan(
    params: ScanEngineParams,
    scannedAt = new Date().toISOString(),
  ): ScanResult {
    return this.#engine.scan(
      params.sourceText,
      params.groupPreferences,
      buildScanScopeSelection(params.countryProfileIds, params.detectionMode),
      scannedAt,
    );
  }

  /**
   * Regenerates all masks with new random values.
   */
  regenerateAll(result: ScanResult): ScanResult {
    return this.#engine.regenerateAll(
      result.sourceText,
      result.matches,
      result.scannedAt,
    );
  }

  /**
   * Regenerates a specific match's mask.
   */
  regenerateMatch(result: ScanResult, matchId: string): ScanResult {
    return this.#engine.regenerateMatch(
      result.sourceText,
      result.matches,
      result.scannedAt,
      matchId,
    );
  }

  /**
   * Rebuilds the result with updated matches (e.g., after toggles).
   */
  rebuild(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
  ): ScanResult {
    return this.#engine.rebuild(sourceText, matches, scannedAt);
  }
}
