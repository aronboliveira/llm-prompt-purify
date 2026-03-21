# Gemini's Solution Strategy

**Date**: 2026-03-21
**Corpus**: 9,772 items tested | 7,366 passed | 2,406 leaked | 0 errors

## Multi-Layered Solution Strategy

### Layer 1: Harden the Test Foundation

The highest priority is to fix the test suite's accuracy. A faulty test suite gives a distorted view of the system's health, causing developers to chase ghosts (false positives) while real issues (false negatives) remain hidden.

**Actions:**

1.  **Integrate Checksum Validation in Tests:** The test extractor for patterns like Chilean RUTs must use the same checksum validation logic as the production engine. This is non-negotiable. A pattern match without a valid checksum is not a valid instance of that data type.
2.  **Refine Test Regex Specificity:**
    *   **Bearer Tokens:** A "Bearer" token is a long, high-entropy string. The test regex must enforce a realistic minimum length (e.g., 20+ characters) to avoid matching the literal words "Bearer token".
    *   **IBANs vs. Other National IDs:** The IBAN test pattern is too generic. It must be refined to explicitly *exclude* patterns known to belong to other identifiers, like Mexican CURPs. This is a classic case of resolving pattern ambiguity.
3.  **Implement a De-duplication Step:** After extraction, the test harness must de-duplicate findings. If a Brazilian CPF is found, and a nine-digit fragment of it is also matched by a generic number pattern, the shorter, less-specific match should be discarded in favor of the longer, more specific one.

**Expected Outcome:** A drastic reduction in reported leaks (~1,136), revealing the true, smaller set of actual vulnerabilities. The pass rate will jump from 75% to ~87%, providing a more realistic baseline.

### Layer 2: Fortify the Core Engine Rules

With a reliable test suite, we can confidently address the real leaks.

**Actions:**

1.  **Promote High-Confidence Patterns to Global:** The US SSN format (`ddd-dd-dddd`) is exceptionally unique and has a near-zero chance of appearing coincidentally in natural language. Its rule should be promoted to `coverage: "global"`. This is the simplest, most effective way to close its cross-scope gap.
2.  **Create a New Standalone Rule for Chinese IDs:** The data clearly shows that 18-digit Chinese Resident IDs appear without keyword labels. The lack of a standalone, country-scoped rule for this is a significant gap in the engine's logic. A new rule with a strong checksum validator is required.
3.  **Introduce "Labeled Global" Variants:** For identifiers like CPFs, CUITs, and CNPJs, the raw numeric pattern is too ambiguous for global coverage. The solution is to create a parallel set of `coverage: "global"` rules that are highly specific: they only match if the number is immediately preceded by a keyword label (e.g., `CPF:`, `CUIT:`). This provides a safe, context-aware way to catch cross-scope leaks without introducing false positives.

**Expected Outcome:** Resolution of the majority of true leaks (~550), including the most critical high-sensitivity data types.

### Layer 3: Implement Intelligent Scope Expansion

The final layer addresses the architectural limitation of a rigid, user-selected scope.

**Action:**

1.  **Introduce Regional Auto-Expansion:** The system should have built-in regional logic. When a user selects any country within a defined region (e.g., Latin America), the engine should automatically expand the active scope to include a shared regional ruleset (e.g., `latam-es`). This ensures that a user scanning a document in Chile will seamlessly detect Argentine CUITs and Mexican CURPs without needing to manually select all three countries. This reflects the reality of regional data exchange.

**Expected Outcome:** A more intelligent, user-friendly system that closes the remaining cross-scope leaks (~1,500) within a major geographical region, dramatically improving the user experience and security posture for regional users.

## Summary of Strategic Layers

| Layer | Focus | Key Actions | Estimated Leaks Addressed |
| :--- | :--- | :--- | :--- |
| **1. Test Foundation** | Eliminate noise and build trust in metrics. | Add validators to tests, refine regex, de-duplicate. | ~1,136 (False Positives) |
| **2. Core Engine** | Fix direct pattern and rule logic gaps. | Promote SSN, add standalone CN ID, create labeled globals. | ~550 (True Leaks) |
| **3. Scope Intelligence** | Address architectural limitations for regional data. | Auto-expand scope for regions like Latin America. | ~1,500 (True Leaks) |
