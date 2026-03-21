# Implementation Plan

## Priority Order

Changes are ordered by impact-to-effort ratio: highest impact, lowest risk first.

---

## Phase 1: Quick Wins (Low Risk, High Impact)

### 1.1 Promote US SSN to global coverage

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`
**Lines**: ~273-283

```diff
  {
    id: "us-ssn",
    category: "identifier",
-   countryProfileIds: ["us"],
-   coverage: "country",
+   coverage: "global",
    confidence: "high",
    label: "US SSN",
-   locale: "en-US",
+   locale: "shared",
    patternFactory: () => /\b\d{3}-\d{2}-\d{4}\b/g,
    priority: 116,
    validator: isValidUsSsn,
  },
```

Also update: `us-ssn-json`, `us-ssn-quoted`, `us-ssn-json-suffixed`

**Impact**: Resolves 80 cross-scope leaks | **Risk**: Negligible
**Tests affected**: Unit tests that assert `coverage: "country"` for US SSN

---

### 1.2 Add standalone Chinese resident ID rule

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`
**After**: `cn-resident-id-labeled` rule definition (~line 655)

```typescript
{
  category: "identifier",
  countryProfileIds: ["cn"],
  coverage: "country",
  confidence: "high",
  id: "cn-resident-id",
  label: "Chinese resident ID",
  locale: "zh-CN",
  patternFactory: () => /\b\d{17}[\dXx]\b/gu,
  priority: 113,
  validator: isValidChineseResidentId,
},
```

**Impact**: Resolves ~470 in-scope leaks | **Risk**: Low (checksum validator is strong)
**Tests**: Add unit test for standalone Chinese ID detection

---

## Phase 2: Regional Auto-Expansion (Medium Effort, High Impact)

### 2.1 Auto-include `latam-es` for LatAm country selections

**File**: `src/app/core/masking/utils/country-scope.utils.ts`

Add a scope expansion function that runs before rule filtering:

```typescript
const LATAM_COUNTRY_IDS = new Set(["ar", "br", "cl", "co", "mx", "pe"]);

export function expandCountryScope(selectedIds: readonly string[]): readonly string[] {
  const expanded = new Set(selectedIds);
  for (const id of selectedIds) {
    if (LATAM_COUNTRY_IDS.has(id)) {
      expanded.add("latam-es");
      break;
    }
  }
  return [...expanded];
}
```

**Integration point**: Call `expandCountryScope` in the masking engine
before passing `countryProfileIds` to `isRuleEnabledForScope`.

**File**: `src/app/core/masking/masking.engine.ts` (or wherever
`filterRulesForScope` is called)

```diff
+ import { expandCountryScope } from "../utils/country-scope.utils";

  const scopeSelection: ScanScopeSelection = {
    detectionMode,
-   countryProfileIds: selectedCountries,
+   countryProfileIds: expandCountryScope(selectedCountries),
  };
```

**Impact**: Resolves ~1,500 LatAm cross-scope leaks at once
**Risk**: Low — all LatAm rules already have validators
**Tests**: Test that selecting "cl" also activates CUIT, CURP, etc.

---

## Phase 3: Global Labeled Variants (Medium Effort, Medium Impact)

### 3.1 Add labeled global rules

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`

Add these rules (each requires keyword context, so zero false-positive risk):

```typescript
// CPF — global labeled
{
  category: "identifier",
  coverage: "global",
  confidence: "high",
  id: "cpf-global-labeled",
  label: "CPF (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cpf|cadastro\s+de?\s+pessoa)\b[^\n\r\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu,
  priority: 109,
  validator: isValidCpf,
  valueGroup: 1,
},

// CNPJ — global labeled
{
  category: "identifier",
  coverage: "global",
  confidence: "high",
  id: "cnpj-global-labeled",
  label: "CNPJ (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cnpj|cadastro\s+nacional)\b[^\n\r\d]{0,12}(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/giu,
  priority: 109,
  validator: isValidCnpj,
  valueGroup: 1,
},

// CUIT — global labeled
{
  category: "identifier",
  coverage: "global",
  confidence: "high",
  id: "cuit-global-labeled",
  label: "Argentine CUIT (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cuit|cuil|clave\s+[uú]nica)\b[^\n\r\d]{0,12}(\d{2}-\d{8}-\d)\b/giu,
  priority: 109,
  validator: isValidArgentineCuit,
  valueGroup: 1,
},

// RUT — global labeled
{
  category: "identifier",
  coverage: "global",
  confidence: "medium",
  id: "rut-global-labeled",
  label: "Chilean RUT (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:rut|rut\s+chileno|rut\s+empresa|n[uú]mero\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
  priority: 109,
  validator: isValidChileanRut,
  valueGroup: 1,
},
```

**Impact**: Catches labeled cross-scope instances (~200 est.)
**Risk**: Zero — all require keyword prefix + checksum validator

---

## Phase 4: Fix Test Extractor (No Engine Change)

### 4.1 Improve test's `extractSensitiveValues`

**File**: `tests/e2e/mock-corpus-browselite.spec.ts`

Changes to the `extractSensitiveValues` function:

1. **Add RUT checksum validation** (eliminates ~458 false reports)
2. **Add CURP exclusion from IBAN matches** (eliminates ~574 false reports)
3. **Require Bearer token minimum length** (eliminates 4 false reports)
4. **Add CURP/RFC extraction** (proper categorization)
5. **De-duplicate substring matches** (reduces overlap inflation)

```typescript
function extractSensitiveValues(sourceText: string): readonly string[] {
  const values: string[] = [];
  const patterns: { re: RegExp; luhn?: boolean; validator?: (v: string) => boolean }[] = [
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
    { re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu },
    { re: /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|...)\b/gu },
    { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    { re: /\bAC[a-f0-9]{32}\b/giu },
    { re: /\b(?:\d[ -]?){13,19}\b/g, luhn: true },
    { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
    { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
    { re: /\b\d{17}[\dX]\b/giu },
    { re: /\b\d{3}-\d{2}-\d{4}\b/g },
    { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
    { re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/gu }, // ← min 20 chars
    { re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/g, validator: isTestValidRut },
    { re: /\b\d{2}-\d{8}-\d\b/g },
    { re: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g }, // CURP
    { re: /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/g }, // RFC
  ];

  // IBAN with CURP/RFC exclusion:
  for (const match of sourceText.matchAll(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g)) {
    const val = match[0];
    if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(val)) continue;
    if (/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(val)) continue;
    values.push(val);
  }

  for (const { re, luhn, validator } of patterns) {
    for (const match of sourceText.matchAll(re)) {
      if (luhn && !luhnValid(match[0])) continue;
      if (validator && !validator(match[0])) continue;
      values.push(match[0]);
    }
  }

  // De-duplicate, removing substrings of longer matches
  const unique = Array.from(new Set(values));
  return unique.filter((v, _, arr) => !arr.some(other => other !== v && other.length > v.length && other.includes(v)));
}
```

**Impact**: Eliminates ~1,136 false reports from test output
**Risk**: Zero — no engine code changed

---

## Phase 5: Optional — Mock Corpus Regeneration

Regenerate mock corpus files with checksum-valid identifiers:

- CPFs with valid check digits (currently 18 fail validation)
- CNPJs with valid check digits (18 fail)
- CUITs with valid check digits (34 fail)
- RUTs with valid check digits

Use `utils/scripts/generate_massive_corpus.py` with updated generators
that compute proper checksums.

---

## Expected Results After All Phases

| Metric           | Before | After Phase 1-2 | After Phase 3-4 | After Phase 5 |
| ---------------- | ------ | --------------- | --------------- | ------------- |
| Total leaks      | 2,406  | ~856            | ~200            | ~100          |
| Pass rate        | 75.4%  | 91.2%           | 97.9%           | 99.0%         |
| Test FPs         | ~1,136 | ~1,136          | ~0              | ~0            |
| Real engine gaps | ~1,270 | ~200            | ~200            | ~100          |

---

## Files Modified

| Phase | File                                                        | Change Type        |
| ----- | ----------------------------------------------------------- | ------------------ |
| 1.1   | `src/app/core/masking/constants/masking-rules.constants.ts` | Edit rules         |
| 1.2   | `src/app/core/masking/constants/masking-rules.constants.ts` | Add rule           |
| 2.1   | `src/app/core/masking/utils/country-scope.utils.ts`         | Add function       |
| 2.1   | `src/app/core/masking/masking.engine.ts`                    | Call expansion     |
| 3.1   | `src/app/core/masking/constants/masking-rules.constants.ts` | Add 4 rules        |
| 4.1   | `tests/e2e/mock-corpus-browselite.spec.ts`                  | Fix test patterns  |
| 5     | `utils/scripts/generate_massive_corpus.py`                  | Improve generators |
