import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";
import {
  FUZZY_LABEL_MASK_FIXTURES,
  FUZZY_LABEL_NEGATIVE_FIXTURES,
  GLOBAL_CREDENTIAL_MASK_FIXTURES,
  GLOBAL_FINANCIAL_MASK_FIXTURES,
  GLOBAL_NEGATIVE_MASK_FIXTURES,
  GLOBAL_PERSONAL_MASK_FIXTURES,
  SCOPE_BOUNDARY_MASK_FIXTURES,
} from "@testing/constants/mask-regression-corpus.constants";
import {
  assertBoundaryFixture,
  assertNegativeFixture,
  assertPositiveFixture,
} from "@testing/utils/masking-engine-assertions.utils";

describe("MaskingEngine regression corpus", () => {
  const engine = new MaskingEngine();

  describe("global credential corpus", () => {
    for (const fixture of GLOBAL_CREDENTIAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("global personal corpus", () => {
    for (const fixture of GLOBAL_PERSONAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("global financial corpus", () => {
    for (const fixture of GLOBAL_FINANCIAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("negative pass-through corpus", () => {
    for (const fixture of GLOBAL_NEGATIVE_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertNegativeFixture(engine, fixture);
      });
    }
  });

  describe("scope boundary corpus", () => {
    for (const fixture of SCOPE_BOUNDARY_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertBoundaryFixture(engine, fixture);
      });
    }
  });

  describe("fuzzy label corpus", () => {
    for (const fixture of FUZZY_LABEL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }

    for (const fixture of FUZZY_LABEL_NEGATIVE_FIXTURES) {
      it(fixture.description, () => {
        assertNegativeFixture(engine, fixture);
      });
    }
  });

  it("keeps consistent masks for repeated secret assignments inside one prompt", () => {
    const sourceText = [
        "api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        "Repeat api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 later in the ticket.",
      ].join("\n"),
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["us"], "selected-plus-global")
      );

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].mask).toBe(result.matches[1].mask);
    expect(result.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
  });

  it("masks short numeric password assignments from main textarea labels", () => {
    const sourceText = [
        "senha=123",
        "password : 4567",
        "contraseÑa=89012",
        "密码=321",
        "पासवर्ड=654",
      ].join("\n"),
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["br"], "selected-plus-global"),
        "2026-05-09T00:00:00.000Z",
        { ...DEFAULT_ADVANCED_PREFERENCES, maskingStrategy: "tags" },
      ),
      numericPasswordMatches = result.matches.filter(
        match => match.ruleId === "numeric-secret-assignment",
      );

    expect(numericPasswordMatches.map(match => match.value)).toEqual([
      "123",
      "4567",
      "89012",
      "321",
      "654",
    ]);
    expect(result.maskedText).not.toContain("123");
    expect(result.maskedText).not.toContain("4567");
    expect(result.maskedText).not.toContain("89012");
    expect(result.maskedText).not.toContain("321");
    expect(result.maskedText).not.toContain("654");
  });

  it("does not treat HTTP bearer scheme words as config-secret values", () => {
    const sourceText =
        "Bearer token: Bearer abc123_def456-ghi789.jkl012~mno345+pqr678",
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["us"], "selected-plus-global"),
        "2026-05-09T00:00:00.000Z",
        { ...DEFAULT_ADVANCED_PREFERENCES, maskingStrategy: "tags" },
      );

    expect(
      result.matches.some(match => match.ruleId === "config-secret-assignment"),
    ).toBe(false);
    expect(result.matches.map(match => match.ruleId)).toContain(
      "bearer-token",
    );
    expect(result.maskedText).not.toContain(
      "abc123_def456-ghi789.jkl012~mno345+pqr678",
    );
  });

  it("preserves untouched prose around masked values instead of collapsing formatting", () => {
    const sourceText = [
        "Context before",
        "Email: maria@example.com",
        "",
        "Context after",
      ].join("\n"),
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["br"], "selected-plus-global")
      );

    expect(result.maskedText).toContain("Context before");
    expect(result.maskedText).toContain("Context after");
    expect(result.maskedText).toContain("\n\n");
    expect(result.maskedText).not.toContain("maria@example.com");
  });
});
