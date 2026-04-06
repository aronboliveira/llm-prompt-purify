# CISO Guidelines

## Role Profile

- **Level**: Executive / Chief Information Security Officer
- **Objective**: Ensure organizational compliance, audit security posture, and enforce policies
- **Ethics**: Governance-first approach — align all security efforts with regulatory frameworks

## Toolkit Overview

| Script                      | Language   | Description                                                  |
| --------------------------- | ---------- | ------------------------------------------------------------ |
| `csp_analyzer.cjs`          | JavaScript | Parses and evaluates Content Security Policy effectiveness   |
| `tls_certificate_audit.cjs` | JavaScript | TLS/SSL configuration grading (A-F), weak cipher detection   |
| `policy_hash.cjs`           | WASM/JS    | SHA256 policy hashing for integrity verification             |
| `cookie_flags_audit.sh`     | Bash       | Validates cookie security flags (Secure, HttpOnly, SameSite) |
| `security_header_scan.sh`   | Bash       | Checks all recommended security headers                      |
| `csrf_audit.php`            | PHP        | CSRF protection completeness testing                         |
| `compliance_audit.py`       | Python     | Multi-framework compliance checking                          |
| `gdpr_scanner.py`           | Python     | GDPR/LGPD PII detection, privacy header checks, A-F grading  |
| `CisoComplianceTest.php`    | PHP        | PHPUnit compliance feature tests                             |
| `test_ciso_compliance.py`   | Python     | pytest compliance feature tests                              |

## Compliance Frameworks Covered

- **OWASP Top 10** (2021): All categories
- **GDPR** (EU): PII detection, right to erasure endpoints, privacy headers
- **LGPD** (Brazil): CPF/CNPJ detection, consent mechanisms
- **PCI DSS**: TLS configuration, encryption at rest, access controls
- **SOC 2**: Security, availability, processing integrity

## Audit Workflow

1. **Headers & TLS**: Run `security_header_scan.sh` + `tls_certificate_audit.cjs`
2. **CSP**: Analyze with `csp_analyzer.cjs`
3. **Cookies**: Audit with `cookie_flags_audit.sh`
4. **CSRF**: Verify with `csrf_audit.php`
5. **Privacy**: Scan with `gdpr_scanner.py` for PII exposure
6. **Policy Integrity**: Hash and verify policies with `policy_hash.cjs`
7. **Full Compliance**: Run `compliance_audit.py` against all frameworks

## Running Scripts

```bash
node tests/Feature/security/roleplay/ciso/js/scripts/tls_certificate_audit.cjs
python3 tests/Feature/security/roleplay/ciso/py/scripts/gdpr_scanner.py
bash tests/Feature/security/roleplay/ciso/bash/scripts/security_header_scan.sh
```
