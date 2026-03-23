import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "./constants/masking.constants";
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
    const sourceText =
        "Summarize this product update for the engineering weekly digest.",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.hasMatches).toBe(false);
    expect(result.maskedText).toBe(sourceText);
    expect(result.matches).toHaveLength(0);
  });

  it("masks repeated email values with the same generated token", () => {
    const sourceText =
        "Email maria@example.com and copy maria@example.com into the CRM.",
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
        brazilScope,
      ),
      invalidResult = engine.scan(
        "Ignore 4111 1111 1111 1112 because it is not valid.",
        DEFAULT_GROUP_PREFERENCES,
        brazilScope,
      );

    expect(
      validResult.matches.some(match => match.ruleId === "credit-card"),
    ).toBe(true);
    expect(validResult.maskedText).not.toContain("4111 1111 1111 1111");
    expect(
      invalidResult.matches.some(match => match.ruleId === "credit-card"),
    ).toBe(false);
  });

  it("masks labeled card numbers even when Luhn validation fails", () => {
    const sourceText = "Meu número de cartão de crédito é 4532-1488-0343-6467",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope),
      labeledCardMatch = result.matches.find(
        match => match.ruleId === "labeled-card-number",
      );

    expect(labeledCardMatch).toBeTruthy();
    expect(labeledCardMatch?.mask).toMatch(/#/u);
    expect(result.maskedText).not.toContain("4532-1488-0343-6467");
  });

  it("masks explicit credential assignments", () => {
    const sourceText =
        "api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.matches.map(match => match.ruleId)).toEqual(
      expect.arrayContaining(["openai-style-key", "jwt-token"]),
    );
    expect(result.maskedText).not.toContain(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );
    expect(result.maskedText).not.toContain(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
    );
  });

  it("masks provider credentials and localized secret assignments used in the mock corpus", () => {
    const sourceText = [
        "Encryption key: encryption_key=aes256_key_1234567890abcdef",
        'Contraseña de base de datos: db_password="MiContr@señ@BD2024!"',
        'Senha do banco de dados: db_password="MinhaS3nh@BD2024!"',
        "Stripe key: sk_live_51AbC123dEf456GhI789jKl012MnO345pQr",
        "Stripe test key: sk_test_4eC39HqLyjWDarjtT1zdp7dc",
        "Twilio SID: AC1234567890abcdef1234567890abcdef",
        "Twilio auth: AuthToken=abcdef1234567890abcdef1234567890",
        "SendGrid API: SG.abc123def456ghi789jkl012mno345pqr",
        "Mailgun key: key-1234567890abcdef1234567890abcdef",
        "Firebase key: AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr",
        "Azure connection string: DefaultEndpointsProtocol=https;AccountName=storage;AccountKey=abc123==;EndpointSuffix=core.windows.net",
      ].join("\n"),
      result = engine.scan(sourceText, DEFAULT_GROUP_PREFERENCES, brazilScope);

    expect(result.hasMatches).toBe(true);
    const allRuleIds = result.matches.map(match => match.ruleId);
    // Accept both secret-assignment and keyed-secret-assignment (higher priority with `=`)
    expect(
      allRuleIds.some(
        id => id === "secret-assignment" || id === "keyed-secret-assignment",
      ),
    ).toBe(true);
    expect(allRuleIds).toEqual(
      expect.arrayContaining([
        "openai-style-key",
        "twilio-account-sid",
        "sendgrid-api-key",
        "mailgun-api-key",
        "firebase-api-key",
      ]),
    );
    expect(result.maskedText).not.toContain("aes256_key_1234567890abcdef");
    expect(result.maskedText).not.toContain("MiContr@señ@BD2024!");
    expect(result.maskedText).not.toContain("MinhaS3nh@BD2024!");
    expect(result.maskedText).not.toContain(
      "sk_live_51AbC123dEf456GhI789jKl012MnO345pQr",
    );
    expect(result.maskedText).not.toContain("sk_test_4eC39HqLyjWDarjtT1zdp7dc");
    expect(result.maskedText).not.toContain(
      "AC1234567890abcdef1234567890abcdef",
    );
    expect(result.maskedText).not.toContain("abcdef1234567890abcdef1234567890");
    expect(result.maskedText).not.toContain(
      "SG.abc123def456ghi789jkl012mno345pqr",
    );
    expect(result.maskedText).not.toContain(
      "key-1234567890abcdef1234567890abcdef",
    );
    expect(result.maskedText).not.toContain(
      "AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr",
    );
    expect(result.maskedText).not.toContain("abc123==");
  });

  it("rebuilds the output when one mask is disabled", () => {
    const sourceText =
        "Email: maria@example.com\nToken: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      scanResult = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        brazilScope,
      ),
      matches = scanResult.matches.map(match =>
        match.ruleId === "email-address" ? { ...match, enabled: false } : match,
      ),
      rebuilt = engine.rebuild(
        scanResult.sourceText,
        matches,
        scanResult.scannedAt,
      );

    expect(rebuilt.maskedText).toContain("maria@example.com");
    expect(rebuilt.maskedText).not.toContain(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );
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
        result.matches[0].id,
      );

    expect(regenerated.matches[0].mask).not.toBe(result.matches[0].mask);
    expect(regenerated.matches[0].mask).toBe(regenerated.matches[1].mask);
  });

  it("uses global-only mode to mask labeled CPF via global rule while keeping shared rules", () => {
    const sourceText =
        "CPF: 529.982.247-25\nEmail: maria@example.com\nToken: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        globalOnlyBrazilScope,
      );

    expect(result.matches.map(match => match.ruleId)).toEqual(
      expect.arrayContaining([
        "cpf-global-labeled",
        "email-address",
        "openai-style-key",
      ]),
    );
    expect(result.matches.some(match => match.ruleId === "cpf")).toBe(false);
    expect(result.maskedText).not.toContain("529.982.247-25");
    expect(result.maskedText).not.toContain("maria@example.com");
    expect(result.maskedText).not.toContain(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );
  });

  it("masks labeled CPF via global rule even when the country scope is set to the United States", () => {
    const sourceText = "CPF: 529.982.247-25\nEmail: maria@example.com",
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        unitedStatesScope,
      );

    expect(result.matches.some(match => match.ruleId === "cpf")).toBe(false);
    expect(
      result.matches.some(match => match.ruleId === "cpf-global-labeled"),
    ).toBe(true);
    expect(result.maskedText).not.toContain("529.982.247-25");
    expect(result.maskedText).not.toContain("maria@example.com");
  });

  it("forces compliance placeholders for numeric identifiers/financial values across all strategies", () => {
    const sourceText =
        "Número de tarjeta: 4532 7854 1236 9874\nRegistro fiscal RFC ASDF567890ASD\nCPF do cliente: 111.222.333-44",
      scope = buildScanScopeSelection(["br", "mx"], "selected-plus-global"),
      strategies = ["random", "tags", "faker", "redacted"] as const;

    for (const strategy of strategies) {
      const result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        scope,
        "2026-03-09T00:00:00.000Z",
        {
          ...DEFAULT_ADVANCED_PREFERENCES,
          maskingStrategy: strategy,
        },
      );

      const complianceMatches = result.matches.filter(match => {
        return (
          (match.category === "financial" || match.category === "identifier") &&
          /\d/u.test(match.value)
        );
      });

      expect(complianceMatches.length).toBeGreaterThan(0);
      for (const complianceMatch of complianceMatches) {
        expect(complianceMatch.mask).toMatch(/#/u);
        expect(complianceMatch.mask).not.toBe(complianceMatch.value);
        expect(result.maskedText).not.toContain(complianceMatch.value);
      }
    }
  });

  describe("American English coverage", () => {
    it("masks SSNs and US phone numbers", () => {
      const sourceText = "SSN: 123-45-6789\nReach me at (415) 555-2671",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          unitedStatesScope,
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["us-phone", "us-ssn"]),
      );
      expect(result.maskedText).not.toContain("123-45-6789");
      expect(result.maskedText).not.toContain("(415) 555-2671");
    });

    it("masks structured English labels for names and addresses", () => {
      const sourceText =
          "Full name: Emily Carter\nAddress: 441 Market Street, San Francisco, CA",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          unitedStatesScope,
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-address", "labeled-name"]),
      );
      expect(result.maskedText).not.toContain("Emily Carter");
      expect(result.maskedText).not.toContain(
        "441 Market Street, San Francisco, CA",
      );
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
            fixture.detectionMode ?? "selected-plus-global",
          ),
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds),
        );

        for (const hiddenValue of fixture.hiddenValues) {
          expect(result.maskedText).not.toContain(hiddenValue);
        }
      });
    }

    it("masks Brazilian phone numbers and labeled CNH data", () => {
      const sourceText = "+55 (11) 99876-5432\nCNH: 12345678901",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          brazilScope,
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["br-phone", "cnh-labeled"]),
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
            fixture.detectionMode ?? "selected-plus-global",
          ),
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds),
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
            fixture.detectionMode ?? "selected-plus-global",
          ),
        );

        expect(result.matches.map(match => match.ruleId)).toEqual(
          expect.arrayContaining(fixture.expectedRuleIds),
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
          buildScanScopeSelection(["co"], "selected-plus-global"),
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining([
          "labeled-address",
          "labeled-name",
          "labeled-phone",
        ]),
      );
      expect(result.maskedText).not.toContain("Camila Torres Rivera");
      expect(result.maskedText).not.toContain("Calle 85 # 12-34, Bogotá");
      expect(result.maskedText).not.toContain("+57 301 222 3344");
    });

    it("masks Spanish role-labeled names used in the ES mock corpus", () => {
      const sourceText =
          "Beneficiario: Lucía Elena Pérez Torres\nContacto principal: Diego Alejandro Martín Ramírez",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(["es"], "selected-plus-global"),
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-name"]),
      );
      expect(result.maskedText).not.toContain("Lucía Elena Pérez Torres");
      expect(result.maskedText).not.toContain("Diego Alejandro Martín Ramírez");
    });

    it("masks Chilean RUT values when they are explicitly labeled", () => {
      const sourceText = "RUT empresa 55.666.777-2",
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          buildScanScopeSelection(["cl"], "selected-plus-global"),
        );

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["chile-rut"]),
      );
      expect(result.maskedText).not.toContain("55.666.777-2");
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
            fixture.detectionMode ?? "selected-plus-global",
          ),
        );

        for (const excludedRuleId of fixture.excludedRuleIds) {
          expect(
            result.matches.some(match => match.ruleId === excludedRuleId),
          ).toBe(false);
        }

        for (const visibleValue of fixture.visibleValues) {
          expect(result.maskedText).toContain(visibleValue);
        }
      });
    }
  });
});
