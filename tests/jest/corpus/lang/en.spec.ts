import {
  ALL_ROLES,
  FORMALITIES,
  corpusExists,
  runRoleFormality,
} from "../_helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("lang: en", () => {
  for (const formality of FORMALITIES) {
    describe(`${formality}`, () => {
      runRoleFormality("en", formality, ALL_ROLES);
    });
  }
});
