# Fuzzy Label Matching Log

Date: 2026-03-03

Decision:

- Added `fuse.js` as a narrow enhancement for typo-tolerant label matching.
- Limited the fuzzy layer to delimiter-based inputs such as `label: value` or `label=value`.
- Kept regexes and existing validators as the primary detection path.

Why this scope:

- Fuzzy matching helps with user typos like `Passwrod`, `Adress`, `Cedla`, `Aadhr`, or misspelled long-form identifier labels.
- It would be too risky to apply fuzzy logic directly to raw identifiers, cards, tokens, or free prose.
- Boundary safety is preserved by requiring a valid-looking value after the fuzzy label match.

Implementation shape:

- Fuzzy label specs live in `src/app/core/masking/constants/fuzzy-label.constants.ts`.
- The Fuse-backed collector lives in `src/app/core/masking/utils/fuzzy-label.utils.ts`.
- The masking engine merges regex candidates with fuzzy-label candidates before overlap resolution.
- Regression tests cover both typo-positive and typo-negative scenarios.

Validation:

- `npm run test -- --runInBand`
- `npm run build`
