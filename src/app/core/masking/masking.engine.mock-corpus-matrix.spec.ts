import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
  MASKING_STRATEGY_ORDER,
} from "./constants/masking.constants";
import type { CountryProfileId } from "./declarations/masking.types";
import { MaskingEngine } from "./masking.engine";
import { buildScanScopeSelection } from "./utils/country-scope.utils";

interface CorpusLanguageConfig {
  language: "en" | "es" | "pt-br";
  selectedScopes: readonly CountryProfileId[];
}

const CORPUS_CONFIG: readonly CorpusLanguageConfig[] = [
  { language: "en", selectedScopes: ["us"] },
  { language: "es", selectedScopes: ["es", "latam-es"] },
  { language: "pt-br", selectedScopes: ["br", "pt"] },
];

describe("MaskingEngine full input-mock corpus matrix", () => {
  const engine = new MaskingEngine();

  for (const config of CORPUS_CONFIG) {
    it(`${config.language}: selected-plus-global masks every mock across all strategies`, () => {
      const files = readLanguageFiles(config.language),
        complianceIssues: string[] = [],
        noMatchFiles = new Set<string>();

      for (const file of files) {
        const sourceText = readMockFile(config.language, file);

        for (const strategy of MASKING_STRATEGY_ORDER) {
          const result = engine.scan(
            sourceText,
            DEFAULT_GROUP_PREFERENCES,
            buildScanScopeSelection(config.selectedScopes, "selected-plus-global"),
            "2026-03-09T00:00:00.000Z",
            {
              ...DEFAULT_ADVANCED_PREFERENCES,
              maskingStrategy: strategy,
            },
          );

          if (!result.hasMatches) {
            noMatchFiles.add(file);
            const riskSignals = findNoMatchRiskSignals(sourceText);
            if (riskSignals.length) {
              complianceIssues.push(
                `${config.language}/${file} [${strategy}] => no matches but risk signal(s): ${riskSignals.join(", ")}`,
              );
            }
            continue;
          }

          for (const match of result.matches) {
            if (result.maskedText.includes(match.value)) {
              complianceIssues.push(
                `${config.language}/${file} [${strategy}] => leaked value for ${match.ruleId}`,
              );
            }

            if (
              (match.category === "financial" || match.category === "identifier") &&
              /\d/u.test(match.value) &&
              !/#/u.test(match.mask)
            ) {
              complianceIssues.push(
                `${config.language}/${file} [${strategy}] => missing compliance placeholder for ${match.ruleId}`,
              );
            }
          }
        }
      }

      if (complianceIssues.length) {
        throw new Error(formatIssues(complianceIssues));
      }

      const detectionCoverage =
        (files.length - noMatchFiles.size) / Math.max(files.length, 1);
      expect(detectionCoverage).toBeGreaterThanOrEqual(0.55);

      if (noMatchFiles.size) {
        const sample = Array.from(noMatchFiles).slice(0, 20).join(", ");
        // Helpful audit output without failing compliance checks.
        // Coverage is still asserted above to catch large regressions.
        // eslint-disable-next-line no-console
        console.warn(
          `[mock-corpus-audit] ${config.language}: ${noMatchFiles.size}/${files.length} files had no matches in selected-plus-global. Sample: ${sample}`,
        );
      }
    });

    it(`${config.language}: global-only keeps detected matches masked and compliance-safe across all strategies`, () => {
      const files = readLanguageFiles(config.language),
        issues: string[] = [];

      for (const file of files) {
        const sourceText = readMockFile(config.language, file);

        for (const strategy of MASKING_STRATEGY_ORDER) {
          const result = engine.scan(
            sourceText,
            DEFAULT_GROUP_PREFERENCES,
            buildScanScopeSelection(config.selectedScopes, "global-only"),
            "2026-03-09T00:00:00.000Z",
            {
              ...DEFAULT_ADVANCED_PREFERENCES,
              maskingStrategy: strategy,
            },
          );

          for (const match of result.matches) {
            if (result.maskedText.includes(match.value)) {
              issues.push(
                `${config.language}/${file} [global-only/${strategy}] => leaked value for ${match.ruleId}`,
              );
            }

            if (
              (match.category === "financial" || match.category === "identifier") &&
              /\d/u.test(match.value) &&
              !/#/u.test(match.mask)
            ) {
              issues.push(
                `${config.language}/${file} [global-only/${strategy}] => missing compliance placeholder for ${match.ruleId}`,
              );
            }
          }
        }
      }

      if (issues.length) {
        throw new Error(formatIssues(issues));
      }
    });
  }
});

function readLanguageFiles(language: CorpusLanguageConfig["language"]): readonly string[] {
  return readdirSync(join(process.cwd(), ".tmp", "input-mocks", language))
    .filter(file => file.endsWith(".txt"))
    .sort((left, right) => left.localeCompare(right));
}

function readMockFile(language: CorpusLanguageConfig["language"], file: string): string {
  return readFileSync(
    join(process.cwd(), ".tmp", "input-mocks", language, file),
    "utf-8",
  );
}

function formatIssues(issues: readonly string[]): string {
  const maxRows = 30,
    preview = issues.slice(0, maxRows).map(issue => `- ${issue}`).join("\n"),
    suffix =
      issues.length > maxRows
        ? `\n...and ${issues.length - maxRows} more issue(s).`
        : "";

  return `Mock corpus matrix found ${issues.length} issue(s):\n${preview}${suffix}`;
}

function findNoMatchRiskSignals(sourceText: string): readonly string[] {
  const signals: string[] = [];

  if (
    /\b(?:access[_\s-]?token|api[_\s-]?key|api[_\s-]?secret|app[_\s-]?secret|application[_\s-]?secret|auth[_\s-]?token|authtoken|client[_\s-]?secret|database[_\s-]?password|db[_\s-]?password|encryption[_\s-]?key|master[_\s-]?password|oauth[_\s-]?secret|password|passphrase|private[_\s-]?key|refresh[_\s-]?token|secret[_\s-]?key|session[_\s-]?token|token|senha|contrase(?:n|ñ)a|clave(?:\s+api|\s+de\s+api|\s+secreta|\s+de\s+cifrado)|chave(?:\s+api|\s+de\s+api|\s+secreta|\s+de\s+acesso|\s+de\s+criptografia)|segredo)\b[^\n\r]{0,12}[:=]\s*["']?[^\s"']{6,}/iu.test(
      sourceText,
    )
  ) {
    signals.push("credential-assignment-like");
  }

  if (/\bBearer\s+[A-Za-z0-9._~+/=-]{10,}\b/u.test(sourceText)) {
    signals.push("bearer-token-like");
  }

  if (
    /\b(?:card|credit|debit|payment|tarjeta|cart[aã]o|cartao)\b[^\n\r\d]{0,40}(?:\d[ -]?){13,19}\b/iu.test(
      sourceText,
    )
  ) {
    signals.push("labeled-card-like-number");
  }

  return signals;
}
