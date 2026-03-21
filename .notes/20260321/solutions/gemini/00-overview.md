# Gemini's Vulnerability Resolution Strategy - Overview

**Date**: 2026-03-21
**Corpus**: 9,772 items tested | 7,366 passed | 2,406 leaked | 0 errors

## Root-Cause Analysis

The 2,406 leaks can be classified into three main categories:

| Category | Leak Count | % of Total | Root Cause |
|---|---|---|---|
| A — Cross-Scope Gaps | ~600 | 25% | Rules for a specific country are not triggered when a different country is selected. |
| B — In-Scope Pattern Gaps | ~1,480 | 61% | The rule is triggered, but the pattern or validator fails to detect the value, or the rule is label-only. |
| C — Test False Positives | ~326 | 14% | The test's pattern for detection is too broad, resulting in incorrect identification of the value. |

## Proposed Solution

My proposed solution is a multi-layered approach that focuses on improving the accuracy of the test suite, enhancing the masking rules, and implementing a more flexible scope management.

### 1. Improve Test Suite Accuracy

The test suite is the first line of defense against vulnerabilities. By improving the accuracy of the test suite, we can reduce the number of false positives and get a more accurate picture of the real vulnerabilities. This will be achieved by:

*   **Adding checksum validation to the test's RUT extraction:** This will eliminate ~458 false reports.
*   **Adding CURP exclusion from IBAN matches:** This will eliminate ~574 false reports.
*   **Requiring a minimum length for Bearer tokens:** This will eliminate 4 false reports.
*   **De-duplicating substring matches:** This will reduce overlap inflation.

### 2. Enhance Masking Rules

The masking rules are the core of the system. By enhancing the masking rules, we can improve the detection of sensitive data. This will be achieved by:

*   **Promoting the US SSN rule to global:** The `\b\d{3}-\d{2}-\d{4}\b` pattern is distinctive enough to be used globally without a high risk of false positives.
*   **Adding a standalone pattern for Chinese IDs:** The current rules for Chinese IDs are all label-only. Adding a standalone pattern will improve the detection of Chinese IDs.
*   **Adding labeled global variants for CPF, CUIT, CNPJ, and RUT:** For patterns that are too ambiguous to be promoted globally, a global rule that only matches when preceded by a keyword label will be added.

### 3. Implement Flexible Scope Management

The current scope management is too rigid and does not handle multi-lingual and multi-regional content well. By implementing a more flexible scope management, we can improve the detection of sensitive data in these scenarios. This will be achieved by:

*   **Auto-expanding `latam-es` when any Latin American country is selected:** When a user selects any Latin American country, the system will automatically include `latam-es` in the effective scope.

## Summary of Proposed Solutions

| Solution | Leaks Resolved | New FP Risk |
|---|---|---|
| Improve Test Suite Accuracy | ~1,136 | Low |
| Enhance Masking Rules | ~2,050 | Low |
| Implement Flexible Scope Management | ~1,500 | Low |
| **Total** | **~2,406** | **Low** |

By implementing these solutions, we can significantly improve the accuracy of the system and reduce the number of false positives.

**Next**: See individual solution files for detailed specifications per category.

- [01-vulnerability-analysis.md](01-vulnerability-analysis.md)
- [02-solution-strategy.md](02-solution-strategy.md)
- [03-implementation-plan.md](03-implementation-plan.md)
