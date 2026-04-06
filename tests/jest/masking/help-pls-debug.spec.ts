import { MaskingEngine } from "../../../src/app/core/masking/masking.engine";
import { DEFAULT_GROUP_PREFERENCES } from "../../../src/app/core/masking/constants/masking.constants";
import { buildScanScopeSelection } from "../../../src/app/core/masking/utils/country-scope.utils";

const scope = buildScanScopeSelection(["us"], "selected-plus-global");

describe("help pls false positive debug", () => {
  const engine = new MaskingEngine();

  it("should NOT mask standalone 'help pls'", () => {
    const result = engine.scan("help pls 😅", DEFAULT_GROUP_PREFERENCES, scope);
    console.log("MASKED:", JSON.stringify(result.maskedText));
    console.log(
      "MATCHES:",
      JSON.stringify(
        result.matches.map(m => ({ ruleId: m.ruleId, value: m.value })),
      ),
    );
    expect(result.matches).toHaveLength(0);
  });

  it("should NOT mask 'help pls' with PII context", () => {
    const text =
      "Hey, my name is John Doe, email john@example.com.\n\nhelp pls 😅";
    const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, scope);
    console.log("MASKED:", JSON.stringify(result.maskedText));
    console.log(
      "MATCHES:",
      JSON.stringify(
        result.matches.map(m => ({
          ruleId: m.ruleId,
          value: m.value,
          start: m.start,
          end: m.end,
        })),
      ),
    );
    const helpPlsMatched = result.matches.some(m =>
      m.value.includes("help pls"),
    );
    expect(helpPlsMatched).toBe(false);
  });
});
