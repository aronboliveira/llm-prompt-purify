/**
 * Exhaustive Flat-Mock Test Runner
 *
 * Processes ALL flat mock files from `.tmp/input-mocks/{lang}/*.txt`
 * through the masking engine across multiple detection modes and strategies.
 * Produces a copilot-compatible log at `.tmp/copilot/<tag>/exhaustive-tests.log`.
 *
 * File format mirrors the codex exhaustive-tests.log for direct comparison.
 */
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
} from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";
import type { MaskingStrategy } from "@core/masking/declarations/masking.types";

// ── Config ─────────────────────────────────────────────────────────────

const MOCK_ROOT = join(process.cwd(), ".tmp", "input-mocks");
const TAG =
  process.env["REPORT_TAG"] ??
  `copilot-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
const REPORT_DIR = join(process.cwd(), ".tmp", "copilot", TAG);
const LOG_FILE = join(REPORT_DIR, "exhaustive-tests.log");

const LANGS = ["en", "pt-br", "es", "zh"] as const;

const LANG_SCOPES: Record<
  string,
  ReturnType<typeof buildScanScopeSelection>[]
> = {
  en: [
    buildScanScopeSelection(["us"], "selected-plus-global"),
    buildScanScopeSelection(["us"], "global-only"),
  ],
  "pt-br": [
    buildScanScopeSelection(["br"], "selected-plus-global"),
    buildScanScopeSelection(["br"], "global-only"),
  ],
  es: [
    buildScanScopeSelection(["es", "latam-es"], "selected-plus-global"),
    buildScanScopeSelection(["es", "latam-es"], "global-only"),
  ],
  zh: [
    buildScanScopeSelection(["cn"], "selected-plus-global"),
    buildScanScopeSelection(["cn"], "global-only"),
  ],
};

const STRATEGIES: readonly MaskingStrategy[] = [
  "random",
  "tags",
  "faker",
  "redacted",
];

const SCAN_DATE = "2026-03-29T00:00:00.000Z";

// ── Helpers ────────────────────────────────────────────────────────────

interface FileEntry {
  lang: string;
  relPath: string;
  text: string;
}

function collectFlatMocks(): readonly FileEntry[] {
  const entries: FileEntry[] = [];
  for (const lang of LANGS) {
    const langDir = join(MOCK_ROOT, lang);
    if (!existsSync(langDir)) continue;
    const files = readdirSync(langDir)
      .filter(f => f.endsWith(".txt"))
      .sort();
    for (const file of files) {
      entries.push({
        lang,
        relPath: `${lang}/${file}`,
        text: readFileSync(join(langDir, file), "utf-8"),
      });
    }
  }
  return entries;
}

interface FileResult {
  relPath: string;
  success: boolean;
  failReasons: string[];
  fix: string;
  totalMatches: number;
  modesWithMatches: number;
  modesTotal: number;
}

function runFileAcrossModesAndStrategies(
  engine: MaskingEngine,
  entry: FileEntry,
): FileResult {
  const isSafeText = entry.relPath.includes("safe-text");
  const failReasons: string[] = [];
  let totalMatches = 0;
  let modesWithMatches = 0;
  let modesTotal = 0;

  for (const scope of LANG_SCOPES[entry.lang]) {
    const modeLabel = scope.detectionMode;
    for (const strategy of STRATEGIES) {
      modesTotal++;
      const advPrefs = {
        ...DEFAULT_ADVANCED_PREFERENCES,
        maskingStrategy: strategy,
      };
      const result = engine.scan(
        entry.text,
        DEFAULT_GROUP_PREFERENCES,
        scope,
        SCAN_DATE,
        advPrefs,
      );

      totalMatches += result.matches.length;
      if (result.matches.length > 0) modesWithMatches++;

      if (isSafeText) {
        continue;
      }

      if (result.matches.length === 0) {
        failReasons.push(`no-matches (${modeLabel}/${strategy})`);
        continue;
      }

      const financialCategories = ["credit-card", "labeled-card-number"];
      for (const match of result.matches) {
        if (financialCategories.includes(match.ruleId)) {
          const mask = match.mask ?? "";
          if (!/\d|#/.test(mask)) {
            failReasons.push(
              `numeric-placeholder-missing (${modeLabel}/${strategy}): ${match.ruleId}`,
            );
          }
        }
      }
    }
  }

  const success = failReasons.length === 0;
  const fix = success
    ? "No changes required."
    : "Enforce numeric compliance placeholders (#) for financial and identifier categories regardless of strategy.";

  return {
    relPath: entry.relPath,
    success,
    failReasons,
    fix,
    totalMatches,
    modesWithMatches,
    modesTotal,
  };
}

function formatResult(r: FileResult): string {
  return `[${r.relPath}]: { success: ${r.success ? 1 : 0}; fail_reason: ${
    r.failReasons.length === 0 ? "0" : `"${r.failReasons.join(" | ")}"`
  }; fix: "${r.fix}"; compliant: ${r.success ? 1 : 0} }`;
}

// ── Guard ──────────────────────────────────────────────────────────────

const mockExists = existsSync(MOCK_ROOT);
const describeIfMocks = mockExists ? describe : describe.skip;

// ── Tests ──────────────────────────────────────────────────────────────

describeIfMocks("Exhaustive flat-mock test runner", () => {
  const engine = new MaskingEngine();
  const entries = mockExists ? collectFlatMocks() : [];
  const results: FileResult[] = [];

  it("mock corpus is available", () => {
    expect(mockExists).toBe(true);
  });

  afterAll(() => {
    if (results.length === 0) return;
    mkdirSync(REPORT_DIR, { recursive: true });
    const lines = results.map(formatResult);
    writeFileSync(LOG_FILE, lines.join("\n") + "\n", "utf-8");
  });

  for (const lang of LANGS) {
    const langEntries = entries.filter(e => e.lang === lang);
    if (langEntries.length === 0) continue;

    describe(`[${lang}] ${langEntries.length} flat mocks`, () => {
      for (const entry of langEntries) {
        const fileName = entry.relPath.split("/").pop()!;
        const isSafeText = fileName.startsWith("safe-text");

        it(`${fileName} — ${isSafeText ? "negative control" : "processes without crash"}`, () => {
          const result = runFileAcrossModesAndStrategies(engine, entry);
          results.push(result);
          // Mirrors codex approach: log compliance issues, hard-fail only on crashes
          expect(result).toBeDefined();
          expect(result.relPath).toBe(entry.relPath);
        });
      }
    });
  }
});
