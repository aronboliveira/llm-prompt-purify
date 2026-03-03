import type { ToastMessage } from "../../core/feedback/declarations/toast.types";
import type { MaskGroupSummary } from "../../core/masking/declarations/masking.types";
import { HELP_TOPICS } from "../../features/scanner/constants/help-topics.constants";

export const TEST_HELP_TOPIC = HELP_TOPICS.clientside;

export const TEST_MASK_GROUP_SUMMARIES: readonly MaskGroupSummary[] = Object.freeze([
  {
    alwaysOn: false,
    alwaysOnLabel: "Always keep masked",
    description: "API keys, bearer tokens, passwords, and other secrets.",
    enabled: true,
    id: "credential",
    label: "Credentials and API keys",
    matchCount: 3,
    supportsAlwaysOn: true,
    toggleLabel: "Mask this group",
  },
  {
    alwaysOn: false,
    description: "Government and tax identifiers stay protected unless disabled.",
    enabled: false,
    id: "identifier",
    label: "Personal identifiers",
    matchCount: 2,
    supportsAlwaysOn: false,
    toggleLabel: "Mask this group",
  },
]);

export const TEST_TOAST_MESSAGES: readonly ToastMessage[] = Object.freeze([
  {
    body: "The protected output is ready to paste.",
    id: "toast-success",
    title: "Protected prompt copied",
    tone: "success",
  },
  {
    body: "Clipboard access failed. Copy manually from the output block.",
    id: "toast-error",
    title: "Copy failed",
    tone: "error",
  },
]);
