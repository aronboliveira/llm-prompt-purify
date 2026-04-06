# White Hat Guidelines

## Role Profile

- **Level**: Advanced / Certified Ethical Hacker
- **Objective**: Systematically identify and report vulnerabilities following OWASP methodologies
- **Ethics**: Always work within scope, document findings, and follow responsible disclosure

## Toolkit Overview

| Script                     | Language   | Description                                          |
| -------------------------- | ---------- | ---------------------------------------------------- |
| `dom_xss_probe.cjs`        | JavaScript | Detects DOM-based XSS sinks and sources              |
| `csp_bypass_test.cjs`      | JavaScript | Analyzes Content Security Policy weaknesses          |
| `crypto_verifier.cjs`      | WASM/JS    | Verifies hash formats, JWT integrity, CSRF tokens    |
| `owasp_sqli_scan.sh`       | Bash       | OWASP-referenced SQLi probes against endpoints       |
| `session_fixation_test.sh` | Bash       | Tests for session fixation vulnerabilities           |
| `param_tamper.php`         | PHP        | HTTP parameter tampering tests                       |
| `auth_bypass_probe.py`     | Python     | Tests authentication bypass vectors                  |
| `owasp_header_audit.py`    | Python     | Audits security headers against OWASP best practices |
| `ssrf_scanner.py`          | Python     | Server-Side Request Forgery payload testing          |
| `WhiteHatSqliTest.php`     | PHP        | PHPUnit SQL injection feature tests                  |

## Methodology

1. **Reconnaissance**: Use `owasp_header_audit.py` and `csp_bypass_test.cjs` for passive recon
2. **Discovery**: Run `dom_xss_probe.cjs`, `ssrf_scanner.py`, and `owasp_sqli_scan.sh`
3. **Verification**: Use `crypto_verifier.cjs` to validate cryptographic implementations
4. **Exploitation**: Controlled testing with `param_tamper.php` and `auth_bypass_probe.py`
5. **Reporting**: Document all findings with CVSS scores and remediation guidance

## Running Scripts

```bash
node tests/Feature/security/roleplay/white-hat/js/scripts/csp_bypass_test.cjs
python3 tests/Feature/security/roleplay/white-hat/py/scripts/ssrf_scanner.py
bash tests/Feature/security/roleplay/white-hat/bash/scripts/owasp_sqli_scan.sh
```
