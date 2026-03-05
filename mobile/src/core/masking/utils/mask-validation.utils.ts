/** Ported from Angular app. */
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

export function isValidArgentineCuit(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
    total = Array.from(digits.slice(0, 10)).reduce((sum, digit, index) => {
      return sum + Number(digit) * weights[index];
    }, 0),
    remainder = 11 - (total % 11),
    verifier = remainder === 11 ? 0 : remainder === 10 ? 9 : remainder;

  return Number(digits[10]) === verifier;
}

export function isValidChineseResidentId(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^\d{17}[\dX]$/u.test(normalized)) return false;

  const birthDate = normalized.slice(6, 14);
  if (!isValidIsoDateSegment(birthDate, "ymd")) return false;

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2],
    verifiers = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"],
    checksum = Array.from(normalized.slice(0, 17)).reduce((sum, digit, index) => {
      return sum + Number(digit) * weights[index];
    }, 0);

  return normalized[17] === verifiers[checksum % 11];
}

export function isValidColombianNit(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{8,10}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const body = digits.slice(0, -1),
    verifier = Number(digits.slice(-1)),
    weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3],
    weightOffset = weights.length - body.length,
    total = Array.from(body).reduce((sum, digit, index) => {
      return sum + Number(digit) * weights[weightOffset + index];
    }, 0),
    remainder = total % 11,
    expectedVerifier = remainder > 1 ? 11 - remainder : remainder;

  return verifier === expectedVerifier;
}

export function isValidIndianAadhaar(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{12}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const multiplicationTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ],
    permutationTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];
  let checksum = 0;

  Array.from(digits)
    .reverse()
    .forEach((digit, index) => {
      checksum =
        multiplicationTable[checksum][
          permutationTable[index % 8][Number.parseInt(digit, 10)]
        ];
    });

  return checksum === 0;
}

export function isValidPeruvianRuc(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  if (!/^(10|15|16|17|20)/u.test(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
    total = Array.from(digits.slice(0, 10)).reduce((sum, digit, index) => {
      return sum + Number(digit) * weights[index];
    }, 0),
    remainder = 11 - (total % 11),
    verifier = remainder === 10 ? 0 : remainder === 11 ? 1 : remainder;

  return Number(digits[10]) === verifier;
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

export function isValidPortugueseNif(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  if (!/^[125689]/u.test(digits)) return false;

  const total = Array.from(digits.slice(0, 8)).reduce((sum, digit, index) => {
      return sum + Number(digit) * (9 - index);
    }, 0),
    remainder = 11 - (total % 11),
    verifier = remainder >= 10 ? 0 : remainder;

  return Number(digits[8]) === verifier;
}

export function isValidRussianInn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{10}(\d{2})?$/u.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  if (digits.length === 10) {
    const expected = calculateMod11Digit(digits.slice(0, 9), [2, 4, 10, 3, 5, 9, 4, 6, 8]);
    return Number(digits[9]) === expected;
  }

  const firstExpected = calculateMod11Digit(
      digits.slice(0, 10),
      [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    ),
    secondExpected = calculateMod11Digit(
      digits.slice(0, 11),
      [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    );

  return Number(digits[10]) === firstExpected && Number(digits[11]) === secondExpected;
}

export function isValidRussianSnils(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const total = Array.from(digits.slice(0, 9)).reduce((sum, digit, index) => {
      return sum + Number(digit) * (9 - index);
    }, 0),
    rawVerifier = total < 100 ? total : total === 100 || total === 101 ? 0 : total % 101,
    verifier = rawVerifier === 100 ? 0 : rawVerifier;

  return Number(digits.slice(9)) === verifier;
}

export function isValidSpanishDni(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^\d{8}[A-Z]$/u.test(normalized)) return false;

  return normalized[8] === calculateSpanishDocumentLetter(normalized.slice(0, 8));
}

export function isValidSpanishNie(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[XYZ]\d{7}[A-Z]$/u.test(normalized)) return false;

  const prefixMap = { X: "0", Y: "1", Z: "2" } as const,
    numericBody = `${prefixMap[normalized[0] as keyof typeof prefixMap]}${normalized.slice(1, 8)}`;

  return normalized[8] === calculateSpanishDocumentLetter(numericBody);
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

function calculateMod11Digit(value: string, weights: readonly number[]): number {
  const total = Array.from(value).reduce((sum, digit, index) => {
    return sum + Number(digit) * weights[index];
  }, 0);

  return (total % 11) % 10;
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

function calculateSpanishDocumentLetter(value: string): string {
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return letters[Number(value) % 23];
}

function isValidIsoDateSegment(value: string, shape: "ymd"): boolean {
  if (shape !== "ymd" || !/^\d{8}$/.test(value)) return false;

  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(4, 6)),
    day = Number(value.slice(6, 8)),
    date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
