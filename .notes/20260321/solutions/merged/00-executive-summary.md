# Merged Vulnerability Analysis — Executive Summary

**Date**: 2026-03-21  
**Sources**: Copilot corpus report + Gemini addendum  
**Corpus**: 9,772 items | 7,366 passed | 2,406 leaked | 0 errors  
**Reported pass rate**: 75.38%

## Key Finding

The reported 2,406 failed items produced 7,352 individual leak values.
Independent reclassification reveals that **only 3,878 (52.7%) represent
real problems** — the rest are test infrastructure noise or mock data
artifacts.

| Root Cause                | Count | % of 7,352 | Actionable?              |
| ------------------------- | ----: | :--------- | ------------------------ |
| Cross-scope gaps          | 3,408 | 46.3%      | Yes — engine changes     |
| Engine bug (missing rule) |   470 | 6.4%       | Yes — add 1 rule         |
| Test inflation / FP       | 2,662 | 36.2%      | Yes — fix test extractor |
| Mock data quality         |   662 | 9.0%       | Optional — regen corpus  |
| Unclassified residual     |   150 | 2.0%       | Low priority             |

**Corrected pass rate** (excluding test FP + mock data):

- Real leaked values: 3,878 across 2,406 items
- After engine fixes: estimated **~97–99%** pass rate

## Accuracy of Source Reports

Both reports (Copilot, Gemini) correctly identified the 3-category taxonomy
and proposed the same core fixes. However, both contain categorization
errors inherited from the test's `categorizeLeak` function:

| Claim                             | Status    | Correction                                         |
| --------------------------------- | --------- | -------------------------------------------------- |
| 2,836 "Chilean RUTs" leaked       | Inflated  | 490 real RUTs + 2,186 CUIT substrings + 160 misc   |
| 2,244 "Brazilian CPFs" leaked     | Inflated  | 1,200 real CPFs + 470 CN IDs + 574 IBANs miscat.   |
| "574 CURPs misclassified as IBAN" | **Wrong** | 0 CURP↔IBAN overlap; 574 are real mock IBANs       |
| 22 "IBANs" in report              | Miscat.   | Actually 22 CURPs (categorizer order bug)          |
| 22 "Credit Cards"                 | Miscat.   | Actually 22 Mexican RFCs (categorizer fallthrough) |
| Chinese IDs not mentioned         | Omission  | 470 CN IDs miscategorized as CPFs in the report    |

See [01-report-validation.md](01-report-validation.md) for full analysis.

## Agreed Fixes (Both Reports Converge)

1. **Promote US SSN to `coverage: "global"`** — resolves 80 cross-scope leaks
2. **Add standalone `cn-resident-id` rule** — resolves 470 in-scope leaks
3. **Auto-expand `latam-es`** when any LatAm country selected — resolves ~2,200+ cross-scope leaks
4. **Add global labeled variants** (CPF, CNPJ, CUIT, RUT) — catches remaining labeled cross-scope instances
5. **Fix test `extractSensitiveValues`** — eliminates 2,662 false/inflated reports
6. **Fix test `categorizeLeak`** — corrects report categorization bugs

## Document Index

| File                                                         | Format | Purpose                              |
| ------------------------------------------------------------ | ------ | ------------------------------------ |
| [00-executive-summary.md](00-executive-summary.md)           | md     | This file — overview & decisions     |
| [01-report-validation.md](01-report-validation.md)           | md     | Validity assessment of both reports  |
| [02-root-cause-analysis.md](02-root-cause-analysis.md)       | md     | Definitive 7,352-value breakdown     |
| [03-engine-fixes.md](03-engine-fixes.md)                     | md     | Masking engine code changes          |
| [04-test-fixes.md](04-test-fixes.md)                         | md     | Test infrastructure code changes     |
| [05-implementation-roadmap.md](05-implementation-roadmap.md) | md     | Phased rollout plan                  |
| [leak-classification.json](leak-classification.json)         | json   | Machine-readable leak classification |
| [report-discrepancies.yml](report-discrepancies.yml)         | yml    | Structured diff: Copilot vs Gemini   |
| [audit-evidence.log](audit-evidence.log)                     | log    | Raw evidence from JSON analysis      |
