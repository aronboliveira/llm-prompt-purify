import {
  ALL_ROLES,
  FORMALITIES,
  corpusExists,
  runRoleFormality,
} from "../_helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("lang: pt-br", () => {
  for (const formality of FORMALITIES) {
    describe(`${formality}`, () => {
      runRoleFormality("pt-br", formality, ALL_ROLES);
    });
  }
});
