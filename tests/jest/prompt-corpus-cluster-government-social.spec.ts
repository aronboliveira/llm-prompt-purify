import {
  FORMALITIES,
  LANGUAGES,
  ROLE_CLUSTERS,
  corpusExists,
  runRoleFormality,
} from "./_prompt-corpus-helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("cluster: government_social × formality", () => {
  const roles = ROLE_CLUSTERS.government_social;

  for (const lang of LANGUAGES) {
    describe(`[${lang}]`, () => {
      for (const formality of FORMALITIES) {
        describe(`${formality}`, () => {
          runRoleFormality(lang, formality, roles);
        });
      }
    });
  }
});
