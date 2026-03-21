# Gemini's Implementation Plan

## Phase 1: Test Suite Hardening (Highest Priority)

**Objective:** Eliminate false positives and establish a reliable baseline for real leaks.

### 1.1. Fix Test Extractor False Positives

**File:** `tests/e2e/mock-corpus-browselite.spec.ts`

**A. Add Checksum Validation to RUT Extraction:**

- Implement a `isTestValidRut` function in the test file, mirroring the logic of the engine's `isValidChileanRut`.
- Update the `patterns` array to use this validator for the RUT regex.

```typescript
// Add this helper function inside the spec file
function isTestValidRut(value: string): boolean {
  const normalized = value.replace(/[.\-]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/u.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  let sum = 0, multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return verifier === expected;
}

// Modify the patterns array in extractSensitiveValues
{ re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/g, validator: isTestValidRut },
```

**B. Refine IBAN and Bearer Token Patterns:**

- Modify the IBAN extraction loop to exclude CURPs.
- Update the Bearer token regex to require a minimum length.

```typescript
// In extractSensitiveValues, replace the simple IBAN regex loop
for (const match of sourceText.matchAll(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g)) {
  const val = match[0];
  // Exclude values that are actually CURPs
  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(val)) continue;
  values.push(val);
}

// In the patterns array, update the Bearer token regex
{ re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/gu }, // Require at least 20 chars
```

**C. De-duplicate Substring Matches:**

- Add a filtering step at the end of `extractSensitiveValues` to remove shorter matches that are substrings of longer ones.

```typescript
// At the end of extractSensitiveValues
const unique = Array.from(new Set(values));
return unique.filter((v, _, arr) => !arr.some(other => other !== v && other.length > v.length && other.includes(v)));
```

**Expected Result:** Running the test after these changes should show a leak count reduced by ~1,136.

## Phase 2: Engine Rule Enhancements

### 2.1. Promote US SSN to Global

**File:** `src/app/core/masking/constants/masking-rules.constants.ts`

- Modify the `us-ssn` rule definition.

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

### 2.2. Add Standalone Chinese ID Rule

**File:** `src/app/core/masking/constants/masking-rules.constants.ts`

- Add the new rule after the existing `cn-resident-id-labeled` rule.

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

### 2.3. Add Labeled Global Variants

**File:** `src/app/core/masking/constants/masking-rules.constants.ts`

- Add the following new rules to the file.

```typescript
// CPF - global labeled
{
  category: "identifier",
  coverage: "global",
  confidence: "high",
  id: "cpf-global-labeled",
  label: "CPF (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cpf|cadastro\s+de?\s+pessoa)\b[^
\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu,
  priority: 109,
  validator: isValidCpf,
  valueGroup: 1,
},

// Other labeled global variants (CNPJ, CUIT, RUT) here...
```

## Phase 3: Scope Intelligence

### 3.1. Implement LatAm Regional Auto-Expansion

**A. Create the utility function:**

**File:** `src/app/core/masking/utils/country-scope.utils.ts`

```typescript
const LATAM_COUNTRY_IDS = new Set(["ar", "br", "cl", "co", "mx", "pe"]);

export function expandCountryScope(selectedIds: readonly string[]): readonly string[] {
  const expanded = new Set(selectedIds);
  if (selectedIds.some(id => LATAM_COUNTRY_IDS.has(id))) {
    expanded.add("latam-es");
  }
  return [...expanded];
}
```

**B. Integrate into the masking engine:**

**File:** `src/app/core/masking/masking.engine.ts` (or equivalent)

- Find where the country selection is passed to the rule filtering logic and apply the expansion.

```diff
+ import { expandCountryScope } from "../utils/country-scope.utils";

  const scopeSelection: ScanScopeSelection = {
    detectionMode,
-   countryProfileIds: selectedCountries,
+   countryProfileIds: expandCountryScope(selectedCountries),
  };
```

## Phase 4: Mock Data Regeneration (Optional but Recommended)

**Objective:** Eliminate the remaining ~100 leaks caused by checksum-invalid mock data.

**File:** `utils/scripts/generate_massive_corpus.py`

- Modify the data generators for CPF, CNPJ, CUIT, and RUT to produce values with valid checksums. This will involve implementing the checksum algorithms in Python within the script.
- After modification, run the script to regenerate the mock files.
- Re-run the E2E tests. The leak count should now be close to zero, reflecting only true, unhandled vulnerabilities.
