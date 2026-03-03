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

export function isLikelyBrazilianStateId(value: string): boolean {
  const normalized = value.replace(/[^0-9X]/giu, "").toUpperCase(),
    digitsOnly = normalized.replace(/X/g, "");

  return /^\d{7,9}[\dX]?$/u.test(normalized) && !/^(\d)\1+$/u.test(digitsOnly);
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

export function isValidChileanRut(value: string): boolean {
  const normalized = value.replace(/[.\-]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/u.test(normalized)) return false;

  const body = normalized.slice(0, -1),
    verifier = normalized.slice(-1);
  let sum = 0,
    multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11),
    expectedVerifier =
      remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return verifier === expectedVerifier;
}

export function isValidPisPasep(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    total = Array.from(digits.slice(0, 10)).reduce((sum, digit, index) => {
      return sum + Number(digit) * weights[index];
    }, 0),
    remainder = 11 - (total % 11),
    verifier = remainder === 10 || remainder === 11 ? 0 : remainder;

  return Number(digits[10]) === verifier;
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

export function looksLikeBrazilianVoterId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{12}$/u.test(digits) && !/^(\d)\1+$/u.test(digits);
}

export function looksLikeLatamNationalId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{6,12}$/u.test(digits) && !/^(\d)\1+$/u.test(digits);
}

export function looksLikeLatamTaxId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{11,13}$/u.test(digits) && !/^(\d)\1+$/u.test(digits);
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
