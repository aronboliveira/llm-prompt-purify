export const SCAN_PHASE_MESSAGES = Object.freeze({
  detecting: "Scanning the text locally for risky patterns...",
  idle: "Pick the masking scope, paste the raw prompt, and the protected output will rebuild locally.",
  masking: "Building the protected output and updating the mask controls...",
  ready:
    "Protected output ready. Refine masks if needed, then copy only the protected text.",
  validating:
    "Checking generated masks against compromising-identifier safety validators...",
});

export const SCAN_TIMINGS = Object.freeze({
  autoRefreshDebounceMs: 900, // Default fallback debounce
  pasteDebounceMs: 350, // Paste: user expects result, but buffer briefly
  typingDebounceMs: 1400, // Keystroke: generous wait to avoid flickering
  deleteDebounceMs: 800, // Delete/backspace: moderate
  compositionDebounceMs: 1200, // IME composition: longest wait
  formatDebounceMs: 300, // Format events (bold, italic): minimal since no text change
  minimumSpinnerMs: 120, // Reduced from 520ms - adaptive spinner for small scans
  phaseSwapMs: 180, // Reduced from 280ms
});

export const SESSION_STORAGE_KEYS = Object.freeze({
  advancedPreferences: "llm-prompt-purify:advanced-preferences:v1",
  countryProfileId: "llm-prompt-purify:country-profile:v1",
  countryProfileIds: "llm-prompt-purify:country-profiles:v2",
  detectionMode: "llm-prompt-purify:detection-mode:v1",
  groupPreferences: "llm-prompt-purify:group-preferences:v2",
  sourceText: "llm-prompt-purify:source-text:v2",
});

export type { InputAction } from "../declarations/scan-session.types";

/**
 * Resolves the adaptive debounce delay for a given InputEvent.inputType.
 * Falls back to `autoRefreshDebounceMs` for unrecognised input types.
 *
 * When the InputEvent reports `isComposing === true`, the composition timer
 * is used unconditionally — the user is still interacting with the IME.
 */
export function resolveAdaptiveDebounceMs(
  inputType?: string,
  isComposing?: boolean,
): number {
  // IME composition always takes precedence over inputType classification
  if (isComposing) return SCAN_TIMINGS.compositionDebounceMs;

  if (!inputType) return SCAN_TIMINGS.autoRefreshDebounceMs;

  if (inputType.startsWith("insertFromPaste") || inputType === "insertFromDrop")
    return SCAN_TIMINGS.pasteDebounceMs;

  // Format events (bold, italic, etc.) don't change text content
  if (inputType.startsWith("format")) return SCAN_TIMINGS.formatDebounceMs;

  if (
    inputType.startsWith("delete") ||
    inputType === "historyUndo" ||
    inputType === "historyRedo"
  )
    return SCAN_TIMINGS.deleteDebounceMs;

  if (inputType === "insertCompositionText")
    return SCAN_TIMINGS.compositionDebounceMs;

  if (inputType === "insertText" || inputType === "insertLineBreak")
    return SCAN_TIMINGS.typingDebounceMs;

  return SCAN_TIMINGS.autoRefreshDebounceMs;
}
