# Green Hat Guidelines

## Role Profile

- **Level**: Beginner / Script Kiddie
- **Objective**: Learn the basics of web application security through simple, exploratory scripts
- **Ethics**: Educational use only — never target production systems without written authorization

## Toolkit Overview

| Script                  | Language   | Description                                      |
| ----------------------- | ---------- | ------------------------------------------------ |
| `cookie_stealer.cjs`    | JavaScript | Extracts cookies from a vulnerable page          |
| `brute_login.sh`        | Bash       | Dictionary-based login brute force               |
| `session_dump.py`       | Python     | Dumps session cookies from HTTP responses        |
| `wasm_hello.cjs`        | WASM/JS    | Simple WASM loader — introduction to WebAssembly |
| `form_spam.php`         | PHP        | Sends repeated form submissions                  |
| `GreenHatSmokeTest.php` | PHP        | PHPUnit smoke test                               |

## Learning Path

1. Start with `cookie_stealer.cjs` to understand how cookies are exposed
2. Try `brute_login.sh` to learn about authentication weaknesses
3. Explore `session_dump.py` to see session management from the attacker's perspective
4. Run `wasm_hello.cjs` to get familiar with WASM in security tooling
5. Use `form_spam.php` to understand why rate limiting matters

## Running Scripts

```bash
# All scripts default to http://127.0.0.1:8000
node tests/Feature/security/roleplay/green-hat/js/scripts/cookie_stealer.cjs
bash tests/Feature/security/roleplay/green-hat/bash/scripts/brute_login.sh
python3 tests/Feature/security/roleplay/green-hat/py/scripts/session_dump.py
```
