/**
 * Unit tests for MaskingEngine — scan, rebuild, regenerateAll, regenerateMatch.
 */
import { MaskingEngine } from "../masking.engine";
import { createGroupPreferenceMap } from "../utils/mask-group.utils";
import { buildScanScopeSelection } from "../utils/country-scope.utils";
import type {
  MaskGroupPreferenceMap,
  ScanMatch,
  ScanScopeSelection,
} from "../declarations/masking.types";

function makeScope(
  countries: readonly string[] = ["br", "us"],
): ScanScopeSelection {
  return buildScanScopeSelection(countries as any, "selected-plus-global");
}

function makePrefs(): MaskGroupPreferenceMap {
  return createGroupPreferenceMap();
}

describe("MaskingEngine", () => {
  let engine: MaskingEngine;

  beforeEach(() => {
    engine = new MaskingEngine();
  });

  // -----------------------------------------------------------------------
  // scan()
  // -----------------------------------------------------------------------
  describe("scan()", () => {
    it("returns empty result for neutral text", () => {
      const result = engine.scan(
        "Hello world!",
        makePrefs(),
        makeScope(),
        "2025-01-01T00:00:00.000Z",
      );

      expect(result.hasMatches).toBe(false);
      expect(result.totalMatches).toBe(0);
      expect(result.matches).toEqual([]);
      expect(result.maskedText).toBe("Hello world!");
    });

    it("detects a valid CPF", () => {
      const text = "My CPF is 529.982.247-25";
      const result = engine.scan(text, makePrefs(), makeScope(["br"]));

      expect(result.hasMatches).toBe(true);
      expect(result.totalMatches).toBeGreaterThanOrEqual(1);

      const cpfMatch = result.matches.find((m) =>
        m.value.replace(/\D/g, "") === "52998224725",
      );
      expect(cpfMatch).toBeDefined();
      expect(cpfMatch!.category).toBe("identifier");
    });

    it("detects a valid CNPJ", () => {
      const text = "CNPJ: 11.222.333/0001-81";
      const result = engine.scan(text, makePrefs(), makeScope(["br"]));

      expect(result.hasMatches).toBe(true);
      const cnpjMatch = result.matches.find((m) =>
        m.value.replace(/\D/g, "") === "11222333000181",
      );
      expect(cnpjMatch).toBeDefined();
    });

    it("detects a credit card number via Luhn", () => {
      const text = "Card: 4111 1111 1111 1111";
      const result = engine.scan(text, makePrefs(), makeScope());

      expect(result.hasMatches).toBe(true);
      const ccMatch = result.matches.find((m) =>
        m.value.replace(/\D/g, "").startsWith("4111"),
      );
      expect(ccMatch).toBeDefined();
      expect(ccMatch!.category).toBe("financial");
    });

    it("detects an email address", () => {
      const text = "Contact: alice@example.com for details";
      const result = engine.scan(text, makePrefs(), makeScope());

      expect(result.hasMatches).toBe(true);
      const emailMatch = result.matches.find((m) =>
        m.value.includes("alice@example.com"),
      );
      expect(emailMatch).toBeDefined();
      expect(emailMatch!.category).toBe("personal");
    });

    it("masks detected values in maskedText", () => {
      const text = "My CPF is 529.982.247-25";
      const result = engine.scan(text, makePrefs(), makeScope(["br"]));

      if (result.hasMatches) {
        expect(result.maskedText).not.toContain("529.982.247-25");
        expect(result.maskedText).not.toBe(text);
      }
    });

    it("respects global-only detection mode", () => {
      const text = "CPF: 529.982.247-25";
      const globalOnlyScope = buildScanScopeSelection(
        ["br"],
        "global-only",
      );
      const result = engine.scan(text, makePrefs(), globalOnlyScope);

      // CPF has coverage=country, so in global-only mode it should be filtered out
      const cpfMatch = result.matches.find((m) =>
        m.value.replace(/\D/g, "") === "52998224725",
      );
      expect(cpfMatch).toBeUndefined();
    });

    it("populates groupCounts correctly", () => {
      const text = "Email: alice@example.com, Card: 4111 1111 1111 1111";
      const result = engine.scan(text, makePrefs(), makeScope());

      expect(result.groupCounts).toBeDefined();
      expect(typeof result.groupCounts.personal).toBe("number");
      expect(typeof result.groupCounts.financial).toBe("number");
    });
  });

  // -----------------------------------------------------------------------
  // rebuild()
  // -----------------------------------------------------------------------
  describe("rebuild()", () => {
    it("re-applies masks from existing matches", () => {
      const text = "My CPF is 529.982.247-25";
      const firstResult = engine.scan(
        text,
        makePrefs(),
        makeScope(["br"]),
      );

      if (firstResult.matches.length > 0) {
        const rebuilt = engine.rebuild(
          text,
          firstResult.matches,
          firstResult.scannedAt,
        );

        expect(rebuilt.maskedText).toBe(firstResult.maskedText);
        expect(rebuilt.totalMatches).toBe(firstResult.totalMatches);
      }
    });

    it("returns sourceText when no matches are enabled", () => {
      const text = "Just plain text";
      const matches: ScanMatch[] = [];
      const result = engine.rebuild(text, matches, "2025-01-01T00:00:00Z");

      expect(result.maskedText).toBe(text);
      expect(result.totalMatches).toBe(0);
      expect(result.hasMatches).toBe(false);
    });

    it("respects enabled flag", () => {
      const text = "CPF: 529.982.247-25";
      const first = engine.scan(text, makePrefs(), makeScope(["br"]));

      if (first.matches.length > 0) {
        const disabledMatches = first.matches.map((m) => ({
          ...m,
          enabled: false,
        }));
        const rebuilt = engine.rebuild(text, disabledMatches, first.scannedAt);

        expect(rebuilt.maskedText).toBe(text);
        expect(rebuilt.enabledMatches).toBe(0);
      }
    });
  });

  // -----------------------------------------------------------------------
  // regenerateAll()
  // -----------------------------------------------------------------------
  describe("regenerateAll()", () => {
    it("generates new masks for all matches", () => {
      const text = "CPF: 529.982.247-25, Email: test@test.com";
      const first = engine.scan(text, makePrefs(), makeScope(["br"]));

      if (first.matches.length > 0) {
        const regenerated = engine.regenerateAll(
          text,
          first.matches,
          first.scannedAt,
        );

        expect(regenerated.totalMatches).toBe(first.totalMatches);
        // Masks are randomized, so we can't guarantee they differ,
        // but structural properties should be preserved
        expect(regenerated.matches.length).toBe(first.matches.length);
      }
    });
  });

  // -----------------------------------------------------------------------
  // regenerateMatch()
  // -----------------------------------------------------------------------
  describe("regenerateMatch()", () => {
    it("regenerates mask only for the targeted match", () => {
      const text = "CPF: 529.982.247-25, Email: test@test.com";
      const first = engine.scan(text, makePrefs(), makeScope(["br"]));

      if (first.matches.length >= 2) {
        const targetId = first.matches[0].id;
        const regenerated = engine.regenerateMatch(
          text,
          first.matches,
          first.scannedAt,
          targetId,
        );

        expect(regenerated.matches.length).toBe(first.matches.length);
      }
    });

    it("falls back to rebuild for unknown matchId", () => {
      const text = "CPF: 529.982.247-25";
      const first = engine.scan(text, makePrefs(), makeScope(["br"]));

      const regenerated = engine.regenerateMatch(
        text,
        first.matches,
        first.scannedAt,
        "nonexistent-id",
      );

      expect(regenerated.totalMatches).toBe(first.totalMatches);
    });
  });
});
