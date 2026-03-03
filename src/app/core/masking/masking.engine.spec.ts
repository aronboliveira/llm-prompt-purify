import { DEFAULT_GROUP_PREFERENCES } from "./constants/masking.constants";
import { MaskingEngine } from "./masking.engine";
import { buildScanScopeSelection } from "./utils/country-scope.utils";
import { createGroupPreferenceMap } from "./utils/mask-group.utils";
import {
  BRAZILIAN_PORTUGUESE_MASK_FIXTURES,
  GLOBAL_SCOPE_MASK_FIXTURES,
  INTERNATIONAL_MASK_FIXTURES,
  NEGATIVE_LOCALE_MASK_FIXTURES,
} from "../../testing/constants/locale-mask-fixtures.constants";

describe("MaskingEngine", () => {
  const engine = new MaskingEngine(),
    brazilScope = buildScanScopeSelection(["br"], "selected-plus-global"),
    globalOnlyBrazilScope = buildScanScopeSelection(["br"], "global-only"),
    unitedStatesScope = buildScanScopeSelection(["us"], "selected-plus-global");

  it("returns the original text when nothing supported is detected", () => {
    const sourceText = "Summarize this product update for the engineering weekly digest.",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.hasMatches).toBe(false);
    expect(result.maskedText).toBe(sourceText);
    expect(result.matches).toHaveLength(0);
  });

  it("masks repeated email values with the same generated token", () => {
    const sourceText = "Email maria@example.com and copy maria@example.com into the CRM.",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].ruleId).toBe("email-address");
    expect(result.matches[0].mask).toBe(result.matches[1].mask);
    expect(result.maskedText).not.toContain("maria@example.com");
  });

  it("masks valid credit card numbers and ignores invalid ones", () => {
    const validResult = engine.scan(
        "Charge card 4111 1111 1111 1111 today.",
        DEFAULT_GROUP_PREFERENCES,
        brazilScope
      ),
      invalidResult = engine.scan(
        "Ignore 4111 1111 1111 1112 because it is not valid.",
        DEFAULT_GROUP_PREFERENCES,
        brazilScope
      );

    expect(validResult.matches.some(match => match.ruleId === "credit-card")).toBe(true);
    expect(validResult.maskedText).not.toContain("4111 1111 1111 1111");
    expect(invalidResult.matches.some(match => match.ruleId === "credit-card")).toBe(false);
  });

  it("masks explicit credential assignments", () => {
    const sourceText =
        "api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.matches.map(match => match.ruleId)).toEqual(
      expect.arrayContaining(["openai-style-key", "jwt-token"])
    );
    expect(result.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    expect(result.maskedText).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature");
  });

  it("rebuilds the output when one mask is disabled", () => {
    const sourceText =
        "Email: maria@example.com\nToken: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      scanResult = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope),
      matches = scanResult.matches.map(match =>
        match.ruleId === "email-address" ? { ...match, enabled: false } : match
      ),
      rebuilt = engine.rebuild(scanResult.sourceText, matches, scanResult.scannedAt);

    expect(rebuilt.maskedText).toContain("maria@example.com");
    expect(rebuilt.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    expect(rebuilt.enabledMatches).toBe(1);
  });

  it("respects disabled group preferences during scan", () => {
    const sourceText = "CPF: 529.982.247-25\nContato: maria@example.com",
      groupPreferences = createGroupPreferenceMap({
        identifier: { enabled: false },
      }),
      result = engine.scan(sourceText, groupPreferences, brazilScope);

    expect(result.maskedText).toContain("529.982.247-25");
    expect(result.maskedText).not.toContain("maria@example.com");
  });

  it("regenerates repeated values with a fresh but consistent replacement", () => {
    const sourceText = "Email maria@example.com and maria@example.com again.",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope),
      regenerated = engine.regenerateMatch(
        result.sourceText,
        result.matches,
        result.scannedAt,
        result.matches[0].id
      );

    expect(regenerated.matches[0].mask).not.toBe(result.matches[0].mask);
    expect(regenerated.matches[0].mask).toBe(regenerated.matches[1].mask);
  });

  it("uses global-only mode to ignore country-specific identifiers while keeping shared rules", () => {
    const sourceText =
        "CPF: 529.982.247-25\nEmail: maria@example.com\nToken: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, globalOnlyBrazilScope);

    expect(result.matches.map(match => match.ruleId)).toEqual(
      expect.arrayContaining(["email-address", "openai-style-key"])
    );
    expect(result.matches.some(match => match.ruleId === "cpf")).toBe(false);
    expect(result.maskedText).toContain("529.982.247-25");
    expect(result.maskedText).not.toContain("maria@example.com");
    expect(result.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
  });

  it("does not activate Brazilian document rules when the country scope is set to the United States", () => {
    const sourceText = "CPF: 529.982.247-25\nEmail: maria@example.com",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, unitedStatesScope);

    expect(result.matches.some(match => match.ruleId === "cpf")).toBe(false);
    expect(result.maskedText).toContain("529.982.247-25");
    expect(result.maskedText).not.toContain("maria@example.com");
  });

  describe("American English coverage", () => {
    it("masks SSNs and US phone numbers", () => {
      const sourceText = "SSN: 123-45-6789\nReach me at (415) 555-2671",
        result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, unitedStatesScope);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["us-phone", "us-ssn"])
      );
      expect(result.maskedText).not.toContain("123-45-6789");
      expect(result.maskedText).not.toContain("(415) 555-2671");
    });

    it("masks structured English labels for names and addresses", () => {
      const sourceText =
          "Full name: Emily Carter\nAddress: 441 Market Street, San Francisco, CA",
        result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, unitedStatesScope);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-address", "labeled-name"])
      );
      expect(result.maskedText).not.toContain("Emily Carter");
      expect(result.maskedText).not.toContain("441 Market Street, San Francisco, CA");
    });
  });

  describe("Brazilian Portuguese coverage", () => {
    for (const fixture of BRAZILIAN_PORTUGUESE_MASK_FIXTURES) {
      it(fixture.description, () => {
        const result = engine.scan(
          fixture.sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(
            fixture.countryProfileIds,
            fixture.detectionMode ?? "selected-plus-global"
          )
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds)
        );

        for (const hiddenValue of fixture.hiddenValues) {
          expect(result.maskedText).not.toContain(hiddenValue);
        }
      });
    }

    it("masks Brazilian phone numbers and labeled CNH data", () => {
      const sourceText = "+55 (11) 99876-5432\nCNH: 12345678901",
        result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["br-phone", "cnh-labeled"])
      );
      expect(result.maskedText).not.toContain("+55 (11) 99876-5432");
      expect(result.maskedText).not.toContain("12345678901");
    });
  });

  describe("International coverage", () => {
    for (const fixture of INTERNATIONAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        const result = engine.scan(
          fixture.sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(
            fixture.countryProfileIds,
            fixture.detectionMode ?? "selected-plus-global"
          )
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds)
        );

        for (const hiddenValue of fixture.hiddenValues) {
          expect(result.maskedText).not.toContain(hiddenValue);
        }
      });
    }

    for (const fixture of GLOBAL_SCOPE_MASK_FIXTURES) {
      it(fixture.description, () => {
        const result = engine.scan(
          fixture.sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(
            fixture.countryProfileIds,
            fixture.detectionMode ?? "selected-plus-global"
          )
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds)
        );

        for (const hiddenValue of fixture.hiddenValues) {
          expect(result.maskedText).not.toContain(hiddenValue);
        }
      });
    }

    it("masks structured Spanish labels for names, addresses, and phone numbers", () => {
      const sourceText =
          "Nombre completo: Camila Torres Rivera\nDirección: Calle 85 # 12-34, Bogotá\nTeléfono: +57 301 222 3344",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(["co"], "selected-plus-global")
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-address", "labeled-name", "labeled-phone"])
      );
      expect(result.maskedText).not.toContain("Camila Torres Rivera");
      expect(result.maskedText).not.toContain("Calle 85 # 12-34, Bogotá");
      expect(result.maskedText).not.toContain("+57 301 222 3344");
    });
  });

  describe("Locale false-positive guardrails", () => {
    for (const fixture of NEGATIVE_LOCALE_MASK_FIXTURES) {
      it(fixture.description, () => {
        const result = engine.scan(
          fixture.sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(
            fixture.countryProfileIds,
            fixture.detectionMode ?? "selected-plus-global"
          )
        );

        for (const excludedRuleId of fixture.excludedRuleIds) {
          expect(result.matches.some(match => match.ruleId === excludedRuleId)).toBe(false);
        }

        for (const visibleValue of fixture.visibleValues) {
          expect(result.maskedText).toContain(visibleValue);
        }
      });
    }
  });
});
