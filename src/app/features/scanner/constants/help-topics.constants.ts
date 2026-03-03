import type { HelpTopic, HelpTopicId } from "../declarations/help-topic.types";

export const HELP_TOPICS: Readonly<Record<HelpTopicId, HelpTopic>> = Object.freeze({
  clientside: {
    id: "clientside",
    paragraphs: [
      "Everything in this screen runs in the browser. The prompt stays on your machine while the scanner detects and masks supported patterns.",
      "No server round-trip is required to produce the protected output. Session storage is only used to keep the current draft and panel choices between refreshes.",
      "If you still see something sensitive in the result, stop there, keep the text local, and replace it manually before sending the prompt anywhere else.",
    ],
    title: "Why this is client-side only",
  },
  controls: {
    id: "controls",
    paragraphs: [
      "Mask groups let you quickly switch whole classes of data on or off. Credentials stay stricter because they are the most likely to cause immediate leaks.",
      "The per-match menu is where you can take off a single mask or regenerate a replacement if the current random token reads awkwardly in your prompt.",
      "Turning a group back on re-applies protection for that group in the current result. The source prompt itself is never rewritten.",
    ],
    title: "How the mask controls work",
  },
  coverage: {
    id: "coverage",
    paragraphs: [
      "Current coverage is strongest for American English, Brazilian Portuguese, and LatAm Spanish. The rules focus on credentials, personal identifiers, contact data, financial strings, and structured addresses.",
      "This is still pattern-based detection. Unsupported secrets, screenshots, prose-only descriptions, and uncommon document formats may pass through untouched.",
      "The safest habit is to scan, review the protected output, and only then paste the result into the target LLM.",
    ],
    title: "What the scanner can still miss",
  },
  workflow: {
    id: "workflow",
    paragraphs: [
      "The intended path is short: paste the original prompt, run the local scan, review the protected output, adjust masks if needed, then copy the safe version.",
      "The output block is the only text you should paste into the external LLM. Copy actions always target that protected result, never the raw input.",
      "If a scan finds nothing, the app tells you explicitly so you know the original and protected versions are identical for that pass.",
    ],
    title: "Recommended workflow",
  },
});
