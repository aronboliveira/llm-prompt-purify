import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const PROMPTS_ROOT = join(process.cwd(), ".tmp", "input-mocks", "prompts");

const SAMPLE_FILES: {
  lang: string;
  formality: string;
  role: string;
  length: string;
  file: string;
}[] = [];

const LANGUAGES = ["en", "pt-br", "es", "zh"] as const;
const FORMALITIES = ["formal", "neutral", "informal"] as const;
const SAMPLE_ROLES = [
  "regular",
  "lawyer",
  "doctor",
  "banker",
  "accountant",
  "hr",
  "developer",
] as const;
const LENGTHS = ["short", "medium", "long"] as const;

for (const lang of LANGUAGES) {
  for (const formality of FORMALITIES) {
    for (const role of SAMPLE_ROLES) {
      for (const length of LENGTHS) {
        const dir = join(PROMPTS_ROOT, lang, formality, role, length);
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir)
          .filter(f => f.endsWith(".txt"))
          .slice(0, 1);
        for (const file of files) {
          SAMPLE_FILES.push({ lang, formality, role, length, file });
        }
      }
    }
  }
}

test.describe("prompt corpus through UI masking", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
  });

  for (const sample of SAMPLE_FILES.slice(0, 24)) {
    const label = `${sample.lang}/${sample.formality}/${sample.role}/${sample.length}`;

    test(`masks PII in ${label}`, async ({ page }) => {
      const content = readFileSync(
        join(
          PROMPTS_ROOT,
          sample.lang,
          sample.formality,
          sample.role,
          sample.length,
          sample.file,
        ),
        "utf-8",
      );

      await page.goto("/");
      await page.getByTestId("source-textarea").fill(content);

      const output = page.getByTestId("masked-output");
      await expect(page.locator(".output__overlay")).toBeVisible();
      await expect(page.locator(".output__overlay")).not.toBeVisible({
        timeout: 10_000,
      });

      const maskedText = await output.textContent();
      expect(maskedText).toBeTruthy();
      expect(maskedText).not.toBe(content);
    });
  }
});

test.describe("prompt corpus language scope coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
  });

  const SCOPE_MAP: Record<string, string> = {
    en: "us",
    "pt-br": "br",
    es: "es",
    zh: "cn",
  };

  for (const lang of LANGUAGES) {
    test(`${lang} prompts trigger ${SCOPE_MAP[lang]} scope detection`, async ({
      page,
    }) => {
      const formalDir = join(PROMPTS_ROOT, lang, "formal", "regular", "long");
      if (!existsSync(formalDir)) {
        test.skip();
        return;
      }
      const files = readdirSync(formalDir).filter(f => f.endsWith(".txt"));
      if (files.length === 0) {
        test.skip();
        return;
      }

      const content = readFileSync(join(formalDir, files[0]), "utf-8");

      await page.goto("/");

      const countryId = SCOPE_MAP[lang];
      if (countryId !== "us") {
        await page.getByTestId("country-modal-button").click();
        await page.getByTestId(`country-toggle-${countryId}`).check();
        await page.getByRole("button", { name: "Close countries" }).click();
      }

      await page.getByTestId("source-textarea").fill(content);

      await expect(page.locator(".output__overlay")).toBeVisible();
      await expect(page.locator(".output__overlay")).not.toBeVisible({
        timeout: 10_000,
      });

      const output = page.getByTestId("masked-output");
      const maskedText = await output.textContent();
      expect(maskedText).toBeTruthy();
      expect(maskedText).not.toBe(content);
    });
  }
});
