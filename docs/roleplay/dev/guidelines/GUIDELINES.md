# Backend Developer Guidelines

## Role Profile

- **Level**: Senior / Security-Aware Developer
- **Objective**: Integrate security into the development workflow through SAST, dependency auditing, and secure coding practices
- **Ethics**: Shift-left security — catch vulnerabilities before they reach production

## Toolkit Overview

| Script                        | Language   | Description                                            |
| ----------------------------- | ---------- | ------------------------------------------------------ |
| `frontend_security_audit.cjs` | JavaScript | Audits frontend code for insecure patterns             |
| `api_rate_limit_test.cjs`     | JavaScript | Tests API rate limiting across critical endpoints      |
| `hash_benchmark.cjs`          | WASM/JS    | Benchmarks hash algorithms, detects weak hashing       |
| `sast_scanner.sh`             | Bash       | Static analysis for hardcoded secrets and patterns     |
| `secret_scanner.sh`           | Bash       | Scans codebase for API keys, DB creds, encryption keys |
| `raw_query_detector.php`      | PHP        | Detects raw SQL queries susceptible to injection       |
| `dependency_audit.py`         | Python     | Audits dependencies for known vulnerabilities          |

## Secure Development Workflow

1. **Pre-commit**: Run `secret_scanner.sh` to catch secrets before committing
2. **Code Review**: Use `raw_query_detector.php` and `frontend_security_audit.cjs`
3. **SAST**: Execute `sast_scanner.sh` for static analysis
4. **Dependencies**: Audit with `dependency_audit.py` for known CVEs
5. **API Design**: Validate rate limiting with `api_rate_limit_test.cjs`
6. **Crypto**: Benchmark hash algorithms with `hash_benchmark.cjs`

## Running Scripts

```bash
node tests/Feature/security/roleplay/backend-dev/js/scripts/api_rate_limit_test.cjs
bash tests/Feature/security/roleplay/backend-dev/bash/scripts/secret_scanner.sh
python3 tests/Feature/security/roleplay/backend-dev/py/scripts/dependency_audit.py
```
