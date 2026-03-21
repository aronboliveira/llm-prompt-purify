# Report Validation — Copilot & Gemini

## 1. Copilot Vulnerability Report (`reports/copilot/vulnerability-report.md`)

### Verified Claims

| Claim               | Status      | Evidence                                      |
| ------------------- | ----------- | --------------------------------------------- |
| 9,772 items tested  | **Correct** | `len(data) == 9772` in JSON                   |
| 7,366 passed        | **Correct** | `sum(d['success'] for d in data) == 7366`     |
| 2,406 leaked        | **Correct** | `sum(not d['success'] for d in data) == 2406` |
| 0 errors            | **Correct** | No error entries in JSON                      |
| 75.38% pass rate    | **Correct** | `7366/9772 = 0.75377`                         |
| By-locale breakdown | **Correct** | All 12 scope rows verified against JSON       |
| By-strategy totals  | **Correct** | faker/random/redacted/tags splits confirmed   |

### Categorization Errors

The report's "Detected Vulnerabilities" section has **significant
misclassification** caused by the `categorizeLeak()` function in
`mock-corpus-browselite.spec.ts` (line 407). The function applies regex
tests in order without anchoring, causing cascade mismatches:

#### Error 1: Chinese IDs classified as "Brazilian CPFs"

The CPF test (`/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/`) runs before the Chinese
ID test (`/\d{17}[\dX]/`). An 18-digit Chinese ID like `440301199203239392`
contains a subsequence matching the CPF regex (`440.301.199-20`), so all
**470 Chinese IDs** are categorized as CPFs.

- Report says: 2,244 Brazilian CPFs
- Actual: 1,200 CPFs + 470 Chinese IDs + 574 IBANs

#### Error 2: IBANs classified as "Brazilian CPFs"

IBANs like `BR9700360305000010000000145C` contain digit sequences matching
the unanchored CPF regex (`970.036.030-50`). Since CPF is checked before
IBAN in the categorizer, **574 mock IBANs** are classified as CPFs.

#### Error 3: CURPs classified as "IBANs"

The IBAN test (`/[A-Z]{2}\d{2}[A-Z0-9]{11,}/`) without word boundaries
matches CURPs like `CADF850420HDFRRN08` starting at offset 2 (`DF850420...`).
IBAN is checked before CURP in the categorizer, so **22 CURPs** appear as
"IBANs" in the report.

#### Error 4: RFCs classified as "Credit Cards / Other Financial"

Mexican RFCs like `ROMC8505126A3` don't match any specific regex before
the fallthrough default, so **22 RFCs** are miscategorized.

#### Error 5: CUIT substrings inflate "Chilean RUTs"

Each CUIT value like `20-29530492-2` generates a substring `29530492-2`
that the RUT regex catches. Under `es|cl`, exactly **1,912 rut-dashed**
values equal the inner portions of 1,912 CUITs — pure test inflation.

### Corrected Categorization

| Report Category          | Report Count | Actual Composition                        |
| ------------------------ | -----------: | ----------------------------------------- |
| Chilean RUTs             |        2,836 | 490 rut + 2,186 rut-substrings + 160 misc |
| Brazilian CPFs           |        2,244 | 1,200 CPF + 470 CN-ID + 574 IBAN          |
| Argentine CUITs          |        2,106 | 2,106 CUIT (correct)                      |
| US SSNs                  |           80 | 80 SSN (correct)                          |
| Brazilian CNPJs          |           38 | 38 CNPJ (correct)                         |
| IBANs                    |           22 | 22 CURP (miscategorized)                  |
| Credit Cards / Financial |           22 | 22 RFC (miscategorized)                   |
| Bearer Tokens            |            4 | 4 literal "Bearer token" text             |

---

## 2. Gemini Addendum Report (`reports/gemini/00-vulnerability-analysis-addendum.md`)

### Assessment

The Gemini addendum provides **qualitative observations** rather than
data-driven analysis. It correctly identifies:

- Test extractor has incomplete regex coverage (confirmed)
- Luhn check gaps (partially confirmed — only applied to credit cards)
- Limited cross-scope testing (confirmed)
- Gaps in country-specific rules (confirmed — Chinese ID standalone missing)
- Mock data variety limitations (confirmed)

However, the report lacks:

- Specific counts or data from the JSON results
- Concrete identification of which rules are affected
- Quantified impact per issue category
- Any original analysis beyond restating general concerns

**Verdict**: Sound directional observations but no independent data
analysis. All claims are generic and unfalsifiable without specifics.

### Playwright Results (`reports/gemini/playwright-results.log`)

Confirms: 18 tests passed in 1.6h, 1 worker, 9772 items processed.
This is consistent with the Copilot report. No discrepancies.

---

## 3. Copilot Solutions (`solutions/copilot/`)

### 00-overview.md — Strategy

| Claim                                         | Status           | Notes                                 |
| --------------------------------------------- | ---------------- | ------------------------------------- |
| 3-category taxonomy (A/B/C)                   | **Valid**        | Breakdown percentages need correction |
| Category A ~600 (25%)                         | **Undercounted** | Actual cross-scope: 3,408 (46.3%)     |
| Category B ~1,480 (61%)                       | **Overcounted**  | Actual engine gap: 470 (6.4%)         |
| Category C ~326 (14%)                         | **Undercounted** | Actual test inflation: 2,662 (36.2%)  |
| SSN → promote to global                       | **Valid**        | Both agree                            |
| Global labeled variants for CPF/CUIT/CNPJ/RUT | **Valid**        | Sound approach                        |
| Auto-expand latam-es                          | **Valid**        | Both agree                            |
| Add standalone Chinese ID rule                | **Valid**        | The only real engine bug              |

### 01-cross-scope-gaps.md

| Fix Proposed                          | Status    | Notes                                                            |
| ------------------------------------- | --------- | ---------------------------------------------------------------- |
| SSN → global coverage                 | **Valid** | 3-2-4 dash pattern is distinctive; validator blocks 000/666/900+ |
| CPF global labeled variant            | **Valid** | Requires keyword context — zero FP risk                          |
| CUIT global labeled + latam-es expand | **Valid** | Two-pronged approach is correct                                  |
| RUT global labeled variant            | **Valid** | Checksum validator prevents FP                                   |
| CNPJ global labeled variant           | **Valid** | Same pattern as CPF labeled                                      |

### 02-in-scope-pattern-fixes.md

| Claim                                    | Valid?        | Notes                                                       |
| ---------------------------------------- | ------------- | ----------------------------------------------------------- |
| RUT under cl: test misattribution        | **Partially** | Mix of CUIT substrings (inflation) + checksum-invalid mocks |
| Chinese IDs under cn: missing standalone | **Yes**       | Only real engine bug — confirmed by code inspection         |
| CPF under br (18): mock data quality     | **Yes**       | `isValidCpf` correctly rejects invalid check digits         |
| CNPJ under br (18): mock data quality    | **Yes**       | `isValidCnpj` correctly rejects                             |
| CUIT under ar (34): mock data quality    | **Yes**       | `isValidArgentineCuit` correctly rejects                    |

### 03-test-false-positives.md

| Claim                            | Valid?        | Correction                                                                                                                                                                       |
| -------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 574 CURPs misclassified as IBANs | **Wrong**     | CURPs don't match IBAN regex (`\d{2}` fails on letters). The 574 are real mock IBANs with invalid mod-97 checksums. In the _categorizer_, 22 CURPs match IBAN regex at offset 2. |
| Bearer literal (4 FPs)           | **Yes**       | "Bearer token" literal text matches test regex                                                                                                                                   |
| RUT checksum in test (458 FPs)   | **Yes**       | pt-br                                                                                                                                                                            | br RG numbers match RUT regex without validation |
| CPF substring from CUITs         | **Partially** | Confirmed overlap inflation, but substrings are rut-dashed (1912), not CPFs                                                                                                      |
| De-duplicate substrings          | **Yes**       | Would eliminate much of the 2,186 rut-dashed inflation                                                                                                                           |

### 04-implementation-plan.md

Well-structured 5-phase plan. Phase ordering is sound. Code examples are
correct. The only error inherited from doc 03 is the CURP/IBAN claim.

---

## 4. Gemini Solutions (`solutions/gemini/`)

### 00-overview.md

- Same 3-category taxonomy as Copilot (independently derived)
- Claims "~2,050 leaks resolved" by engine fixes + "~1,500" by scope
  management — these overlap (double-counting)
- Overall approach is sound but less specific than Copilot's

### 01-vulnerability-analysis.md

- Per-type analysis is correct in direction but uses Copilot report's
  miscategorized counts without independent verification
- Correctly identifies all major issue categories

### 02-solution-strategy.md

- "Three-layer" approach (test→engine→scope) is well-reasoned
- Layer ordering (fix tests first, then engine, then scope) is pragmatically
  optimal — Copilot proposed the reverse (engine first)
- Both orderings are defensible; Gemini's "trust the metrics first" argument
  is stronger for iterative development

### 03-implementation-plan.md

- Code examples mirror Copilot's (identical patterns and function signatures)
- Missing: explicit IBAN checksum analysis, rut-dashed inflation detail,
  categorizeLeak fix
- Phase 4 (mock data regeneration) is correctly positioned as optional

---

## 5. Cross-Report Agreement Matrix

| Topic                             | Copilot | Gemini | Merged Verdict        |
| --------------------------------- | :-----: | :----: | --------------------- |
| SSN → global                      |    ✓    |   ✓    | **Adopt**             |
| Standalone cn-resident-id rule    |    ✓    |   ✓    | **Adopt**             |
| latam-es auto-expansion           |    ✓    |   ✓    | **Adopt**             |
| Global labeled variants           |    ✓    |   ✓    | **Adopt**             |
| Test RUT checksum validation      |    ✓    |   ✓    | **Adopt**             |
| Bearer min-length                 |    ✓    |   ✓    | **Adopt**             |
| De-duplicate substrings           |    ✓    |   ✓    | **Adopt**             |
| CURP/IBAN exclusion in test       |   ✓\*   |  ✓\*   | **Adopt (corrected)** |
| Fix categorizeLeak ordering       |    ✗    |   ✗    | **Add — both missed** |
| IBAN mock data = checksum-invalid |    ✗    |   ✗    | **Add — both missed** |
| Fix phase ordering                |   E→T   |  T→E   | **Gemini preferred**  |

\* Both incorrectly described the CURP/IBAN issue; the actual fix targets
the categorizer's anchor-free regex ordering, plus test IBAN checksum.
