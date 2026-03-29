import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const PROMPTS_ROOT = join(process.cwd(), ".tmp", "input-mocks", "prompts");

test.describe("prompt corpus structural integrity", () => {
  test("corpus root directory exists", () => {
    expect(existsSync(PROMPTS_ROOT)).toBe(true);
  });

  const EXPECTED_LANGUAGES = ["en", "pt-br", "es", "zh"];
  const EXPECTED_FORMALITIES = ["formal", "neutral", "informal"];
  const EXPECTED_LENGTHS = ["short", "medium", "long"];

  for (const lang of EXPECTED_LANGUAGES) {
    test(`${lang}/ has subdirectories for all formalities`, () => {
      const langDir = join(PROMPTS_ROOT, lang);
      if (!existsSync(langDir)) {
        test.skip();
        return;
      }
      const dirs = readdirSync(langDir).filter(d =>
        statSync(join(langDir, d)).isDirectory(),
      );
      for (const formality of EXPECTED_FORMALITIES) {
        expect(dirs).toContain(formality);
      }
    });
  }

  test("every leaf directory contains at least 1 .txt file", () => {
    if (!existsSync(PROMPTS_ROOT)) {
      test.skip();
      return;
    }
    let totalFiles = 0;
    let emptyDirs = 0;

    for (const lang of readdirSync(PROMPTS_ROOT)) {
      const langDir = join(PROMPTS_ROOT, lang);
      if (!statSync(langDir).isDirectory()) continue;
      for (const formality of readdirSync(langDir)) {
        const fDir = join(langDir, formality);
        if (!statSync(fDir).isDirectory()) continue;
        for (const role of readdirSync(fDir)) {
          const rDir = join(fDir, role);
          if (!statSync(rDir).isDirectory()) continue;
          for (const length of readdirSync(rDir)) {
            const lDir = join(rDir, length);
            if (!statSync(lDir).isDirectory()) continue;
            const files = readdirSync(lDir).filter(f => f.endsWith(".txt"));
            totalFiles += files.length;
            if (files.length === 0) emptyDirs++;
          }
        }
      }
    }

    expect(emptyDirs).toBe(0);
    expect(totalFiles).toBeGreaterThan(0);
  });

  test("prompt files are non-empty and contain text", () => {
    if (!existsSync(PROMPTS_ROOT)) {
      test.skip();
      return;
    }

    let checked = 0;
    for (const lang of EXPECTED_LANGUAGES) {
      for (const formality of EXPECTED_FORMALITIES) {
        const dir = join(PROMPTS_ROOT, lang, formality, "regular", "medium");
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir)
          .filter(f => f.endsWith(".txt"))
          .slice(0, 2);
        for (const file of files) {
          const content = readFileSync(join(dir, file), "utf-8");
          expect(content.trim().length).toBeGreaterThan(10);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  test("has at least 1000 total prompt files", () => {
    if (!existsSync(PROMPTS_ROOT)) {
      test.skip();
      return;
    }

    let total = 0;
    const countRecursive = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          countRecursive(full);
        } else if (entry.endsWith(".txt")) {
          total++;
        }
      }
    };
    countRecursive(PROMPTS_ROOT);
    expect(total).toBeGreaterThanOrEqual(1000);
  });
});
