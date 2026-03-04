import { MASK_CHARACTER_SETS } from "../constants/masking.constants";

const MAX_MASK_RETRIES = 8;

/**
 * LG-004: Creates a visually distinct mask. If randomization fails to produce
 * a different mask after MAX_MASK_RETRIES, appends a 4-char hex suffix.
 */
export function createDistinctMask(
  value: string,
  previousMask?: string,
): string {
  if (!value) return "";

  let nextMask = createMask(value);
  if (!previousMask) return nextMask;

  let attempts = 0;
  while (nextMask === previousMask && attempts < MAX_MASK_RETRIES) {
    nextMask = createMask(value);
    attempts += 1;
  }

  // LG-004: If still identical after retries, append hex suffix for distinctness
  if (nextMask === previousMask) {
    const hexSuffix = generateHexSuffix();
    nextMask = appendHexSuffix(nextMask, hexSuffix);
  }

  return nextMask;
}

function generateHexSuffix(): string {
  const bytes = new Uint8Array(2);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 256);
    bytes[1] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function appendHexSuffix(mask: string, suffix: string): string {
  // Replace last 4 alphanumeric characters with hex suffix for visibility
  const chars = Array.from(mask);
  let replaced = 0;
  for (let i = chars.length - 1; i >= 0 && replaced < 4; i--) {
    if (/[0-9A-Za-z]/u.test(chars[i])) {
      chars[i] = suffix[replaced];
      replaced++;
    }
  }
  return chars.join("");
}

export function createMask(value: string): string {
  return Array.from(value).map(remapCharacter).join("");
}

export function invalidateCandidateMask(value: string): string {
  const characters = Array.from(value);
  let lastAlphaNumericIndex = -1;

  for (let index = characters.length - 1; index >= 0; index -= 1) {
    if (/[0-9A-Za-z]/u.test(characters[index])) {
      lastAlphaNumericIndex = index;
      break;
    }
  }

  if (lastAlphaNumericIndex < 0) return value;

  return characters
    .map((character, index) => {
      if (index !== lastAlphaNumericIndex) return character;
      return remapToDifferentCharacter(character);
    })
    .join("");
}

export function redactPreview(value: string): string {
  if (value.length <= 6) return value[0] ? `${value[0]}***` : "";
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function sanitizeCapturedValue(value: string): string {
  return value.trim().replace(/[;:,]+$/g, "");
}

function pickRandom(characterSet: string): string {
  const index = randomNumber(characterSet.length);
  return characterSet[index];
}

function randomNumber(max: number): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function remapCharacter(character: string): string {
  if (/\d/u.test(character)) return pickRandom(MASK_CHARACTER_SETS.digits);
  if (/\p{Lu}/u.test(character))
    return pickRandom(MASK_CHARACTER_SETS.uppercase);
  if (/\p{Ll}/u.test(character))
    return pickRandom(MASK_CHARACTER_SETS.lowercase);
  if (/\s/u.test(character)) return character;
  return pickRandom(MASK_CHARACTER_SETS.symbols);
}

function remapToDifferentCharacter(character: string): string {
  if (/\d/u.test(character)) return cycleCharacter(character, "0123456789");
  if (/\p{Lu}/u.test(character))
    return cycleCharacter(character, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (/\p{Ll}/u.test(character))
    return cycleCharacter(character, "abcdefghijklmnopqrstuvwxyz");
  return cycleCharacter(character, MASK_CHARACTER_SETS.symbols);
}

function cycleCharacter(character: string, characterSet: string): string {
  const currentIndex = characterSet.indexOf(character);
  if (currentIndex < 0) return characterSet[0] ?? character;
  return characterSet[(currentIndex + 1) % characterSet.length];
}
