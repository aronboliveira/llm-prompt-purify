# Black Hat Guidelines

> **WARNING**: These scripts exist for DEFENSIVE TESTING ONLY.
> All black-hat folders are git-ignored (`**/black-hat/` in `.gitignore`).
> Never use these tools against systems without explicit written authorization.

## Role Profile

- **Level**: Expert / Advanced Persistent Threat Simulation
- **Objective**: Simulate sophisticated attack chains to validate security controls
- **Ethics**: Red team exercises ONLY — authorized environments, full documentation required

## Toolkit Overview

| Script                      | Language   | Description                                          |
| --------------------------- | ---------- | ---------------------------------------------------- |
| `payload_obfuscator.cjs`    | JavaScript | 7 encoding methods for WAF evasion                   |
| `xss_chain_builder.cjs`     | JavaScript | Reflected, Stored, DOM XSS payload chains            |
| `session_hijack.cjs`        | JavaScript | Cookie extraction, token forgery, replay attacks     |
| `encoder_loader.cjs`        | WASM/JS    | Multi-layer XOR/ROT13/substitution encoding via WASM |
| `sqli_chain.sh`             | Bash       | 10 SQLi payloads across 5 endpoints                  |
| `cmd_injection_probe.sh`    | Bash       | Command injection testing across form fields         |
| `exfil_tunnel.sh`           | Bash       | Data exfiltration simulation (HTTP, DNS, headers)    |
| `advanced_sqli.py`          | Python     | Time-based blind, UNION-based, error-based SQLi      |
| `credential_harvester.py`   | Python     | Phishing template analysis, password reset poisoning |
| `waf_bypass_chain.php`      | PHP        | 8 encoding techniques × 8 payloads × 6 endpoints     |
| `BlackHatEvasionTest.php`   | PHP        | PHPUnit evasion feature tests                        |
| `test_black_hat_evasion.py` | Python     | pytest evasion feature tests                         |

## Attack Chain Methodology

1. **Reconnaissance**: Identify WAF, headers, and session mechanisms
2. **Encoding**: Use `payload_obfuscator.cjs` and `encoder_loader.cjs` to evade filters
3. **Injection**: Chain `sqli_chain.sh`, `advanced_sqli.py`, and `cmd_injection_probe.sh`
4. **Session**: Escalate with `session_hijack.cjs` and `credential_harvester.py`
5. **Persistence**: Establish persistence with `xss_chain_builder.cjs` (stored XSS)
6. **Exfiltration**: Test data loss prevention with `exfil_tunnel.sh`

## Security Controls Validated

- Web Application Firewall (WAF) effectiveness
- Input validation and output encoding
- Session management and token entropy
- Content Security Policy enforcement
- Data Loss Prevention (DLP) controls
