/**
 * LLM Prompt Purifier - Configuration Constants
 * @version 1.3.0
 */

import type { Config, PatternDefinition } from "./types";

export const CONFIG: Readonly<Config> = Object.freeze({
  SCAN_INTERVAL_MS: 800,
  FADE_DELAY_MS: 2500,
  MAX_PROMPT_LENGTH: 5000,
  MAX_DETECTIONS_PREVIEW: 5,
  DEBOUNCE_MS: 300,
  TOAST_ID: "llm-purify-toast-root",
  SUGGESTIONS_ID: "llm-purify-suggestions-root",
  HINT_ID: "llm-purify-hint-root",
  QUICKBAR_ID: "llm-purify-quickbar-root",
});

export const PATTERNS: Readonly<Record<string, PatternDefinition>> =
  Object.freeze({
    // Common patterns (language-agnostic)
    EMAIL: {
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      label: "Email",
      mask: "[EMAIL]",
    },
    PHONE: {
      regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      label: "Phone",
      mask: "[PHONE]",
    },
    SSN: { regex: /\b\d{3}-\d{2}-\d{4}\b/g, label: "SSN", mask: "[SSN]" },
    CREDIT_CARD: {
      regex:
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      label: "Credit Card",
      mask: "[CARD-XXXX]",
    },

    // API Keys & Secrets
    API_KEY: {
      regex:
        /\b(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?\b/gi,
      label: "API Key",
      mask: "[API_KEY]",
    },
    AWS_KEY: {
      regex: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
      label: "AWS Key",
      mask: "[AWS_KEY]",
    },
    AWS_SECRET: {
      regex:
        /\baws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*[A-Za-z0-9/+=]{40}\b/gi,
      label: "AWS Secret",
      mask: "[AWS_SECRET]",
    },
    GITHUB_PAT: {
      regex: /\bgh[pous]_[A-Za-z0-9]{36,}\b/g,
      label: "GitHub Token",
      mask: "[GITHUB_TOKEN]",
    },
    GITLAB_PAT: {
      regex: /\bglpat-[A-Za-z0-9]{20}\b/g,
      label: "GitLab Token",
      mask: "[GITLAB_TOKEN]",
    },
    SLACK_TOKEN: {
      regex: /\bxox[baprs]-[A-Za-z0-9-]{10,48}\b/g,
      label: "Slack Token",
      mask: "[SLACK_TOKEN]",
    },
    STRIPE_KEY: {
      regex: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
      label: "Stripe Key",
      mask: "[STRIPE_KEY]",
    },
    GOOGLE_API: {
      regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
      label: "Google API Key",
      mask: "[GOOGLE_API_KEY]",
    },
    SENDGRID_KEY: {
      regex: /\bSG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\b/g,
      label: "SendGrid Key",
      mask: "[SENDGRID_KEY]",
    },
    TWILIO_SID: {
      regex: /\bAC[a-f0-9]{32}\b/g,
      label: "Twilio SID",
      mask: "[TWILIO_SID]",
    },
    OPENAI_KEY: {
      regex: /\bsk-[A-Za-z0-9]{48}\b/g,
      label: "OpenAI Key",
      mask: "[OPENAI_KEY]",
    },
    ANTHROPIC_KEY: {
      regex: /\bsk-ant-[A-Za-z0-9\-]{40,}\b/g,
      label: "Anthropic Key",
      mask: "[ANTHROPIC_KEY]",
    },

    // Crypto & Security
    JWT: {
      regex: /\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]+\b/g,
      label: "JWT Token",
      mask: "[JWT]",
    },
    PRIVATE_KEY: {
      regex: /-----BEGIN\s(?:RSA|EC|OPENSSH|DSA)?\s?PRIVATE KEY-----/gi,
      label: "Private Key",
      mask: "[PRIVATE_KEY]",
    },
    PEM_CERT: {
      regex: /-----BEGIN\sCERTIFICATE-----/gi,
      label: "Certificate",
      mask: "[CERTIFICATE]",
    },
    BITCOIN_ADDR: {
      regex: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g,
      label: "Bitcoin Address",
      mask: "[BTC_ADDR]",
    },
    ETH_ADDR: {
      regex: /\b0x[a-fA-F0-9]{40}\b/g,
      label: "Ethereum Address",
      mask: "[ETH_ADDR]",
    },

    // Personal Identifiers
    UUID: {
      regex:
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      label: "UUID",
      mask: "[UUID]",
    },
    MAC_ADDR: {
      regex: /\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b/gi,
      label: "MAC Address",
      mask: "[MAC_ADDR]",
    },
    IPV4: {
      regex:
        /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g,
      label: "IP Address",
      mask: "[IP_ADDR]",
    },

    // Brazil
    CPF: {
      regex: /\b\d{3}[.\-]?\d{3}[.\-]?\d{3}[\-]?\d{2}\b/g,
      label: "CPF",
      mask: "[CPF]",
    },
    CNPJ: {
      regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
      label: "CNPJ",
      mask: "[CNPJ]",
    },

    // Spain/Latin America
    DNI: { regex: /\b\d{8}[A-Z]\b/gi, label: "DNI", mask: "[DNI]" },
    NIE: { regex: /\b[XYZ]\d{7}[A-Z]\b/gi, label: "NIE", mask: "[NIE]" },
    CURP_MX: {
      regex: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g,
      label: "CURP",
      mask: "[CURP]",
    },

    // Banking
    IBAN: {
      regex:
        /\b[A-Z]{2}\d{2}[\s\-]?(?:[A-Z0-9]{4}[\s\-]?){2,7}[A-Z0-9]{1,4}\b/gi,
      label: "IBAN",
      mask: "[IBAN]",
    },
    SWIFT: {
      regex: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
      label: "SWIFT Code",
      mask: "[SWIFT]",
    },

    // URLs with credentials
    URL_WITH_CREDS: {
      regex: /\b(?:https?|ftp):\/\/[^:]+:[^@]+@[^\s]+\b/gi,
      label: "URL with Credentials",
      mask: "[URL_REDACTED]",
    },

    // Connection strings
    CONNECTION_STRING: {
      regex: /\b(?:mongodb|postgres|mysql|redis):\/\/[^\s]+:[^\s]+@[^\s]+\b/gi,
      label: "Connection String",
      mask: "[DB_CONNECTION]",
    },

    // Passwords in context
    PASSWORD_CONTEXT: {
      regex: /\b(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{6,}['"]?\b/gi,
      label: "Password",
      mask: "[PASSWORD]",
    },

    // Bearer tokens (non-JWT)
    BEARER_TOKEN: {
      regex: /\bBearer\s+([A-Za-z0-9\-._~+/]+=*)\b/g,
      label: "Bearer Token",
      mask: "[BEARER]",
    },

    // ─── Brazil (extended) ────────────────────────────────────────────
    BR_PHONE: {
      regex:
        /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}\b/g,
      label: "BR Phone",
      mask: "[BR_PHONE]",
    },
    PIS_PASEP: {
      regex: /\b\d{3}\.?\d{5}\.?\d{2}-?\d\b/g,
      label: "PIS/PASEP",
      mask: "[PIS]",
    },
    RG: {
      regex: /\b\d{2}\.?\d{3}\.?\d{3}-?[\dXx]\b/g,
      label: "RG",
      mask: "[RG]",
    },
    TITULO_ELEITOR: {
      regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
      label: "Titulo de Eleitor",
      mask: "[TITULO_ELEITOR]",
    },

    // ─── Latin America ────────────────────────────────────────────────
    CUIT: {
      regex: /\b(?:20|23|24|27|30|33|34)-?\d{8}-?\d\b/g,
      label: "CUIT",
      mask: "[CUIT]",
    },
    RUT_CL: {
      regex: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]\b/g,
      label: "RUT",
      mask: "[RUT]",
    },
    NIT_CO: {
      regex: /\b\d{9,10}-?\d\b/g,
      label: "NIT",
      mask: "[NIT]",
    },
    RUC_PE: {
      regex: /\b(?:10|15|17|20)\d{9}\b/g,
      label: "RUC",
      mask: "[RUC]",
    },

    // ─── Portugal ─────────────────────────────────────────────────────
    PT_NIF: {
      regex: /\b[1-3]\d{8}\b/g,
      label: "NIF",
      mask: "[NIF]",
    },
    PT_NISS: {
      regex: /\b[12]\d{10}\b/g,
      label: "NISS",
      mask: "[NISS]",
    },

    // ─── China ────────────────────────────────────────────────────────
    CN_RESIDENT_ID: {
      regex: /\b\d{17}[\dXx]\b/g,
      label: "CN Resident ID",
      mask: "[CN_ID]",
    },
    CN_PHONE: {
      regex: /\b(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b/g,
      label: "CN Phone",
      mask: "[CN_PHONE]",
    },

    // ─── Russia ───────────────────────────────────────────────────────
    RU_INN: {
      regex: /\b\d{12}\b|\b\d{10}\b/g,
      label: "INN",
      mask: "[INN]",
    },
    RU_SNILS: {
      regex: /\b\d{3}-\d{3}-\d{3}\s?\d{2}\b/g,
      label: "SNILS",
      mask: "[SNILS]",
    },

    // ─── India ────────────────────────────────────────────────────────
    IN_AADHAAR: {
      regex: /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g,
      label: "Aadhaar",
      mask: "[AADHAAR]",
    },
    IN_PAN: {
      regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
      label: "PAN",
      mask: "[PAN]",
    },
    IN_GSTIN: {
      regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Zz][A-Z0-9]\b/g,
      label: "GSTIN",
      mask: "[GSTIN]",
    },
  });

export const INPUT_SELECTORS: readonly string[] = Object.freeze([
  // ChatGPT / OpenAI
  "#prompt-textarea",
  '[data-testid="prompt-textarea"]',
  'form textarea[tabindex="0"]',
  // Claude / Anthropic
  '.ProseMirror[contenteditable="true"]',
  '[data-placeholder="How can Claude help you today?"]',
  // DeepSeek
  "#chat-input",
  '[data-testid="chat-input"]',
  // Gemini / Bard
  'rich-textarea[aria-label*="Enter a prompt"]',
  '[aria-label*="Enter a prompt"] textarea',
  'textarea[aria-label*="prompt"]',
  // Copilot / Bing
  "#searchbox",
  'textarea[id*="copilot"]',
  "cib-serp textarea",
  // Perplexity
  'textarea[placeholder*="Ask anything"]',
  'textarea[placeholder*="ask anything"]',
  // Poe
  'textarea[class*="ChatInput"]',
  '[class*="ChatMessageInputContainer"] textarea',
  // HuggingFace Chat
  'textarea[placeholder*="Ask"]',
  // Mistral
  '[data-testid="chat-input-textarea"]',
  // You.com
  'textarea[placeholder*="Ask me anything"]',
  // Character.AI
  'textarea[placeholder*="Message"]',
  // Grok / x.AI
  'textarea[placeholder*="Ask anything"]',
  '[data-testid="tweetTextarea_0"]',
  // Inflection Pi
  'textarea[placeholder*="Talk with Pi"]',
  // Cohere Coral
  'textarea[placeholder*="message"]',
  // Generic fallbacks
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"][data-lexical-editor="true"]',
  'textarea[aria-label*="chat"]',
  'textarea[aria-label*="Chat"]',
  'textarea[aria-label*="message"]',
  'textarea[aria-label*="Message"]',
  '[data-placeholder*="message"]',
  '[data-placeholder*="Message"]',
]);

export const ICONS: Readonly<Record<string, string>> = Object.freeze({
  warning:
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
  close:
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>',
  eye: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
  copy: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  check:
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  shield:
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  x: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
});
