# Vulnerability Resolution Strategy — Overview

**Date**: 2026-03-21
**Corpus**: 9,772 items tested | 7,366 passed | 2,406 leaked | 0 errors

## Root-Cause Taxonomy

The 2,406 leaks fall into **three distinct categories** requiring different treatments:

| Category                  | Leak Count | % of Total | Root Cause                                                                         |
| ------------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------- |
| A — Cross-Scope Gaps      | ~600       | 25%        | Correct-scope rules exist but don't fire because user selected a different country |
| B — In-Scope Pattern Gaps | ~1,480     | 61%        | Rule fires but pattern or validator rejects the value, or the rule is label-only   |
| C — Test False Positives  | ~326       | 14%        | Test extractor regex is too broad; value isn't actually that type                  |

## Decision Matrix

| Issue                              | Promote to Global?         | Add Labeled Global Variant? | Expand Regional Group?         | Fix Validator?         | Fix Test?           |
| ---------------------------------- | -------------------------- | --------------------------- | ------------------------------ | ---------------------- | ------------------- |
| Chilean RUTs leaked cross-scope    | No (overlaps CPF, RG)      | **Yes**                     | **Yes** (auto-expand latam-es) | --                     | --                  |
| Chilean RUTs leaked in-scope       | --                         | --                          | --                             | No (validator correct) | **Yes** (test FP)   |
| Brazilian CPFs leaked cross-scope  | No (overlaps RUT, NIT)     | **Yes**                     | --                             | --                     | --                  |
| Brazilian CPFs leaked in-scope     | --                         | --                          | --                             | **Yes** (check digits) | --                  |
| Argentine CUITs leaked cross-scope | No                         | **Yes**                     | **Yes** (auto-expand latam-es) | --                     | --                  |
| US SSNs leaked cross-scope         | **Yes** (very distinctive) | Also yes                    | --                             | --                     | --                  |
| Brazilian CNPJs leaked cross-scope | No (13-14 digit overlap)   | **Yes**                     | --                             | --                     | --                  |
| Brazilian CNPJs leaked in-scope    | --                         | --                          | --                             | **Yes** (check digits) | --                  |
| Chinese IDs leaked in-scope        | --                         | --                          | --                             | --                     | Add standalone rule |
| IBANs / Credit Cards               | --                         | --                          | --                             | --                     | **Yes** (test FP)   |
| Bearer tokens                      | --                         | --                          | --                             | --                     | **Yes** (test FP)   |

## Recommended Approach per Category

### Approach 1: Promote to Global (for US SSNs only)

`\b\d{3}-\d{2}-\d{4}\b` is sufficiently distinctive — the dashed format with
3-2-4 digit grouping has virtually no false positives in natural text.

**Risk**: Low. The pattern already has a validator blocking area codes 000, 666, 900+.

### Approach 2: Add Labeled Global Variants

For patterns too ambiguous to promote globally (CPFs, CUITs, CNPJs, RUTs), add a
**global** rule that matches only when preceded by a keyword label:

```
/\b(?:cpf|cadastro)\b[^\n\r\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu
```

This fires everywhere but requires explicit context like `CPF: 123.456.789-01`.
The standalone (unlabeled) pattern stays country-scoped. This is the safest way
to expand coverage without introducing false positives.

### Approach 3: Expand Regional Auto-Selection

When a user selects any Latin American country (br, cl, ar, mx, co, pe), the
system should **silently include `latam-es`** in the effective scope. This
ensures all LatAm identifiers fire together — a user scanning Chilean text will
also catch Argentine CUITs, Mexican CURPs, etc.

**Implementation**: In the scope selection logic, expand the country IDs array
before running `isRuleEnabledForScope`.

### Approach 4: Add Standalone Patterns (for Chinese IDs)

The `cn-resident-id-labeled` rule requires label context, but the mock data
contains standalone 18-digit Chinese ID numbers. Add a standalone regex with
checksum validation (already implemented in `isValidChineseResidentId`).

### Approach 5: Fix Test Extraction Patterns

The test's `extractSensitiveValues` function has overly broad patterns that
create false positives — CURPs being classified as IBANs, RFCs as credit cards,
and "Bearer token" (the literal phrase) matching the bearer regex.

---

**Next**: See individual solution files for detailed specifications per category.

- [01-cross-scope-gaps.md](01-cross-scope-gaps.md)
- [02-in-scope-pattern-fixes.md](02-in-scope-pattern-fixes.md)
- [03-test-false-positives.md](03-test-false-positives.md)
- [04-implementation-plan.md](04-implementation-plan.md)
