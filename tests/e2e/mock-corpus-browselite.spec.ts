/**
 * BrowserLite Corpus E2E — Resilient Full-Corpus Runner
 *
 * Processes ALL mock corpus files through the masking engine with:
 *   • Per-locale test isolation (browser crash in one locale doesn't kill others)
 *   • Per-item try/catch with automatic page recovery
 *   • Periodic page reload to prevent memory leaks (every 200 items)
 *   • Extended country scope testing (all 12 profiles)
 *   • All 4 masking strategy sweeps
 *   • Incremental result saving (partial runs preserved)
 *   • Vulnerability report generation in .notes/
 *
 * Usage:
 *   MOCK_LIMIT=0 npx playwright test tests/e2e/mock-corpus-browselite.spec.ts --headed --timeout=0
 *
 * Env vars:
 *   MOCK_LIMIT           — Max items per locale (0 = all). Default: 20 local, 0 CI.
 *   MOCK_SAMPLE_PER_LANG — Max files per language subdirectory (0 = all).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface RunItem {
  countryId: string;
  file: string;
  language: string;
  sourceText: string;
}

interface TestResult {
  file: string;
  language: string;
  countryId: string;
  strategy: string;
  success: boolean;
  leaks: readonly string[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

const PROCESS_WAIT_MS = 800;
const INTER_ITEM_MS = 300;
const MAX_CONSECUTIVE_ERRORS = 5;
const RELOAD_EVERY_N = 200;
const REPRESENTATIVE_SAMPLE = 10;

const MOCK_ROOT = join(process.cwd(), ".tmp", "input-mocks");
const NOTES_DIR = join(process.cwd(), ".notes");
const REPORT_DIR = join(process.cwd(), ".tmp", "copilot", "reports-20260307");
const RESULTS_FILE = join(REPORT_DIR, "browselite-results.json");

const samplePerLanguage = Number(process.env["MOCK_SAMPLE_PER_LANG"] ?? "0");
const defaultLimit = process.env["CI"] ? 0 : 20;
const mockLimit = Number(process.env["MOCK_LIMIT"] ?? String(defaultLimit));

const LOCALE_CONFIGS = [
  { countryId: "br", language: "pt-br" },
  { countryId: "cl", language: "es" },
  { countryId: "cn", language: "zh" },
  { countryId: "us", language: "en" },
] as const;

const EXTENDED_SCOPES: readonly { scope: string; mockLang: string }[] = [
  { scope: "mx", mockLang: "es" },
  { scope: "ar", mockLang: "es" },
  { scope: "co", mockLang: "es" },
  { scope: "pe", mockLang: "es" },
  { scope: "pt", mockLang: "pt-br" },
  { scope: "es", mockLang: "es" },
  { scope: "ru", mockLang: "en" },
  { scope: "in", mockLang: "en" },
];

const STRATEGIES = ["random", "tags", "faker", "redacted"] as const;

/* ------------------------------------------------------------------ */
/*  Build Items                                                       */
/* ------------------------------------------------------------------ */

function buildLocaleItems(
  language: string,
  countryId: string,
): readonly RunItem[] {
  const langDir = join(MOCK_ROOT, language);
  const items: RunItem[] = [];

  try {
    const entries = readdirSync(langDir, { withFileTypes: true });

    for (const entry of entries
      .filter(e => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const catDir = join(langDir, entry.name);
      let files = readdirSync(catDir)
        .filter(f => f.endsWith(".txt"))
        .sort();
      if (samplePerLanguage > 0) files = files.slice(0, samplePerLanguage);
      for (const file of files) {
        items.push({
          countryId,
          file: `${entry.name}/${file}`,
          language,
          sourceText: readFileSync(join(catDir, file), "utf-8"),
        });
      }
    }

    let flat = entries
      .filter(e => e.isFile() && e.name.endsWith(".txt"))
      .map(e => e.name)
      .sort();
    if (samplePerLanguage > 0) flat = flat.slice(0, samplePerLanguage);
    for (const file of flat) {
      items.push({
        countryId,
        file,
        language,
        sourceText: readFileSync(join(langDir, file), "utf-8"),
      });
    }
  } catch {
    /* language directory missing */
  }

  return mockLimit > 0 ? items.slice(0, mockLimit) : items;
}

/* ------------------------------------------------------------------ */
/*  Page Setup & Recovery                                              */
/* ------------------------------------------------------------------ */

async function setupApiMock(page: Page): Promise<void> {
  await page.route("**/api/mask-safety/validate", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSafe: true, findings: [] }),
    });
  });
}

async function setCountryScope(
  page: Page,
  countryId: string,
  strategy?: string,
): Promise<void> {
  await page.evaluate(
    ({ cid, strat }) => {
      window.sessionStorage.setItem(
        "llm-prompt-purify:country-profiles:v2",
        JSON.stringify([cid]),
      );
      window.sessionStorage.setItem(
        "llm-prompt-purify:country-profile:v1",
        cid,
      );
      if (strat) {
        const raw = window.sessionStorage.getItem(
          "llm-prompt-purify:advanced-preferences:v1",
        );
        const prefs = raw ? JSON.parse(raw) : {};
        window.sessionStorage.setItem(
          "llm-prompt-purify:advanced-preferences:v1",
          JSON.stringify({ ...prefs, maskingStrategy: strat }),
        );
      }
    },
    { cid: countryId, strat: strategy },
  );
  await page.reload();
  await expect(page.getByTestId("source-textarea")).toBeVisible({
    timeout: 15_000,
  });
}

async function recoverPage(
  page: Page,
  countryId: string,
  strategy?: string,
): Promise<boolean> {
  try {
    await page.goto("/", { timeout: 15_000 });
    await setCountryScope(page, countryId, strategy);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Batch Processing                                                   */
/* ------------------------------------------------------------------ */

async function processBatch(
  page: Page,
  items: readonly RunItem[],
  strategy: string,
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let consecutiveErrors = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Periodic reload to prevent memory leaks
    if (i > 0 && i % RELOAD_EVERY_N === 0) {
      try {
        await page.goto("/");
        await setCountryScope(page, item.countryId, strategy);
      } catch {
        /* continue with current page state */
      }
    }

    try {
      await page.getByTestId("source-textarea").fill(item.sourceText);
      await page.waitForTimeout(PROCESS_WAIT_MS);

      const output = page.getByTestId("masked-output");
      await expect(output).toBeVisible({ timeout: 5_000 });
      const maskedText = (await output.textContent()) ?? "";
      const leaks = evaluateUiResult(item.sourceText, maskedText);

      results.push({
        file: item.file,
        language: item.language,
        countryId: item.countryId,
        strategy,
        success: leaks.length === 0,
        leaks,
      });
      consecutiveErrors = 0;

      if (i < items.length - 1) {
        await page.waitForTimeout(INTER_ITEM_MS);
      }
    } catch (err) {
      results.push({
        file: item.file,
        language: item.language,
        countryId: item.countryId,
        strategy,
        success: false,
        leaks: [],
        error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      });

      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        for (let j = i + 1; j < items.length; j++) {
          results.push({
            file: items[j].file,
            language: items[j].language,
            countryId: items[j].countryId,
            strategy,
            success: false,
            leaks: [],
            error: "Skipped — too many consecutive errors",
          });
        }
        break;
      }

      if (!(await recoverPage(page, item.countryId, strategy))) {
        for (let j = i + 1; j < items.length; j++) {
          results.push({
            file: items[j].file,
            language: items[j].language,
            countryId: items[j].countryId,
            strategy,
            success: false,
            leaks: [],
            error: "Skipped — page unrecoverable",
          });
        }
        break;
      }
    }
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Sensitive-Value Extraction (expanded)                             */
/* ------------------------------------------------------------------ */

function luhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  let total = 0;
  for (let i = digits.length - 1, alt = false; i >= 0; i--, alt = !alt) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
  }
  return total % 10 === 0;
}

function isTestValidRut(value: string): boolean {
  const normalized = value.replace(/[.\-]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/u.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return verifier === expected;
}

function isTestValidIban(value: string): boolean {
  const v = value.toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)) return false;
  const rearranged = v.slice(4) + v.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    numeric += /[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch;
  }
  let rem = 0;
  for (const d of numeric) rem = (rem * 10 + Number(d)) % 97;
  return rem === 1;
}

function extractSensitiveValues(sourceText: string): readonly string[] {
  const values: string[] = [];
  const patterns: { re: RegExp; luhn?: boolean; validator?: (v: string) => boolean }[] = [
    /* Emails */
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
    /* JWT */
    { re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu },
    /* API keys (OpenAI, Stripe, SendGrid, Mailgun, Firebase) */
    {
      re: /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,}|SG\.[A-Za-z0-9_-]{20,}|key-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})\b/gu,
    },
    /* AWS access keys */
    { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    /* Twilio SIDs */
    { re: /\bAC[a-f0-9]{32}\b/giu },
    /* Credit cards (Luhn-validated) */
    { re: /\b(?:\d[ -]?){13,19}\b/g, luhn: true },
    /* Brazilian CPF */
    { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
    /* Brazilian CNPJ */
    { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
    /* Chinese resident ID */
    { re: /\b\d{17}[\dX]\b/giu },
    /* US SSN */
    { re: /\b\d{3}-\d{2}-\d{4}\b/g },
    /* GitHub PAT */
    { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
    /* Bearer tokens (min 20 chars after "Bearer ") */
    { re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/gu },
    /* IBAN */
    { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, validator: isTestValidIban },
    /* Chilean RUT */
    { re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/g, validator: isTestValidRut },
    /* Mexican CURP */
    { re: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g },
    /* Mexican RFC */
    { re: /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/g },
    /* Argentine CUIT */
    { re: /\b\d{2}-\d{8}-\d\b/g },
  ];

  for (const { re, luhn, validator } of patterns) {
    for (const match of sourceText.matchAll(re)) {
      if (luhn && !luhnValid(match[0])) continue;
      if (validator && !validator(match[0])) continue;
      values.push(match[0]);
    }
  }

  const unique = Array.from(new Set(values));
  return unique.filter(
    (v, _, arr) =>
      !arr.some(
        other => other !== v && other.length > v.length && other.includes(v),
      ),
  );
}

function evaluateUiResult(
  sourceText: string,
  maskedText: string,
): readonly string[] {
  const reasons: string[] = [];
  for (const val of extractSensitiveValues(sourceText)) {
    if (maskedText.includes(val)) {
      reasons.push(`leak: ${val}`);
    }
  }
  return reasons;
}
("");
/* ------------------------------------------------------------------ */
/*  Results Persistence                                               */
/* ------------------------------------------------------------------ */

function loadResults(): TestResult[] {
  try {
    if (existsSync(RESULTS_FILE)) {
      return JSON.parse(readFileSync(RESULTS_FILE, "utf-8"));
    }
  } catch {
    /* corrupted — start fresh */
  }
  return [];
}

function appendResults(newResults: readonly TestResult[]): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  const existing = loadResults();
  existing.push(...newResults);
  writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2), "utf-8");
}

/* ------------------------------------------------------------------ */
/*  Report Generation                                                 */
/* ------------------------------------------------------------------ */

function categorizeLeak(leak: string): string {
  const v = leak.replace(/^leak:\s*/, "");

  // Exact-format checks (anchored, most specific first)
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu.test(v))
    return "Email Addresses";
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v))
    return "JWT Tokens";
  if (/^(?:AKIA|ASIA)[A-Z0-9]{16}$/.test(v)) return "AWS Access Keys";
  if (/^AC[a-f0-9]{32}$/i.test(v)) return "Twilio SIDs";
  if (/^gh[pousr]_[A-Za-z0-9]{20,}$/.test(v)) return "GitHub PATs";
  if (/^Bearer\s/.test(v)) return "Bearer Tokens";
  if (/^sk[-_]/.test(v)) return "API Keys (OpenAI/Stripe)";

  // Chinese IDs BEFORE CPF (18 digits would match CPF's 11-digit subsequence)
  if (/^\d{17}[\dXx]$/.test(v)) return "Chinese Resident IDs";

  // Structured identifiers (anchored)
  if (/^\d{3}-\d{2}-\d{4}$/.test(v)) return "US SSNs";
  if (/^\d{2}-\d{8}-\d$/.test(v)) return "Argentine CUITs";
  if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(v))
    return "Brazilian CNPJs";
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v)) return "Brazilian CPFs";
  if (/^\d{11}$/.test(v)) return "Brazilian CPFs (unformatted)";
  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(v))
    return "Mexican CURPs";
  if (/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(v)) return "Mexican RFCs";
  if (/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)) return "IBANs";
  if (/^\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]$/.test(v)) return "Chilean RUTs";

  return "Credit Cards / Other Financial";
}

function generateReport(results: readonly TestResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const leaked = results.filter(r => r.leaks.length > 0).length;
  const errored = results.filter(r => r.error).length;

  let md = `# Vulnerability Report — BrowserLite Corpus\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Inputs Tested**: ${total}\n`;
  md += `**Passed**: ${passed}\n`;
  md += `**Leaked**: ${leaked}\n`;
  md += `**Errors**: ${errored}\n`;
  md += `**Pass Rate**: ${total ? ((passed / total) * 100).toFixed(2) : 0}%\n\n`;

  /* By locale */
  md += `## By Locale\n\n`;
  md += `| Locale | Scope | Total | Pass | Leak | Err |\n`;
  md += `|--------|-------|-------|------|------|-----|\n`;
  const keys = [...new Set(results.map(r => `${r.language}|${r.countryId}`))];
  for (const key of keys.sort()) {
    const [lang, scope] = key.split("|");
    const lr = results.filter(
      r => r.language === lang && r.countryId === scope,
    );
    md += `| ${lang} | ${scope} | ${lr.length} | ${lr.filter(r => r.success).length} | ${lr.filter(r => r.leaks.length > 0).length} | ${lr.filter(r => r.error).length} |\n`;
  }
  md += `\n`;

  /* By strategy */
  const strats = [...new Set(results.map(r => r.strategy))];
  if (strats.length > 1) {
    md += `## By Strategy\n\n`;
    md += `| Strategy | Total | Pass | Leak |\n`;
    md += `|----------|-------|------|------|\n`;
    for (const s of strats.sort()) {
      const sr = results.filter(r => r.strategy === s);
      md += `| ${s} | ${sr.length} | ${sr.filter(r => r.success).length} | ${sr.filter(r => r.leaks.length > 0).length} |\n`;
    }
    md += `\n`;
  }

  /* Vulnerability details */
  const leakResults = results.filter(r => r.leaks.length > 0);
  if (leakResults.length > 0) {
    const grouped: Record<
      string,
      { count: number; files: string[]; examples: string[] }
    > = {};
    for (const r of leakResults) {
      for (const leak of r.leaks) {
        const cat = categorizeLeak(leak);
        if (!grouped[cat]) grouped[cat] = { count: 0, files: [], examples: [] };
        grouped[cat].count++;
        grouped[cat].files.push(`${r.language}/${r.file}`);
        if (grouped[cat].examples.length < 5)
          grouped[cat].examples.push(leak.replace(/^leak:\s*/, ""));
      }
    }

    md += `## Detected Vulnerabilities\n\n`;
    for (const [cat, data] of Object.entries(grouped).sort(
      (a, b) => b[1].count - a[1].count,
    )) {
      md += `### ${cat}\n\n`;
      md += `- **Count**: ${data.count}\n`;
      md += `- **Affected**: ${data.files.slice(0, 5).join(", ")}${data.files.length > 5 ? ` (+${data.files.length - 5})` : ""}\n`;
      md += `- **Examples**:\n`;
      for (const ex of data.examples) md += `  - \`${ex}\`\n`;
      md += `\n`;
    }
  } else {
    md += `## Vulnerabilities\n\nNone detected.\n\n`;
  }

  /* Error summary */
  if (errored > 0) {
    md += `## Processing Errors\n\n`;
    const errorCounts: Record<string, number> = {};
    for (const r of results.filter(r => r.error)) {
      const key = r.error!.slice(0, 100);
      errorCounts[key] = (errorCounts[key] ?? 0) + 1;
    }
    for (const [msg, count] of Object.entries(errorCounts).sort(
      (a, b) => b[1] - a[1],
    )) {
      md += `- **${msg}**: ${count}×\n`;
    }
    md += `\n`;
  }

  return md;
}

function escapeQuotes(value: string): string {
  return value.replaceAll(/\\/gu, "\\\\").replaceAll(/"/gu, '\\"');
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

test.describe.configure({ mode: "serial" });

/* Pre-build locale items for test registration */
const LOCALE_ITEMS = LOCALE_CONFIGS.map(c => ({
  ...c,
  items: buildLocaleItems(c.language, c.countryId),
}));

/* Reset accumulated results at start of suite */
test("reset results", () => {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(RESULTS_FILE, "[]", "utf-8");
});

/* ---- Core corpus: one test per locale ---- */
for (const { countryId, language, items } of LOCALE_ITEMS) {
  test(`[corpus] ${language} — ${items.length} mocks (scope: ${countryId})`, async ({
    page,
  }) => {
    test.setTimeout(Math.max(300_000, items.length * 2500 + 120_000));
    if (items.length === 0) return;

    await setupApiMock(page);
    await page.goto("/");
    await setCountryScope(page, countryId);

    const results = await processBatch(page, items, "random");
    appendResults(results);
  });
}

/* ---- Extended scope tests: representative sample per country ---- */
for (const { scope, mockLang } of EXTENDED_SCOPES) {
  test(`[scope] ${scope} — sample of ${REPRESENTATIVE_SAMPLE}`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const items = buildLocaleItems(mockLang, scope).slice(
      0,
      REPRESENTATIVE_SAMPLE,
    );
    if (items.length === 0) return;

    await setupApiMock(page);
    await page.goto("/");
    await setCountryScope(page, scope);

    const results = await processBatch(page, items, "random");
    appendResults(results);
  });
}

/* ---- Strategy sweep: test each masking strategy on a sample ---- */
for (const strategy of STRATEGIES) {
  test(`[strategy] ${strategy} — cross-locale sample`, async ({ page }) => {
    test.setTimeout(180_000);
    const sample: RunItem[] = [];
    for (const { items } of LOCALE_ITEMS) {
      sample.push(...items.slice(0, 5));
    }
    if (sample.length === 0) return;

    await setupApiMock(page);
    await page.goto("/");
    await setCountryScope(page, sample[0].countryId, strategy);

    let currentCountry = sample[0].countryId;
    const batchResults: TestResult[] = [];

    for (let i = 0; i < sample.length; i++) {
      const item = sample[i];
      if (item.countryId !== currentCountry) {
        await setCountryScope(page, item.countryId, strategy);
        currentCountry = item.countryId;
      }

      try {
        await page.getByTestId("source-textarea").fill(item.sourceText);
        await page.waitForTimeout(PROCESS_WAIT_MS);
        const maskedText =
          (await page.getByTestId("masked-output").textContent()) ?? "";
        const leaks = evaluateUiResult(item.sourceText, maskedText);
        batchResults.push({
          file: item.file,
          language: item.language,
          countryId: item.countryId,
          strategy,
          success: leaks.length === 0,
          leaks,
        });
      } catch (err) {
        batchResults.push({
          file: item.file,
          language: item.language,
          countryId: item.countryId,
          strategy,
          success: false,
          leaks: [],
          error: (err instanceof Error ? err.message : String(err)).slice(
            0,
            200,
          ),
        });
        if (!(await recoverPage(page, item.countryId, strategy))) break;
      }
      if (i < sample.length - 1) await page.waitForTimeout(INTER_ITEM_MS);
    }

    appendResults(batchResults);
  });
}

/* ---- Final: aggregate & write vulnerability report ---- */
test("generate vulnerability report", () => {
  const results = loadResults();
  expect(results.length).toBeGreaterThan(0);

  const report = generateReport(results);

  mkdirSync(NOTES_DIR, { recursive: true });
  writeFileSync(join(NOTES_DIR, "vulnerability-report.md"), report, "utf-8");
  writeFileSync(
    join(NOTES_DIR, "vulnerability-results.json"),
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  /* Legacy log format */
  const lines = results
    .sort((a, b) =>
      `${a.language}/${a.file}`.localeCompare(`${b.language}/${b.file}`),
    )
    .map(r => {
      const key = `[${r.language}/${r.file}]`;
      const reason = r.leaks.length
        ? `"${escapeQuotes(r.leaks.join(" | "))}"`
        : r.error
          ? `"${escapeQuotes(r.error)}"`
          : "0";
      return `${key}: { success: ${r.success ? 1 : 0}; fail_reason: ${reason}; strategy: "${r.strategy}"; compliant: ${r.success ? 1 : 0} }`;
    });
  writeFileSync(
    join(REPORT_DIR, "browselite-e2e.log"),
    lines.join("\n") + "\n",
    "utf-8",
  );

  /* eslint-disable no-console */
  console.log(`\n=== VULNERABILITY REPORT ===`);
  console.log(
    `Total: ${results.length} | Pass: ${results.filter(r => r.success).length} | Leak: ${results.filter(r => r.leaks.length > 0).length} | Error: ${results.filter(r => r.error).length}`,
  );
  console.log(`Report saved to: .notes/vulnerability-report.md`);
  /* eslint-enable no-console */
});
