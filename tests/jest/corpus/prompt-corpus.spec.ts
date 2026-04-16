import {
  ALL_ROLES,
  FORMALITIES,
  LANGUAGES,
  SCOPES,
  corpusExists,
  engine,
  groupPrefs,
  prefs,
  readPromptFile,
  readPromptFiles,
} from "./_helpers";

const LENGTHS = ["short", "medium", "long"] as const;

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("MaskingEngine prompt-mocks corpus", () => {
  it("corpus is available", () => {
    expect(corpusExists).toBe(true);
  });

  for (const lang of LANGUAGES) {
    describe(`[${lang}]`, () => {
      const scope = SCOPES[lang];

      for (const formality of FORMALITIES) {
        describe(`${formality}`, () => {
          for (const role of ALL_ROLES) {
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
                    groupPrefs,
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
