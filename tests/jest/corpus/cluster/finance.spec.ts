import {
  FORMALITIES,
  LANGUAGES,
  ROLE_CLUSTERS,
  corpusExists,
  runRoleFormality,
} from "../_helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("cluster: finance × formality", () => {
  const roles = ROLE_CLUSTERS.finance;

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
