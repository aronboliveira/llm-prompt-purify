import { sanitizeCapturedValue } from "./mask-format.utils";
import { ALL_ADDRESS_KEYWORDS } from "../constants/address-keywords.constants";

// ─── Fuzzy address keyword matching ─────────────────────────────────────────

/**
 * Normalize a potential address keyword token by:
 *  1. Stripping diacritics (NFD + remove combining marks)
 *  2. Removing non-letter characters between letters (separator tricks)
 *  3. Lowercasing
 *
 * "trave--sa" → "travesa"
 * "a.v.e.n.i.d.a" → "avenida"
 * "Praça" → "praca"
 */
function normalizeAddressToken(token: string): string {
  return token
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/(?<=\p{L})[^\p{L}]+(?=\p{L})/gu, "")
    .toLowerCase();
}

/**
 * Levenshtein edit distance between two strings.
 * Uses two-row DP for O(min(m,n)) memory.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const m = a.length,
    n = b.length;
  let prev = Array.from({ length: m + 1 }, (_, i) => i);
  let curr = new Array<number>(m + 1);

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }

  return prev[m];
}

/** Max edit distance based on keyword length. */
function maxEditDistance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

/** Lazily-built set of { normalized } keyword entries. */
let _normalizedKw: Array<{ normalized: string }> | null = null;

function getNormalizedKeywords(): Array<{ normalized: string }> {
  if (_normalizedKw) return _normalizedKw;
  const seen = new Set<string>();
  _normalizedKw = ALL_ADDRESS_KEYWORDS.map(kw => ({
    normalized: kw
      .normalize("NFD")
      .replace(/\p{M}+/gu, "")
      .toLowerCase(),
  })).filter(e => {
    if (seen.has(e.normalized)) return false;
    seen.add(e.normalized);
    return true;
  });
  return _normalizedKw;
}

/**
 * Common words (month names, prepositions, etc.) that should NEVER be
 * fuzzy-matched to address keywords even if within edit distance.
 * Stored normalised (NFD-stripped, lowercase).
 */
const FUZZY_EXCLUSIONS = new Set([
  // English months
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
  // Portuguese months
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
  // Spanish months
  "enero",
  "febrero",
  "marzo",
  "mayo",
  "junio",
  "julio",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
  // Common short words that cause collisions
  "the",
  "and",
  "for",
  "from",
  "with",
  "that",
  "this",
  "have",
  "been",
  "not",
  "but",
  "are",
  "was",
  "were",
  "has",
  "had",
  "its",
  "our",
  "para",
  "como",
  "pero",
  "esta",
  "este",
  "esos",
  "esas",
  "com",
  "por",
  "mas",
  "mais",
  "essa",
  "esse",
]);

/**
 * Check if a raw token (possibly separator-stuffed or misspelled)
 * fuzzy-matches any known address keyword.
 */
export function matchesAnyAddressKeyword(token: string): boolean {
  const nt = normalizeAddressToken(token);
  if (nt.length < 2) return false;
  if (FUZZY_EXCLUSIONS.has(nt)) return false;

  for (const { normalized: kw } of getNormalizedKeywords()) {
    const maxDist = maxEditDistance(kw.length);
    if (Math.abs(nt.length - kw.length) > maxDist) continue;
    if (maxDist === 0) {
      if (nt === kw) return true;
    } else if (levenshteinDistance(nt, kw) <= maxDist) {
      return true;
    }
  }
  return false;
}

/**
 * Validator for fuzzy/obfuscated address detection rules.
 * Returns true when the captured text:
 *  - contains a number (fundamental address structure)
 *  - contains at least one word-token that fuzzy-matches an address keyword
 */
export function looksLikeFuzzyAddress(value: string): boolean {
  const normalized = sanitizeCapturedValue(value);
  if (normalized.length < 6 || normalized.length > 250) return false;
  if (!/\d/.test(normalized)) return false;

  const tokens = normalized
    .split(/[\s,]+/)
    .filter(t => t.length >= 2 && /\p{L}/u.test(t));
  return tokens.some(t => matchesAnyAddressKeyword(t));
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

export function looksLikeCardNumberSequence(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 13 && digitsOnly.length <= 19;
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
  for (const digit of numeric)
    remainder = (remainder * 10 + Number(digit)) % 97;
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

/**
 * Structural CPF check — correct digit count + non-repeating.
 * Does NOT validate check digits, so it catches malformed/fake CPFs.
 */
export function looksLikeCpfStructural(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{11}$/.test(digits) && !/^(\d)\1+$/.test(digits);
}

/**
 * Structural CNPJ check — correct digit count + non-repeating.
 * Does NOT validate check digits.
 */
export function looksLikeCnpjStructural(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{14}$/.test(digits) && !/^(\d)\1+$/.test(digits);
}

/**
 * Structural Peruvian RUC check — 11 digits, valid prefix (10|15|16|17|20),
 * non-repeating. Does NOT validate the check digit.
 */
export function looksLikePeruvianRucStructural(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  return /^(10|15|16|17|20)/.test(digits);
}

/**
 * Structural US SSN check — 9 digits, area != 000|666, group != 00,
 * serial != 0000, non-repeating. Does NOT reject area >= 900
 * (SSA randomized allocation since 2011).
 */
export function looksLikeUsaSsnStructural(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 9 || /^(\d)\1+$/.test(digits)) return false;
  const area = parseInt(digits.slice(0, 3), 10);
  if (area === 0 || area === 666) return false;
  const group = parseInt(digits.slice(3, 5), 10);
  if (group === 0) return false;
  const serial = parseInt(digits.slice(5), 10);
  return serial !== 0;
}

// ─── Obfuscation Detection ────────────────────────────────────────────────

const OBFUSCATION_TAG_CHECKS: readonly [RegExp, string][] = Object.freeze([
  [/[·。．]/, "homoglyph-dot"],
  [/[\u2013\u2014\uFF0D_=~]/, "homoglyph-dash"],
  [/[\u2044\u29F8\\]/, "homoglyph-slash"],
  [/\.{2,}/, "separator-stuffing-dot"],
  [/-{2,}|[\u2013\u2014]{2,}/, "separator-stuffing-dash"],
  [/\/{2,}/, "separator-stuffing-slash"],
]);

export function detectObfuscationTags(rawFragment: string): readonly string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of OBFUSCATION_TAG_CHECKS)
    if (pattern.test(rawFragment)) tags.push(tag);
  return tags;
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    secondWeights = [6, ...firstWeights];

  const firstDigit = calculateWeightedDigit(digits.slice(0, 12), firstWeights),
    secondDigit = calculateWeightedDigit(
      `${digits.slice(0, 12)}${firstDigit}`,
      secondWeights,
    );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const [firstDigit, secondDigit] = calculateCheckSum(digits.slice(0, 9), 11);
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
    checksum = Array.from(normalized.slice(0, 17)).reduce(
      (sum, digit, index) => {
        return sum + Number(digit) * weights[index];
      },
      0,
    );

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
  if (!/^\d{10}(\d{2})?$/u.test(digits) || /^(\d)\1+$/.test(digits))
    return false;

  if (digits.length === 10) {
    const expected = calculateMod11Digit(
      digits.slice(0, 9),
      [2, 4, 10, 3, 5, 9, 4, 6, 8],
    );
    return Number(digits[9]) === expected;
  }

  const firstExpected = calculateMod11Digit(
      digits.slice(0, 10),
      [7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
    ),
    secondExpected = calculateMod11Digit(
      digits.slice(0, 11),
      [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
    );

  return (
    Number(digits[10]) === firstExpected &&
    Number(digits[11]) === secondExpected
  );
}

export function isValidRussianSnils(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const total = Array.from(digits.slice(0, 9)).reduce((sum, digit, index) => {
      return sum + Number(digit) * (9 - index);
    }, 0),
    rawVerifier =
      total < 100 ? total : total === 100 || total === 101 ? 0 : total % 101,
    verifier = rawVerifier === 100 ? 0 : rawVerifier;

  return Number(digits.slice(9)) === verifier;
}

export function isValidSpanishDni(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^\d{8}[A-Z]$/u.test(normalized)) return false;

  return (
    normalized[8] === calculateSpanishDocumentLetter(normalized.slice(0, 8))
  );
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
  if (normalized.length < 6 || normalized.length > 200) return false;

  // Fast path: structural indicators (digits, separators)
  if (/[\d,#-]/.test(normalized)) return true;

  // Fast path: exact keyword match (expanded list)
  if (
    /\b(?:acesso|alameda|ala|andador|andar|anel|apartamento|apt[oe]?|avenida|bairro|balão|barracão|beco|bloco|blvd|boulevard|calçadão|callejón|calle|calzada|caminho|camino|carrera|casa|cerrada|circuito|circunvalación|city|colonia|condomínio|conjunto|conj|contorno|costanera|crescent|croft|crossing|dell|departamento|depto|descida|desvio|diagonal|drive|edifício|elevado|entroncamento|escadaria|esplanade|estrada|explanada|fazenda|floor|fraccionamiento|frente|fundos|galpão|gardens|gleba|glorieta|grove|heath|highway|hollow|interior|jardim|jirón|knoll|ladeira|landing|lane|largo|libramiento|ln|logradouro|lote|malecón|manzana|marginal|meadow|mezanino|mews|morro|oficina|overpass|parcela|parque|pasaje|passagem|passarela|paseo|path|pavilhão|periférico|picada|pike|piso|place|plaza|plazoleta|plazuela|point|ponte|praça|privada|prolongación|promenade|quadra|ramal|rampa|residencial|retorno|ribeirão|ridge|road|rodovia|rotatória|rotonda|ronda|row|rua|sala|senda|sendero|servidão|setor|sítio|square|st|street|subida|suite|terrace|torre|township|transversal|travesía|travessa|trevo|trincheira|túnel|turnpike|underpass|urbanización|vale|variante|vereda|vía|viaduto|viela|via|vila|walk|way)\b/iu.test(
      normalized,
    )
  )
    return true;

  // Slow path: fuzzy keyword match (separator tricks, typos, diacritics)
  const tokens = normalized
    .split(/[\s,]+/)
    .filter(t => t.length >= 2 && /\p{L}/u.test(t));
  return tokens.some(t => matchesAnyAddressKeyword(t));
}

export function looksLikeStructuredName(value: string): boolean {
  const normalized = sanitizeCapturedValue(value).replace(/\s+/g, " ");
  if (normalized.length < 5 || normalized.length > 80) return false;

  const parts = normalized.split(" ");
  return (
    parts.length >= 2 &&
    parts.every(part => /^[\p{L}][\p{L}'-]{0,30}$/u.test(part))
  );
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

/**
 * Validator for config-file secret assignments (.env, yaml, toml, etc.).
 * More lenient than looksSecretLike — accepts placeholder/dummy values,
 * empty assignments, common config values, and values >= 8 chars.
 * Rejects only obviously non-secret short values (e.g., "interna", "hello")
 * that would produce false positives with multi-word keywords.
 */
export function looksLikeConfigSecret(value: string): boolean {
  const normalized = sanitizeCapturedValue(value);
  if (normalized.length === 0) return true;
  if (/^(?:basic|bearer|digest|negotiate)$/i.test(normalized)) return false;
  if (
    /^(?:null|nil|dummy|empty|undefined|none|na|n\/a|false|true|yes|no|1|0|off|on|local|localhost|127\.0\.0\.1)$/i.test(
      normalized,
    )
  )
    return true;
  if (normalized.length >= 8) return true;
  const classes = [
    /\d/.test(normalized),
    /[a-z]/.test(normalized),
    /[A-Z]/.test(normalized),
    /[^A-Za-z0-9]/.test(normalized),
  ].filter(Boolean).length;
  if (classes >= 2) return true;
  // Short lowercase-only values that are common config defaults
  if (/^(?:root|admin|postgres|mysql|mongo|redis|guest|user|dev|test|prod|stage)$/i.test(normalized)) return true;
  return false;
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

export function looksLikeCnpjLikeId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^\d{14}$/u.test(digits) && !/^(\d)\1+$/u.test(digits);
}

function calculateMod11Digit(
  value: string,
  weights: readonly number[],
): number {
  const total = Array.from(value).reduce((sum, digit, index) => {
    return sum + Number(digit) * weights[index];
  }, 0);

  return (total % 11) % 10;
}

function calculateWeightedDigit(
  value: string,
  weights: readonly number[],
): number {
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

/**
 * Generic modular-arithmetic checksum calculator.
 *
 * Computes one or more check digits by iteratively applying a weighted sum
 * modulo {@link modulus}.  Weights are auto-generated as descending sequences
 * `[factor, factor-1, …, 2]` where `factor` starts at `bodyLength + 1` and
 * increments for each subsequent check digit.  After each digit is computed it
 * is appended to the working body so the next iteration incorporates it.
 *
 * This covers the CPF/NIF-style pattern used across Latin-American and Iberian
 * documents whose check digits follow the rule:
 *
 * ```
 * remainder = weightedSum % modulus
 * digit    = remainder < 2 ? 0 : modulus − remainder
 * ```
 *
 * @example
 * ```ts
 * calculateCheckSum("123456789", 11);  // → [0, 9]  (CPF 123.456.789-09)
 * calculateCheckSum(123456789, 11);    // → [0, 9]  (same, from a number)
 * ```
 *
 * @param state   Digit body — non-digit characters are stripped automatically.
 * @param modulus Divisor (`modulus` must be > digit count of `state`).
 * @returns       Computed check digits in order (first → last).
 */
export function calculateCheckSum(
  state: string | number,
  modulus: number,
): readonly number[] {
  let digits =
    typeof state === "string" ? state.replace(/\D/g, "") : String(state);

  if (!Number.isFinite(modulus) || modulus < 2)
    throw new Error("modulus must be a finite number >= 2");
  modulus = Math.trunc(modulus);

  if (digits.length === 0)
    throw new Error("state must contain at least one digit");

  if (modulus <= digits.length)
    throw new Error("modulus must be greater than the digit count of state");

  const checkDigitCount = modulus - digits.length;
  const result: number[] = [];

  for (let d = 0; d < checkDigitCount; d++) {
    const factor = digits.length + 1;
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      const digitValue = Number(digits[i]);
      const weight = factor - i;
      sum += digitValue * weight;
    }

    const remainder = sum % modulus;
    const checkDigit = remainder < 2 ? 0 : modulus - remainder;

    result.push(checkDigit);
    digits += String(checkDigit);
  }

  return result;
}
