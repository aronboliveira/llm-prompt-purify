import { computed, Injectable, signal } from "@angular/core";
import { rebuildScanResult, scanSensitiveText } from "../masking/masking.engine";
import { SESSION_STORAGE_KEYS } from "./scan-session.constants";
import type { ScanSessionState } from "./scan-session.types";

@Injectable({ providedIn: "root" })
export class ScanSessionService {
  readonly #state = signal<ScanSessionState>({
    errorMessage: null,
    isScanning: false,
    result: null,
    sourceText: this.#loadSourceText(),
  });

  public readonly state = this.#state.asReadonly();

  public readonly viewModel = computed(() => {
    const state = this.#state(),
      result = state.result;

    return {
      activeMatches: result?.enabledMatches ?? 0,
      canCopy: !!result,
      errorMessage: state.errorMessage,
      hasMatches: !!result?.hasMatches,
      hasResult: !!result,
      isScanning: state.isScanning,
      maskedText: result?.maskedText ?? "",
      matchCount: result?.totalMatches ?? 0,
      matches: result?.matches ?? [],
      scannedAt: result?.scannedAt ?? null,
      sourceText: state.sourceText,
    };
  });

  public clear(): void {
    this.#state.set({
      errorMessage: null,
      isScanning: false,
      result: null,
      sourceText: "",
    });
    this.#persistSourceText("");
  }

  public runScan(): void {
    const sourceText = this.#state().sourceText;
    if (!sourceText.trim()) {
      this.#state.update(state => ({
        ...state,
        errorMessage: "Paste content into the textarea before running the scan.",
        result: null,
      }));
      return;
    }

    this.#state.update(state => ({ ...state, errorMessage: null, isScanning: true }));
    try {
      const result = scanSensitiveText(sourceText);
      this.#state.update(state => ({
        ...state,
        errorMessage: null,
        isScanning: false,
        result,
      }));
    } catch (error) {
      this.#state.update(state => ({
        ...state,
        errorMessage:
          error instanceof Error
            ? error.message
            : "The scan failed before a safe output could be produced.",
        isScanning: false,
        result: null,
      }));
    }
  }

  public setAllMatchesEnabled(enabled: boolean): void {
    const result = this.#state().result;
    if (!result) return;

    const matches = result.matches.map(match => ({ ...match, enabled }));
    this.#state.update(state => ({
      ...state,
      result: rebuildScanResult(result.sourceText, matches, result.scannedAt),
    }));
  }

  public toggleMatch(matchId: string, enabled: boolean): void {
    const result = this.#state().result;
    if (!result) return;

    const matches = result.matches.map(match =>
      match.id === matchId ? { ...match, enabled } : match
    );

    this.#state.update(state => ({
      ...state,
      result: rebuildScanResult(result.sourceText, matches, result.scannedAt),
    }));
  }

  public updateSourceText(sourceText: string): void {
    const current = this.#state();
    this.#state.set({
      errorMessage: null,
      isScanning: false,
      result:
        current.result?.sourceText === sourceText
          ? current.result
          : null,
      sourceText,
    });
    this.#persistSourceText(sourceText);
  }

  #loadSourceText(): string {
    try {
      if (typeof sessionStorage === "undefined") return "";
      return sessionStorage.getItem(SESSION_STORAGE_KEYS.sourceText) ?? "";
    } catch {
      return "";
    }
  }

  #persistSourceText(sourceText: string): void {
    try {
      if (typeof sessionStorage === "undefined") return;
      if (sourceText)
        sessionStorage.setItem(SESSION_STORAGE_KEYS.sourceText, sourceText);
      else sessionStorage.removeItem(SESSION_STORAGE_KEYS.sourceText);
    } catch {
      // Storage is optional and must not block local masking.
    }
  }
}
