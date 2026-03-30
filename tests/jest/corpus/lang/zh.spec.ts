import {
  ALL_ROLES,
  FORMALITIES,
  corpusExists,
  runRoleFormality,
} from "../_helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("lang: zh", () => {
  for (const formality of FORMALITIES) {
    describe(`${formality}`, () => {
      runRoleFormality("zh", formality, ALL_ROLES);
    });
  }
});
