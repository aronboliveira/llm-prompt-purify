# Root Cause Analysis — Definitive Breakdown

Based on independent reclassification of all 7,352 leak values from the
raw `vulnerability-results.json`, using anchored regex patterns and
cross-referencing against engine rule definitions.

Machine-readable version: [leak-classification.json](leak-classification.json)  
Raw evidence: [audit-evidence.log](audit-evidence.log)

## Classification Method

Each of the 7,352 `"leak: <value>"` strings was classified by:

1. **Type**: Anchored regex matching the value's exact format
2. **Root cause**: Cross-referencing type + tested scope against the
   engine's rule `coverage` and `countryProfileIds` fields

## Type Distribution

| Type            | Count | Format                             | Example                  |
| --------------- | ----: | ---------------------------------- | ------------------------ |
| rut-dashed      | 2,186 | `DDDDDDDD-D`                       | `29530492-2`             |
| cuit            | 2,106 | `DD-DDDDDDDD-D`                    | `20-29530492-2`          |
| cpf-unformatted | 1,142 | `DDDDDDDDDDD` (11 digits)          | `20126535342`            |
| iban            |   574 | `AA99XXXXXXXXXXX...` (14-34 chars) | `GB89BANK95431514479519` |
| rut-dotted      |   490 | `D.DDD.DDD-D` or `DD.DDD.DDD-D`    | `71.245.512-3`           |
| cn-resident-id  |   470 | `DDDDDDDDDDDDDDDDDX` (18 chars)    | `440301199203239392`     |
| rut-compact     |    94 | `DDDDDDDDK`                        | `12348054K`              |
| us-ssn          |    80 | `DDD-DD-DDDD`                      | `614-30-9184`            |
| cpf-formatted   |    58 | `DDD.DDD.DDD-DD`                   | `456.789.123-45`         |
| cnpj            |    38 | `DD.DDD.DDD/DDDD-DD`               | `12.345.678/0001-90`     |
| numeric-8digit  |    34 | `DDDDDDDD`                         | `12345678`               |
| curp            |    22 | `AAAA999999AAAAAA99`               | `CADF850420HDFRRN08`     |
| rfc             |    22 | `AAA(A)999999AAA`                  | `ROMC8505126A3`          |
| bearer-literal  |     4 | `Bearer token`                     | `Bearer token`           |
| other           |    32 | misc                               | —                        |

## Root Cause Distribution

| Root Cause                           | Count | % of 7,352 |
| ------------------------------------ | ----: | ---------: |
| **Cross-scope: rule not active**     | 3,328 |      45.3% |
| **Test inflation: CUIT substring**   | 2,186 |      29.7% |
| **Mock data: IBAN checksum invalid** |   574 |       7.8% |
| **Engine gap: missing standalone**   |   470 |       6.4% |
| **Test FP: RG matches RUT regex**    |   472 |       6.4% |
| **Cross-scope: SSN country-scoped**  |    80 |       1.1% |
| **Mock data: RUT checksum invalid**  |    18 |       0.2% |
| **Mock data: CPF checksum invalid**  |    18 |       0.2% |
| **Mock data: CNPJ checksum invalid** |    18 |       0.2% |
| **Mock data: CUIT checksum invalid** |    34 |       0.5% |
| **Test FP: Bearer literal**          |     4 |       0.1% |
| **Unclassified**                     |   150 |       2.0% |

## Detailed Analysis by Root Cause

### A. Cross-Scope Gaps (3,408 values, 46.3%)

Values from country Y present in the text but the user selected country X.
The engine's rule for country Y has `coverage: "country"` and won't fire.

**Breakdown by identifier type:**

| Type            | Count | Rule's countryProfileIds | Scopes where leaked    |
| --------------- | ----: | ------------------------ | ---------------------- |
| cuit            | 2,072 | `["ar", "latam-es"]`     | cl, co, es, mx, pe     |
| cpf-unformatted | 1,142 | `["br"]`                 | cl, ar, co, es, mx, pe |
| us-ssn          |    80 | `["us"]`                 | in, ru                 |
| cpf-formatted   |    40 | `["br"]`                 | pt                     |
| rut-dotted      |    14 | `["cl", "latam-es"]`     | pt                     |
| cnpj            |    20 | `["br"]`                 | pt                     |
| curp            |    22 | `["mx", "latam-es"]`     | cl                     |
| rfc             |    22 | `["mx", "latam-es"]`     | cl                     |

**Key insight**: The es-locale mock corpus contains mixed LatAm identifiers
(CUITs, CPFs, CURPs, RFCs, RUTs). When tested under a single country scope
like `cl`, only rules with `"cl"` in countryProfileIds fire. Rules needing
`"ar"`, `"mx"`, or `"br"` are inactive even though the data is LatAm-wide.

### B. Engine Gap (470 values, 6.4%)

Only ONE genuine engine bug exists: **standalone Chinese resident IDs** are
not masked when tested under `cn` scope.

The engine has 3 cn-resident-id rules — all require context:

- `cn-resident-id-labeled`: needs keyword like `身份证号`
- `cn-resident-id-json`: needs JSON key context
- `cn-resident-id-quoted`: needs surrounding quotes

Standalone 18-digit values like `440301199203239392` in flowing text match
none of these. The `isValidChineseResidentId` validator (mod-11/17-weight
checksum) exists and works — it simply lacks a standalone rule to invoke it.

### C. Test Inflation (2,662 values, 36.2%)

#### C.1 CUIT substring inflation (2,186)

Each CUIT like `20-29530492-2` generates a substring `29530492-2` that the
test extractor's RUT regex catches separately (no word boundary filtering).
Under `es|cl`, exactly 1,912 rut-dashed values equal the inner 8+1 portions
of 1,912 CUITs — a 1:1 match confirming pure inflation.

Verified: `set(cuit[3:] for cuit in cl_cuits) == set(cl_rut_dash_values)`

#### C.2 RG/RUT format overlap (472)

Under `pt-br|br`, values like `71.245.512-3` match the test's RUT regex
but are Brazilian RG numbers (Registro Geral). The engine's RUT rule has
`isValidChileanRut` which correctly rejects these. The test extractor has
no checksum validation.

#### C.3 Bearer literal (4)

The phrase "Bearer token" in descriptive text matches the test's Bearer
regex `/Bearer\s+[A-Za-z0-9\-._~+/]+=*/` — the word "token" (5 chars)
matches the unrestricted character class.

### D. Mock Data Quality (662 values, 9.0%)

Values in the correct format but failing the engine's checksum validators:

| Type | Count | Validator               | Issue                         |
| ---- | ----: | ----------------------- | ----------------------------- |
| iban |   574 | `isLikelyIban` (mod-97) | Mock IBANs use `BANK` as BIC  |
| cuit |    34 | `isValidArgentineCuit`  | Random digits, bad check      |
| cpf  |    18 | `isValidCpf` (mod-11)   | Example: `456.789.123-45`     |
| cnpj |    18 | `isValidCnpj` (mod-11)  | Example: `12.345.678/0001-90` |
| rut  |    18 | `isValidChileanRut`     | Random body + invalid check   |

The engine is correct to reject these — they are not real identifiers.

### E. Unclassified (150 values, 2.0%)

Mostly 8-digit + K format values (`12348054K`) and plain 8-digit sequences
(`12345678`) that don't match any specific identifier format precisely.
Low priority for further investigation.

## Corrected Metrics

| Metric                    | Reported | Corrected   |
| ------------------------- | -------- | ----------- |
| Total leak values         | 7,352    | 7,352       |
| Real engine issues        | —        | 3,878       |
| Test artifacts            | —        | 2,662       |
| Mock data artifacts       | —        | 662         |
| Unclassified              | —        | 150         |
| Effective pass rate       | 75.38%   | ~87% (real) |
| After engine fixes (est.) | —        | ~97–99%     |
