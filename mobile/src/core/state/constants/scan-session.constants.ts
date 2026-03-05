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
  autoRefreshDebounceMs: 180,
  minimumSpinnerMs: 120,
  phaseSwapMs: 180,
});

export const SESSION_STORAGE_KEYS = Object.freeze({
  countryProfileId: "llm-prompt-purify:country-profile:v1",
  countryProfileIds: "llm-prompt-purify:country-profiles:v2",
  detectionMode: "llm-prompt-purify:detection-mode:v1",
  groupPreferences: "llm-prompt-purify:group-preferences:v2",
  sourceText: "llm-prompt-purify:source-text:v2",
});
