import { MASK_CHARACTER_SETS } from "./masking.constants";
import type { DetectionRule, ScanMatch } from "./masking.types";

interface CandidateMatch {
  rule: DetectionRule;
  start: number;
  end: number;
  value: string;
}

export function applyEnabledMasks(
  sourceText: string,
  matches: readonly ScanMatch[]
): string {
  const enabledMatches = [...matches]
    .filter(match => match.enabled)
    .sort((left, right) => left.start - right.start);

  if (!enabledMatches.length) return sourceText;

  let cursor = 0,
    maskedText = "";
  for (const match of enabledMatches) {
    maskedText += sourceText.slice(cursor, match.start);
    maskedText += match.mask;
    cursor = match.end;
  }
  maskedText += sourceText.slice(cursor);
  return maskedText;
}

export function createMask(value: string): string {
  return Array.from(value).map(remapCharacter).join("");
}

export function extractCandidateMatch(
  match: RegExpMatchArray,
  rule: DetectionRule
): CandidateMatch | null {
  if (typeof match.index !== "number") return null;

  if (typeof rule.valueGroup !== "number") {
    const value = sanitizeCapturedValue(match[0]);
    return value
      ? {
          end: match.index + value.length,
          rule,
          start: match.index,
          value,
        }
      : null;
  }

  const capturedValue = sanitizeCapturedValue(match[rule.valueGroup] ?? "");
  if (!capturedValue) return null;

  const relativeIndex = match[0].indexOf(capturedValue);
  if (relativeIndex < 0) return null;

  const start = match.index + relativeIndex;
  return {
    end: start + capturedValue.length,
    rule,
    start,
    value: capturedValue,
  };
}

export function isLikelyCreditCard(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length < 13 || digitsOnly.length > 19) return false;

  let checksum = 0,
    shouldDouble = false;
  for (let index = digitsOnly.length - 1; index >= 0; index -= 1) {
    let digit = parseInt(digitsOnly[index], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    checksum += digit;
    shouldDouble = !shouldDouble;
  }
  return checksum % 10 === 0;
}

export function isLikelyIban(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) return false;

  const rearranged = `${normalized.slice(4)}${normalized.slice(0, 4)}`;
  let numeric = "";
  for (const character of rearranged) {
    numeric += /[A-Z]/.test(character)
      ? (character.charCodeAt(0) - 55).toString()
      : character;
  }

  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

export function isLikelyPhoneNumber(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 13;
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    secondWeights = [6, ...firstWeights];

  const firstDigit = calculateWeightedDigit(digits.slice(0, 12), firstWeights),
    secondDigit = calculateWeightedDigit(
      `${digits.slice(0, 12)}${firstDigit}`,
      secondWeights
    );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const firstDigit = calculateCpfDigit(digits.slice(0, 9), 10),
    secondDigit = calculateCpfDigit(`${digits.slice(0, 9)}${firstDigit}`, 11);

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function looksLikeStructuredAddress(value: string): boolean {
  const normalized = sanitizeCapturedValue(value);
  if (normalized.length < 8 || normalized.length > 120) return false;
  return /[\d,#-]/.test(normalized) ||
    /\b(?:apto|avenida|bairro|bloco|calle|casa|city|drive|estrada|road|rua|st|street)\b/iu.test(
      normalized
    );
}

export function looksLikeStructuredName(value: string): boolean {
  const normalized = sanitizeCapturedValue(value).replace(/\s+/g, " ");
  if (normalized.length < 5 || normalized.length > 80) return false;

  const parts = normalized.split(" ");
  return parts.length >= 2 &&
    parts.every(part => /^[\p{L}][\p{L}'-]{0,30}$/u.test(part));
}

export function looksSecretLike(value: string): boolean {
  const normalized = sanitizeCapturedValue(value);
  if (normalized.length < 8) return false;

  const hasDigit = /\d/.test(normalized),
    hasLower = /[a-z]/.test(normalized),
    hasSymbol = /[^A-Za-z0-9]/.test(normalized),
    hasUpper = /[A-Z]/.test(normalized);

  return [hasDigit, hasLower, hasSymbol, hasUpper].filter(Boolean).length >= 2;
}

export function redactPreview(value: string): string {
  if (value.length <= 6) return value[0] ? `${value[0]}***` : "";
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function resolveOverlaps(
  candidates: readonly CandidateMatch[]
): readonly CandidateMatch[] {
  if (candidates.length <= 1) return [...candidates];

  const sorted = [...candidates].sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start;
    if (left.rule.priority !== right.rule.priority)
      return right.rule.priority - left.rule.priority;
    return right.value.length - left.value.length;
  });

  const resolved: CandidateMatch[] = [];
  for (const candidate of sorted) {
    const previous = resolved.at(-1);
    if (!previous || candidate.start >= previous.end) {
      resolved.push(candidate);
      continue;
    }

    if (scoreCandidate(candidate) > scoreCandidate(previous))
      resolved[resolved.length - 1] = candidate;
  }

  return resolved.sort((left, right) => left.start - right.start);
}

function calculateCpfDigit(value: string, factor: number): number {
  const total = Array.from(value).reduce((sum, digit, index) => {
    return sum + Number(digit) * (factor - index);
  }, 0);

  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function calculateWeightedDigit(value: string, weights: readonly number[]): number {
  const total = Array.from(value).reduce((sum, digit, index) => {
    return sum + Number(digit) * weights[index];
  }, 0);

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function pickRandom(characterSet: string): string {
  const index = randomNumber(characterSet.length);
  return characterSet[index];
}

function randomNumber(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function remapCharacter(character: string): string {
  if (/\d/u.test(character)) return pickRandom(MASK_CHARACTER_SETS.digits);
  if (/\p{Lu}/u.test(character)) return pickRandom(MASK_CHARACTER_SETS.uppercase);
  if (/\p{Ll}/u.test(character)) return pickRandom(MASK_CHARACTER_SETS.lowercase);
  if (/\s/u.test(character)) return character;
  return pickRandom(MASK_CHARACTER_SETS.symbols);
}

function sanitizeCapturedValue(value: string): string {
  return value.trim().replace(/[;:,]+$/g, "");
}

function scoreCandidate(candidate: CandidateMatch): number {
  return candidate.rule.priority * 1000 + candidate.value.length;
}
