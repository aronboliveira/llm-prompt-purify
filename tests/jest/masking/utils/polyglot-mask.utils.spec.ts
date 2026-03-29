import {
  generatePolyglotMask,
  createDistinctPolyglotMask,
  DEFAULT_POLYGLOT_CONFIG,
} from "@core/masking/utils/polyglot-mask.utils";
import type { PolyglotMaskConfig } from "@core/masking/utils/polyglot-mask.utils";
import {
  ALL_POOLS,
  POOLS_BY_FAMILY,
} from "@core/masking/constants/polyglot-pools.constants";
import type {
  WritingSystemFamily,
  WritingSystemSubtype,
} from "@core/masking/constants/polyglot-pools.constants";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a lookup mapping every character to its pool's family. */
function charFamilyMap(): Map<string, WritingSystemFamily> {
  const map = new Map<string, WritingSystemFamily>();
  for (const pool of ALL_POOLS) {
    for (const ch of pool.chars) {
      map.set(ch, pool.family);
    }
  }
  return map;
}

function charSubtypeMap(): Map<string, WritingSystemSubtype> {
  const map = new Map<string, WritingSystemSubtype>();
  for (const pool of ALL_POOLS) {
    for (const ch of pool.chars) {
      map.set(ch, pool.subtype);
    }
  }
  return map;
}

type WeightTier = "digital" | "figure" | "script";

const DIGITAL_SUBTYPES = new Set<WritingSystemSubtype>(["keyboard"]);
const FIGURE_SUBTYPES = new Set<WritingSystemSubtype>([
  "arrows",
  "box-drawing",
  "geometric",
  "math",
  "misc",
]);
const SCRIPT_FAMILIES = new Set<WritingSystemFamily>(["abugida", "syllabary"]);

function tierOfChar(ch: string): WeightTier | undefined {
  const sub = SUBTYPE_BY_CHAR.get(ch);
  if (!sub) return undefined;
  if (DIGITAL_SUBTYPES.has(sub)) return "digital";
  if (FIGURE_SUBTYPES.has(sub)) return "figure";
  const fam = FAMILY_BY_CHAR.get(ch);
  if (fam && SCRIPT_FAMILIES.has(fam)) return "script";
  // Alphabetic chars that survived filtering are treated as script
  return "script";
}

const FAMILY_BY_CHAR = charFamilyMap();
const SUBTYPE_BY_CHAR = charSubtypeMap();
const SEPARATOR_RE = /[\s\-./:\\,;=|()[\]{}<>'"_]/;

function familyOf(ch: string): WritingSystemFamily | undefined {
  return FAMILY_BY_CHAR.get(ch);
}

// ─── suite ───────────────────────────────────────────────────────────────────

describe("generatePolyglotMask", () => {
  it("returns a string of the same length as the input", () => {
    const mask = generatePolyglotMask("hello12345");
    expect(mask.length).toBe("hello12345".length);
  });

  it("preserves whitespace characters", () => {
    const mask = generatePolyglotMask("hello world");
    expect(mask[5]).toBe(" ");
  });

  it("preserves structural separators (dash, dot, slash, etc.)", () => {
    const input = "123-456.789/012";
    const mask = generatePolyglotMask(input);
    expect(mask[3]).toBe("-");
    expect(mask[7]).toBe(".");
    expect(mask[11]).toBe("/");
  });

  it("never produces two consecutive script characters from the same family (alphabetic/syllabary/abugida)", () => {
    // Run with a decently long input for statistical confidence
    const input = "A".repeat(120);
    const mask = generatePolyglotMask(input);
    let lastFamily: WritingSystemFamily | null = null;

    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const fam = familyOf(ch);
      expect(fam).toBeDefined();
      // symbol-symbol is allowed; script-same-script is not
      if (lastFamily !== null && lastFamily !== "symbol" && fam !== "symbol") {
        expect(fam).not.toBe(lastFamily);
      }
      lastFamily = fam!;
    }
  });

  it("draws characters only from enabled families", () => {
    const config: PolyglotMaskConfig = {
      enabledFamilies: ["syllabary", "symbol"],
      excludedSubtypes: [],
    };
    const mask = generatePolyglotMask("ABCDEFGHIJ", config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const fam = familyOf(ch);
      expect(fam).toBeDefined();
      expect(["syllabary", "symbol"]).toContain(fam);
    }
  });

  it("excludes specific subtypes via excludedSubtypes", () => {
    const config: PolyglotMaskConfig = {
      enabledFamilies: ["abugida", "symbol"],
      excludedSubtypes: ["devanagari", "keyboard"],
    };
    const devanagariPool = ALL_POOLS.find(p => p.subtype === "devanagari")!;
    const keyboardPool = ALL_POOLS.find(p => p.subtype === "keyboard")!;
    const excluded = new Set([...devanagariPool.chars, ...keyboardPool.chars]);

    const mask = generatePolyglotMask("A".repeat(200), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(excluded.has(ch)).toBe(false);
    }
  });

  it("returns ? characters when no pools are active", () => {
    const config: PolyglotMaskConfig = {
      enabledFamilies: [],
      excludedSubtypes: [],
    };
    const mask = generatePolyglotMask("hello", config);
    expect(mask).toBe("?????");
  });

  it("handles single-family mode by alternating subtypes", () => {
    const config: PolyglotMaskConfig = {
      enabledFamilies: ["abugida"],
      excludedSubtypes: [],
    };
    const mask = generatePolyglotMask("A".repeat(60), config);
    expect(mask.length).toBe(60);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const fam = familyOf(ch);
      expect(fam).toBe("abugida");
    }
  });

  it("never leaves original alphanumeric characters unmasked", () => {
    const input = "My SSN is 123-45-6789 okay";
    const mask = generatePolyglotMask(input);
    for (let i = 0; i < input.length; i++) {
      if (SEPARATOR_RE.test(input[i])) {
        expect(mask[i]).toBe(input[i]);
      } else {
        expect(mask[i]).not.toBe(input[i]);
      }
    }
  });

  describe("statistical diversity", () => {
    it("uses at least 2 different families in a long mask", () => {
      const mask = generatePolyglotMask("X".repeat(200));
      const families = new Set<WritingSystemFamily>();
      for (const ch of mask) {
        const f = familyOf(ch);
        if (f) families.add(f);
      }
      expect(families.size).toBeGreaterThanOrEqual(2);
    });

    it("produces different output on repeated calls (randomness)", () => {
      const input = "A".repeat(40);
      const masks = new Set(
        Array.from({ length: 10 }, () => generatePolyglotMask(input)),
      );
      expect(masks.size).toBeGreaterThan(1);
    });
  });

  describe("50/25/25 weighted tier distribution", () => {
    it("produces all three tiers (digital, figure, script) in long output", () => {
      const mask = generatePolyglotMask("X".repeat(500));
      const tiers = new Set<WeightTier>();
      for (const ch of mask) {
        if (SEPARATOR_RE.test(ch)) continue;
        const t = tierOfChar(ch);
        if (t) tiers.add(t);
      }
      expect(tiers.size).toBe(3);
    });

    it("digital symbols appear roughly 50% of the time (±15%)", () => {
      const mask = generatePolyglotMask("X".repeat(1000));
      let digital = 0,
        total = 0;
      for (const ch of mask) {
        if (SEPARATOR_RE.test(ch)) continue;
        total++;
        if (tierOfChar(ch) === "digital") digital++;
      }
      const ratio = digital / total;
      expect(ratio).toBeGreaterThan(0.35);
      expect(ratio).toBeLessThan(0.65);
    });

    it("script characters (abugida/syllabary) appear roughly 25% (±15%)", () => {
      const mask = generatePolyglotMask("X".repeat(1000));
      let script = 0,
        total = 0;
      for (const ch of mask) {
        if (SEPARATOR_RE.test(ch)) continue;
        total++;
        if (tierOfChar(ch) === "script") script++;
      }
      const ratio = script / total;
      expect(ratio).toBeGreaterThan(0.1);
      expect(ratio).toBeLessThan(0.4);
    });
  });
});

describe("createDistinctPolyglotMask", () => {
  it("returns a mask different from the previous one", () => {
    const value = "A".repeat(30);
    const first = createDistinctPolyglotMask(value);
    const second = createDistinctPolyglotMask(
      value,
      DEFAULT_POLYGLOT_CONFIG,
      first,
    );
    // With 30 chars from a large pool, collision probability is negligible
    expect(second).not.toBe(first);
  });

  it("respects the config passed in", () => {
    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "symbol"],
      excludedSubtypes: [],
    };
    const mask = createDistinctPolyglotMask("testing", config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const fam = familyOf(ch);
      expect(["alphabetic", "symbol"]).toContain(fam);
    }
  });

  it("returns fallback after max retries if always colliding (edge case)", () => {
    // With an empty-ish pool the generator still returns something
    const config: PolyglotMaskConfig = {
      enabledFamilies: [],
      excludedSubtypes: [],
    };
    const mask = createDistinctPolyglotMask("ab", config, "??", 3);
    // It should return "??" because that's the only thing the generator can produce
    expect(mask).toBe("??");
  });
});

describe("polyglot-pools integrity", () => {
  it("ALL_POOLS contains at least 15 pools", () => {
    expect(ALL_POOLS.length).toBeGreaterThanOrEqual(15);
  });

  it("every pool has a non-empty chars string", () => {
    for (const pool of ALL_POOLS) {
      expect(pool.chars.length).toBeGreaterThan(0);
    }
  });

  it("no pool contains CJK logograph characters", () => {
    const cjkRanges = [
      [0x4e00, 0x9fff], // CJK Unified Ideographs
      [0x3400, 0x4dbf], // CJK Extension A
      [0x20000, 0x2a6df], // CJK Extension B
      [0xf900, 0xfaff], // CJK Compatibility Ideographs
    ] as const;

    for (const pool of ALL_POOLS) {
      for (const ch of pool.chars) {
        const cp = ch.codePointAt(0) ?? 0;
        for (const [lo, hi] of cjkRanges) {
          expect(cp >= lo && cp <= hi).toBe(false);
        }
      }
    }
  });

  it("covers all 4 expected families", () => {
    const families = new Set(ALL_POOLS.map(p => p.family));
    expect(families).toEqual(
      new Set(["abugida", "alphabetic", "syllabary", "symbol"]),
    );
  });

  it("POOLS_BY_FAMILY keys match the actual families in ALL_POOLS", () => {
    const expected = new Set(ALL_POOLS.map(p => p.family));
    const actual = new Set(Object.keys(POOLS_BY_FAMILY));
    expect(actual).toEqual(expected);
  });
});

describe("locale-aware polyglot masking", () => {
  it("excludes latin subtype via localeExcludedSubtypes (e.g., Brazil)", () => {
    const latinPool = ALL_POOLS.find(p => p.subtype === "latin")!;
    const latinChars = new Set([...latinPool.chars]);

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: [],
      localeExcludedSubtypes: ["latin"],
    };

    const mask = generatePolyglotMask("X".repeat(200), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(latinChars.has(ch)).toBe(false);
    }
  });

  it("excludes the ENTIRE native family when nativeFamily is set (e.g., Brazil → no alphabetic at all)", () => {
    // All alphabetic characters: latin, cyrillic, armenian, georgian
    const alphabeticChars = new Set<string>();
    for (const pool of ALL_POOLS) {
      if (pool.family === "alphabetic") {
        for (const ch of pool.chars) alphabeticChars.add(ch);
      }
    }

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: [],
      localeExcludedSubtypes: ["latin"],
      nativeFamily: "alphabetic",
    };

    const mask = generatePolyglotMask("X".repeat(500), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(alphabeticChars.has(ch)).toBe(false);
    }
  });

  it("excludes the entire abugida family when nativeFamily is abugida (e.g., India)", () => {
    const abugidaChars = new Set<string>();
    for (const pool of ALL_POOLS) {
      if (pool.family === "abugida") {
        for (const ch of pool.chars) abugidaChars.add(ch);
      }
    }

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: [],
      localeExcludedSubtypes: [
        "devanagari",
        "bengali",
        "gujarati",
        "kannada",
        "tamil",
        "telugu",
      ],
      nativeFamily: "abugida",
    };

    const mask = generatePolyglotMask("X".repeat(500), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(abugidaChars.has(ch)).toBe(false);
    }
  });

  it("excludes cyrillic subtype via localeExcludedSubtypes (e.g., Russia)", () => {
    const cyrillicPool = ALL_POOLS.find(p => p.subtype === "cyrillic")!;
    const cyrillicChars = new Set([...cyrillicPool.chars]);

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: [],
      localeExcludedSubtypes: ["cyrillic"],
    };

    const mask = generatePolyglotMask("X".repeat(200), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(cyrillicChars.has(ch)).toBe(false);
    }
  });

  it("excludes devanagari subtype via localeExcludedSubtypes (e.g., India/Hindi)", () => {
    const devanagariPool = ALL_POOLS.find(p => p.subtype === "devanagari")!;
    const devanagariChars = new Set([...devanagariPool.chars]);

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: [],
      localeExcludedSubtypes: ["devanagari"],
    };

    const mask = generatePolyglotMask("X".repeat(200), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(devanagariChars.has(ch)).toBe(false);
    }
  });

  it("merges both excludedSubtypes and localeExcludedSubtypes", () => {
    const latinPool = ALL_POOLS.find(p => p.subtype === "latin")!;
    const keyboardPool = ALL_POOLS.find(p => p.subtype === "keyboard")!;
    const excludedChars = new Set([...latinPool.chars, ...keyboardPool.chars]);

    const config: PolyglotMaskConfig = {
      enabledFamilies: ["alphabetic", "syllabary", "abugida", "symbol"],
      excludedSubtypes: ["keyboard"],
      localeExcludedSubtypes: ["latin"],
    };

    const mask = generatePolyglotMask("X".repeat(200), config);
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      expect(excludedChars.has(ch)).toBe(false);
    }
  });

  it("never produces two consecutive chars from the same script subtype", () => {
    const mask = generatePolyglotMask("A".repeat(120));
    let lastSubtype: WritingSystemSubtype | null = null;
    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const sub = SUBTYPE_BY_CHAR.get(ch);
      const fam = FAMILY_BY_CHAR.get(ch);
      // Symbol-family subtypes may repeat (symbol-symbol is allowed).
      // Script subtypes (alphabetic/syllabary/abugida) must not repeat.
      if (sub && lastSubtype !== null && fam !== "symbol") {
        expect(sub).not.toBe(lastSubtype);
      }
      if (sub) lastSubtype = sub;
    }
  });
});
