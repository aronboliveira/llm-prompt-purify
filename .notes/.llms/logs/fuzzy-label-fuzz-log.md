# Fuzzy Label Fuzz Expansion

Date: 2026-03-03

This pass expanded the narrow Fuse.js layer with additional OCR-like and transliteration-safe aliases for label-driven rules that already depend on strong value patterns or validators. The matcher still only operates on `label: value` or `label=value` lines, so the broader alias set does not turn on fuzzy scanning for free prose or unlabeled raw identifiers.

The catalog now covers extra noisy-label paths for shared credentials and contact labels plus country-specific identifiers across Portugal, Spain, Peru, China, Russia, and India. New examples include `contrasenia`, spaced and attached `shenfenzheng` pinyin forms, long-form RUC/GSTIN variants, Portuguese fiscal/social labels with `m -> rn` OCR confusion, and short Russian `SNILS` variants such as `sni1s`.

Testing was expanded with a deterministic generated corpus instead of random fuzzing. The new corpus builds positive noisy-label fixtures and negative boundary fixtures from explicit mutation recipes, then verifies that:

- close label mutations still mask valid sensitive values
- the same noisy labels do not mask invalid values
- distant labels do not activate the rule even when the value looks valid

Validation after the expansion:

- `npm run test -- --runInBand`: 11 suites passed, 279 tests passed
- `npm run build`: passed
