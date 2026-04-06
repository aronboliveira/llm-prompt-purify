# QA Guidelines

## Role Profile

- **Level**: Mid-Senior / Quality Assurance Engineer with Security Focus
- **Objective**: Ensure application quality through edge-case testing, fuzzing, regression testing, and accessibility-security overlap checks
- **Ethics**: Test to protect users — boundary testing prevents real-world exploitation

## Toolkit Overview

| Script                             | Language   | Description                                           |
| ---------------------------------- | ---------- | ----------------------------------------------------- |
| `form_fuzzer.cjs`                  | JavaScript | Fuzzes form fields with unexpected inputs             |
| `accessibility_security_audit.cjs` | JavaScript | A11y-security overlap checks (CAPTCHA, MFA, timeouts) |
| `input_validator.cjs`              | WASM/JS    | WASM-powered input validation for 8 threat types      |
| `url_tamper.sh`                    | Bash       | URL parameter tampering and path traversal            |
| `session_edge_cases.php`           | PHP        | 8 session edge case scenarios                         |
| `QaEdgeCaseTest.php`               | PHP        | PHPUnit edge case feature tests                       |
| `boundary_value_gen.py`            | Python     | Generates boundary value test data                    |
| `regression_security_gen.py`       | Python     | Regression tests for known CVEs                       |
| `test_qa_edge_cases.py`            | Python     | pytest edge case feature tests                        |

## Testing Strategy

1. **Input Fuzzing**: Run `form_fuzzer.cjs` and `input_validator.cjs` for all form fields
2. **Boundary Values**: Generate edge cases with `boundary_value_gen.py`
3. **URL Tampering**: Test routes with `url_tamper.sh`
4. **Session Edge Cases**: Execute `session_edge_cases.php` for cookie manipulation
5. **Regression**: Verify past vulnerabilities stay fixed with `regression_security_gen.py`
6. **Accessibility**: Validate security UX with `accessibility_security_audit.cjs`

## Input Validation Coverage (WASM validator)

- SQL Injection patterns
- Cross-Site Scripting (XSS)
- Path Traversal
- Command Injection
- Server-Side Template Injection
- LDAP Injection
- Null Byte attacks
- CRLF Injection

## Running Scripts

```bash
node tests/Feature/security/roleplay/qa/js/scripts/form_fuzzer.cjs
python3 tests/Feature/security/roleplay/qa/py/scripts/regression_security_gen.py
bash tests/Feature/security/roleplay/qa/bash/scripts/url_tamper.sh
```
