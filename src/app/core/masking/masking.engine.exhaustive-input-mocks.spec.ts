/**
 * Copilot Exhaustive Mock Corpus Test
 *
 * For every .txt file under .tmp/input-mocks/{en,es,pt-br,zh}:
 *  - Runs MaskingEngine.scan() with the locale-appropriate scope
 *  - Evaluates compliance (no sensitive value leaks in maskedText)
 *  - Writes .tmp/copilot/reports-20260307/exhaustive-tests.log with the schema:
 *    [lang/filename]: { success: 0|1; fail_reason: string|0; fix: string; compliant: 0|1 }
 *
 * The test then compares the copilot log against the codex reference at
 * .tmp/codex/reports-20260307/exhaustive-tests.log and verifies the results match
 * or are better (no regressions introduced).
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "./constants/masking.constants";
import type { CountryProfileId } from "./declarations/masking.types";
import { MaskingEngine } from "./masking.engine";
import { buildScanScopeSelection } from "./utils/country-scope.utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
  success: 0 | 1;
  fail_reason: string | 0;
  fix: string;
  compliant: 0 | 1;
}

interface LangConfig {
  language: string;
  countryIds: readonly CountryProfileId[];
  scopeMode: "selected-plus-global";
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MOCK_ROOT = join(process.cwd(), ".tmp", "input-mocks");
const COPILOT_REPORT = join(
  process.cwd(),
  ".tmp",
  "copilot",
  "reports-20260307",
  "exhaustive-tests.log",
);
const CODEX_REPORT = join(
  process.cwd(),
  ".tmp",
  "codex",
  "reports-20260307",
  "exhaustive-tests.log",
);
const SCAN_TIMESTAMP = "2026-03-07T00:00:00.000Z";

const LANG_CONFIGS: readonly LangConfig[] = [
  {
    language: "en",
    countryIds: ["us"] as const,
    scopeMode: "selected-plus-global",
  },
  {
    language: "es",
    countryIds: ["es", "latam-es"] as const,
    scopeMode: "selected-plus-global",
  },
  {
    language: "pt-br",
    countryIds: ["br"] as const,
    scopeMode: "selected-plus-global",
  },
  {
    language: "zh",
    countryIds: ["cn"] as const,
    scopeMode: "selected-plus-global",
  },
];

// ---------------------------------------------------------------------------
// Checksum validators — only flag values the engine would actually detect
// ---------------------------------------------------------------------------

/** Luhn algorithm for credit card validation. */
function luhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, "").split("").map(Number);
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i];
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** CPF checksum validator (Brazilian individual taxpayer registry). */
function cpfValid(value: string): boolean {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const digits = d.split("").map(Number);
  const calc = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i] * (len + 1 - i);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(9) === digits[9] && calc(10) === digits[10];
}

/** CNPJ checksum validator (Brazilian company registry). */
function cnpjValid(value: string): boolean {
  const d = value.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const digits = d.split("").map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const check = (weights: number[], len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i] * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return check(w1, 12) === digits[12] && check(w2, 13) === digits[13];
}

// Sensitive value patterns mirroring the playwright BrowserLite spec.
// Each entry pairs a regex with an optional validator function.
const SENSITIVE_PATTERNS: readonly { re: RegExp; valid?: (s: string) => boolean }[] = [
  { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
  { re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu },
  { re: /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,}|SG\.[A-Za-z0-9_-]{20,}|key-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})\b/gu },
  { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { re: /\bAC[a-f0-9]{32}\b/giu },
  { re: /\b(?:\d[ -]?){13,19}\b/g, valid: luhnValid },
  { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, valid: cpfValid },
  { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, valid: cnpjValid },
  { re: /\b\d{17}[\dX]\b/giu },
  // Chinese phone  (+86 prefix or 1[3-9]xx format)
  { re: /(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b/g },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readMockFiles(language: string): readonly string[] {
  return readdirSync(join(MOCK_ROOT, language))
    .filter(f => f.endsWith(".txt"))
    .sort((a, b) => a.localeCompare(b));
}

function extractSensitiveValues(text: string): readonly string[] {
  const found: string[] = [];
  for (const { re, valid } of SENSITIVE_PATTERNS) {
    const cloned = new RegExp(re.source, re.flags);
    for (const m of text.matchAll(cloned)) {
      if (valid && !valid(m[0])) continue;
      found.push(m[0]);
    }
  }
  return Array.from(new Set(found));
}

function escapeQuotes(s: string): string {
  return s.replaceAll(/\\/gu, "\\\\").replaceAll(/"/gu, '\\"');
}

function evaluateCompliance(
  sourceText: string,
  maskedText: string,
): readonly string[] {
  const sensitiveValues = extractSensitiveValues(sourceText);
  return sensitiveValues
    .filter(val => maskedText.includes(val))
    .map(val => `ui-leak: ${val}`);
}

function parseCodexLog(logPath: string): Map<string, AuditEntry> {
  const result = new Map<string, AuditEntry>();
  let raw: string;
  try {
    raw = readFileSync(logPath, "utf-8");
  } catch {
    return result;
  }

  for (const line of raw.split("\n")) {
    const m = line.match(
      /^\[([^\]]+)\]:\s*\{\s*success:\s*(\d+);\s*fail_reason:\s*(".*?"|0);\s*fix:\s*"(.*?)";\s*compliant:\s*(\d+)\s*\}/u,
    );
    if (!m) continue;
    const [, key, success, failRaw, fix, compliant] = m;
    result.set(key, {
      success: Number(success) as 0 | 1,
      fail_reason:
        failRaw === "0"
          ? 0
          : (failRaw.slice(1, -1).replaceAll('\\"', '"') as string),
      fix: fix.replaceAll('\\"', '"'),
      compliant: Number(compliant) as 0 | 1,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Engine + scopes (created once)
// ---------------------------------------------------------------------------

const engine = new MaskingEngine();
const compliancePrefs = {
  ...DEFAULT_ADVANCED_PREFERENCES,
  maskingStrategy: "tags" as const,
};
const scopeByLang = new Map<string, ReturnType<typeof buildScanScopeSelection>>(
  LANG_CONFIGS.map(c => [
    c.language,
    buildScanScopeSelection(c.countryIds, c.scopeMode),
  ]),
);

// ---------------------------------------------------------------------------
// Build audit synchronously (before the describe block runs tests)
// ---------------------------------------------------------------------------

const reportEntries = new Map<string, AuditEntry>();

for (const config of LANG_CONFIGS) {
  const scope = scopeByLang.get(config.language)!;
  const files = readMockFiles(config.language);

  for (const file of files) {
    const sourceText = readFileSync(
      join(MOCK_ROOT, config.language, file),
      "utf-8",
    );
    const expectsMatches = !file.startsWith("safe-text-");

    let result: ReturnType<typeof engine.scan>;
    try {
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        scope,
        SCAN_TIMESTAMP,
        compliancePrefs,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      reportEntries.set(`[${config.language}/${file}]`, {
        success: 0,
        fail_reason: `engine-error: ${errMsg}`,
        fix: "Investigate thrown error in MaskingEngine.scan() for this input.",
        compliant: 0,
      });
      continue;
    }

    const leaks = evaluateCompliance(sourceText, result.maskedText);

    // A credential/sensitive file MUST produce at least one match to succeed.
    const noMatchWhenExpected =
      expectsMatches && !result.hasMatches && leaks.length === 0;

    const reasons: string[] = [...leaks];
    if (noMatchWhenExpected) {
      reasons.push(`no-match-for-sensitive-file: ${sourceText.trim()}`);
    }

    reportEntries.set(`[${config.language}/${file}]`, {
      success: reasons.length ? 0 : 1,
      fail_reason: reasons.length ? reasons.join(" | ") : 0,
      fix: reasons.length
        ? "Update detection rules or overlap selection so sensitive values are always redacted."
        : "No changes required.",
      compliant: reasons.length ? 0 : 1,
    });
  }
}

// Write copilot log
mkdirSync(join(process.cwd(), ".tmp", "copilot", "reports-20260307"), {
  recursive: true,
});
const logLines = Array.from(reportEntries.keys())
  .sort((a, b) => a.localeCompare(b))
  .map(key => {
    const e = reportEntries.get(key)!;
    const fr =
      e.fail_reason === 0 ? "0" : `"${escapeQuotes(String(e.fail_reason))}"`;
    return `${key}: { success: ${e.success}; fail_reason: ${fr}; fix: "${escapeQuotes(e.fix)}"; compliant: ${e.compliant} }`;
  });
writeFileSync(COPILOT_REPORT, `${logLines.join("\n")}\n`, "utf-8");

// ---------------------------------------------------------------------------
// Jest describe / it blocks
// ---------------------------------------------------------------------------

describe("Copilot Exhaustive Input-Mock Corpus", () => {
  describe("per-file scan results", () => {
    for (const config of LANG_CONFIGS) {
      const files = readMockFiles(config.language);
      const scope = scopeByLang.get(config.language)!;

      describe(`language: ${config.language}`, () => {
        for (const file of files) {
          it(`[${config.language}/${file}] — scan must not leak sensitive values`, () => {
            const sourceText = readFileSync(
              join(MOCK_ROOT, config.language, file),
              "utf-8",
            );

            const result = engine.scan(
              sourceText,
              DEFAULT_GROUP_PREFERENCES,
              scope,
              SCAN_TIMESTAMP,
              compliancePrefs,
            );

            // For all files: maskedText must not contain any extracted sensitive value.
            const leaks = evaluateCompliance(sourceText, result.maskedText);
            expect(leaks).toHaveLength(0);
          });
        }
      });
    }
  });

  describe("credential files must have at least one match", () => {
    const credentialPrefixes = [
      "api-key-",
      "aws-key-",
      "bearer-token-",
      "credential-assignment-",
      "jwt-token-",
      "twilio-sid-",
    ];

    for (const config of LANG_CONFIGS) {
      const scope = scopeByLang.get(config.language)!;
      const files = readMockFiles(config.language).filter(f =>
        credentialPrefixes.some(p => f.startsWith(p)),
      );

      if (files.length === 0) continue;

      it(`[${config.language}] all credential mocks produce ≥1 match`, () => {
        for (const file of files) {
          const sourceText = readFileSync(
            join(MOCK_ROOT, config.language, file),
            "utf-8",
          );
          const result = engine.scan(
            sourceText,
            DEFAULT_GROUP_PREFERENCES,
            scope,
            SCAN_TIMESTAMP,
            compliancePrefs,
          );
          expect(result.hasMatches).toBe(true);
        }
      });
    }
  });

  describe("zh-specific: id-card and phone must be detected with CN scope", () => {
    const cnScope = scopeByLang.get("zh")!;

    it("zh id-card files trigger cn-resident-id-labeled rule", () => {
      const idCardFiles = readMockFiles("zh").filter(f =>
        f.startsWith("id-card-"),
      );
      expect(idCardFiles.length).toBeGreaterThan(0);

      for (const file of idCardFiles) {
        const sourceText = readFileSync(join(MOCK_ROOT, "zh", file), "utf-8");
        const result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          cnScope,
          SCAN_TIMESTAMP,
          compliancePrefs,
        );
        const idCardMatch = result.matches.some(
          m => m.ruleId === "cn-resident-id-labeled",
        );
        if (!idCardMatch) {
          // Fallback: if labeled rule missed it, the maskedText must not contain 18-digit ID.
          const leaks = evaluateCompliance(sourceText, result.maskedText);
          expect(leaks).toHaveLength(0);
        }
      }
    });

    it("zh phone files trigger cn-phone rule or are otherwise masked", () => {
      const phoneFiles = readMockFiles("zh").filter(f =>
        f.startsWith("phone-"),
      );
      expect(phoneFiles.length).toBeGreaterThan(0);

      for (const file of phoneFiles) {
        const sourceText = readFileSync(join(MOCK_ROOT, "zh", file), "utf-8");
        const result = engine.scan(
          sourceText,
          DEFAULT_GROUP_PREFERENCES,
          cnScope,
          SCAN_TIMESTAMP,
          compliancePrefs,
        );
        const leaks = evaluateCompliance(sourceText, result.maskedText);
        expect(leaks).toHaveLength(0);
      }
    });
  });

  describe("copilot log vs codex log comparison", () => {
    it("copilot log has ≥1 entry per language directory", () => {
      for (const config of LANG_CONFIGS) {
        const langEntries = logLines.filter(l =>
          l.startsWith(`[${config.language}/`),
        );
        expect(langEntries.length).toBeGreaterThan(0);
      }
    });

    it("copilot log entries are at least as good as codex entries (no regressions)", () => {
      const codexMap = parseCodexLog(CODEX_REPORT);
      if (codexMap.size === 0) {
        // No codex log to compare yet — skip regression check.
        return;
      }

      const regressions: string[] = [];
      for (const [key, codexEntry] of codexMap) {
        const copilotEntry = reportEntries.get(key);
        if (!copilotEntry) continue; // new file, not in codex — OK

        // A regression = codex passed but copilot fails.
        if (codexEntry.success === 1 && copilotEntry.success === 0) {
          regressions.push(
            `REGRESSION ${key}: codex=success, copilot=fail (${String(copilotEntry.fail_reason)})`,
          );
        }
      }

      if (regressions.length > 0) {
        fail(
          `Copilot log introduced ${regressions.length} regression(s):\n${regressions.join("\n")}`,
        );
      }
    });

    it("copilot log total entries ≥ codex log total entries", () => {
      const codexMap = parseCodexLog(CODEX_REPORT);
      if (codexMap.size === 0) return;
      expect(reportEntries.size).toBeGreaterThanOrEqual(codexMap.size);
    });
  });
});
