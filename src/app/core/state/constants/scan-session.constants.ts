export const SCAN_PHASE_MESSAGES = Object.freeze({
  detecting: "Scanning the text locally for risky patterns...",
  idle: "Paste the original prompt, then run a local scan.",
  masking: "Building the protected output and preparing review controls...",
  ready: "Protected output ready. Review masks, regenerate replacements if needed, then copy.",
});

export const SCAN_TIMINGS = Object.freeze({
  minimumSpinnerMs: 900,
  phaseSwapMs: 280,
});

export const SESSION_STORAGE_KEYS = Object.freeze({
  groupPreferences: "llm-prompt-purify:group-preferences:v2",
  sourceText: "llm-prompt-purify:source-text:v2",
});
