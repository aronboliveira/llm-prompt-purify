import { MASK_CHARACTER_SETS } from "../constants/masking.constants";

const MAX_MASK_RETRIES = 8;

export function createDistinctMask(value: string, previousMask?: string): string {
  if (!value) return "";

  let nextMask = createMask(value);
  if (!previousMask) return nextMask;

  let attempts = 0;
  while (nextMask === previousMask && attempts < MAX_MASK_RETRIES) {
    nextMask = createMask(value);
    attempts += 1;
  }

  return nextMask;
}

export function createMask(value: string): string {
  return Array.from(value).map(remapCharacter).join("");
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
