import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_GROUP_PREFERENCES,
} from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";

// ── Paths ──────────────────────────────────────────────────────────────

export const PROMPTS_ROOT = join(
  process.cwd(),
  ".tmp",
  "input-mocks",
  "prompts",
);

export const corpusExists = existsSync(PROMPTS_ROOT);

// ── Engine ─────────────────────────────────────────────────────────────

export const engine = new MaskingEngine();

export const groupPrefs = DEFAULT_GROUP_PREFERENCES;

export const prefs = {
  ...DEFAULT_ADVANCED_PREFERENCES,
  maskingStrategy: "tags" as const,
};

export const SCAN_DATE = "2026-03-29T00:00:00.000Z";

// ── Scopes ─────────────────────────────────────────────────────────────

export const SCOPES: Record<
  string,
  ReturnType<typeof buildScanScopeSelection>
> = {
  en: buildScanScopeSelection(["us"], "selected-plus-global"),
  "pt-br": buildScanScopeSelection(["br"], "selected-plus-global"),
  es: buildScanScopeSelection(["es", "latam-es"], "selected-plus-global"),
  zh: buildScanScopeSelection(["cn"], "selected-plus-global"),
};

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
    .sort();
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

// ── Shared test body ───────────────────────────────────────────────────

/**
 * Runs the standard PII-detection assertion loop for a set of roles
 * under a given language and formality.
 */
export function runRoleFormality(
  lang: (typeof LANGUAGES)[number],
  formality: (typeof FORMALITIES)[number],
  roles: readonly string[],
): void {
  const scope = SCOPES[lang];

  for (const role of roles) {
    for (const length of LENGTHS) {
      const files = readPromptFiles(lang, formality, role, length);
      if (files.length === 0) continue;

      it(`${role}/${length} — detects PII in ${files.length} prompts`, () => {
        let totalMatches = 0;
        let maskedCount = 0;

        for (const file of files) {
          const text = readPromptFile(lang, formality, role, length, file);
          const result = engine.scan(text, groupPrefs, scope, SCAN_DATE, prefs);

          totalMatches += result.matches.length;
          if (result.maskedText !== text) maskedCount++;
        }

        expect(totalMatches).toBeGreaterThan(0);
        expect(maskedCount).toBeGreaterThan(0);
      });
    }
  }
}
