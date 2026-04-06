### Security roleplay (Jest)

```bash
# All roleplay unit tests
npx jest tests/jest/roleplay --no-coverage

# Specific role
npx jest tests/jest/roleplay/white-hat.spec.ts

# 5 suites — multi-language scripts (JS, Bash, Python)
# Roles: black-hat, green-hat, white-hat, CISO, backend-dev, QA
```

---

# Security Roleplay Testing Framework

Multi-language security testing framework with role-based actors simulating real-world attack and defense scenarios against the LLM Prompt Purifier application.

## End-to-End Flow

```
Create Script → Create Test → Fix Found Vulnerabilities
```

1. **Scripts** (`docs/roleplay/{role}/scripts/`) probe for vulnerabilities
2. **Jest tests** (`tests/jest/roleplay/`) validate the script logic and security assertions
3. **Fixes** (`VULNERABILITY_FIXES.md` + backend patches) remediate discovered issues

## Overview

Each **role** represents a security persona with different skill levels, objectives, and toolkits:

| Role            | Skill Level | Languages        | Scripts | Focus                                |
| --------------- | ----------- | ---------------- | ------- | ------------------------------------ |
| **Green Hat**   | Beginner    | JS, Bash, Python | 3       | Cookie theft, brute force, sessions  |
| **White Hat**   | Advanced    | JS, Bash, Python | 4       | OWASP Top 10, CSP, XSS, headers      |
| **Black Hat**   | Expert      | JS, Bash, Python | 3       | Evasion, SQLi chains, obfuscation    |
| **CISO**        | Executive   | JS, Bash, Python | 3       | Compliance, GDPR/LGPD, CSP grading   |
| **Backend Dev** | Senior      | JS, Bash, Python | 3       | Rate limiting, secrets, dependencies |
| **QA**          | Mid-Senior  | JS, Bash, Python | 3       | Fuzzing, URL tampering, boundaries   |

## Directory Structure

```
docs/roleplay/
├── README.md
├── VULNERABILITY_FIXES.md          # Documented fixes from testing
├── {role}/
│   ├── guidelines/
│   │   └── GUIDELINES.md           # Role profile, toolkit, methodology
│   └── scripts/
│       ├── js/                     # Node.js scripts (.js, CJS exports)
│       ├── py/                     # Python 3 scripts
│       ├── sh/                     # Shell scripts (curl-based)
│       └── wasm/                   # WASM loaders (reserved)
tests/jest/roleplay/
├── green-hat.spec.ts               # Cookie/session security assertions
├── white-hat.spec.ts               # XSS detection + CSP auditing
├── ciso.spec.ts                    # Compliance framework validation
├── dev.spec.ts                     # Rate limiting design assertions
└── qa.spec.ts                      # Fuzz vector + boundary testing
```

## Running Tests

### Jest (unit tests for script logic)

```bash
# All roleplay tests
npx jest tests/jest/roleplay --no-coverage

# Single role
npx jest tests/jest/roleplay/white-hat.spec.ts
npx jest tests/jest/roleplay/ciso.spec.ts
```

### Scripts (manual execution against running server)

```bash
# Green Hat — cookie analysis
node docs/roleplay/green-hat/scripts/js/cookie_stealer.js

# White Hat — OWASP header audit
python3 docs/roleplay/white-hat/scripts/py/owasp_header_audit.py

# CISO — security header scan
bash docs/roleplay/ciso/scripts/sh/security_header_scan.sh

# Dev — rate limit test
node docs/roleplay/dev/scripts/js/api_rate_limit_test.js

# QA — URL tampering
bash docs/roleplay/qa/scripts/sh/url_tamper.sh
```

### Python scripts

```bash
# CISO — GDPR/LGPD compliance scanner
APP_URL=http://localhost:5147 python3 docs/roleplay/ciso/scripts/py/gdpr_scanner.py

# Dev — dependency audit
python3 docs/roleplay/dev/scripts/py/dependency_audit.py

# QA — boundary value generation
python3 docs/roleplay/qa/scripts/py/boundary_value_gen.py
```

## Script Conventions

1. **Header**: Each script starts with a roleplay banner (`[ROLE] Script Name`)
2. **Exports**: JS scripts export functions for unit test validation
3. **CLI mode**: `require.main === module` or `__name__ == "__main__"` for direct execution
4. **Target**: Scripts accept `APP_URL` env var, default `http://127.0.0.1:5147` (API) or `:4200` (frontend)
5. **Documentation**: Backend comments and descriptions are in pt-BR

## Vulnerabilities Found & Fixed

See [VULNERABILITY_FIXES.md](VULNERABILITY_FIXES.md) for detailed findings:

| ID    | Severity | Found By         | Fix                              |
| ----- | -------- | ---------------- | -------------------------------- |
| V-006 | Medium   | Dev              | Rate limit on `/api/mask-safety` |
| V-007 | High     | CISO + White Hat | Security headers middleware      |
| V-008 | Low      | CISO             | Server header suppression        |
| V-009 | Medium   | CISO             | HSTS enforcement in production   |

## Security Notes

- **Black-hat scripts** are git-ignored (`**/black-hat/` in `.gitignore`)
- Never commit real credentials or exploit code to the repository
- All scripts target only `localhost` / `127.0.0.1` by default
- Scripts are for defensive security testing ONLY
