import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

interface UiAuditEntry {
  success: 0 | 1;
  fail_reason: string | 0;
  fix: string;
  compliant: 0 | 1;
}

interface RunItem {
  countryId: string;
  file: string;
  language: "pt-br" | "es" | "zh" | "en";
  sourceText: string;
}

const INTERVAL_MS = 5000;
const MOCK_ROOT = join(process.cwd(), ".tmp", "input-mocks");
const REPORT_PATH = join(
  process.cwd(),
  ".tmp",
  "copilot",
  "reports-20260307",
  "browselite-e2e.log",
);

const samplePerLanguage = Number(process.env["MOCK_SAMPLE_PER_LANG"] ?? "0");
const runItems = buildRunItems();
const mockLimit = Number(process.env["MOCK_LIMIT"] ?? "0");
const effectiveItems = mockLimit > 0 ? runItems.slice(0, mockLimit) : runItems;
const estimatedTimeoutMs = Math.max(
  180_000,
  effectiveItems.length * (INTERVAL_MS + 1800) + 60_000,
);

test.describe.configure({ mode: "serial" });
test.setTimeout(estimatedTimeoutMs);

test("BrowserLite mock-by-mock run with 5s interval and scope switching", async ({
  page,
}) => {
  await page.route("**/api/mask-safety/validate", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSafe: true, findings: [] }),
    });
  });

  await page.goto("/");

  const reportEntries: Record<string, UiAuditEntry> = {};
  let currentCountry: string | null = null;

  for (let index = 0; index < effectiveItems.length; index += 1) {
    const item = effectiveItems[index];

    if (currentCountry !== item.countryId) {
      await setSingleCountryScope(page, item.countryId);
      currentCountry = item.countryId;
    }

    await page.getByTestId("source-textarea").fill(item.sourceText);
    await page.waitForTimeout(1100);

    const output = page.getByTestId("masked-output");
    await expect(output).toBeVisible();
    const maskedText = (await output.textContent()) ?? "";

    const reasons = evaluateUiResult(item.sourceText, maskedText);
    const key = `[${item.language}/${item.file}]`;
    reportEntries[key] = {
      success: reasons.length ? 0 : 1,
      fail_reason: reasons.length ? reasons.join(" | ") : 0,
      fix: reasons.length
        ? "Update detection rules or overlap selection so sensitive values are always removed from BrowserLite output."
        : "No changes required.",
      compliant: reasons.length ? 0 : 1,
    };

    if (index < effectiveItems.length - 1) {
      await page.waitForTimeout(INTERVAL_MS);
    }
  }

  mkdirSync(join(process.cwd(), ".tmp", "copilot", "reports-20260307"), {
    recursive: true,
  });

  const lines = Object.keys(reportEntries)
    .sort((left, right) => left.localeCompare(right))
    .map(key => {
      const entry = reportEntries[key];
      const failReason =
        entry.fail_reason === 0 ? "0" : `"${escapeQuotes(entry.fail_reason)}"`;
      return `${key}: { success: ${entry.success}; fail_reason: ${failReason}; fix: "${escapeQuotes(entry.fix)}"; compliant: ${entry.compliant} }`;
    });
  writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf-8");

  expect(lines.length).toBe(effectiveItems.length);
});

function buildRunItems(): readonly RunItem[] {
  const configs: readonly {
    countryId: string;
    language: RunItem["language"];
  }[] = [
    { countryId: "br", language: "pt-br" },
    { countryId: "cl", language: "es" },
    { countryId: "cn", language: "zh" },
    { countryId: "us", language: "en" },
  ];

  const items: RunItem[] = [];
  for (const config of configs) {
    const langDir = join(MOCK_ROOT, config.language);

    // Check if language directory has subdirectories (new structure) or flat files (legacy)
    const entries = readdirSync(langDir, { withFileTypes: true });
    const hasSubdirs = entries.some(entry => entry.isDirectory());

    if (hasSubdirs) {
      // New structure: language/category/*.txt
      const subdirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

      for (const subdir of subdirs) {
        const categoryDir = join(langDir, subdir);
        const files = readdirSync(categoryDir)
          .filter(file => file.endsWith(".txt"))
          .sort((left, right) => left.localeCompare(right));

        const effectiveFiles =
          samplePerLanguage > 0 ? files.slice(0, samplePerLanguage) : files;

        for (const file of effectiveFiles) {
          items.push({
            countryId: config.countryId,
            file: `${subdir}/${file}`,
            language: config.language,
            sourceText: readFileSync(join(categoryDir, file), "utf-8"),
          });
        }
      }
    } else {
      // Legacy structure: language/*.txt (flat)
      const files = entries
        .filter(entry => entry.isFile() && entry.name.endsWith(".txt"))
        .map(entry => entry.name)
        .sort((left, right) => left.localeCompare(right));

      const effectiveFiles =
        samplePerLanguage > 0 ? files.slice(0, samplePerLanguage) : files;

      for (const file of effectiveFiles) {
        items.push({
          countryId: config.countryId,
          file,
          language: config.language,
          sourceText: readFileSync(join(langDir, file), "utf-8"),
        });
      }
    }
  }

  return items;
}

async function setSingleCountryScope(
  page: Page,
  targetCountryId: string,
): Promise<void> {
  await page.evaluate(countryId => {
    window.sessionStorage.setItem(
      "llm-prompt-purify:country-profiles:v2",
      JSON.stringify([countryId]),
    );
    window.sessionStorage.setItem(
      "llm-prompt-purify:country-profile:v1",
      countryId,
    );
  }, targetCountryId);

  await page.reload();
  await expect(page.getByTestId("source-textarea")).toBeVisible();
}

function evaluateUiResult(
  sourceText: string,
  maskedText: string,
): readonly string[] {
  const reasons: string[] = [];
  for (const sensitiveValue of extractSensitiveValues(sourceText)) {
    if (maskedText.includes(sensitiveValue)) {
      reasons.push(`ui-leak: ${sensitiveValue}`);
    }
  }
  return reasons;
}

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

function extractSensitiveValues(sourceText: string): readonly string[] {
  const values: string[] = [];
  const patterns: { re: RegExp; luhn?: boolean }[] = [
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
    { re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu },
    { re: /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,}|SG\.[A-Za-z0-9_-]{20,}|key-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})\b/gu },
    { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    { re: /\bAC[a-f0-9]{32}\b/giu },
    { re: /\b(?:\d[ -]?){13,19}\b/g, luhn: true },
    { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
    { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
    { re: /\b\d{17}[\dX]\b/giu },
  ];

  for (const { re, luhn } of patterns) {
    for (const match of sourceText.matchAll(re)) {
      if (luhn && !luhnValid(match[0])) continue;
      values.push(match[0]);
    }
  }

  return Array.from(new Set(values));
}

function escapeQuotes(value: string): string {
  return value.replaceAll(/\\/gu, "\\\\").replaceAll(/"/gu, '\\"');
}
