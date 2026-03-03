import { MaskingEngine } from "./masking.engine";
import {
  FUZZY_LABEL_FUZZ_NEGATIVE_FIXTURES,
  FUZZY_LABEL_FUZZ_POSITIVE_FIXTURES,
} from "../../testing/constants/fuzzy-label-fuzz.constants";
import {
  assertNegativeFixture,
  assertPositiveFixture,
} from "../../testing/utils/masking-engine-assertions.utils";

describe("MaskingEngine fuzzy label fuzz corpus", () => {
  const engine = new MaskingEngine();

  describe("positive noisy label corpus", () => {
    for (const fixture of FUZZY_LABEL_FUZZ_POSITIVE_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("negative noisy label corpus", () => {
    for (const fixture of FUZZY_LABEL_FUZZ_NEGATIVE_FIXTURES) {
      it(fixture.description, () => {
        assertNegativeFixture(engine, fixture);
      });
    }
  });
});
