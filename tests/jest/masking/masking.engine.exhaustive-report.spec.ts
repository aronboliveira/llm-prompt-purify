import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
  MASKING_STRATEGY_ORDER,
} from "@core/masking/constants/masking.constants";
import type { CountryProfileId } from "@core/masking/declarations/masking.types";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";

type MockLanguage = "en" | "es" | "pt-br" | "zh";

interface ExhaustiveResultEntry {
  success: 0 | 1;
  fail_reason: string | 0;
  fix: string;
  compliant: 0 | 1;
}

const SCOPE_BY_LANGUAGE: Readonly<
  Record<MockLanguage, readonly CountryProfileId[]>
> = Object.freeze({
  en: ["us"],
  es: ["cl", "latam-es"],
  "pt-br": ["br"],
  zh: ["cn"],
});

const REPORT_DATE = "20260323";
const REPORT_ISO = "2026-03-23T00:00:00.000Z";

const mockRoot = join(process.cwd(), ".tmp", "input-mocks");
const describeIfMocks = existsSync(mockRoot) ? describe : describe.skip;

describeIfMocks("MaskingEngine exhaustive corpus report", () => {
  const engine = new MaskingEngine();

  it(`writes exhaustive per-file report to .tmp/codex/reports-${REPORT_DATE}/exhaustive-tests.log`, () => {
    const mockRoot = join(process.cwd(), ".tmp", "input-mocks"),
      reportDir = join(
        process.cwd(),
        ".tmp",
        "codex",
        `reports-${REPORT_DATE}`,
      ),
      reportPath = join(reportDir, "exhaustive-tests.log"),
      reportEntries: Record<string, ExhaustiveResultEntry> = {};

    const languages = readdirSync(mockRoot)
      .filter(language => isSupportedLanguage(language))
      .sort((left, right) => left.localeCompare(right));

    for (const language of languages) {
      const files = readdirSync(join(mockRoot, language))
        .filter(file => file.endsWith(".txt"))
        .sort((left, right) => left.localeCompare(right));

      for (const file of files) {
        const sourceText = readFileSync(
            join(mockRoot, language, file),
            "utf-8",
          ),
          reasons: string[] = [];

        for (const mode of ["selected-plus-global", "global-only"] as const) {
          const scopeSelection = buildScanScopeSelection(
            SCOPE_BY_LANGUAGE[language],
            mode,
          );

          for (const strategy of MASKING_STRATEGY_ORDER) {
            const result = engine.scan(
              sourceText,
              DEFAULT_GROUP_PREFERENCES,
              scopeSelection,
              REPORT_ISO,
              {
                ...DEFAULT_ADVANCED_PREFERENCES,
                maskingStrategy: strategy,
              },
            );

            if (!result.hasMatches) {
              const riskSignals = findNoMatchRiskSignals(sourceText);
              if (riskSignals.length) {
                reasons.push(
                  `risky-no-match (${mode}/${strategy}): ${riskSignals.join(", ")}`,
                );
              }
              continue;
            }

            for (const match of result.matches) {
              if (result.maskedText.includes(match.value)) {
                reasons.push(`leak (${mode}/${strategy}): ${match.ruleId}`);
              }

              if (
                (match.category === "financial" ||
                  match.category === "identifier") &&
                /\d/u.test(match.value) &&
                !/#/u.test(match.mask)
              ) {
                reasons.push(
                  `numeric-placeholder-missing (${mode}/${strategy}): ${match.ruleId}`,
                );
              }
            }
          }
        }

        const uniqueReasons = Array.from(new Set(reasons)),
          key = `[${language}/${file}]`,
          success = uniqueReasons.length ? 0 : 1,
          compliant = uniqueReasons.length ? 0 : 1;

        reportEntries[key] = {
          success,
          fail_reason: uniqueReasons.length ? uniqueReasons.join(" | ") : 0,
          fix: uniqueReasons.length
            ? proposeFix(uniqueReasons)
            : "No changes required.",
          compliant,
        };
      }
    }

    mkdirSync(reportDir, { recursive: true });

    const lines = Object.keys(reportEntries)
      .sort((left, right) => left.localeCompare(right))
      .map(key => {
        const entry = reportEntries[key];
        const failReason =
          entry.fail_reason === 0
            ? "0"
            : `"${escapeQuotes(entry.fail_reason)}"`;

        return `${key}: { success: ${entry.success}; fail_reason: ${failReason}; fix: "${escapeQuotes(entry.fix)}"; compliant: ${entry.compliant} }`;
      });

    writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf-8");
    expect(lines.length).toBeGreaterThan(0);
  });
});

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

function proposeFix(reasons: readonly string[]): string {
  const fixes: string[] = [];
  if (reasons.some(reason => reason.startsWith("leak"))) {
    fixes.push(
      "Adjust overlap resolution or match span selection so masked output never keeps the matched raw value.",
    );
  }
  if (
    reasons.some(reason => reason.startsWith("numeric-placeholder-missing"))
  ) {
    fixes.push(
      "Enforce numeric compliance placeholders (#) for financial and identifier categories regardless of strategy.",
    );
  }
  if (reasons.some(reason => reason.startsWith("risky-no-match"))) {
    fixes.push(
      "Add or relax a labeled/provider detection rule so risky assignment patterns are detected in selected scope.",
    );
  }

  return fixes.length
    ? fixes.join(" ")
    : "Inspect this file and strengthen matching precision for its pattern.";
}

function escapeQuotes(value: string): string {
  return value.replaceAll(/\\/gu, "\\\\").replaceAll(/"/gu, '\\"');
}

function isSupportedLanguage(language: string): language is MockLanguage {
  return (
    language === "en" ||
    language === "es" ||
    language === "pt-br" ||
    language === "zh"
  );
}
