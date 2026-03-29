import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "./constants/masking.constants";
import { MaskingEngine } from "./masking.engine";
import { buildScanScopeSelection } from "./utils/country-scope.utils";

const PROMPTS_ROOT = join(process.cwd(), ".tmp", "input-mocks", "prompts");

const SCOPES: Record<string, ReturnType<typeof buildScanScopeSelection>> = {
  en: buildScanScopeSelection(["us"], "selected-plus-global"),
  "pt-br": buildScanScopeSelection(["br"], "selected-plus-global"),
  es: buildScanScopeSelection(["es", "latam-es"], "selected-plus-global"),
  zh: buildScanScopeSelection(["cn"], "selected-plus-global"),
};

const LANGUAGES = ["en", "pt-br", "es", "zh"] as const;
const FORMALITIES = ["formal", "neutral", "informal"] as const;
const ROLES = [
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
const LENGTHS = ["short", "medium", "long"] as const;

function readPromptFiles(
  lang: string,
  formality: string,
  role: string,
  length: string,
): readonly string[] {
  const dir = join(PROMPTS_ROOT, lang, formality, role, length);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".txt"))
    .sort();
}

function readPromptFile(
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

const corpusExists = existsSync(PROMPTS_ROOT);

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("MaskingEngine prompt-mocks corpus", () => {
  const engine = new MaskingEngine();
  const prefs = {
    ...DEFAULT_ADVANCED_PREFERENCES,
    maskingStrategy: "tags" as const,
  };

  for (const lang of LANGUAGES) {
    describe(`[${lang}]`, () => {
      const scope = SCOPES[lang];

      for (const formality of FORMALITIES) {
        describe(`${formality}`, () => {
          for (const role of ROLES) {
            for (const length of LENGTHS) {
              const files = readPromptFiles(lang, formality, role, length);
              if (files.length === 0) continue;

              it(`${role}/${length} — detects PII in ${files.length} prompts`, () => {
                let totalMatches = 0;
                let maskedCount = 0;

                for (const file of files) {
                  const text = readPromptFile(
                    lang,
                    formality,
                    role,
                    length,
                    file,
                  );
                  const result = engine.scan(
                    text,
                    DEFAULT_GROUP_PREFERENCES,
                    scope,
                    "2026-03-29T00:00:00.000Z",
                    prefs,
                  );

                  totalMatches += result.matches.length;
                  if (result.maskedText !== text) maskedCount++;
                }

                expect(totalMatches).toBeGreaterThan(0);
                expect(maskedCount).toBeGreaterThan(0);
              });
            }
          }
        });
      }
    });
  }
});
