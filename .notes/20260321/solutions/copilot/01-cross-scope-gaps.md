# Category A: Cross-Scope Gaps

## Problem Summary

When a user selects country scope X, rules scoped to country Y don't fire.
Sensitive values from country Y present in the text pass through unmasked.

```
User selects [br] → CPF/CNPJ rules fire
                  → US SSN, Chilean RUT, Argentine CUIT rules do NOT fire
                  → Any SSNs, RUTs, or CUITs in the text leak through
```

This is **by design** in `selected-plus-global` mode, but creates real privacy
risk when users paste multilingual or multi-region content.

## Affected Patterns

### 1. US SSNs under non-US scopes — 80 leaks

| Scope tested | Leaks | Expected behavior                          |
| ------------ | ----- | ------------------------------------------ |
| en\|in       | 40    | us-ssn rule not active under Indian scope  |
| en\|ru       | 40    | us-ssn rule not active under Russian scope |

**Values**: `614-30-9184`, `226-23-4438`, `141-41-1973`

**Recommended fix**: **Promote `us-ssn` to `coverage: "global"`**

**Reasoning**: The pattern `\b\d{3}-\d{2}-\d{4}\b` is highly distinctive:

- The 3-2-4 dashed grouping is essentially unique to SSNs
- The validator already blocks invalid area numbers (000, 666, 900-999)
- False positive risk is negligible across all languages
- SSNs are extremely high-sensitivity PII — missing one is worse than a false positive

```typescript
// masking-rules.constants.ts — change:
{
  id: "us-ssn",
  coverage: "global",        // was: "country"
  // countryProfileIds: ["us"],  ← remove or keep for metadata
  // ... rest unchanged
}
```

Also promote: `us-ssn-json`, `us-ssn-quoted`, `us-ssn-json-suffixed`

### 2. Brazilian CPFs under non-BR scopes — ~1,102 leaks

| Scope tested           | CPF leaks |
| ---------------------- | --------- |
| es\|cl                 | 1,062     |
| es\|ar, co, es, mx, pe | 20 each   |
| pt-br\|pt              | 40        |

**Values**: `20126535342`, `456.789.123-45`

**Recommended fix**: **Add a global labeled variant**

CPFs should NOT be promoted to global because `\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`
matches too many numeric sequences (phone fragments, part numbers, etc.).
Instead, add a global rule that only matches with keyword context:

```typescript
{
  id: "cpf-global-labeled",
  category: "identifier",
  coverage: "global",
  confidence: "high",
  label: "CPF (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cpf|cadastro\s+de?\s+pessoa|cadastro)\b[^\n\r\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu,
  priority: 109,
  validator: isValidCpf,
  valueGroup: 1,
}
```

When a user is under US scope and pastes `CPF: 123.456.789-01`, this labeled
global variant catches it. Standalone CPFs (no label) remain country-scoped.

### 3. Argentine CUITs under non-AR scopes — ~2,066 leaks

| Scope tested       | CUIT leaks |
| ------------------ | ---------- |
| es\|cl             | 1,912      |
| es\|co, es, mx, pe | 40 each    |

**Values**: `20-29530492-2`, `27-36403173-3`

**Recommended fix**: **Two-pronged approach**

**a) Auto-expand `latam-es` when any LatAm country is selected**

The `latam-es` regional group exists but requires explicit selection. When a user
selects `cl`, they should automatically get `latam-es` rules too. This means
CUITs fire under Chilean scope, RUTs fire under Argentine scope, etc.

```typescript
// country-scope.utils.ts — add auto-expansion:
const LATAM_COUNTRIES = new Set(["ar", "br", "cl", "co", "mx", "pe"]);

export function expandCountryScope(selectedIds: readonly string[]): readonly string[] {
  const expanded = new Set(selectedIds);
  if (selectedIds.some(id => LATAM_COUNTRIES.has(id))) {
    expanded.add("latam-es");
  }
  return [...expanded];
}
```

**b) Add a global labeled variant for CUITs**

```typescript
{
  id: "cuit-global-labeled",
  category: "identifier",
  coverage: "global",
  confidence: "high",
  label: "Argentine CUIT (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cuit|cuil|clave\s+[uú]nica)\b[^\n\r\d]{0,12}(\d{2}-\d{8}-\d)\b/giu,
  priority: 109,
  validator: isValidArgentineCuit,
  valueGroup: 1,
}
```

### 4. Chilean RUTs under non-CL scopes — ~658 leaks (cross-scope only)

| Scope tested           | RUT leaks                            |
| ---------------------- | ------------------------------------ |
| pt-br\|br              | 458 (some are test FPs — see doc 03) |
| es\|ar, co, es, mx, pe | ~62 each                             |
| en\|us                 | 12                                   |

**Recommended fix**: Same latam-es auto-expansion (fixes es\|ar etc.) +
global labeled variant for non-LatAm scopes:

```typescript
{
  id: "rut-global-labeled",
  category: "identifier",
  coverage: "global",
  confidence: "medium",
  label: "Chilean RUT (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:rut|rut\s+chileno|rut\s+empresa)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
  priority: 109,
  validator: isValidChileanRut,
  valueGroup: 1,
}
```

### 5. Brazilian CNPJs under non-BR scopes — 20 leaks

| Scope tested | CNPJ leaks |
| ------------ | ---------- |
| pt-br\|pt    | 20         |

**Recommended fix**: Global labeled variant:

```typescript
{
  id: "cnpj-global-labeled",
  category: "identifier",
  coverage: "global",
  confidence: "high",
  label: "CNPJ (labeled, global)",
  locale: "shared",
  patternFactory: () =>
    /\b(?:cnpj|cadastro\s+nacional)\b[^\n\r\d]{0,12}(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/giu,
  priority: 109,
  validator: isValidCnpj,
  valueGroup: 1,
}
```

## Summary: Cross-Scope Fix Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    CROSS-SCOPE FIX LAYERS                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Promote US SSN to global                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ SSN pattern is distinctive enough for zero-FP global    │ │
│  │ coverage. Catches SSNs regardless of user's scope.      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 2: Auto-expand latam-es                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Selecting any LatAm country (br, cl, ar, mx, co, pe)   │ │
│  │ silently adds "latam-es" to the effective scope.        │ │
│  │ All LatAm identifiers fire together.                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Layer 3: Global labeled variants                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ New rules with coverage: "global" that require keyword  │ │
│  │ labels (CPF:, CUIT:, RUT:, CNPJ:).                     │ │
│  │ Fire everywhere but only with explicit context.         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Impact Estimate

| Fix                     | Leaks Resolved           | New FP Risk                              |
| ----------------------- | ------------------------ | ---------------------------------------- |
| SSN → global            | 80 (100%)                | Negligible                               |
| latam-es auto-expand    | ~1,500 (estimated)       | Low — LatAm patterns are already precise |
| Global labeled variants | ~200 (labeled instances) | None — requires keyword context          |
| **Total**               | **~1,780 / 2,406**       | **Low**                                  |

The remaining ~626 leaks are Category B (in-scope pattern gaps) and
Category C (test false positives), covered in docs 02 and 03.
