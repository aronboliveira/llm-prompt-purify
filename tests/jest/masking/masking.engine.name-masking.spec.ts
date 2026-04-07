import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";
import {
  createNameAliasMask,
  createFakerCounterState,
} from "@core/masking/utils/mask-strategy.utils";
import type { AdvancedMaskingPreferences } from "@core/masking/declarations/masking.types";

describe("MaskingEngine – Name Masking", () => {
  const engine = new MaskingEngine(),
    usScope = buildScanScopeSelection(["us"], "selected-plus-global"),
    brScope = buildScanScopeSelection(["br"], "selected-plus-global"),
    globalScope = buildScanScopeSelection([], "global-only");

  function scanWithNames(
    text: string,
    overrides: Partial<AdvancedMaskingPreferences> = {},
  ) {
    return engine.scan(
      text,
      DEFAULT_GROUP_PREFERENCES,
      usScope,
      "2026-06-01T00:00:00.000Z",
      {
        ...DEFAULT_ADVANCED_PREFERENCES,
        maskNames: true,
        nameStrategy: "alias",
        ...overrides,
      },
    );
  }

  // ─── Opt-in toggle ──────────────────────────────────────────────────────────

  describe("opt-in toggle (maskNames)", () => {
    it("does NOT mask names when maskNames is false (default)", () => {
      const result = engine.scan(
        "Contact Emily Carter for details.",
        DEFAULT_GROUP_PREFERENCES,
        usScope,
      );

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeUndefined();
      expect(result.maskedText).toContain("Emily Carter");
    });

    it("masks names when maskNames is true", () => {
      const result = scanWithNames("Please ask Emily Carter for details.");

      const nameMatch = result.matches.find(
        m =>
          m.ruleId.startsWith("name-standalone-") ||
          m.ruleId === "labeled-name" ||
          m.ruleId === "name-contextual",
      );
      expect(nameMatch).toBeTruthy();
      expect(result.maskedText).not.toContain("Emily Carter");
    });
  });

  // ─── Alias strategy (initials + counter) ────────────────────────────────────

  describe("alias strategy (nameStrategy: alias)", () => {
    it("replaces a name with its initials + counter (e.g. EC1)", () => {
      const result = scanWithNames("Emily Carter joined the team.");

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.mask).toBe("EC1");
    });

    it("gives distinct counters to different names sharing the same initials", () => {
      const result = scanWithNames("Emily Carter and Edward Clarke met today.");

      const nameMatches = result.matches.filter(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatches.length).toBeGreaterThanOrEqual(2);

      const ecMasks = nameMatches
        .map(m => m.mask)
        .filter(m => m.startsWith("EC"));
      expect(ecMasks).toContain("EC1");
      expect(ecMasks).toContain("EC2");
    });

    it("reuses the same alias for repeated occurrences of the same name", () => {
      const result = scanWithNames(
        "Emily Carter said hello, and then Emily Carter left.",
      );

      const nameMatches = result.matches.filter(
        m => m.value === "Emily Carter",
      );
      expect(nameMatches.length).toBe(2);
      expect(nameMatches[0].mask).toBe(nameMatches[1].mask);
    });

    it("produces distinct aliases for names with different initials", () => {
      const result = scanWithNames(
        "Emily Carter and Michael Johnson discussed the plan.",
      );

      const nameMatches = result.matches.filter(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatches.length).toBeGreaterThanOrEqual(2);

      const masks = nameMatches.map(m => m.mask);
      expect(masks).toContain("EC1");
      expect(masks).toContain("MJ1");
    });

    it("falls back to NN when initials cannot be extracted", () => {
      const counter = createFakerCounterState();
      const mask = createNameAliasMask("   ", counter);
      expect(mask).toBe("NN1");
    });
  });

  // ─── Default strategy (standard masking) ────────────────────────────────────

  describe("default strategy (nameStrategy: default)", () => {
    it("masks names using the standard masking strategy instead of aliases", () => {
      const result = scanWithNames("Emily Carter joined.", {
        nameStrategy: "default",
        maskingStrategy: "tags",
      });

      const nameMatch = result.matches.find(
        m =>
          m.ruleId.startsWith("name-standalone-") ||
          m.ruleId === "labeled-name",
      );
      expect(nameMatch).toBeTruthy();
      // Tags strategy produces <TAG> format, NOT alias format
      expect(nameMatch!.mask).toMatch(/^<.+>$/u);
      expect(nameMatch!.mask).not.toMatch(/^[A-Z]{2,5}\d+$/u);
    });

    it("masks names using faker strategy when nameStrategy is default", () => {
      const result = scanWithNames("Emily Carter joined.", {
        nameStrategy: "default",
        maskingStrategy: "faker",
      });

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      // Faker produces semantic replacements, not alias format
      expect(nameMatch!.mask).not.toMatch(/^[A-Z]{2}\d+$/u);
    });

    it("masks names using redacted strategy when nameStrategy is default", () => {
      const result = scanWithNames("Emily Carter joined.", {
        nameStrategy: "default",
        maskingStrategy: "redacted",
      });

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      // Redacted produces ████ format
      expect(nameMatch!.mask).toMatch(/[█#*]/u);
    });
  });

  // ─── Multi-locale detection ─────────────────────────────────────────────────

  describe("multi-locale name detection", () => {
    it("detects EN-US names", () => {
      const result = scanWithNames("Emily Carter signed the document.");
      expect(result.matches.some(m => m.ruleId === "name-standalone-en")).toBe(
        true,
      );
    });

    it("detects PT-BR names", () => {
      const result = scanWithNames("Maria Clara Souza assinou o contrato.");

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.value).toBe("Maria Clara Souza");
      expect(nameMatch!.mask).toBe("MCS1");
    });

    it("detects ES names", () => {
      const result = scanWithNames("Carlos García firmó el documento.");

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.value).toContain("Carlos");
      expect(nameMatch!.mask).toMatch(/^CG?\d+$/u);
    });

    it("detects RU names (transliterated)", () => {
      const result = scanWithNames("Ivan Petrov sent the report.");

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.value).toBe("Ivan Petrov");
      expect(nameMatch!.mask).toBe("IP1");
    });

    it("detects IN names", () => {
      const result = scanWithNames("Rahul Sharma submitted the form.");

      const nameMatch = result.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.value).toBe("Rahul Sharma");
      expect(nameMatch!.mask).toBe("RS1");
    });
  });

  // ─── Contextual name detection ──────────────────────────────────────────────

  describe("contextual name detection", () => {
    it("detects names preceded by context keywords like 'Dear'", () => {
      const result = scanWithNames("Dear John Smith, please review.");

      const contextMatch = result.matches.find(
        m => m.ruleId === "name-contextual",
      );
      expect(contextMatch).toBeTruthy();
      expect(result.maskedText).not.toContain("John Smith");
    });

    it("detects names preceded by Portuguese context keywords", () => {
      const result = scanWithNames(
        "Prezado João Silva, favor revisar o documento.",
      );

      const hasNameMatch = result.matches.some(
        m =>
          m.ruleId === "name-contextual" ||
          m.ruleId === "name-standalone-pt-br" ||
          m.ruleId === "labeled-name",
      );
      expect(hasNameMatch).toBe(true);
    });
  });

  // ─── Labeled name integration ────────────────────────────────────────────────

  describe("labeled-name rule integration", () => {
    it("masks labeled names when maskNames is true", () => {
      const result = scanWithNames("Nome: Maria Clara Souza");

      const labeledMatch = result.matches.find(
        m => m.ruleId === "labeled-name",
      );
      expect(labeledMatch).toBeTruthy();
      expect(result.maskedText).not.toContain("Maria Clara Souza");
    });

    it("labeled-name remains active even when maskNames is false", () => {
      const result = engine.scan(
        "Nome: Maria Clara Souza",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );

      const labeledMatch = result.matches.find(
        m => m.ruleId === "labeled-name",
      );
      // labeled-name is always active (keyword-gated, low FP risk)
      expect(labeledMatch).toBeTruthy();
    });

    it("applies alias strategy to labeled-name rule", () => {
      const result = scanWithNames("Name: Emily Carter");

      const labeledMatch = result.matches.find(
        m => m.ruleId === "labeled-name",
      );
      expect(labeledMatch).toBeTruthy();
      expect(labeledMatch!.mask).toBe("EC1");
    });
  });

  // ─── Negative tests (false-positive resistance) ─────────────────────────────

  describe("false-positive resistance", () => {
    it("does not mask common phrases that resemble names", () => {
      const result = scanWithNames(
        "New York is a big city. San Francisco is too.",
      );

      const nameMatches = result.matches.filter(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatches).toHaveLength(0);
    });

    it("does not mask single words as names", () => {
      const result = scanWithNames("Contact Emily for details.");

      const nameMatches = result.matches.filter(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatches).toHaveLength(0);
    });

    it("does not mask names that exceed 5 parts", () => {
      const result = scanWithNames(
        "Contact Emily Rose Margaret Catherine Helena Grace for details.",
      );

      const nameMatches = result.matches.filter(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      // The regex allows up to 2+3=5 parts; 6+ should not match as one unit
      const sixWordName = nameMatches.find(
        m => m.value === "Emily Rose Margaret Catherine Helena Grace",
      );
      expect(sixWordName).toBeUndefined();
    });
  });

  // ─── createNameAliasMask unit tests ─────────────────────────────────────────

  describe("createNameAliasMask", () => {
    it("generates initials + counter from a two-part name", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("Emily Carter", counter)).toBe("EC1");
    });

    it("generates initials from a three-part name", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("Maria Clara Souza", counter)).toBe("MCS1");
    });

    it("increments counter for same initials", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("Emily Carter", counter)).toBe("EC1");
      expect(createNameAliasMask("Edward Clarke", counter)).toBe("EC2");
      expect(createNameAliasMask("Eliot Champion", counter)).toBe("EC3");
    });

    it("tracks counters independently per initial group", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("Emily Carter", counter)).toBe("EC1");
      expect(createNameAliasMask("Michael Johnson", counter)).toBe("MJ1");
      expect(createNameAliasMask("Edward Clarke", counter)).toBe("EC2");
      expect(createNameAliasMask("Mark Jensen", counter)).toBe("MJ2");
    });

    it("uses NN fallback for whitespace-only input", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("   ", counter)).toBe("NN1");
    });

    it("uses NN fallback for empty string", () => {
      const counter = createFakerCounterState();
      expect(createNameAliasMask("", counter)).toBe("NN1");
    });

    it("falls back to counter 1 without counter state", () => {
      expect(createNameAliasMask("Emily Carter")).toBe("EC1");
      // Without counter state, always returns 1
      expect(createNameAliasMask("Emily Carter")).toBe("EC1");
    });
  });

  // ─── Engine rebuild / regeneration with name masking ────────────────────────

  describe("rebuild and regeneration", () => {
    it("rebuilds correctly with name masks removed from output", () => {
      const scanResult = scanWithNames(
        "Emily Carter and Michael Johnson signed.",
      );

      expect(scanResult.maskedText).not.toContain("Emily Carter");
      expect(scanResult.maskedText).not.toContain("Michael Johnson");
      expect(scanResult.maskedText).toContain("EC1");
      expect(scanResult.maskedText).toContain("MJ1");
    });

    it("regenerateAll produces fresh aliases", () => {
      const scanResult = scanWithNames("Emily Carter signed the form.");

      const regenerated = engine.regenerateAll(
        scanResult.sourceText,
        scanResult.matches,
        scanResult.scannedAt,
        "random",
        {
          ...DEFAULT_ADVANCED_PREFERENCES,
          maskNames: true,
          nameStrategy: "alias",
        },
      );

      // After regeneration, alias counters reset so EC1 is still EC1
      const nameMatch = regenerated.matches.find(m =>
        m.ruleId.startsWith("name-standalone-"),
      );
      expect(nameMatch).toBeTruthy();
      expect(nameMatch!.mask).toBe("EC1");
    });
  });

  // ─── Strategy compatibility ─────────────────────────────────────────────────

  describe("alias works across all base strategies", () => {
    const strategies = ["random", "tags", "faker", "redacted"] as const;

    for (const strategy of strategies) {
      it(`produces alias masks when nameStrategy=alias even with base strategy=${strategy}`, () => {
        const result = scanWithNames("Emily Carter joined.", {
          maskingStrategy: strategy,
        });

        const nameMatch = result.matches.find(m =>
          m.ruleId.startsWith("name-standalone-"),
        );
        expect(nameMatch).toBeTruthy();
        expect(nameMatch!.mask).toBe("EC1");
      });
    }
  });
});
