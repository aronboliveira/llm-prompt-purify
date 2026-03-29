import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";

describe("MaskingEngine input-mock compliance corpus", () => {
  const engine = new MaskingEngine(),
    enScope = buildScanScopeSelection(["us"], "selected-plus-global"),
    esScope = buildScanScopeSelection(
      ["es", "latam-es"],
      "selected-plus-global",
    ),
    brScope = buildScanScopeSelection(["br"], "selected-plus-global"),
    compliancePrefs = {
      ...DEFAULT_ADVANCED_PREFERENCES,
      maskingStrategy: "tags" as const,
    };

  it("masks the requested ES mock ranges and enforces unrealistic numeric placeholders", () => {
    const files = readLanguageFiles("es");
    let numericChecked = 0;

    for (const file of files) {
      const sourceText = readMockFile("es", file),
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          esScope,
          "2026-03-09T00:00:00.000Z",
          compliancePrefs,
        );

      for (const match of result.matches) {
        expect(result.maskedText).not.toContain(match.value);

        if (
          (match.category === "financial" || match.category === "identifier") &&
          /\d/u.test(match.value)
        ) {
          expect(match.mask).not.toBe(match.value);
          numericChecked += 1;
        }
      }
    }

    expect(numericChecked).toBeGreaterThan(0);
  });

  it("masks the requested PT-BR mock range and enforces unrealistic numeric placeholders", () => {
    const files = readLanguageFiles("pt-br");
    let numericChecked = 0;

    for (const file of files) {
      const sourceText = readMockFile("pt-br", file),
        result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          brScope,
          "2026-03-09T00:00:00.000Z",
          compliancePrefs,
        );

      for (const match of result.matches) {
        expect(result.maskedText).not.toContain(match.value);

        if (
          (match.category === "financial" || match.category === "identifier") &&
          /\d/u.test(match.value)
        ) {
          expect(match.mask).not.toBe(match.value);
          numericChecked += 1;
        }
      }
    }

    expect(numericChecked).toBeGreaterThan(0);
  });

  it("masks the credential-heavy mock files that previously escaped detection", () => {
    const fixtureSets = [
      {
        language: "en",
        prefixes: [
          "api-key-",
          "aws-key-",
          "bearer-token-",
          "credential-assignment-",
          "jwt-token-",
          "twilio-sid-",
        ],
        scope: enScope,
      },
      {
        language: "es",
        prefixes: [
          "api-key-",
          "aws-key-",
          "bearer-token-",
          "credential-assignment-",
          "jwt-token-",
          "twilio-sid-",
        ],
        scope: esScope,
      },
      {
        language: "pt-br",
        prefixes: [
          "api-key-",
          "aws-key-",
          "bearer-token-",
          "credential-assignment-",
          "jwt-token-",
          "twilio-sid-",
        ],
        scope: brScope,
      },
    ] as const;

    for (const fixtureSet of fixtureSets) {
      const files = readLanguageFiles(fixtureSet.language).filter(file =>
        fixtureSet.prefixes.some(prefix => file.startsWith(prefix)),
      );
      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        const sourceText = readMockFile(fixtureSet.language, file),
          result = engine.scan(
            sourceText,
            DEFAULT_GROUP_PREFERENCES,
            fixtureSet.scope,
            "2026-03-09T00:00:00.000Z",
            compliancePrefs,
          );

        if (!result.hasMatches) {
          throw new Error(
            `${fixtureSet.language} mock ${file} produced no matches: ${sourceText}`,
          );
        }
        expect(result.hasMatches).toBe(true);
        expect(result.matches.length).toBeGreaterThan(0);

        for (const match of result.matches) {
          expect(result.maskedText).not.toContain(match.value);
        }
      }
    }
  });
});

function readLanguageFiles(language: string): readonly string[] {
  return readdirSync(join(process.cwd(), ".tmp", "input-mocks", language))
    .filter(file => file.endsWith(".txt"))
    .sort((left, right) => left.localeCompare(right));
}

function readMockFile(language: string, file: string): string {
  return readFileSync(
    join(process.cwd(), ".tmp", "input-mocks", language, file),
    "utf-8",
  );
}
