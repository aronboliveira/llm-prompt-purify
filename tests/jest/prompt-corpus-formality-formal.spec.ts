import {
  LANGUAGES,
  ROLE_CLUSTERS,
  type ClusterName,
  corpusExists,
  runRoleFormality,
} from "./_prompt-corpus-helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("formality: formal × all clusters", () => {
  for (const lang of LANGUAGES) {
    describe(`[${lang}]`, () => {
      for (const cluster of Object.keys(ROLE_CLUSTERS) as ClusterName[]) {
        describe(`cluster:${cluster}`, () => {
          runRoleFormality(lang, "formal", ROLE_CLUSTERS[cluster]);
        });
      }
    });
  }
});
