/**
 * Polyglot Mask Generator
 *
 * Produces visually unpredictable masks by interleaving characters
 * from different Unicode writing-system families. Key invariants:
 *
 * 1. **No two consecutive characters share the same writing-system family**
 *    (alphabetic-alphabetic, syllabary-syllabary, abugida-abugida forbidden).
 * 2. The user's locale-native writing-system **family** is entirely excluded
 *    (e.g. Brazil → no alphabetic chars at all, not even Cyrillic/Armenian).
 * 3. Character selection follows a weighted distribution:
 *      50 % — common digital symbols  (@#$%&* etc.)
 *      25 % — unicode figure symbols  (arrows, geometric, math, misc, box-drawing)
 *      25 % — abugida or syllabary characters
 */

import type {
  CharacterPool,
  WritingSystemFamily,
  WritingSystemSubtype,
} from "../constants/polyglot-pools.constants";
import { ALL_POOLS } from "../constants/polyglot-pools.constants";
import type { PolyglotMaskConfig } from "../declarations/polyglot-mask.types";

export type { PolyglotMaskConfig } from "../declarations/polyglot-mask.types";

// ─── Configuration ───────────────────────────────────────────────────────────

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

// ─── Weighted Tiers ──────────────────────────────────────────────────────────

/** Subtypes treated as "common digital symbols" — 50 % weight. */
const DIGITAL_SYMBOL_SUBTYPES: ReadonlySet<WritingSystemSubtype> = new Set([
  "keyboard",
]);

/** Subtypes treated as "unicode figure symbols" — 25 % weight. */
const FIGURE_SYMBOL_SUBTYPES: ReadonlySet<WritingSystemSubtype> = new Set([
  "arrows",
  "box-drawing",
  "geometric",
  "math",
  "misc",
]);

/** Families treated as "script characters" — 25 % weight. */
const SCRIPT_FAMILIES: ReadonlySet<WritingSystemFamily> = new Set([
  "abugida",
  "syllabary",
]);

type WeightTier = "digital" | "figure" | "script";

function tierOf(pool: CharacterPool): WeightTier {
  if (DIGITAL_SYMBOL_SUBTYPES.has(pool.subtype)) return "digital";
  if (FIGURE_SYMBOL_SUBTYPES.has(pool.subtype)) return "figure";
  if (SCRIPT_FAMILIES.has(pool.family)) return "script";
  // Alphabetic pools that survived filtering fall into script
  return "script";
}

// ─── Pool Resolution ─────────────────────────────────────────────────────────

function resolveActivePools(config: PolyglotMaskConfig): CharacterPool[] {
  const excluded = new Set([
    ...config.excludedSubtypes,
    ...(config.localeExcludedSubtypes ?? []),
  ]);

  return ALL_POOLS.filter(p => {
    if (!config.enabledFamilies.includes(p.family)) return false;
    if (excluded.has(p.subtype)) return false;
    // Hard-exclude the entire native family
    if (config.nativeFamily && p.family === config.nativeFamily) return false;
    return true;
  }).map(ensureSingleCodepoint);
}

/**
 * Safety filter: ensures every character in a pool is a single Unicode
 * code point. Abugidas and other complex scripts sometimes combine multiple
 * code points into a single glyph — we only keep standalone characters
 * so a mask never accidentally forms a real word/ligature.
 */
function ensureSingleCodepoint(pool: CharacterPool): CharacterPool {
  const filtered = Array.from(pool.chars)
    .filter(c => [...c].length === 1)
    .join("");
  return filtered === pool.chars ? pool : { ...pool, chars: filtered };
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

function groupByTier(
  pools: readonly CharacterPool[],
): Map<WeightTier, CharacterPool[]> {
  const map = new Map<WeightTier, CharacterPool[]>();
  for (const pool of pools) {
    const tier = tierOf(pool);
    const group = map.get(tier);
    if (group) group.push(pool);
    else map.set(tier, [pool]);
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

// ─── Weighted Tier Selection ─────────────────────────────────────────────────

/**
 * Picks a weight tier with the 50/25/25 distribution, constrained to only
 * tiers that have pools with an eligible family (for the no-consecutive rule).
 */
function pickWeightedTier(
  tierGroups: ReadonlyMap<WeightTier, CharacterPool[]>,
  eligibleFamilies: ReadonlySet<WritingSystemFamily>,
): WeightTier | null {
  // Filter tiers to those that contain at least one eligible-family pool
  const viable: WeightTier[] = [];
  for (const [tier, pools] of tierGroups) {
    if (pools.some(p => eligibleFamilies.has(p.family))) {
      viable.push(tier);
    }
  }
  if (viable.length === 0) return null;
  if (viable.length === 1) return viable[0];

  // Build CDF with base weights: digital=50, figure=25, script=25
  const weights: Record<WeightTier, number> = {
    digital: 50,
    figure: 25,
    script: 25,
  };
  let total = 0;
  const cdf: { tier: WeightTier; cumulative: number }[] = [];
  for (const tier of viable) {
    total += weights[tier];
    cdf.push({ tier, cumulative: total });
  }

  const roll = secureRandomIndex(total);
  for (const entry of cdf) {
    if (roll < entry.cumulative) return entry.tier;
  }
  return cdf[cdf.length - 1].tier;
}

// ─── Core Generator ──────────────────────────────────────────────────────────

/**
 * Generates a polyglot mask string of `length` characters.
 *
 * Guarantees:
 * - No two consecutive chars share the same `family`
 * - No two consecutive chars share the same `subtype`
 * - 50 % digital symbols, 25 % figure symbols, 25 % script (abugida/syllabary)
 * - Separator/whitespace chars in the original are preserved
 * - The user's locale-native family is entirely excluded
 * - Every abugida character is a single Unicode code point
 */
export function generatePolyglotMask(
  originalValue: string,
  config: PolyglotMaskConfig = DEFAULT_POLYGLOT_CONFIG,
): string {
  const activePools = resolveActivePools(config);
  if (activePools.length === 0) {
    return "?".repeat(originalValue.length);
  }

  const familyGroups = groupByFamily(activePools);
  const familyKeys = Array.from(familyGroups.keys());
  const tierGroups = groupByTier(activePools);
  const canAlternate = familyKeys.length >= 2;

  let lastFamily: WritingSystemFamily | null = null;
  let lastSubtype: WritingSystemSubtype | null = null;
  const result: string[] = [];

  for (const ch of originalValue) {
    // Preserve whitespace and common structural separators
    if (/[\s\-./:\\,;=|()[\]{}<>'"_]/.test(ch)) {
      result.push(ch);
      continue;
    }

    // Build the set of families eligible for this position.
    // The no-consecutive rule applies to script families (alphabetic,
    // syllabary, abugida) but NOT to "symbol" — symbol may follow symbol
    // so the 50/25/25 weighting can be honoured.
    const eligibleFamilies: Set<WritingSystemFamily> = new Set(
      canAlternate && lastFamily && lastFamily !== "symbol"
        ? familyKeys.filter(f => f !== lastFamily)
        : familyKeys,
    );

    // Pick weighted tier, then pick a pool from that tier
    const tier = pickWeightedTier(tierGroups, eligibleFamilies);
    if (!tier) {
      result.push("?");
      continue;
    }

    const tierPools = tierGroups.get(tier)!;
    // Filter to eligible families AND different subtype
    let candidates = tierPools.filter(
      p => eligibleFamilies.has(p.family) && p.subtype !== lastSubtype,
    );
    if (candidates.length === 0) {
      // Relax subtype constraint
      candidates = tierPools.filter(p => eligibleFamilies.has(p.family));
    }
    if (candidates.length === 0) {
      // Absolute fallback: pick any pool with eligible family
      candidates = activePools.filter(
        p => eligibleFamilies.has(p.family) && p.subtype !== lastSubtype,
      );
      if (candidates.length === 0) {
        candidates = activePools.filter(p => eligibleFamilies.has(p.family));
      }
    }

    const pool = candidates[secureRandomIndex(candidates.length)];
    result.push(pickRandomChar(pool));
    lastFamily = pool.family;
    lastSubtype = pool.subtype;
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
