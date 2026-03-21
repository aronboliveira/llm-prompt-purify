# Category B: In-Scope Pattern Gaps

## Problem Summary

The correct country scope is active but certain values still leak through.
This means the regex matched, but either:

- The **validator rejected** the value (checksum/structural failure)
- The rule is **label-only** and the value appears standalone
- The regex itself **doesn't cover** a format variant

## Affected Patterns

### 1. Chilean RUTs under cl scope — 2,048 leaks

**Scope**: `es|cl` (chile-rut rule IS active)

**Analysis**: The mock corpus contains mixed LatAm content. The **test
extractor's** RUT regex `\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b` matches values
that the engine's `isValidChileanRut` validator correctly rejects (invalid
check digit). These are primarily:

- **CPF-like fragments** (`20126535342` → 11 digits, test reads the last 9 as
  RUT-like) — this is a **test false positive** (see doc 03)
- **Values where check digit doesn't verify** — the engine is right to reject

**Evidence**: The engine uses `isValidChileanRut` which computes a mod-11
checksum. Values like `29530492-2` may fail the checksum for their specific
body digits. The 2,048 leaks under cl scope are largely **test misattribution**
rather than real engine failures.

**Recommendation**: Primarily a **test fix** (doc 03). The engine behavior is
correct — it validates check digits and rejects invalid RUTs.

However, audit whether the mock corpus intentionally generates
checksum-valid RUTs. If the mocks use random digits, many will fail validation
by design. Consider regenerating the `es` mock corpus with
checksum-valid identifiers.

### 2. Chinese IDs under cn scope — 470 leaks

**Scope**: `zh|cn` (cn-resident-id rules ARE active)

**Analysis**: The cn-resident-id rules are ALL label/JSON/quote-context only:

- `cn-resident-id-labeled` — requires label like "身份证号"
- `cn-resident-id-json` — requires JSON key context
- `cn-resident-id-quoted` — requires surrounding quotes

The mock data contains standalone 18-digit Chinese IDs:

```
负责人身份证: 440301199203239392
身份证号: 330102199708060734
```

The first line HAS a label ("负责人身份证") so it SHOULD match via the labeled
rule. The leak suggests either:

1. The label pattern's keyword list doesn't include "负责人身份证" (it may
   only match "身份证号" and not compound variants like "负责人身份证")
2. The label delimiter regex doesn't handle Chinese colon `:` (U+FF1A) vs `:`

**Recommendation**: **Two fixes**

**a) Add standalone Chinese ID rule (new)**

```typescript
{
  id: "cn-resident-id",
  category: "identifier",
  countryProfileIds: ["cn"],
  coverage: "country",
  confidence: "high",
  label: "Chinese resident ID (standalone)",
  locale: "zh-CN",
  patternFactory: () => /\b\d{17}[\dXx]\b/gu,
  priority: 112,
  validator: isValidChineseResidentId,
}
```

The checksum validator is strong enough (mod-11 with 17 weights) to prevent
false positives. This matches the approach used for CPF/CNPJ which have both
standalone and labeled rules.

**b) Expand label keyword list**

Check `CN_RESIDENT_ID_LABEL_FLAGS` and ensure it includes:

- `负责人身份证` (responsible person's ID)
- `居民身份证` (resident ID card)
- `身份证号码` (ID card number — full form)
- Handle both `:` (U+003A) and `：` (U+FF1A) delimiters

### 3. Brazilian CPFs under br scope — 18 leaks

**Scope**: `pt-br|br` (cpf rule IS active)

**Analysis**: Only 18 leaks out of 2,482 items (0.7% failure rate). The
`isValidCpf` validator uses the official mod-11 algorithm with two check
digits. These 18 values are CPF-formatted numbers that fail checksum
verification.

Sample values:

- `456.789.123-45` — check digits don't verify for body 456789123
- `111.222.333-44` — check digits don't verify for body 111222333

**Recommendation**: **No engine change needed**

These are mock-data artifacts. The generator created CPF-formatted numbers
with random digits that don't pass the official checksum. The engine is
correct to reject them.

**Action**: Regenerate mock CPF data with checksum-valid values, or accept
that the test will always have a small false-positive count from invalid
mock data. The `isValidCpf` validator is working as intended.

### 4. Brazilian CNPJs under br scope — 18 leaks

**Scope**: `pt-br|br` (cnpj rule IS active)

Same situation as CPFs — mock-generated CNPJ numbers that fail checksum.

Sample values:

- `12.345.678/0001-90` — check digits fail for body 12345678000
- `98.765.432/0001-10` — check digits fail

**Recommendation**: Same as CPFs — **mock data quality issue**, not an
engine bug. The `isValidCnpj` validator is working correctly.

### 5. Argentine CUITs under ar scope — 34 leaks

**Scope**: `es|ar` (cuit rule IS active via `latam-es`)

The 34 values that leak are CUITs matching `\b\d{2}-\d{8}-\d\b` where the
check digit doesn't verify via `isValidArgentineCuit`. Same mock-data quality
issue.

**Recommendation**: Regenerate mock data with checksum-valid CUITs, or
accept as known test artifact.

## Summary

| Issue                       | Real Engine Bug?                                 | Fix Needed?                  | Fix Where?                 |
| --------------------------- | ------------------------------------------------ | ---------------------------- | -------------------------- |
| RUTs under cl scope (2,048) | **No** — test misattribution + validator correct | Test fix                     | doc 03                     |
| Chinese IDs under cn (470)  | **Yes** — missing standalone rule                | **Add rule**                 | masking-rules.constants.ts |
| CPFs under br (18)          | **No** — checksum-invalid mock data              | Mock regeneration (optional) | Mock corpus                |
| CNPJs under br (18)         | **No** — checksum-invalid mock data              | Mock regeneration (optional) | Mock corpus                |
| CUITs under ar (34)         | **No** — checksum-invalid mock data              | Mock regeneration (optional) | Mock corpus                |

**Only one real engine bug**: Missing standalone Chinese ID rule.
Everything else is either correct validator behavior or test pattern issues.
