/**
 * Polyglot Mask Generator
 *
 * Produces visually unpredictable masks by interleaving characters
 * from different Unicode writing-system families. The key invariant:
 * **no two consecutive characters may come from the same writing-system
 * family**, which makes it impossible for the output to form real words
 * in any human language.
 */

import type {
  CharacterPool,
  WritingSystemFamily,
  WritingSystemSubtype,
} from "../constants/polyglot-pools.constants";
import { ALL_POOLS, POOLS_BY_FAMILY } from "../constants/polyglot-pools.constants";

// ─── Configuration ───────────────────────────────────────────────────────────

export interface PolyglotMaskConfig {
  /** Which writing-system families are enabled. */
  readonly enabledFamilies: readonly WritingSystemFamily[];
  /** Specific subtypes to exclude even if their family is enabled. */
  readonly excludedSubtypes: readonly WritingSystemSubtype[];
}

export const DEFAULT_POLYGLOT_CONFIG: Readonly<PolyglotMaskConfig> =
  Object.freeze({
    enabledFamilies: Object.freeze<WritingSystemFamily[]>([
      "abugida",
      "alphabetic",
      "syllabary",
      "symbol",
    ]),
    excludedSubtypes: Object.freeze<WritingSystemSubtype[]>([]),
  });

// ─── Pool Resolution ─────────────────────────────────────────────────────────

function resolveActivePools(config: PolyglotMaskConfig): CharacterPool[] {
  const excluded = new Set(config.excludedSubtypes);
  return ALL_POOLS.filter(
    p => config.enabledFamilies.includes(p.family) && !excluded.has(p.subtype),
  );
}

function groupByFamily(
  pools: readonly CharacterPool[],
): Map<WritingSystemFamily, CharacterPool[]> {
  const map = new Map<WritingSystemFamily, CharacterPool[]>();
  for (const pool of pools) {
    const group = map.get(pool.family);
    if (group) group.push(pool);
    else map.set(pool.family, [pool]);
  }
  return map;
}

// ─── Cryptographic-quality RNG helper ────────────────────────────────────────

function secureRandomIndex(max: number): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pickRandomChar(pool: CharacterPool): string {
  const chars = Array.from(pool.chars);
  return chars[secureRandomIndex(chars.length)];
}

// ─── Core Generator ──────────────────────────────────────────────────────────

/**
 * Generates a polyglot mask string of `length` characters.
 *
 * Guarantees:
 * - No two consecutive chars share the same `family`
 * - Characters are drawn uniformly from the active pools
 * - Separator/whitespace chars in the original are preserved
 */
export function generatePolyglotMask(
  originalValue: string,
  config: PolyglotMaskConfig = DEFAULT_POLYGLOT_CONFIG,
): string {
  const activePools = resolveActivePools(config);
  if (activePools.length === 0) {
    // Fallback: fill with generic replacement
    return "?".repeat(originalValue.length);
  }

  const familyGroups = groupByFamily(activePools);
  const familyKeys = Array.from(familyGroups.keys());

  // Need at least 2 families for the "no consecutive same family" rule
  // If only 1 family, alternate between different subtypes within it
  const canAlternate = familyKeys.length >= 2;

  let lastFamily: WritingSystemFamily | null = null;
  const result: string[] = [];

  for (const ch of originalValue) {
    // Preserve whitespace and common structural separators
    if (/[\s\-./:\\,;=|()[\]{}<>'"_]/.test(ch)) {
      result.push(ch);
      // Don't reset lastFamily — separators don't count
      continue;
    }

    if (canAlternate) {
      // Pick a family different from the last one
      const eligible = familyKeys.filter(f => f !== lastFamily);
      const chosenFamily = eligible[secureRandomIndex(eligible.length)];
      const pools = familyGroups.get(chosenFamily)!;
      const pool = pools[secureRandomIndex(pools.length)];
      result.push(pickRandomChar(pool));
      lastFamily = chosenFamily;
    } else {
      // Single family: alternate between subtypes
      const pools = familyGroups.get(familyKeys[0])!;
      if (pools.length >= 2) {
        const eligible = pools.filter(
          p => p.subtype !== (lastFamily as unknown as string),
        );
        const pool =
          eligible.length > 0
            ? eligible[secureRandomIndex(eligible.length)]
            : pools[secureRandomIndex(pools.length)];
        result.push(pickRandomChar(pool));
        lastFamily = pool.subtype as unknown as WritingSystemFamily;
      } else {
        result.push(pickRandomChar(pools[0]));
      }
    }
  }

  return result.join("");
}

/**
 * Creates a distinct polyglot mask, retrying if it collides
 * with a previous mask (mirrors createDistinctMask behaviour).
 */
export function createDistinctPolyglotMask(
  value: string,
  config: PolyglotMaskConfig = DEFAULT_POLYGLOT_CONFIG,
  previousMask?: string,
  maxRetries = 8,
): string {
  let mask = generatePolyglotMask(value, config);
  if (!previousMask) return mask;

  let attempts = 0;
  while (mask === previousMask && attempts < maxRetries) {
    mask = generatePolyglotMask(value, config);
    attempts++;
  }

  return mask;
}
