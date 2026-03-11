/**
 * Masking strategy utilities.
 *
 * Each strategy function receives the raw detected value and the rule metadata,
 * and returns the replacement string to splice into the output.
 */
import {
  CATEGORY_TAG_LABELS,
  RULE_TAG_MAP,
} from "../constants/masking.constants";
import type {
  MatchCategory,
  MaskingStrategy,
  ScanMatch,
  XmlWrapTag,
} from "../declarations/masking.types";
import { createDistinctMask } from "./mask-format.utils";

// ─── Tag Strategy ────────────────────────────────────────────────────────────

/**
 * Returns `<TAG_NAME>` based on the detection rule ID or category fallback.
 */
export function createTagMask(ruleId: string, category: MatchCategory): string {
  const tagName =
    RULE_TAG_MAP[ruleId] ?? CATEGORY_TAG_LABELS[category] ?? "REDACTED";
  return `<${tagName}>`;
}

// ─── Faker Strategy ──────────────────────────────────────────────────────────

/**
 * Detailed mapping of detection rule IDs to privacy-safe string tags.
 * This covers natural strings (like names, addresses) and numeric data
 * (like IDs, phones) specifically per country/region, ensuring outputs
 * are immediately recognizable as placeholders and never violate privacy
 * by accidentally generating real existing numbers.
 */
const FAKER_CATEGORY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  // Global / Shared String & Numeric Formats
  "email-address": "EMAIL",
  "labeled-phone": "PHONE",
  "labeled-name": "NAME",
  "labeled-address": "ADDRESS",
  "labeled-passport": "PASSPORT",
  "credit-card": "CREDIT_CARD",
  iban: "IBAN",

  // Credentials
  "jwt-token": "JWT",
  "openai-style-key": "OPENAI_KEY",
  "aws-access-key": "AWS_ACCESS",
  "aws-secret-key": "AWS_SECRET",
  "github-pat": "GITHUB_PAT",
  "slack-webhook": "SLACK_WEBHOOK",
  "secret-assignment": "SECRET",
  "bearer-token": "BEARER",

  // United States (US)
  "us-ssn": "SSN",
  "us-phone": "US_PHONE",

  // Brazil (BR)
  cpf: "CPF",
  cnpj: "CNPJ",
  "br-phone": "BR_PHONE",
  "cep-labeled": "CEP",
  "cnh-labeled": "CNH",
  "pis-pasep-labeled": "PIS_PASEP",
  "rg-labeled": "RG",
  "titulo-eleitor-labeled": "TITULO_ELEITOR",

  // Latin America & Spain (ES, AR, CL, CO, MX, PE)
  "chile-rut": "RUT",
  curp: "CURP",
  rfc: "RFC",
  cuit: "CUIT",
  nit: "NIT",
  "cedula-labeled": "CEDULA",
  "dni-labeled": "DNI",
  "ruc-labeled": "RUC",
  "es-dni-labeled": "ES_DNI",
  "es-nie-labeled": "NIE",

  // Portugal (PT)
  "pt-nif-labeled": "NIF",
  "pt-niss-labeled": "NISS",

  // China (CN)
  "cn-resident-id-labeled": "CN_RESIDENT_ID",
  "cn-phone": "CN_PHONE",

  // Russia (RU)
  "ru-inn-labeled": "INN",
  "ru-snils-labeled": "SNILS",

  // India (IN)
  "in-aadhaar-labeled": "AADHAAR",
  "in-pan-labeled": "PAN",
  "in-gstin-labeled": "GSTIN",

  // Category Level Fallbacks
  personal: "PII",
  financial: "FINANCIAL",
  identifier: "ID",
  location: "LOCATION",
  credential: "CREDENTIAL",
});

import type { FakerCounterState, BlocklistHit } from "../declarations/strategy.types";

export type { FakerCounterState, BlocklistHit };

/**
 * Creates a fresh counter state for a new scan session.
 */
export function createFakerCounterState(): FakerCounterState {
  return { counters: new Map() };
}

/**
 * Gets the next counter value for a category label and increments it.
 */
function getNextCounter(state: FakerCounterState, label: string): number {
  const current = state.counters.get(label) ?? 0,
    next = current + 1;
  state.counters.set(label, next);
  return next;
}

/**
 * Determines the faker category label from a rule ID.
 */
function getFakerLabel(ruleId: string, category: MatchCategory): string {
  // Try to match specific rule patterns
  for (const [pattern, label] of Object.entries(FAKER_CATEGORY_LABELS)) {
    if (ruleId.includes(pattern)) return label;
  }
  // Fall back to category-level label
  return FAKER_CATEGORY_LABELS[category] ?? "DADO";
}

/**
 * Generates a privacy-safe synthetic replacement using the counter-based
 * `{CATEGORY_LABEL}{N}` format.
 *
 * The only exception is emails, which use obvious fake domains like
 * @example.com that are clearly distinguishable from real addresses.
 *
 * @param value - The original detected value
 * @param ruleId - The detection rule ID
 * @param category - The match category
 * @param counterState - Counter state for tracking occurrences
 */
export function createFakerMask(
  value: string,
  ruleId: string,
  category: MatchCategory,
  counterState?: FakerCounterState,
): string {
  // Emails are safe to generate with obvious fake domains
  if (
    ruleId.includes("email") ||
    (category === "personal" && looksLikeEmail(value))
  ) {
    return fakeEmail(counterState);
  }

  // All other categories use the safe {LABEL}{N} format
  const label = getFakerLabel(ruleId, category),
    counter = counterState ? getNextCounter(counterState, label) : 1;
  return `{${label}${counter}}`;
}

// ─── Redaction Strategy ──────────────────────────────────────────────────────

const REDACTION_CHAR = "█";

/**
 * Replaces the entire value with a solid block of the same character length.
 */
export function createRedactedMask(value: string): string {
  return REDACTION_CHAR.repeat(value.length);
}

// ─── Mandatory Numeric Compliance Masking ───────────────────────────────────

/**
 * Rotating symbol set for numeric compliance masking.
 * Uses multiple visually distinct symbols so the output is immediately
 * recognisable as synthetic and never mistaken for a plausible number.
 */
const NUMERIC_COMPLIANCE_SYMBOLS = ["#", "@", "*", "$"] as const;

/**
 * Compliance guardrail:
 * Financial / identifier values that contain digits are always transformed
 * to clearly non-real placeholders using rotating multi-symbol replacement,
 * regardless of selected masking strategy.
 *
 * Digits and letters are replaced with a cycling sequence of symbols
 * (e.g. `###.@@@.***-$$`) so the output can never be confused with a
 * real document number.
 */
export function createNumericComplianceMask(value: string): string {
  let symbolIndex = 0;
  const masked = Array.from(value, character => {
    if (/[\p{L}\p{N}]/u.test(character)) {
      const sym =
        NUMERIC_COMPLIANCE_SYMBOLS[
          symbolIndex % NUMERIC_COMPLIANCE_SYMBOLS.length
        ];
      symbolIndex++;
      return sym;
    }
    return character;
  }).join("");

  return symbolIndex > 0
    ? masked
    : NUMERIC_COMPLIANCE_SYMBOLS.join("")
        .repeat(
          Math.ceil(
            Math.max(value.length, 4) / NUMERIC_COMPLIANCE_SYMBOLS.length,
          ),
        )
        .slice(0, Math.max(value.length, 4));
}

function shouldForceNumericComplianceMask(
  value: string,
  category: MatchCategory,
): boolean {
  if (category !== "financial" && category !== "identifier") return false;
  return /\d/u.test(value);
}

// ─── Strategy Dispatcher ─────────────────────────────────────────────────────

/**
 * Creates a mask for a given value according to the selected strategy.
 *
 * @param value - The original detected value
 * @param ruleId - The detection rule ID
 * @param category - The match category
 * @param strategy - The masking strategy to use
 * @param previousMask - For "random" strategy, avoids generating the same mask
 * @param fakerCounterState - For "faker" strategy, tracks category counters
 */
export function createMaskForStrategy(
  value: string,
  ruleId: string,
  category: MatchCategory,
  strategy: MaskingStrategy,
  previousMask?: string,
  fakerCounterState?: FakerCounterState,
): string {
  if (shouldForceNumericComplianceMask(value, category)) {
    return createNumericComplianceMask(value);
  }

  // Emails always get obviously-fake format regardless of strategy
  if (
    ruleId.includes("email") ||
    (category === "personal" && looksLikeEmail(value))
  ) {
    if (strategy === "redacted") return createRedactedMask(value);
    if (strategy === "tags") return createTagMask(ruleId, category);
    return fakeEmail(fakerCounterState);
  }

  // JWT tokens → low-entropy obvious fakes
  if (ruleId === "jwt-token") {
    if (strategy === "redacted") return createRedactedMask(value);
    if (strategy === "tags") return createTagMask(ruleId, category);
    return createLowEntropyJwtMask(fakerCounterState);
  }

  // Webhook URLs → obviously fake placeholder
  if (ruleId === "slack-webhook") {
    if (strategy === "redacted") return createRedactedMask(value);
    if (strategy === "tags") return createTagMask(ruleId, category);
    return createLowEntropyWebhookMask(fakerCounterState);
  }

  // Bearer tokens → low-entropy placeholder
  if (ruleId === "bearer-token") {
    if (strategy === "redacted") return createRedactedMask(value);
    if (strategy === "tags") return createTagMask(ruleId, category);
    return createLowEntropyBearerMask(fakerCounterState);
  }

  switch (strategy) {
    case "tags":
      return createTagMask(ruleId, category);
    case "faker":
      return createFakerMask(value, ruleId, category, fakerCounterState);
    case "redacted":
      return createRedactedMask(value);
    case "random":
    default:
      return createDistinctMask(value, previousMask);
  }
}

// ─── XML Wrapping ────────────────────────────────────────────────────────────

/**
 * Wraps the given text in an XML tag pair.
 */
export function wrapInXmlTag(text: string, tag: XmlWrapTag): string {
  return `<${tag}>\n${text}\n</${tag}>`;
}

// ─── Blocklist / Ignore-list Application ─────────────────────────────────────

/**
 * Scans `sourceText` for any keyword-blocklist entries and returns additional
 * `ScanMatch`-like objects for splicing. Matches are case-insensitive.
 */
export function findBlocklistMatches(
  sourceText: string,
  blocklist: readonly string[],
): readonly BlocklistHit[] {
  if (!blocklist.length) return [];

  const hits: BlocklistHit[] = [];
  for (const keyword of blocklist) {
    if (!keyword.trim()) continue;
    const escaped = escapeRegex(keyword.trim());
    const re = new RegExp(escaped, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(sourceText)) !== null) {
      hits.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        keyword: keyword.trim(),
      });
    }
  }

  return hits;
}

/**
 * Returns `true` when the match value is present in the global ignore list
 * (case-insensitive comparison).
 */
export function isIgnored(
  value: string,
  ignoreList: readonly string[],
): boolean {
  if (!ignoreList.length) return false;
  const lower = value.toLowerCase();
  return ignoreList.some(ignored => lower === ignored.toLowerCase());
}

// BlocklistHit type is re-exported from strategy.types.ts

// ─── Internal Faker Helpers ──────────────────────────────────────────────────

/**
 * Fake email domains that are obviously non-real per RFC 2606.
 * Using these ensures the generated email can never match a real address.
 * The domain names are intentionally long and conspicuous.
 */
export const FAKE_DOMAINS = [
  "INVALID-DOMAIN.example",
  "NOT-REAL-ADDR.example",
  "FAKE-MAILBOX.test.example",
  "REDACTED-EMAIL.example.net",
] as const;

export function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)];
}

export function randomInt(max: number): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function looksLikeEmail(value: string): boolean {
  return /@/.test(value) && /\./.test(value);
}

// ─── Low-Entropy Masks for High-Risk Tokens ──────────────────────────────────

/**
 * Returns an obviously fake JWT with structure preserved but all segments
 * replaced by repeating placeholder text. Immediately recognisable as synthetic.
 */
function createLowEntropyJwtMask(counterState?: FakerCounterState): string {
  const n = counterState ? getNextCounter(counterState, "JWT") : 1;
  return `eyJGQUtFX0pXVA.AAAA-BBBB-CCCC-FAKE-JWT-${n}.XXXX-YYYY-ZZZZ-NOT-REAL`;
}

/**
 * Returns an obviously fake Slack webhook URL.
 */
function createLowEntropyWebhookMask(counterState?: FakerCounterState): string {
  const n = counterState ? getNextCounter(counterState, "WEBHOOK") : 1;
  return `https://hooks.slack.com/services/TXXXXXXXX/BYYYYYYYY/FAKE-WEBHOOK-TOKEN-${n}`;
}

/**
 * Returns an obviously fake bearer token.
 */
function createLowEntropyBearerMask(counterState?: FakerCounterState): string {
  const n = counterState ? getNextCounter(counterState, "BEARER") : 1;
  return `FAKE-BEARER-TOKEN-${n}-XXXX-YYYY-ZZZZ-NOT-REAL`;
}

/**
 * Generates a fake email using RFC 2606 reserved domains.
 * Format: `xXx_user{N}_{HASH}@INVALID-DOMAIN.example`
 * — guaranteed non-existent and visually conspicuous.
 * The 4-char hex hash ensures regeneration always produces a distinct value.
 */
function fakeEmail(counterState?: FakerCounterState): string {
  const counter = counterState ? getNextCounter(counterState, "EMAIL") : 1,
    domain = pick(FAKE_DOMAINS),
    hex = randomInt(0xffff).toString(16).padStart(4, "0").toUpperCase();
  return `xXx_user${counter}_${hex}@${domain}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Credential Prefix Mangling ──────────────────────────────────────────────

/** Rule IDs whose label/prefix should be mangled alongside the value. */
const CREDENTIAL_PREFIX_RULE_IDS = new Set([
  "secret-assignment",
  "keyed-secret-assignment",
]);

/**
 * Mangles a credential label such as `senha_master` → `XXXXX_YYYYYY`,
 * preserving separators (`_`, `-`, `.`, ` `) but replacing all
 * alphanumeric runs with visually distinct placeholder characters.
 */
export function mangleCredentialPrefix(label: string): string {
  const replacementChars = ["X", "Y", "Z", "W"];
  let segmentIndex = 0;
  return label.replace(/[A-Za-z0-9]+/g, segment => {
    const ch = replacementChars[segmentIndex % replacementChars.length];
    segmentIndex++;
    return ch.repeat(segment.length);
  });
}

/**
 * Expands credential matches to include their label/prefix.
 *
 * For each credential match produced by `secret-assignment` or
 * `keyed-secret-assignment`, looks backward in the source text for the
 * `<label><delimiter>` portion and creates a new ScanMatch that covers
 * the prefix. The prefix mask is generated by {@link mangleCredentialPrefix}.
 */
export function expandCredentialPrefixes(
  sourceText: string,
  matches: readonly ScanMatch[],
): readonly ScanMatch[] {
  const prefixMatches: ScanMatch[] = [];

  for (const match of matches) {
    if (!CREDENTIAL_PREFIX_RULE_IDS.has(match.ruleId)) continue;

    // Look backward from the match start to find `label[:=]` with optional whitespace/quotes
    const searchStart = Math.max(0, match.start - 120),
      preceding = sourceText.slice(searchStart, match.start);

    // Match: <label> <delimiter> <optional quote/space>
    const labelRe = /(\S+)\s*[:=]\s*["']?\s*$/,
      labelHit = labelRe.exec(preceding);
    if (!labelHit || !labelHit[1]) continue;

    const label = labelHit[1],
      fullMatchText = labelHit[0],
      labelStart = searchStart + (labelHit.index ?? 0),
      labelEnd = labelStart + fullMatchText.length;

    // Avoid overlapping with the value match or duplicating
    if (labelEnd > match.start) continue;
    if (prefixMatches.some(pm => pm.start === labelStart)) continue;

    const mangledLabel = mangleCredentialPrefix(label),
      // Mangle everything including delimiter and quotes
      delimPart = fullMatchText.slice(label.length),
      mangledFull = mangledLabel + delimPart;

    prefixMatches.push({
      category: "credential",
      confidence: "high",
      enabled: true,
      end: labelEnd,
      groupId: "credential",
      id: `credential-prefix:${labelStart}:${labelEnd}`,
      label: "Credential prefix",
      locale: match.locale,
      locked: false,
      mask: mangledFull,
      ruleId: "credential-prefix",
      start: labelStart,
      value: fullMatchText,
    });
  }

  return prefixMatches;
}
