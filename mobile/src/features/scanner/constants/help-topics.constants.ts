import type { HelpTopic, HelpTopicId } from "../declarations/help-topic.types";

export const HELP_TOPICS: Readonly<Record<HelpTopicId, HelpTopic>> = Object.freeze({
  clientside: {
    id: "clientside",
    paragraphs: [
      "Everything in this app runs on your device. The prompt stays local while the scanner detects and masks supported patterns.",
      "No server round-trip is required to produce the protected output. Local storage is only used to keep the current draft and panel choices between sessions.",
      "If you still see something sensitive in the result, stop there, keep the text local, and replace it manually before sending the prompt anywhere else.",
    ],
    title: "Why this is local-only",
  },
  controls: {
    id: "controls",
    paragraphs: [
      "Mask groups let you switch broad classes of sensitive data on or off without leaving the live workspace. Credentials stay stricter because they are the most likely to cause immediate leaks.",
      "Each match row shows the relationship between the generated mask and the original captured value in the format label(mask):original, so you can take off or regenerate exactly what you need.",
      "Every checkbox and regenerate action updates the protected output immediately. There is no separate review screen in this layout.",
    ],
    title: "How the mask controls work",
  },
  country: {
    id: "country",
    paragraphs: [
      "Use the country selector to choose one or more country scopes whose local identifiers are most likely to appear in the prompt. Shared global rules still run unless you switch the detector to global-only mode.",
      "Selecting multiple countries with different language families is supported, but it widens the rule set and may reduce precision. When possible, keep the scope inside one language family.",
      "Global-only mode keeps scanning for reusable patterns such as credentials, emails, payment strings, and shared labeled fields, but it skips country-specific document formats like CPF, CURP, RUT, DNI, Aadhaar, INN, or Chinese resident IDs.",
    ],
    title: "How country focus changes the scan",
  },
  coverage: {
    id: "coverage",
    paragraphs: [
      "Current coverage is strongest for Brazil, Portugal, Spain, Spanish-speaking Latin America, the United States, China, Russia, and India. The rules focus on credentials, identifiers, contact data, financial strings, and structured addresses.",
      "This is still pattern-based detection. Unsupported secrets, screenshots, prose-only descriptions, and uncommon document formats may pass through untouched even when a related country scope is enabled.",
      "The safest habit is still the same: keep the raw prompt local, inspect the protected output, and only then paste the masked result into the target LLM.",
    ],
    title: "What the scanner can still miss",
  },
  workflow: {
    id: "workflow",
    paragraphs: [
      "The intended path is: set the scope, paste the raw prompt, wait for the short local masking pass, adjust mask controls if needed, then copy the protected version.",
      "The output block is the only text you should paste into the external LLM. Copy actions always target that protected result, never the raw input.",
      "If the detector finds nothing supported, the app says so explicitly and the protected output will match the raw prompt for that pass.",
    ],
    title: "Recommended workflow",
  },
});
