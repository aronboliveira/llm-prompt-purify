import { sanitizeCapturedValue } from "./mask-format.utils";

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
