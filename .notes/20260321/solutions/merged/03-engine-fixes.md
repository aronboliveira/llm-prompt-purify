# Engine Fixes — Masking Rule Changes

All changes target production code in `src/app/core/masking/`.

## Fix 1: Promote US SSN to Global Coverage

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`  
**Lines**: 271–283 (us-ssn), 845 (us-ssn-json), 859 (us-ssn-quoted), 1120 (us-ssn-json-suffixed)  
**Resolves**: 80 cross-scope leaks (en|in: 40, en|ru: 40)

The pattern `\b\d{3}-\d{2}-\d{4}\b` is highly distinctive — the 3-2-4
dashed grouping is essentially unique to US SSNs. Combined with the
existing `isValidUsaSsn` validator (rejects area 000/666/900+, group 00,
serial 0000), false-positive risk is negligible across all locales.

```diff
  {
    category: "identifier",
-   countryProfileIds: ["us"],
-   coverage: "country",
+   coverage: "global",
    confidence: "high",
    id: "us-ssn",
    label: "US Social Security number",
-   locale: "en-US",
+   locale: "shared",
    patternFactory: () => /\b\d{3}-\d{2}-\d{4}\b/g,
    priority: 116,
    validator: isValidUsaSsn,
  },
```

Apply the same `coverage: "global"` + `locale: "shared"` change to:

- `us-ssn-json` (line 845)
- `us-ssn-quoted` (line 859)
- `us-ssn-json-suffixed` (line 1120)

---

## Fix 2: Add Standalone Chinese Resident ID Rule

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`  
**Insert after**: `cn-resident-id-quoted` (line ~932)  
**Resolves**: 470 in-scope leaks (zh|cn)

The only genuine engine bug. Three cn-resident-id rules exist but all
require context (labeled, JSON, quoted). Standalone 18-digit Chinese IDs
in flowing text are missed.

The `isValidChineseResidentId` validator computes a mod-11 weighted
checksum using 17 positional weights and a verifier lookup table. This is
strong enough to prevent false positives from random 18-digit sequences.

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
  priority: 112,
  validator: isValidChineseResidentId,
},
```

Also audit the labeled rule's keyword list to ensure coverage of compound
labels like `负责人身份证` (responsible person's ID) and both colon
variants (`:` U+003A and `：` U+FF1A).

---

## Fix 3: Auto-Expand LatAm Regional Scope

**File**: `src/app/core/masking/utils/country-scope.utils.ts`  
**Resolves**: ~2,200+ cross-scope leaks across all LatAm scopes

When a user selects any Latin American country, rules tagged with
`"latam-es"` in their countryProfileIds should automatically activate.
Currently, users must explicitly select `latam-es` separately.

### 3a. Add expansion function

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

### 3b. Integrate into masking engine

**File**: `src/app/core/masking/masking.engine.ts` (line ~134)

```diff
+ import { expandCountryScope } from "../utils/country-scope.utils";

- scopeFilteredRules = filterRulesForScope(MASKING_RULES, scopeSelection),
+ scopeFilteredRules = filterRulesForScope(MASKING_RULES, {
+   ...scopeSelection,
+   countryProfileIds: expandCountryScope(scopeSelection.countryProfileIds),
+ }),
```

Alternatively, integrate the expansion into `buildScanScopeSelection()`
to normalize scope at the boundary.

### Effect

With this change, selecting `cl` activates all 16 rules tagged
`"latam-es"`, including: cuit, cuit-labeled-loose, curp, rfc, nit,
cedula-labeled, chile-rut (already has `"cl"`), ruc-labeled, etc.

---

## Fix 4: Add Global Labeled Variants

**File**: `src/app/core/masking/constants/masking-rules.constants.ts`  
**Resolves**: Remaining labeled cross-scope instances (~200 estimated)

These rules fire globally but require keyword context (zero FP risk):

```typescript
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
{
  category: "identifier",
  coverage: "global",
  confidence: "medium",
  id: "rut-global-labeled",
  label: "Chilean RUT (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:rut|n[uú]mero\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
  priority: 109,
  validator: isValidChileanRut,
  valueGroup: 1,
},
```

---

## Impact Summary

| Fix                     | Leaks Resolved | New FP Risk      | Files Changed                             |
| ----------------------- | -------------: | ---------------- | ----------------------------------------- |
| 1. SSN → global         |             80 | Negligible       | masking-rules.constants.ts                |
| 2. CN ID standalone     |            470 | Low (checksum)   | masking-rules.constants.ts                |
| 3. latam-es auto-expand |         2,200+ | Low (validators) | country-scope.utils.ts, masking.engine.ts |
| 4. Global labeled       |           ~200 | Zero (keywords)  | masking-rules.constants.ts                |
| **Total**               |     **~2,950** | **Low**          | 3 files                                   |
