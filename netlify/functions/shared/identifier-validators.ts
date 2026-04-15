// ── Identifier validation algorithms (ported from C#) ──

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function hasRepeatedDigits(digits: string): boolean {
  return digits.length > 0 && digits.split("").every(d => d === digits[0]);
}

export function isLikelyCreditCard(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19 || hasRepeatedDigits(digits))
    return false;

  let checksum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
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
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) return false;

  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    if (/[A-Z]/.test(ch)) {
      const encoded = String(ch.charCodeAt(0) - 55);
      for (const d of encoded)
        remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
    } else {
      remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder === 1;
}

export function isValidArgentineCuit(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let total = 0;
  for (let i = 0; i < weights.length; i++)
    total += (digits.charCodeAt(i) - 48) * weights[i];

  const r = 11 - (total % 11);
  const verifier = r === 11 ? 0 : r === 10 ? 9 : r;
  return digits.charCodeAt(10) - 48 === verifier;
}

export function isValidChileanRut(value: string): boolean {
  const normalized = value.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) return false;

  const verifier = normalized[normalized.length - 1];
  let sum = 0;
  let multiplier = 2;
  for (let i = normalized.length - 2; i >= 0; i--) {
    sum += (normalized.charCodeAt(i) - 48) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const r = 11 - (sum % 11);
  const expected = r === 11 ? "0" : r === 10 ? "K" : String(r);
  return verifier === expected;
}

export function isValidChineseResidentId(value: string): boolean {
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!/^\d{17}[\dX]$/.test(normalized)) return false;

  const dateStr = normalized.substring(6, 14);
  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  )
    return false;

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const verifiers = "10X98765432";
  let checksum = 0;
  for (let i = 0; i < weights.length; i++)
    checksum += (normalized.charCodeAt(i) - 48) * weights[i];

  return normalized[17] === verifiers[checksum % 11];
}

function calculateWeightedDigit(value: string, weights: number[]): number {
  let total = 0;
  for (let i = 0; i < value.length; i++)
    total += (value.charCodeAt(i) - 48) * weights[i];
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 14 || hasRepeatedDigits(digits)) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const firstDigit = calculateWeightedDigit(digits.slice(0, 12), firstWeights);
  const secondDigit = calculateWeightedDigit(
    digits.slice(0, 12) + String(firstDigit),
    secondWeights,
  );
  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function isValidColombianNit(value: string): boolean {
  const digits = digitsOnly(value);
  if (!/^\d{8,10}$/.test(digits) || hasRepeatedDigits(digits)) return false;

  const body = digits.slice(0, -1);
  const verifier = digits.charCodeAt(digits.length - 1) - 48;
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const offset = weights.length - body.length;
  let total = 0;
  for (let i = 0; i < body.length; i++)
    total += (body.charCodeAt(i) - 48) * weights[offset + i];

  const remainder = total % 11;
  const expected = remainder > 1 ? 11 - remainder : remainder;
  return verifier === expected;
}

function calculateCpfDigit(value: string, factor: number): number {
  let total = 0;
  for (let i = 0; i < value.length; i++)
    total += (value.charCodeAt(i) - 48) * (factor - i);
  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) return false;

  const firstDigit = calculateCpfDigit(digits.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(
    digits.slice(0, 9) + String(firstDigit),
    11,
  );
  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function isValidIndianAadhaar(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 12 || hasRepeatedDigits(digits)) return false;

  const mult = [
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
  ];
  const perm = [
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
  const reversed = digits.split("").reverse();
  for (let i = 0; i < reversed.length; i++)
    checksum = mult[checksum][perm[i % 8][reversed[i].charCodeAt(0) - 48]];

  return checksum === 0;
}

export function isValidPeruvianRuc(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) return false;
  if (
    !digits.startsWith("10") &&
    !digits.startsWith("15") &&
    !digits.startsWith("16") &&
    !digits.startsWith("17") &&
    !digits.startsWith("20")
  )
    return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let total = 0;
  for (let i = 0; i < weights.length; i++)
    total += (digits.charCodeAt(i) - 48) * weights[i];

  const r = 11 - (total % 11);
  const verifier = r === 10 ? 0 : r === 11 ? 1 : r;
  return digits.charCodeAt(10) - 48 === verifier;
}

export function isValidPisPasep(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let total = 0;
  for (let i = 0; i < weights.length; i++)
    total += (digits.charCodeAt(i) - 48) * weights[i];

  const r = 11 - (total % 11);
  const verifier = r === 10 || r === 11 ? 0 : r;
  return digits.charCodeAt(10) - 48 === verifier;
}

export function isValidPortugueseNif(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 9 || hasRepeatedDigits(digits)) return false;
  if (!"125689".includes(digits[0])) return false;

  let total = 0;
  for (let i = 0; i < 8; i++) total += (digits.charCodeAt(i) - 48) * (9 - i);

  const r = 11 - (total % 11);
  const verifier = r >= 10 ? 0 : r;
  return digits.charCodeAt(8) - 48 === verifier;
}

function calculateMod11Digit(value: string, weights: number[]): number {
  let total = 0;
  for (let i = 0; i < value.length; i++)
    total += (value.charCodeAt(i) - 48) * weights[i];
  return (total % 11) % 10;
}

export function isValidRussianInn(value: string): boolean {
  const digits = digitsOnly(value);
  if (!/^\d{10}(\d{2})?$/.test(digits) || hasRepeatedDigits(digits))
    return false;

  if (digits.length === 10) {
    const expected = calculateMod11Digit(
      digits.slice(0, 9),
      [2, 4, 10, 3, 5, 9, 4, 6, 8],
    );
    return digits.charCodeAt(9) - 48 === expected;
  }

  const first = calculateMod11Digit(
    digits.slice(0, 10),
    [7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
  );
  const second = calculateMod11Digit(
    digits.slice(0, 11),
    [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
  );
  return (
    digits.charCodeAt(10) - 48 === first &&
    digits.charCodeAt(11) - 48 === second
  );
}

export function isValidRussianSnils(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) return false;

  let total = 0;
  for (let i = 0; i < 9; i++) total += (digits.charCodeAt(i) - 48) * (9 - i);

  let rawVerifier: number;
  if (total < 100) rawVerifier = total;
  else if (total === 100 || total === 101) rawVerifier = 0;
  else rawVerifier = total % 101;

  const verifier = rawVerifier === 100 ? 0 : rawVerifier;
  return parseInt(digits.slice(9), 10) === verifier;
}

function calculateSpanishDocumentLetter(value: string): string {
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return letters[parseInt(value, 10) % 23];
}

export function isValidSpanishDni(value: string): boolean {
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!/^\d{8}[A-Z]$/.test(normalized)) return false;
  return (
    normalized[8] === calculateSpanishDocumentLetter(normalized.slice(0, 8))
  );
}

export function isValidSpanishNie(value: string): boolean {
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) return false;

  const prefix =
    normalized[0] === "X" ? "0" : normalized[0] === "Y" ? "1" : "2";
  const numericBody = prefix + normalized.substring(1, 8);
  return normalized[8] === calculateSpanishDocumentLetter(numericBody);
}

export const VALIDATORS: Record<string, (value: string) => boolean> = {
  "chile-rut": isValidChileanRut,
  "cn-resident-id-labeled": isValidChineseResidentId,
  cnpj: isValidCnpj,
  "credit-card": isLikelyCreditCard,
  cpf: isValidCpf,
  cuit: isValidArgentineCuit,
  "es-dni-labeled": isValidSpanishDni,
  "es-nie-labeled": isValidSpanishNie,
  iban: isLikelyIban,
  "in-aadhaar-labeled": isValidIndianAadhaar,
  nit: isValidColombianNit,
  "pis-pasep-labeled": isValidPisPasep,
  "pt-nif-labeled": isValidPortugueseNif,
  "ru-inn-labeled": isValidRussianInn,
  "ru-snils-labeled": isValidRussianSnils,
  "ruc-labeled": isValidPeruvianRuc,
};
