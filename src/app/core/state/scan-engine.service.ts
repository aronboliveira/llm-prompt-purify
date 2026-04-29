import { Injectable } from "@angular/core";

import type {
  ScanMatch,
  ScanResult,
} from "../masking/declarations/masking.types";
import { MaskingEngine } from "../masking/masking.engine";
import { buildScanScopeSelection } from "../masking/utils/country-scope.utils";
import type {
  ScanEngineParams,
  ScanWorkerRequest,
  ScanWorkerResponse,
} from "./declarations/scan-engine.types";

export type { ScanEngineParams } from "./declarations/scan-engine.types";

const WORKER_SCAN_MIN_CHARS = 256 * 1_024;

/**
 * LG-007: Extracted scan engine operations from ScanSessionService.
 * Handles pure scan logic without state management.
 */
@Injectable({ providedIn: "root" })
export class ScanEngineService {
  readonly #engine = new MaskingEngine();
  #nextWorkerRequestId = 0;
  #worker: Worker | null = null;
  readonly #workerRequests = new Map<
    number,
    {
      reject: (error: Error) => void;
      resolve: (result: ScanResult) => void;
    }
  >();

  /**
   * Performs a fresh scan on the source text.
   */
  scan(
    params: ScanEngineParams,
    scannedAt = new Date().toISOString(),
  ): Promise<ScanResult> | ScanResult {
    if (!this.#shouldUseWorker(params.sourceText)) {
      return this.scanSync(params, scannedAt);
    }

    return this.#scanInWorker(params, scannedAt).catch(() => {
      this.#disposeWorker();
      return this.scanSync(params, scannedAt);
    });
  }

  /**
   * Performs a fresh scan on the current thread.
   */
  scanSync(
    params: ScanEngineParams,
    scannedAt = new Date().toISOString(),
  ): ScanResult {
    return this.#engine.scan(
      params.sourceText,
      params.groupPreferences,
      buildScanScopeSelection(params.countryProfileIds, params.detectionMode),
      scannedAt,
      params.advancedPreferences,
    );
  }

  /**
   * Regenerates all masks with new random values.
   */
  regenerateAll(
    result: ScanResult,
    params: Pick<ScanEngineParams, "advancedPreferences" | "countryProfileIds">,
  ): ScanResult {
    return this.#engine.regenerateAll(
      result.sourceText,
      result.matches,
      result.scannedAt,
      params.advancedPreferences.maskingStrategy,
      params.advancedPreferences,
      params.countryProfileIds,
    );
  }

  /**
   * Regenerates a specific match's mask.
   */
  regenerateMatch(
    result: ScanResult,
    matchId: string,
    params: Pick<ScanEngineParams, "advancedPreferences" | "countryProfileIds">,
  ): ScanResult {
    return this.#engine.regenerateMatch(
      result.sourceText,
      result.matches,
      result.scannedAt,
      matchId,
      params.advancedPreferences.maskingStrategy,
      params.advancedPreferences,
      params.countryProfileIds,
    );
  }

  /**
   * Rebuilds the result with updated matches (e.g., after toggles).
   */
  rebuild(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
    advancedPreferences: ScanEngineParams["advancedPreferences"],
  ): ScanResult {
    return this.#engine.rebuild(
      sourceText,
      matches,
      scannedAt,
      advancedPreferences,
    );
  }

  #disposeWorker(): void {
    this.#worker?.terminate();
    this.#worker = null;

    for (const pending of this.#workerRequests.values()) {
      pending.reject(new Error("Scan worker was disposed."));
    }
    this.#workerRequests.clear();
  }

  async #getWorker(): Promise<Worker> {
    if (this.#worker) return this.#worker;

    const { createScanWorker } = await import("./scan-worker.factory");
    const worker = createScanWorker();
    worker.onmessage = event => this.#handleWorkerMessage(event);
    worker.onerror = () => this.#disposeWorker();
    this.#worker = worker;
    return worker;
  }

  #handleWorkerMessage(event: MessageEvent<ScanWorkerResponse>): void {
    const response = event.data,
      pending = this.#workerRequests.get(response.id);
    if (!pending) return;

    this.#workerRequests.delete(response.id);

    if ("error" in response) {
      pending.reject(new Error(response.error));
      return;
    }

    pending.resolve(response.result);
  }

  async #scanInWorker(
    params: ScanEngineParams,
    scannedAt: string,
  ): Promise<ScanResult> {
    const worker = await this.#getWorker(),
      id = ++this.#nextWorkerRequestId,
      request: ScanWorkerRequest = { id, params, scannedAt };

    return new Promise<ScanResult>((resolve, reject) => {
      this.#workerRequests.set(id, { reject, resolve });
      worker.postMessage(request);
    });
  }

  #shouldUseWorker(sourceText: string): boolean {
    return (
      typeof Worker !== "undefined" &&
      sourceText.length >= WORKER_SCAN_MIN_CHARS
    );
  }
}
