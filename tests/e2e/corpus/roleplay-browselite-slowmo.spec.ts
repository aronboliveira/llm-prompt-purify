/**
 * Roleplay Slow-Mo BrowserLite E2E — Typing & Pasting Variations
 *
 * Runs all roleplay input mock fixtures through the masking engine in
 * headed + slowMo mode, alternating between paste and typing input
 * methods. Each fixture is tested twice (once paste, once typing).
 *
 * Repeats in a loop until the configured time limit (default: 2h).
 *
 * Usage:
 *   SLOW_MO=150 ROLEPLAY_DURATION_MIN=120 npx playwright test \
 *     tests/e2e/corpus/roleplay-browselite-slowmo.spec.ts \
 *     --headed --timeout=0 --config=playwright.visual.config.ts
 *
 * Env vars:
 *   ROLEPLAY_DURATION_MIN — Total run time in minutes. Default: 120
 *   SLOWMO_TYPING_MS      — Delay between keystrokes. Default: 35
 *   SLOWMO_WAIT_MS         — Wait after input before assert. Default: 2500
 *   SLOWMO_READ_MS         — Pause after each item for inspection. Default: 5000
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Fixture imports — roleplay personas                               */
/* ------------------------------------------------------------------ */

// We can't import TS fixtures directly in Playwright (different tsconfig),
// so we inline the fixture data. The source of truth remains the fixture files.

interface RoleplayItem {
  role: string;
  description: string;
  sourceText: string;
  hiddenValues: readonly string[];
  countryProfileIds: readonly string[];
  isNegative?: boolean;
  visibleValues?: readonly string[];
}

/* ── QA ─────────────────────────────────────────────────────────── */
const QA_ITEMS: RoleplayItem[] = [
  {
    role: "qa",
    description: "single-line multi-field: address + SSN + phone + email",
    sourceText:
      "address: 742 Evergreen Terrace, Springfield SSN: 321-54-9876 Email: homer.simpson@aol.com",
    hiddenValues: [
      "742 Evergreen Terrace, Springfield",
      "321-54-9876",
      "homer.simpson@aol.com",
    ],
    countryProfileIds: ["us"],
  },
  {
    role: "qa",
    description: "comma-separated fields mimicking CRM export",
    sourceText:
      "Name: Jane Doe, Email: jane.doe@corp.io, SSN: 123-45-6789, DOB: 1985-03-14",
    hiddenValues: ["jane.doe@corp.io", "123-45-6789"],
    countryProfileIds: ["us"],
  },
  {
    role: "qa",
    description: "PT-BR labeled CPF and phone on same line",
    sourceText: "CPF: 529.982.247-25 Telefone: +55 11 91234-5678",
    hiddenValues: ["529.982.247-25"],
    countryProfileIds: ["br"],
  },
  {
    role: "qa",
    description: "tab-separated PII fields (TSV style)",
    sourceText: "Email: user@example.com\tSSN: 987-65-4320\tPhone: 555-0199",
    hiddenValues: ["user@example.com", "987-65-4320"],
    countryProfileIds: ["us"],
  },
  {
    role: "qa",
    description: "mixed-case labels with equals delimiter",
    sourceText: "ssn=111-22-3333 phone=+1-800-555-0100",
    hiddenValues: ["111-22-3333"],
    countryProfileIds: ["us"],
  },
  {
    role: "qa",
    description: "dual-locale document with US and BR PII",
    sourceText:
      "SSN: 456-78-9012\nCPF: 529.982.247-25\nEmail: contact@bilingual.org",
    hiddenValues: ["456-78-9012", "contact@bilingual.org"],
    countryProfileIds: ["us", "br"],
  },
  {
    role: "qa",
    description: "credential + address on same line (API key after address)",
    sourceText:
      "address: 1600 Pennsylvania Ave NW, Washington DC API key: sk-proj-abc123def456ghi789jkl",
    hiddenValues: [
      "1600 Pennsylvania Ave NW, Washington DC",
      "sk-proj-abc123def456ghi789jkl",
    ],
    countryProfileIds: ["us"],
  },
  {
    role: "qa",
    description: "multiline form with every common PII type",
    sourceText: [
      "Name: Alice Liddell",
      "Email: alice@wonder.land",
      "SSN: 555-12-3456",
      "Address: 123 Rabbit Hole Ln, Apt 42",
      "Phone: +1-555-867-5309",
    ].join("\n"),
    hiddenValues: [
      "alice@wonder.land",
      "555-12-3456",
      "123 Rabbit Hole Ln, Apt 42",
    ],
    countryProfileIds: ["us"],
  },
];

/* ── Black Hat ──────────────────────────────────────────────────── */
const BLACK_HAT_ITEMS: RoleplayItem[] = [
  {
    role: "black-hat",
    description: "SSN with extra whitespace padding around dashes",
    sourceText: "SSN:   123-45-6789   (padded)",
    hiddenValues: ["123-45-6789"],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "email in angle brackets with surrounding noise",
    sourceText: ">>>>NOISE<<<< email: victim@evil.com ####END####",
    hiddenValues: ["victim@evil.com"],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "credential after long filler text",
    sourceText:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. sk-proj-AAAAAAAAAAAABBBBBBBBBBBB",
    hiddenValues: ["sk-proj-AAAAAAAAAAAABBBBBBBBBBBB"],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "JWT token sandwiched between HTML comment markers",
    sourceText:
      "<!-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM -->",
    hiddenValues: [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM",
    ],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "AWS key hidden in a base64-like blob",
    sourceText:
      "config=dXNlcjpwYXNz key: AKIAIOSFODNN7EXAMPLE secret=aGVsbG8gd29ybGQ=",
    hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "multiple SSNs crammed together with minimal separation",
    sourceText: "SSN:111-22-3333/444-55-6666",
    hiddenValues: ["111-22-3333", "444-55-6666"],
    countryProfileIds: ["us"],
  },
  {
    role: "black-hat",
    description: "CPF with dots (dot variant test)",
    sourceText: "CPF: 529.982.247-25 (dot variant test)",
    hiddenValues: ["529.982.247-25"],
    countryProfileIds: ["br"],
  },
  {
    role: "black-hat",
    description: "PII buried in JSON-like structure on single line",
    sourceText: '{"user":"admin","email":"leaked@internal.corp","role":"root"}',
    hiddenValues: ["leaked@internal.corp"],
    countryProfileIds: ["us"],
  },
];

const BLACK_HAT_NEGATIVE_ITEMS: RoleplayItem[] = [
  {
    role: "black-hat",
    description: "hex-like strings that should not trigger PII rules",
    sourceText: "commit: a4f8c3b2e1 hash: 0xDEADBEEF checksum: 5a3b7c9d",
    hiddenValues: [],
    visibleValues: ["a4f8c3b2e1", "0xDEADBEEF", "5a3b7c9d"],
    countryProfileIds: ["us"],
    isNegative: true,
  },
  {
    role: "black-hat",
    description: "code variable names that look like PII labels",
    sourceText:
      "const addressBuffer = new Uint8Array(32); const phoneHandler = () => null;",
    hiddenValues: [],
    visibleValues: ["new Uint8Array(32)", "() => null"],
    countryProfileIds: ["us"],
    isNegative: true,
  },
];

/* ── White Hat ──────────────────────────────────────────────────── */
const WHITE_HAT_ITEMS: RoleplayItem[] = [
  {
    role: "white-hat",
    description: "HTTP Authorization header with Bearer token",
    sourceText:
      "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
    hiddenValues: [
      "eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
    ],
    countryProfileIds: ["us"],
  },
  {
    role: "white-hat",
    description: "form POST body with PII fields",
    sourceText: [
      "POST /api/submit HTTP/1.1",
      "Content-Type: application/x-www-form-urlencoded",
      "",
      "name=John+Doe&email=john@pentest.lab&ssn=999-88-7777",
    ].join("\n"),
    hiddenValues: ["john@pentest.lab", "999-88-7777"],
    countryProfileIds: ["us"],
  },
  {
    role: "white-hat",
    description: ".env file contents with secrets",
    sourceText: [
      "OPENAI_API_KEY=sk-live-testkey1234567890abcdef",
      "AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE",
      "DATABASE_URL=postgres://localhost:5432/mydb",
    ].join("\n"),
    hiddenValues: ["sk-live-testkey1234567890abcdef", "AKIAI44QH8DHBEXAMPLE"],
    countryProfileIds: ["us"],
  },
  {
    role: "white-hat",
    description: "GitHub PAT in git config",
    sourceText:
      "url = https://ghp_ABCDEFghijklmnopqrstuvwxyz012345@github.com/org/repo.git",
    hiddenValues: ["ghp_ABCDEFghijklmnopqrstuvwxyz012345"],
    countryProfileIds: ["us"],
  },
  {
    role: "white-hat",
    description: "SSN in SQL INSERT statement (data exfil test)",
    sourceText:
      "INSERT INTO users (name, ssn, email) VALUES ('Bob', '321-65-0987', 'exfil@target.com');",
    hiddenValues: ["321-65-0987", "exfil@target.com"],
    countryProfileIds: ["us"],
  },
  {
    role: "white-hat",
    description: "CSV row with PII columns",
    sourceText: "Alice,Smith,alice@csv.test,456-78-0123,1990-01-15,123 Main St",
    hiddenValues: ["alice@csv.test", "456-78-0123"],
    countryProfileIds: ["us"],
  },
];

/* ── Green Hat ──────────────────────────────────────────────────── */
const GREEN_HAT_ITEMS: RoleplayItem[] = [
  {
    role: "green-hat",
    description: "plaintext SSN with label",
    sourceText: "My SSN is 123-45-6789",
    hiddenValues: ["123-45-6789"],
    countryProfileIds: ["us"],
  },
  {
    role: "green-hat",
    description: "email address in simple sentence",
    sourceText: "Send it to john.doe@gmail.com please",
    hiddenValues: ["john.doe@gmail.com"],
    countryProfileIds: ["us"],
  },
  {
    role: "green-hat",
    description: "phone number with country code",
    sourceText: "Phone: +1-555-123-4567",
    hiddenValues: ["+1-555-123-4567"],
    countryProfileIds: ["us"],
  },
  {
    role: "green-hat",
    description: "CPF with standard formatting",
    sourceText: "Meu CPF é 529.982.247-25",
    hiddenValues: ["529.982.247-25"],
    countryProfileIds: ["br"],
  },
  {
    role: "green-hat",
    description: "simple labeled address",
    sourceText: "Address: 456 Oak Street, Apt 12, Chicago IL 60601",
    hiddenValues: ["456 Oak Street, Apt 12, Chicago IL 60601"],
    countryProfileIds: ["us"],
  },
  {
    role: "green-hat",
    description: "API key pasted into chat",
    sourceText: "here is my key: sk-test-Abc123Def456Ghi789Jkl012",
    hiddenValues: ["sk-test-Abc123Def456Ghi789Jkl012"],
    countryProfileIds: ["us"],
  },
];

/* ── CISO ───────────────────────────────────────────────────────── */
const CISO_ITEMS: RoleplayItem[] = [
  {
    role: "ciso",
    description: "incident report excerpt with PII of affected individual",
    sourceText: [
      "INCIDENT REPORT #IR-2025-0042",
      "Affected individual: Jane Doe",
      "Email: victim@company.com",
      "SSN: 234-56-7890",
      "Data classification: PII / Confidential",
      "GDPR Article 33 notification deadline: 72 hours",
    ].join("\n"),
    hiddenValues: ["victim@company.com", "234-56-7890"],
    countryProfileIds: ["us"],
  },
  {
    role: "ciso",
    description: "LGPD data mapping with CPF and CNPJ",
    sourceText: [
      "MAPEAMENTO DE DADOS — LGPD Art. 37",
      "Titular: Maria Silva",
      "CPF: 529.982.247-25",
      "Empresa controladora CNPJ: 11.222.333/0001-81",
      "Base legal: consentimento (Art. 7, I)",
    ].join("\n"),
    hiddenValues: ["529.982.247-25", "11.222.333/0001-81"],
    countryProfileIds: ["br"],
  },
  {
    role: "ciso",
    description: "PCI-DSS audit log with card-adjacent data",
    sourceText: [
      "PCI-DSS Requirement 3.4 — Render PAN unreadable",
      "Audit finding: cardholder email stored in plaintext",
      "Evidence: cardholder@bank.com found in access_log.csv",
      "Remediation: encrypt at rest, mask in transit",
    ].join("\n"),
    hiddenValues: ["cardholder@bank.com"],
    countryProfileIds: ["us"],
  },
  {
    role: "ciso",
    description: "cross-border data transfer summary with mixed-locale PII",
    sourceText: [
      "Cross-Border Transfer Assessment",
      "US Employee SSN: 789-01-2345",
      "BR Employee CPF: 529.982.247-25",
      "DPO contact: dpo@multinational.corp",
      "Standard Contractual Clauses: approved",
    ].join("\n"),
    hiddenValues: ["789-01-2345", "dpo@multinational.corp"],
    countryProfileIds: ["us", "br"],
  },
  {
    role: "ciso",
    description: "vendor risk assessment with API credentials",
    sourceText: [
      "Vendor: AI Analytics Corp",
      "API key found in public repo: sk-live-vendorAudit123456789012345",
      "Risk level: CRITICAL",
      "Action: rotate immediately, revoke access",
    ].join("\n"),
    hiddenValues: ["sk-live-vendorAudit123456789012345"],
    countryProfileIds: ["us"],
  },
];

/* ── Dev ─────────────────────────────────────────────────────────── */
const DEV_ITEMS: RoleplayItem[] = [
  {
    role: "dev",
    description: "application log line with user email",
    sourceText:
      "[2025-03-15T14:22:01Z] ERROR UserService: failed login for user42@startup.io from 10.0.0.1",
    hiddenValues: ["user42@startup.io"],
    countryProfileIds: ["us"],
  },
  {
    role: "dev",
    description: "JSON API response with PII fields",
    sourceText: [
      '{"id": 42, "name": "Bob",',
      ' "email": "bob@api.test",',
      ' "ssn": "321-54-9876",',
      ' "role": "admin"}',
    ].join("\n"),
    hiddenValues: ["bob@api.test", "321-54-9876"],
    countryProfileIds: ["us"],
  },
  {
    role: "dev",
    description: ".env file leak with multiple secrets",
    sourceText: [
      "NODE_ENV=production",
      "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
      "PORT=3000",
    ].join("\n"),
    hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
    countryProfileIds: ["us"],
  },
  {
    role: "dev",
    description: "git diff context with embedded secret",
    sourceText: [
      "diff --git a/config.ts b/config.ts",
      "--- a/config.ts",
      "+++ b/config.ts",
      "@@ -3,2 +3,2 @@",
      '-const API_KEY = "placeholder";',
      '+const API_KEY = "sk-proj-myDevKey12345678901234567";',
    ].join("\n"),
    hiddenValues: ["sk-proj-myDevKey12345678901234567"],
    countryProfileIds: ["us"],
  },
  {
    role: "dev",
    description: "database query result with SSN column",
    sourceText: [
      "SELECT * FROM users WHERE active = true;",
      "-- Result:",
      "-- id | name  | ssn         | email",
      "-- 1  | Alice | 555-44-3322 | alice@db.local",
    ].join("\n"),
    hiddenValues: ["555-44-3322", "alice@db.local"],
    countryProfileIds: ["us"],
  },
  {
    role: "dev",
    description: "shell history with curl and auth header",
    sourceText:
      'curl -H "Authorization: token ghp_1234567890abcdefGHIJKLMNOPQRST" https://api.github.com/user',
    hiddenValues: ["ghp_1234567890abcdefGHIJKLMNOPQRST"],
    countryProfileIds: ["us"],
  },
];

/* ------------------------------------------------------------------ */
/*  All items combined                                                */
/* ------------------------------------------------------------------ */

const ALL_POSITIVE: RoleplayItem[] = [
  ...QA_ITEMS,
  ...BLACK_HAT_ITEMS,
  ...WHITE_HAT_ITEMS,
  ...GREEN_HAT_ITEMS,
  ...CISO_ITEMS,
  ...DEV_ITEMS,
];

const ALL_NEGATIVE: RoleplayItem[] = [...BLACK_HAT_NEGATIVE_ITEMS];

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

const DURATION_MIN = Number(process.env["ROLEPLAY_DURATION_MIN"] ?? "120");
const TYPING_DELAY_MS = Number(process.env["SLOWMO_TYPING_MS"] ?? "35");
const WAIT_AFTER_INPUT_MS = Number(process.env["SLOWMO_WAIT_MS"] ?? "2500");
const READ_PAUSE_MS = Number(process.env["SLOWMO_READ_MS"] ?? "5000");

const REPORT_DIR = join(process.cwd(), ".tmp", "copilot", "roleplay-slowmo");
const RESULTS_FILE = join(REPORT_DIR, "roleplay-slowmo-results.json");
const LOG_FILE = join(REPORT_DIR, "roleplay-slowmo.log");

const COUNTRY_SCOPE: Record<string, string> = {
  us: "us",
  br: "br",
  cl: "cl",
  cn: "cn",
};

/** CJK / abugida for composition events */
const CJK_ABUGIDA_RE =
  /[\u2E80-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F]/u;

/* ------------------------------------------------------------------ */
/*  Result tracking                                                   */
/* ------------------------------------------------------------------ */

interface RoleplayResult {
  iteration: number;
  role: string;
  description: string;
  inputMethod: "paste" | "typing";
  success: boolean;
  leaks: readonly string[];
  negativeResult?: { visibleOk: boolean };
  error?: string;
  timestamp: string;
}

function loadResults(): RoleplayResult[] {
  try {
    if (existsSync(RESULTS_FILE)) {
      return JSON.parse(readFileSync(RESULTS_FILE, "utf-8"));
    }
  } catch {
    /* fresh start */
  }
  return [];
}

function saveResults(results: readonly RoleplayResult[]): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), "utf-8");
}

/* ------------------------------------------------------------------ */
/*  Input methods (reused from browselite-slowmo)                     */
/* ------------------------------------------------------------------ */

async function inputViaPaste(page: Page, text: string): Promise<void> {
  await page.evaluate(sourceText => {
    const ta = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="source-textarea"]',
    );
    if (!ta) throw new Error("source-textarea not found");

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

    ta.value = sourceText;
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

    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }, text);
}

async function inputViaTyping(page: Page, text: string): Promise<void> {
  // Clear field
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

  const chars = [...text];
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

        if (isCjkChar && !wasInComposition) {
          ta.dispatchEvent(
            new CompositionEvent("compositionstart", {
              bubbles: true,
              data: "",
            }),
          );
        }

        if (!isCjkChar && wasInComposition) {
          ta.dispatchEvent(
            new CompositionEvent("compositionend", {
              bubbles: true,
              data: ta.value.slice(-1),
            }),
          );
        }

        ta.value += char;

        if (isCjkChar) {
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

        if (index === totalLen - 1) {
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

    if (TYPING_DELAY_MS > 0 && i < chars.length - 1) {
      await page.waitForTimeout(TYPING_DELAY_MS);
    }
  }

  // Ensure ngModel picks up final value
  const textarea = page.getByTestId("source-textarea");
  await textarea.dispatchEvent("input");
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
/*  Report generation                                                 */
/* ------------------------------------------------------------------ */

function generateReport(results: readonly RoleplayResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const leaked = results.filter(r => r.leaks.length > 0).length;
  const errored = results.filter(r => r.error).length;
  const pasteCount = results.filter(r => r.inputMethod === "paste").length;
  const typingCount = results.filter(r => r.inputMethod === "typing").length;
  const iterations =
    results.length > 0 ? Math.max(...results.map(r => r.iteration)) : 0;

  let md = `# Roleplay Slow-Mo — Vulnerability Report\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Iterations Completed**: ${iterations}\n`;
  md += `**Total Inputs Tested**: ${total}\n`;
  md += `**Passed**: ${passed}\n`;
  md += `**Leaked**: ${leaked}\n`;
  md += `**Errors**: ${errored}\n`;
  md += `**Pass Rate**: ${total ? ((passed / total) * 100).toFixed(2) : 0}%\n\n`;

  md += `## Input Method Distribution\n\n`;
  md += `| Method | Count | Pass | Leak |\n`;
  md += `|--------|-------|------|------|\n`;
  md += `| paste | ${pasteCount} | ${results.filter(r => r.inputMethod === "paste" && r.success).length} | ${results.filter(r => r.inputMethod === "paste" && r.leaks.length > 0).length} |\n`;
  md += `| typing | ${typingCount} | ${results.filter(r => r.inputMethod === "typing" && r.success).length} | ${results.filter(r => r.inputMethod === "typing" && r.leaks.length > 0).length} |\n\n`;

  md += `## By Role\n\n`;
  md += `| Role | Total | Pass | Leak | Err |\n`;
  md += `|------|-------|------|------|-----|\n`;
  for (const role of [
    "qa",
    "black-hat",
    "white-hat",
    "green-hat",
    "ciso",
    "dev",
  ]) {
    const rr = results.filter(r => r.role === role);
    if (rr.length === 0) continue;
    md += `| ${role} | ${rr.length} | ${rr.filter(r => r.success).length} | ${rr.filter(r => r.leaks.length > 0).length} | ${rr.filter(r => r.error).length} |\n`;
  }
  md += `\n`;

  const leakResults = results.filter(r => r.leaks.length > 0);
  if (leakResults.length > 0) {
    md += `## Detected Vulnerabilities\n\n`;
    for (const r of leakResults.slice(0, 50)) {
      md += `- **[${r.role}] ${r.description}** (${r.inputMethod}, iter ${r.iteration}): ${r.leaks.join(", ")}\n`;
    }
    if (leakResults.length > 50) {
      md += `\n...and ${leakResults.length - 50} more.\n`;
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

test.skip(
  () => !process.env["SLOWMO_RUN"],
  "Roleplay slowmo spec skipped — set SLOWMO_RUN=1 to enable",
);

test.describe.configure({ mode: "serial" });

test("reset roleplay slowmo results", () => {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(RESULTS_FILE, "[]", "utf-8");
});

test("[roleplay-slowmo] loop all personas — paste & typing (2h)", async ({
  page,
}) => {
  test.setTimeout(0); // No timeout — runs for DURATION_MIN

  await setupApiMock(page);
  await page.goto("/");

  const startTime = Date.now();
  const deadline = startTime + DURATION_MIN * 60_000;
  let iteration = 0;
  const allResults: RoleplayResult[] = [];

  /* ── Ordered sequence per user spec ────────────────────────── */
  type SequenceEntry = { item: RoleplayItem; inputMethod: "paste" | "typing" };

  function buildOrderedSequence(): SequenceEntry[] {
    const seq: SequenceEntry[] = [];

    // 1) Typing Black Hat
    for (const item of BLACK_HAT_ITEMS) {
      seq.push({ item, inputMethod: "typing" });
    }
    // 2) Pasting Green Hat
    for (const item of GREEN_HAT_ITEMS) {
      seq.push({ item, inputMethod: "paste" });
    }
    // 3) Typing QA
    for (const item of QA_ITEMS) {
      seq.push({ item, inputMethod: "typing" });
    }
    // 4) Pasting Black Hat
    for (const item of BLACK_HAT_ITEMS) {
      seq.push({ item, inputMethod: "paste" });
    }
    // 5) All others — alternate paste/typing
    const others = [...WHITE_HAT_ITEMS, ...CISO_ITEMS, ...DEV_ITEMS];
    for (let i = 0; i < others.length; i++) {
      seq.push({
        item: others[i],
        inputMethod: i % 2 === 0 ? "paste" : "typing",
      });
    }

    return seq;
  }

  const orderedSeq = buildOrderedSequence();

  while (Date.now() < deadline) {
    iteration++;
    console.log(`\n══════════════════════════════════════════════════════════`);
    console.log(
      `  ITERATION ${iteration} — elapsed ${((Date.now() - startTime) / 60_000).toFixed(1)}m / ${DURATION_MIN}m`,
    );
    console.log(`══════════════════════════════════════════════════════════\n`);

    for (let i = 0; i < orderedSeq.length; i++) {
      if (Date.now() >= deadline) break;

      const { item, inputMethod } = orderedSeq[i];

      // Set country scope for this fixture
      const scope = item.countryProfileIds[0] ?? "us";
      try {
        await setCountryScope(page, COUNTRY_SCOPE[scope] ?? scope);
      } catch {
        // If scope change fails, try page reload
        try {
          await page.goto("/");
          await setCountryScope(page, COUNTRY_SCOPE[scope] ?? scope);
        } catch {
          continue;
        }
      }

      try {
        console.log(
          `  [${inputMethod.toUpperCase()}] [${item.role}] ${item.description}`,
        );

        if (inputMethod === "paste") {
          await inputViaPaste(page, item.sourceText);
        } else {
          await inputViaTyping(page, item.sourceText);
        }

        await page.waitForTimeout(WAIT_AFTER_INPUT_MS);

        const output = page.getByTestId("masked-output");
        try {
          await expect(output).toHaveAttribute("data-state", "ready", {
            timeout: 15_000,
          });
        } catch {
          /* still try to read output */
        }

        const maskedText = (await output.textContent()) ?? "";
        const leaks: string[] = [];

        for (const val of item.hiddenValues) {
          if (maskedText.includes(val)) {
            leaks.push(`LEAK: "${val}"`);
          }
        }

        const result: RoleplayResult = {
          iteration,
          role: item.role,
          description: item.description,
          inputMethod,
          success: leaks.length === 0,
          leaks,
          timestamp: new Date().toISOString(),
        };

        allResults.push(result);

        if (leaks.length > 0) {
          console.log(`    ❌ LEAKS FOUND: ${leaks.join(", ")}`);
        } else {
          console.log(`    ✅ OK`);
        }

        // Reading pause
        await page.waitForTimeout(READ_PAUSE_MS);
      } catch (err) {
        const msg = (err instanceof Error ? err.message : String(err)).slice(
          0,
          200,
        );
        console.log(`    ⚠️ ERROR: ${msg}`);

        allResults.push({
          iteration,
          role: item.role,
          description: item.description,
          inputMethod,
          success: false,
          leaks: [],
          error: msg,
          timestamp: new Date().toISOString(),
        });

        // Try recovering
        try {
          await page.goto("/", { timeout: 15_000 });
        } catch {
          /* bail this item */
        }
      }
    }

    // Run negative items at the end of each iteration
    for (const item of ALL_NEGATIVE) {
      if (Date.now() >= deadline) break;

      const negInputMethod: "paste" | "typing" =
        iteration % 2 === 0 ? "paste" : "typing";

      try {
        const scope = item.countryProfileIds[0] ?? "us";
        await setCountryScope(page, COUNTRY_SCOPE[scope] ?? scope);

        console.log(
          `  [${negInputMethod.toUpperCase()}] [${item.role}] (negative) ${item.description}`,
        );

        if (negInputMethod === "paste") {
          await inputViaPaste(page, item.sourceText);
        } else {
          await inputViaTyping(page, item.sourceText);
        }

        await page.waitForTimeout(WAIT_AFTER_INPUT_MS);

        const output = page.getByTestId("masked-output");
        try {
          await expect(output).toHaveAttribute("data-state", "ready", {
            timeout: 15_000,
          });
        } catch {
          /* try to read */
        }

        const maskedText = (await output.textContent()) ?? "";
        let visibleOk = true;
        for (const val of item.visibleValues ?? []) {
          if (!maskedText.includes(val)) {
            visibleOk = false;
            console.log(`    ⚠️ FALSE POSITIVE: "${val}" was masked`);
          }
        }

        allResults.push({
          iteration,
          role: item.role,
          description: `(negative) ${item.description}`,
          inputMethod: negInputMethod,
          success: visibleOk,
          leaks: [],
          negativeResult: { visibleOk },
          timestamp: new Date().toISOString(),
        });

        if (visibleOk) {
          console.log(`    ✅ OK (no false positives)`);
        }

        await page.waitForTimeout(READ_PAUSE_MS);
      } catch (err) {
        allResults.push({
          iteration,
          role: item.role,
          description: `(negative) ${item.description}`,
          inputMethod: negInputMethod,
          success: false,
          leaks: [],
          error: (err instanceof Error ? err.message : String(err)).slice(
            0,
            200,
          ),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Save results after each iteration
    saveResults(allResults);
    console.log(
      `\n  📊 Iteration ${iteration} complete — ${allResults.length} total results saved`,
    );

    // Periodic page reload to prevent memory buildup
    if (iteration % 5 === 0) {
      try {
        await page.goto("/");
      } catch {
        /* best-effort */
      }
    }
  }

  // Final save
  saveResults(allResults);
  console.log(
    `\n✅ Completed ${iteration} iterations in ${((Date.now() - startTime) / 60_000).toFixed(1)} minutes`,
  );
  console.log(`   Total results: ${allResults.length}`);
  console.log(`   Leaks: ${allResults.filter(r => r.leaks.length > 0).length}`);
  console.log(`   Errors: ${allResults.filter(r => r.error).length}`);
});

/* ---- Final report ---- */
test("generate roleplay slowmo vulnerability report", () => {
  const results = loadResults();
  expect(results.length).toBeGreaterThan(0);

  const report = generateReport(results);

  const notesDir = join(process.cwd(), ".notes");
  mkdirSync(notesDir, { recursive: true });
  writeFileSync(
    join(notesDir, "roleplay-slowmo-vulnerability-report.md"),
    report,
    "utf-8",
  );

  writeFileSync(
    LOG_FILE,
    results
      .map(r => {
        const key = `[iter${r.iteration}][${r.role}][${r.inputMethod}]`;
        const reason = r.leaks.length
          ? `"${r.leaks.join(" | ")}"`
          : r.error
            ? `"${r.error}"`
            : "0";
        return `${key} ${r.description}: { success: ${r.success ? 1 : 0}; fail_reason: ${reason} }`;
      })
      .join("\n") + "\n",
    "utf-8",
  );

  console.log(`\n=== ROLEPLAY SLOWMO VULNERABILITY REPORT ===`);
  console.log(report);
});
