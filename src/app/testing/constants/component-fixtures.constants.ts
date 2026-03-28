import type { ToastMessage } from "../../core/feedback/declarations/toast.types";
import type {
  CountryProfileSummary,
  MaskGroupSummary,
  ScanMatch,
} from "../../core/masking/declarations/masking.types";
import { HELP_TOPICS } from "../../features/scanner/constants/help-topics.constants";

export const TEST_HELP_TOPIC = HELP_TOPICS.clientside;

export const TEST_MASK_GROUP_SUMMARIES: readonly MaskGroupSummary[] =
  Object.freeze([
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
      description:
        "Government and tax identifiers stay protected unless disabled.",
      enabled: false,
      id: "identifier",
      label: "Personal identifiers",
      matchCount: 2,
      supportsAlwaysOn: false,
      toggleLabel: "Mask this group",
    },
  ]);

export const TEST_COUNTRY_PROFILES: readonly CountryProfileSummary[] =
  Object.freeze([
    {
      description:
        "Shared global rules plus Brazil-focused identifiers such as CPF and CNPJ.",
      flagEmoji: "🇧🇷",
      id: "br",
      label: "Brazil",
      languageFamily: "portuguese",
      languageLabel: "Portuguese",
      localeLabel: "PT-BR",
      selected: true,
    },
    {
      description:
        "Shared global rules plus Spain-focused identifiers such as DNI and NIE.",
      flagEmoji: "🇪🇸",
      id: "es",
      label: "Spain",
      languageFamily: "spanish",
      languageLabel: "Spanish",
      localeLabel: "ES-ES",
      selected: false,
    },
  ]);

export const TEST_SCAN_MATCHES: readonly ScanMatch[] = Object.freeze([
  {
    category: "credential",
    confidence: "high",
    enabled: true,
    end: 22,
    groupId: "credential",
    id: "openai-style-key:0:22",
    label: "API key",
    locale: "shared",
    locked: true,
    mask: "A1B2-C3D4",
    matchTags: [],
    ruleId: "openai-style-key",
    start: 0,
    value: "sk-proj-EXAMPLE123456",
  },
  {
    category: "identifier",
    confidence: "high",
    enabled: false,
    end: 44,
    groupId: "identifier",
    id: "cpf:24:44",
    label: "CPF",
    locale: "pt-BR",
    locked: false,
    mask: "9Z8Y7X",
    matchTags: [],
    ruleId: "cpf",
    start: 24,
    value: "529.982.247-25",
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
