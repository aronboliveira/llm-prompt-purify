import {
  ALL_ROLES,
  FORMALITIES,
  corpusExists,
  runRoleFormality,
} from "../_helpers";

const describeIfCorpus = corpusExists ? describe : describe.skip;

describeIfCorpus("lang: es", () => {
  for (const formality of FORMALITIES) {
    describe(`${formality}`, () => {
      runRoleFormality("es", formality, ALL_ROLES);
    });
  }
});
