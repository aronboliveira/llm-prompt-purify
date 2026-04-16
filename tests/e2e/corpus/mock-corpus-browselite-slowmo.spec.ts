/**
 * BrowserLite Slow-Mo Corpus E2E — Headed Visual Runner
 *
 * Processes prompt-corpus files through the masking engine in headed + slowMo
 * mode for visual inspection. Key differences from the standard BrowserLite:
 *
 *   • Starts with NEW variations: informal formality, newer roles, long lengths
 *   • Alternates between two input methods per item:
 *     – **Paste mode**: dispatches InputEvent with inputType='insertFromPaste'
 *     – **Typing mode**: dispatches InputEvent with inputType='insertText'
 *       char-by-char (with isComposing=true for CJK/abugida segments)
 *   • Uses vanilla JS InputEvent with inputType, data, isComposing,
 *     getTargetRanges, and dataTransfer where applicable
 *   • Uses dataset DOMStringMap pseudoboolean to prevent duplicate listeners
 *
 * Usage:
 *   SLOW_MO=150 npx playwright test tests/e2e/corpus/mock-corpus-browselite-slowmo.spec.ts \
 *     --headed --timeout=0 --config=playwright.visual.config.ts
 *
 * Env vars:
 *   SLOWMO_LIMIT       — Max items per language (0 = all). Default: 0
 *   SLOWMO_TYPING_MS   — Delay between keystrokes in typing mode. Default: 35
 *   SLOWMO_WAIT_MS     — Wait after input before asserting output. Default: 2500
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

interface PromptItem {
  lang: string;
  formality: string;
  role: string;
  length: string;
  file: string;
  sourceText: string;
}

interface SlowMoResult {
  lang: string;
  formality: string;
  role: string;
  length: string;
  file: string;
  inputMethod: "paste" | "typing";
  success: boolean;
  leaks: readonly string[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

const PROMPTS_ROOT = join(process.cwd(), ".tmp", "input-mocks", "prompts");
const NOTES_DIR = join(process.cwd(), ".notes");
const REPORT_DIR = join(process.cwd(), ".tmp", "copilot", "slowmo-browselite");
const RESULTS_FILE = join(REPORT_DIR, "slowmo-results.json");
const LOG_FILE = join(REPORT_DIR, "slowmo-browselite.log");

const SLOWMO_LIMIT = Number(process.env["SLOWMO_LIMIT"] ?? "0");
const TYPING_DELAY_MS = Number(process.env["SLOWMO_TYPING_MS"] ?? "35");
const WAIT_AFTER_INPUT_MS = Number(process.env["SLOWMO_WAIT_MS"] ?? "2500");

/** Reading pause after masking completes — scales with text length.
 *  short → 30s, medium → 45s, long → 60s. Override with SLOWMO_READ_MS. */
const READ_PAUSE_SHORT = Number(process.env["SLOWMO_READ_MS_SHORT"] ?? "30000");
const READ_PAUSE_MEDIUM = Number(
  process.env["SLOWMO_READ_MS_MEDIUM"] ?? "45000",
);
const READ_PAUSE_LONG = Number(process.env["SLOWMO_READ_MS_LONG"] ?? "60000");

function readingPauseMs(length: string): number {
  if (length === "long") return READ_PAUSE_LONG;
  if (length === "medium") return READ_PAUSE_MEDIUM;
  return READ_PAUSE_SHORT;
}

const corpusExists = existsSync(PROMPTS_ROOT);

const LANGUAGES = ["en", "pt-br", "es", "zh"] as const;
const FORMALITIES = ["informal", "neutral", "formal"] as const; // informal first
const LENGTHS = ["long", "medium", "short"] as const; // long first

/** Newer / less common roles first, then the rest */
const ROLE_PRIORITY: readonly string[] = [
  "tax_preparer",
  "paralegal",
  "marketing",
  "customer_support",
  "social_worker",
  "therapist",
  "journalist",
  "government",
  "insurance_agent",
  "realtor",
  "pharmacist",
  "recruiter",
  "secretary",
  "researcher",
  "banker",
  "hr",
  "nurse",
  "accountant",
  "sysadmin",
  "analyst",
  "techsavvy",
  "teacher",
  "doctor",
  "lawyer",
  "developer",
  "business",
  "student",
  "regular",
];

const LANG_SCOPE: Record<string, string> = {
  en: "us",
  "pt-br": "br",
  es: "cl",
  zh: "cn",
};

/** Unicode ranges that signal CJK or abugida composition */
const CJK_ABUGIDA_RE =
  /[\u2E80-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F]/u;

/* ------------------------------------------------------------------ */
/*  Build items — prioritise new variations                           */
/* ------------------------------------------------------------------ */

function buildPromptItems(): PromptItem[] {
  if (!corpusExists) return [];

  const items: PromptItem[] = [];

  for (const lang of LANGUAGES) {
    for (const formality of FORMALITIES) {
      for (const role of ROLE_PRIORITY) {
        for (const length of LENGTHS) {
          const dir = join(PROMPTS_ROOT, lang, formality, role, length);
          if (!existsSync(dir)) continue;

          const files = readdirSync(dir)
            .filter(f => f.endsWith(".txt"))
            .sort();

          for (const file of files) {
            items.push({
              lang,
              formality,
              role,
              length,
              file,
              sourceText: readFileSync(join(dir, file), "utf-8"),
            });
          }
        }
      }
    }
  }

  if (SLOWMO_LIMIT > 0) {
    // Apply per-language limit while keeping interleaved distribution
    const counts: Record<string, number> = {};
    return items.filter(item => {
      const key = item.lang;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts[key] <= SLOWMO_LIMIT;
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Page setup                                                        */
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

async function setCountryScope(page: Page, countryId: string): Promise<void> {
  await page.evaluate(cid => {
    window.sessionStorage.setItem(
      "llm-prompt-purify:country-profiles:v2",
      JSON.stringify([cid]),
    );
    window.sessionStorage.setItem("llm-prompt-purify:country-profile:v1", cid);
  }, countryId);
  await page.reload();
  await expect(page.getByTestId("source-textarea")).toBeVisible({
    timeout: 15_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Input Methods — vanilla InputEvent with proper properties         */
/* ------------------------------------------------------------------ */

/**
 * Paste mode: sets textarea value in one shot and dispatches a single
 * InputEvent with inputType='insertFromPaste', carrying the text via
 * dataTransfer. Uses dataset pseudoboolean to guard listener attachment.
 */
async function inputViaPaste(page: Page, text: string): Promise<void> {
  await page.evaluate(sourceText => {
    const ta = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="source-textarea"]',
    );
    if (!ta) throw new Error("source-textarea not found");

    // Clear first — mimic Ctrl+A → paste replace
    ta.value = "";
    ta.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: false,
        inputType: "deleteContentBackward",
        data: null,
        isComposing: false,
      }),
    );

    // Set value and fire insertFromPaste
    ta.value = sourceText;

    // Build a DataTransfer to carry the pasted text
    const dt = new DataTransfer();
    dt.setData("text/plain", sourceText);

    ta.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: false,
        inputType: "insertFromPaste",
        data: null,
        dataTransfer: dt,
        isComposing: false,
      }),
    );

    // Also fire ngModel's change pathway
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }, text);
}

/**
 * Typing mode: simulates character-by-character typing with proper
 * InputEvent for each character. For CJK / abugida characters,
 * uses compositionstart → insertCompositionText (isComposing=true)
 * → compositionend flow. Uses dataset DOMStringMap pseudoboolean
 * to prevent listener re-attachment.
 */
async function inputViaTyping(page: Page, text: string): Promise<void> {
  const textarea = page.getByTestId("source-textarea");

  // Clear field first
  await page.evaluate(() => {
    const ta = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="source-textarea"]',
    );
    if (!ta) return;
    ta.value = "";
    ta.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: false,
        inputType: "deleteByCut",
        data: null,
        isComposing: false,
      }),
    );
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Type char-by-char, dispatching proper InputEvents
  // For CJK/abugida we use composition events
  const chars = [...text]; // proper Unicode codepoint iteration
  let inComposition = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const isCjk = CJK_ABUGIDA_RE.test(ch);

    await page.evaluate(
      ({ char, isCjkChar, wasInComposition, index, totalLen }) => {
        const ta = document.querySelector<HTMLTextAreaElement>(
          '[data-testid="source-textarea"]',
        );
        if (!ta) return;

        // Guard: use dataset pseudoboolean to prevent multiple listener stacking
        const guardKey = "slowmoListenerBound";
        if (!ta.dataset[guardKey]) {
          ta.dataset[guardKey] = "1";
        }

        // Start composition for CJK if not already composing
        if (isCjkChar && !wasInComposition) {
          ta.dispatchEvent(
            new CompositionEvent("compositionstart", {
              bubbles: true,
              data: "",
            }),
          );
        }

        // End composition if we were composing and this char isn't CJK
        if (!isCjkChar && wasInComposition) {
          ta.dispatchEvent(
            new CompositionEvent("compositionend", {
              bubbles: true,
              data: ta.value.slice(-1),
            }),
          );
        }

        // Append character to textarea value
        ta.value += char;

        if (isCjkChar) {
          // Composition input: isComposing=true, inputType=insertCompositionText
          ta.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              cancelable: false,
              inputType: "insertCompositionText",
              data: char,
              isComposing: true,
            }),
          );

          ta.dispatchEvent(
            new CompositionEvent("compositionupdate", {
              bubbles: true,
              data: char,
            }),
          );
        } else {
          // Normal typing: isComposing=false, inputType=insertText
          ta.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              cancelable: false,
              inputType: "insertText",
              data: char,
              isComposing: false,
            }),
          );
        }

        // Fire change at end of input or periodically
        if (index === totalLen - 1) {
          // Final composition end if needed
          if (isCjkChar) {
            ta.dispatchEvent(
              new CompositionEvent("compositionend", {
                bubbles: true,
                data: char,
              }),
            );
          }
          ta.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      {
        char: ch,
        isCjkChar: isCjk,
        wasInComposition: inComposition,
        index: i,
        totalLen: chars.length,
      },
    );

    inComposition = isCjk;

    // Delay between keystrokes for visual effect
    if (TYPING_DELAY_MS > 0 && i < chars.length - 1) {
      await page.waitForTimeout(TYPING_DELAY_MS);
    }
  }

  // Ensure ngModel picks up final value
  await textarea.dispatchEvent("input");
}

/* ------------------------------------------------------------------ */
/*  Sensitive-value extraction (reused from browselite)               */
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

function extractSensitiveValues(sourceText: string): readonly string[] {
  const values: string[] = [];
  const patterns: { re: RegExp; luhn?: boolean }[] = [
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
    { re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu },
    {
      re: /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,}|SG\.[A-Za-z0-9_-]{20,}|key-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})\b/gu,
    },
    { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    { re: /\bAC[a-f0-9]{32}\b/giu },
    { re: /\b(?:\d[ -]?){13,19}\b/g, luhn: true },
    { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
    { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
    { re: /\b\d{17}[\dX]\b/giu },
    { re: /\b\d{3}-\d{2}-\d{4}\b/g },
    { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
    { re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/gu },
  ];

  for (const { re, luhn } of patterns) {
    for (const match of sourceText.matchAll(re)) {
      if (luhn && !luhnValid(match[0])) continue;
      values.push(match[0]);
    }
  }

  return [...new Set(values)];
}

function evaluateResult(
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

/* ------------------------------------------------------------------ */
/*  Results persistence                                               */
/* ------------------------------------------------------------------ */

function loadResults(): SlowMoResult[] {
  try {
    if (existsSync(RESULTS_FILE)) {
      return JSON.parse(readFileSync(RESULTS_FILE, "utf-8"));
    }
  } catch {
    /* corrupted — fresh start */
  }
  return [];
}

function appendResults(newResults: readonly SlowMoResult[]): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  const existing = loadResults();
  existing.push(...newResults);
  writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2), "utf-8");
}

/* ------------------------------------------------------------------ */
/*  Report generation                                                 */
/* ------------------------------------------------------------------ */

function generateSlowMoReport(results: readonly SlowMoResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const leaked = results.filter(r => r.leaks.length > 0).length;
  const errored = results.filter(r => r.error).length;
  const pasteCount = results.filter(r => r.inputMethod === "paste").length;
  const typingCount = results.filter(r => r.inputMethod === "typing").length;

  let md = `# SlowMo BrowserLite — Vulnerability Report\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Inputs Tested**: ${total}\n`;
  md += `**Passed**: ${passed}\n`;
  md += `**Leaked**: ${leaked}\n`;
  md += `**Errors**: ${errored}\n`;
  md += `**Pass Rate**: ${total ? ((passed / total) * 100).toFixed(2) : 0}%\n\n`;
  md += `## Input Method Distribution\n\n`;
  md += `| Method | Count | Pass | Leak |\n`;
  md += `|--------|-------|------|------|\n`;
  md += `| paste | ${pasteCount} | ${results.filter(r => r.inputMethod === "paste" && r.success).length} | ${results.filter(r => r.inputMethod === "paste" && r.leaks.length > 0).length} |\n`;
  md += `| typing | ${typingCount} | ${results.filter(r => r.inputMethod === "typing" && r.success).length} | ${results.filter(r => r.inputMethod === "typing" && r.leaks.length > 0).length} |\n\n`;

  md += `## By Language\n\n`;
  md += `| Lang | Total | Pass | Leak | Err |\n`;
  md += `|------|-------|------|------|-----|\n`;
  for (const lang of LANGUAGES) {
    const lr = results.filter(r => r.lang === lang);
    if (lr.length === 0) continue;
    md += `| ${lang} | ${lr.length} | ${lr.filter(r => r.success).length} | ${lr.filter(r => r.leaks.length > 0).length} | ${lr.filter(r => r.error).length} |\n`;
  }
  md += `\n`;

  md += `## By Formality\n\n`;
  md += `| Formality | Total | Pass | Leak |\n`;
  md += `|-----------|-------|------|------|\n`;
  for (const f of FORMALITIES) {
    const fr = results.filter(r => r.formality === f);
    if (fr.length === 0) continue;
    md += `| ${f} | ${fr.length} | ${fr.filter(r => r.success).length} | ${fr.filter(r => r.leaks.length > 0).length} |\n`;
  }
  md += `\n`;

  const leakResults = results.filter(r => r.leaks.length > 0);
  if (leakResults.length > 0) {
    md += `## Detected Vulnerabilities\n\n`;
    for (const r of leakResults.slice(0, 30)) {
      md += `- **${r.lang}/${r.formality}/${r.role}/${r.length}/${r.file}** (${r.inputMethod}): ${r.leaks.join(", ")}\n`;
    }
    if (leakResults.length > 30) {
      md += `\n...and ${leakResults.length - 30} more.\n`;
    }
    md += `\n`;
  } else {
    md += `## Vulnerabilities\n\nNone detected.\n\n`;
  }

  return md;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

/* Skip during normal `playwright test` runs — only run when explicitly
   targeted via SLOWMO_RUN=1.                                          */
test.skip(
  () => !process.env["SLOWMO_RUN"],
  "Slowmo spec skipped — set SLOWMO_RUN=1 to enable",
);

test.describe.configure({ mode: "serial" });

const ALL_ITEMS = buildPromptItems();

test("reset slowmo results", () => {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(RESULTS_FILE, "[]", "utf-8");
});

/**
 * The main test: process all prompt corpus items with alternating
 * paste / typing input methods. Grouped by language for isolation.
 */
for (const lang of LANGUAGES) {
  const langItems = ALL_ITEMS.filter(item => item.lang === lang);
  if (langItems.length === 0) continue;

  test(`[slowmo] ${lang} — ${langItems.length} items (paste/type alternating)`, async ({
    page,
  }) => {
    test.setTimeout(0); // No timeout — user watches visually

    await setupApiMock(page);
    await page.goto("/");
    await setCountryScope(page, LANG_SCOPE[lang] ?? "us");

    const results: SlowMoResult[] = [];
    let consecutiveErrors = 0;

    for (let i = 0; i < langItems.length; i++) {
      const item = langItems[i];
      const usePaste = i % 2 === 0; // alternate: even=paste, odd=typing
      const inputMethod: "paste" | "typing" = usePaste ? "paste" : "typing";

      // For typing mode on long texts, cap at 600 chars for sanity
      const effectiveText =
        !usePaste && item.sourceText.length > 600
          ? item.sourceText.slice(0, 600)
          : item.sourceText;

      try {
        if (usePaste) {
          await inputViaPaste(page, effectiveText);
        } else {
          await inputViaTyping(page, effectiveText);
        }

        // Wait for the masking engine to process
        await page.waitForTimeout(WAIT_AFTER_INPUT_MS);

        // Check for output ready state
        const output = page.getByTestId("masked-output");
        try {
          await expect(output).toHaveAttribute("data-state", "ready", {
            timeout: 15_000,
          });
        } catch {
          // If not ready after 15s, still read whatever is there
        }

        const maskedText = (await output.textContent()) ?? "";
        const leaks = evaluateResult(effectiveText, maskedText);

        results.push({
          ...item,
          inputMethod,
          success: leaks.length === 0,
          leaks,
        });
        consecutiveErrors = 0;

        // Reading pause — give the user time to inspect the masked output
        await page.waitForTimeout(readingPauseMs(item.length));
      } catch (err) {
        results.push({
          ...item,
          inputMethod,
          success: false,
          leaks: [],
          error: (err instanceof Error ? err.message : String(err)).slice(
            0,
            200,
          ),
        });

        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          // Bail — too many errors in a row
          for (let j = i + 1; j < langItems.length; j++) {
            results.push({
              ...langItems[j],
              inputMethod: j % 2 === 0 ? "paste" : "typing",
              success: false,
              leaks: [],
              error: "Skipped — consecutive error bailout",
            });
          }
          break;
        }

        // Try to recover
        try {
          await page.goto("/", { timeout: 15_000 });
          await setCountryScope(page, LANG_SCOPE[lang] ?? "us");
        } catch {
          // Unrecoverable — bail remaining
          for (let j = i + 1; j < langItems.length; j++) {
            results.push({
              ...langItems[j],
              inputMethod: j % 2 === 0 ? "paste" : "typing",
              success: false,
              leaks: [],
              error: "Skipped — page unrecoverable",
            });
          }
          break;
        }
      }

      // Periodic page reload to prevent memory leaks
      if (i > 0 && i % 150 === 0) {
        try {
          await page.goto("/");
          await setCountryScope(page, LANG_SCOPE[lang] ?? "us");
        } catch {
          /* best-effort */
        }
      }
    }

    appendResults(results);
  });
}

/* ---- Final: generate vulnerability report ---- */
test("generate slowmo vulnerability report", () => {
  const results = loadResults();
  expect(results.length).toBeGreaterThan(0);

  const report = generateSlowMoReport(results);

  mkdirSync(NOTES_DIR, { recursive: true });
  writeFileSync(
    join(NOTES_DIR, "slowmo-vulnerability-report.md"),
    report,
    "utf-8",
  );

  // Log file
  const lines = results
    .sort((a, b) =>
      `${a.lang}/${a.formality}/${a.role}/${a.file}`.localeCompare(
        `${b.lang}/${b.formality}/${b.role}/${b.file}`,
      ),
    )
    .map(r => {
      const key = `[${r.lang}/${r.formality}/${r.role}/${r.length}/${r.file}]`;
      const reason = r.leaks.length
        ? `"${r.leaks.join(" | ")}"`
        : r.error
          ? `"${r.error}"`
          : "0";
      return `${key}: { success: ${r.success ? 1 : 0}; method: "${r.inputMethod}"; fail_reason: ${reason} }`;
    });
  writeFileSync(LOG_FILE, lines.join("\n") + "\n", "utf-8");

  console.log(`\n=== SLOWMO VULNERABILITY REPORT ===`);
  console.log(report);
});
