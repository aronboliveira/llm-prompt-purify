export const WORKSPACE_COPY = Object.freeze({
  clientsideBody:
    "Masking runs on this device. The raw prompt stays local unless you copy text out of the app yourself.",
  clientsideTitle: "Everything stays on-device while you sanitize.",
  controlsBody:
    "Disable whole groups or individual masks below. Every checkbox updates the protected output immediately.",
  controlsTitle: "Mask controls",
  emptyOutput:
    "Paste the raw prompt in the input area and the protected version will appear here after the local masking pass.",
  heroBody:
    "This layout keeps the process short: paste raw text, let the local masking pass rebuild the protected output, remove or regenerate masks if needed, then copy only the protected result into the LLM.",
  heroTitle: "Keep the raw prompt local. Copy only the masked version.",
  languageWarning:
    "Selecting countries with different languages can widen the rule set and reduce masking precision. Prefer a single language family unless you need the overlap.",
  outputBody:
    "This output block is the only text meant to leave the app. If anything sensitive still shows up, change the controls before copying.",
  outputTitle: "Masked version",
  rawBody:
    "Paste the original prompt here. The output updates locally after a short spinner so you can inspect exactly what would be exposed.",
  rawTitle: "Raw version",
});
