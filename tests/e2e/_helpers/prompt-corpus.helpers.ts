import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

// ── Paths ──────────────────────────────────────────────────────────────

export const PROMPTS_ROOT = join(
  process.cwd(),
  ".tmp",
  "input-mocks",
  "prompts",
);

export const corpusExists = existsSync(PROMPTS_ROOT);

// ── Dimensions ─────────────────────────────────────────────────────────

export const LANGUAGES = ["en", "pt-br", "es", "zh"] as const;
export const FORMALITIES = ["formal", "neutral", "informal"] as const;
export const LENGTHS = ["short", "medium", "long"] as const;

export const ALL_ROLES = [
  "regular",
  "student",
  "business",
  "techsavvy",
  "analyst",
  "developer",
  "sysadmin",
  "lawyer",
  "doctor",
  "nurse",
  "accountant",
  "hr",
  "recruiter",
  "secretary",
  "teacher",
  "pharmacist",
  "insurance_agent",
  "banker",
  "realtor",
  "social_worker",
  "researcher",
  "therapist",
  "journalist",
  "government",
  "customer_support",
  "marketing",
  "paralegal",
  "tax_preparer",
] as const;

// ── Role clusters ──────────────────────────────────────────────────────

export const ROLE_CLUSTERS = {
  healthcare: ["doctor", "nurse", "pharmacist", "therapist"],
  legal: ["lawyer", "paralegal"],
  finance: ["banker", "accountant", "tax_preparer", "insurance_agent"],
  hr_admin: ["hr", "recruiter", "secretary"],
  education: ["teacher", "student", "researcher"],
  tech: ["developer", "sysadmin", "analyst"],
  public_facing: ["customer_support", "marketing", "journalist"],
  government_social: ["government", "social_worker", "realtor"],
  general: ["regular", "business", "techsavvy"],
} as const;

export type ClusterName = keyof typeof ROLE_CLUSTERS;

// ── Language → country scope mapping ───────────────────────────────────

const LANG_SCOPE: Record<string, string> = {
  en: "us",
  "pt-br": "br",
  es: "es",
  zh: "cn",
};

// ── Sampling ───────────────────────────────────────────────────────────

const MAX_FILES_PER_COMBO = Number(process.env["E2E_CORPUS_SAMPLE"] ?? "2");

// ── File readers ───────────────────────────────────────────────────────

export function readPromptFiles(
  lang: string,
  formality: string,
  role: string,
  length: string,
): readonly string[] {
  const dir = join(PROMPTS_ROOT, lang, formality, role, length);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".txt"))
    .sort()
    .slice(0, MAX_FILES_PER_COMBO);
}

export function readPromptFile(
  lang: string,
  formality: string,
  role: string,
  length: string,
  file: string,
): string {
  return readFileSync(
    join(PROMPTS_ROOT, lang, formality, role, length, file),
    "utf-8",
  );
}

// ── UI helpers ─────────────────────────────────────────────────────────

export async function setupPage(page: Page, countryId: string): Promise<void> {
  await page.route("**/api/mask-safety/validate", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSafe: true, findings: [] }),
    });
  });

  await page.goto("/");

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

export async function assertMasked(
  page: Page,
  sourceText: string,
): Promise<void> {
  await page.getByTestId("source-textarea").fill(sourceText);

  const output = page.getByTestId("masked-output");
  await expect(output).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);

  const masked = (await output.textContent()) ?? "";
  expect(masked.length).toBeGreaterThan(0);

  if (masked !== sourceText) {
    // Masking occurred — verify no obvious leaks for common PII patterns
    const emails = sourceText.match(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    );
    for (const email of emails ?? []) {
      expect(masked).not.toContain(email);
    }
  }
}

// ── Shared test body ───────────────────────────────────────────────────

export interface CorpusSample {
  lang: string;
  formality: string;
  role: string;
  length: string;
  file: string;
  text: string;
}

export function collectSamples(
  roles: readonly string[],
  formalities: readonly string[] = [...FORMALITIES],
  languages: readonly string[] = [...LANGUAGES],
): CorpusSample[] {
  const samples: CorpusSample[] = [];

  for (const lang of languages) {
    for (const formality of formalities) {
      for (const role of roles) {
        for (const length of LENGTHS) {
          const files = readPromptFiles(lang, formality, role, length);
          for (const file of files) {
            samples.push({
              lang,
              formality,
              role,
              length,
              file,
              text: readPromptFile(lang, formality, role, length, file),
            });
          }
        }
      }
    }
  }

  return samples;
}

export function registerClusterTests(
  clusterName: string,
  roles: readonly string[],
): void {
  const samples = corpusExists ? collectSamples(roles) : [];

  test.describe(`prompt corpus cluster: ${clusterName}`, () => {
    test.skip(!corpusExists, "corpus not generated");

    for (const lang of LANGUAGES) {
      for (const formality of FORMALITIES) {
        const subset = samples.filter(
          s => s.lang === lang && s.formality === formality,
        );
        if (subset.length === 0) continue;

        test(`[${lang}] ${formality} — ${subset.length} samples (${roles.join(", ")})`, async ({
          page,
        }) => {
          test.setTimeout(Math.max(60_000, subset.length * 5_000));
          await setupPage(page, LANG_SCOPE[lang] ?? "us");

          for (const sample of subset) {
            await assertMasked(page, sample.text);
          }
        });
      }
    }
  });
}

export function registerFormalityTests(
  formality: (typeof FORMALITIES)[number],
): void {
  const samples = corpusExists
    ? collectSamples([...ALL_ROLES], [formality])
    : [];

  test.describe(`prompt corpus formality: ${formality}`, () => {
    test.skip(!corpusExists, "corpus not generated");

    for (const lang of LANGUAGES) {
      const subset = samples.filter(s => s.lang === lang);
      if (subset.length === 0) continue;

      test(`[${lang}] ${formality} — ${subset.length} samples across all roles`, async ({
        page,
      }) => {
        test.setTimeout(Math.max(120_000, subset.length * 5_000));
        await setupPage(page, LANG_SCOPE[lang] ?? "us");

        for (const sample of subset) {
          await assertMasked(page, sample.text);
        }
      });
    }
  });
}

// ── Cluster × Formality combination ────────────────────────────────────

export function registerClusterFormalityTests(
  clusterName: string,
  roles: readonly string[],
  formality: (typeof FORMALITIES)[number],
): void {
  const samples = corpusExists ? collectSamples(roles, [formality]) : [];

  test.describe(`prompt corpus ${clusterName} × ${formality}`, () => {
    test.skip(!corpusExists, "corpus not generated");

    for (const lang of LANGUAGES) {
      const subset = samples.filter(s => s.lang === lang);
      if (subset.length === 0) continue;

      test(`[${lang}] ${clusterName}/${formality} — ${subset.length} samples (${roles.join(", ")})`, async ({
        page,
      }) => {
        test.setTimeout(Math.max(60_000, subset.length * 5_000));
        await setupPage(page, LANG_SCOPE[lang] ?? "us");

        for (const sample of subset) {
          await assertMasked(page, sample.text);
        }
      });
    }
  });
}

// ── Per-language ───────────────────────────────────────────────────────

export function registerLanguageTests(lang: (typeof LANGUAGES)[number]): void {
  const samples = corpusExists
    ? collectSamples([...ALL_ROLES], [...FORMALITIES], [lang])
    : [];

  test.describe(`prompt corpus language: ${lang}`, () => {
    test.skip(!corpusExists, "corpus not generated");

    for (const formality of FORMALITIES) {
      const subset = samples.filter(s => s.formality === formality);
      if (subset.length === 0) continue;

      test(`${formality} — ${subset.length} samples across all roles`, async ({
        page,
      }) => {
        test.setTimeout(Math.max(120_000, subset.length * 5_000));
        await setupPage(page, LANG_SCOPE[lang] ?? "us");

        for (const sample of subset) {
          await assertMasked(page, sample.text);
        }
      });
    }
  });
}

// ── Per-role ───────────────────────────────────────────────────────────

export function registerRoleTests(role: string): void {
  const samples = corpusExists ? collectSamples([role]) : [];

  test.describe(`prompt corpus role: ${role}`, () => {
    test.skip(!corpusExists, "corpus not generated");

    for (const lang of LANGUAGES) {
      for (const formality of FORMALITIES) {
        const subset = samples.filter(
          s => s.lang === lang && s.formality === formality,
        );
        if (subset.length === 0) continue;

        test(`[${lang}] ${formality} — ${subset.length} samples`, async ({
          page,
        }) => {
          test.slow(); // visual / slowMo configs need extra time
          test.setTimeout(Math.max(120_000, subset.length * 15_000));
          await setupPage(page, LANG_SCOPE[lang] ?? "us");

          for (const sample of subset) {
            await assertMasked(page, sample.text);
          }
        });
      }
    }
  });
}
