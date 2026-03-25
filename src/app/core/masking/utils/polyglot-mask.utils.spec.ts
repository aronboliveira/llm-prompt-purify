import {
  generatePolyglotMask,
  createDistinctPolyglotMask,
  DEFAULT_POLYGLOT_CONFIG,
} from "./polyglot-mask.utils";
import type { PolyglotMaskConfig } from "./polyglot-mask.utils";
import {
  ALL_POOLS,
  POOLS_BY_FAMILY,
} from "../constants/polyglot-pools.constants";
import type { WritingSystemFamily } from "../constants/polyglot-pools.constants";

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

const FAMILY_BY_CHAR = charFamilyMap();
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

  it("never produces two consecutive characters from the same family", () => {
    // Run with a decently long input for statistical confidence
    const input = "A".repeat(120);
    const mask = generatePolyglotMask(input);
    let lastFamily: WritingSystemFamily | null = null;

    for (const ch of mask) {
      if (SEPARATOR_RE.test(ch)) continue;
      const fam = familyOf(ch);
      expect(fam).toBeDefined();
      if (lastFamily !== null) {
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
    it("uses at least 3 different families in a long mask", () => {
      const mask = generatePolyglotMask("X".repeat(200));
      const families = new Set<WritingSystemFamily>();
      for (const ch of mask) {
        const f = familyOf(ch);
        if (f) families.add(f);
      }
      expect(families.size).toBeGreaterThanOrEqual(3);
    });

    it("produces different output on repeated calls (randomness)", () => {
      const input = "A".repeat(40);
      const masks = new Set(
        Array.from({ length: 10 }, () => generatePolyglotMask(input)),
      );
      // With 4 families and many chars, collisions are effectively impossible
      expect(masks.size).toBeGreaterThan(1);
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
