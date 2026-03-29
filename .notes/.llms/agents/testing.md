# Testing Subagent

## Scope

Own Jest unit coverage, Playwright end-to-end validation, and test-fixture quality.

## Responsibilities

- Build extensive fixtures for:
  - Brazilian Portuguese
  - LatAm Spanish
  - American English
  - Chinese (Simplified)
- Cover both false positives and false negatives.
- Keep end-to-end tests focused on the critical workflow:
  - paste content
  - scan
  - see masks applied by default
  - disable one mask
  - copy masked output

## Constraints

- Unit tests must cover the engine more deeply than UI tests.
- Do not use end-to-end tests to compensate for missing pure-function coverage.
- Prefer readable fixtures over overly clever generators.

## Deliverables

- Engine specs
- State specs
- Component integration specs where valuable
- Playwright flow specs
- Prompt corpus specs (cluster, formality, lang, role)
- Logged test commands and results

## Test Structure

```
tests/
├── e2e/               # Playwright E2E (685 specs)
│   ├── _helpers/      # Shared helpers & registrators
│   ├── io/            # IO & entropy edge-case specs
│   ├── workflow/      # Scan-workflow & visual-demo
│   └── corpus/        # Prompt-corpus combinatorial specs
│       ├── cluster/   # 9 + 27 cluster×formality
│       ├── formality/ # 3 formality-level
│       ├── lang/      # 4 language-specific (en, pt-br, es, zh)
│       └── role/      # 28 professional-role
├── jest/              # Jest unit tests (44 suites / 4576+ tests)
│   ├── corpus/        # Prompt-corpus unit specs
│   │   ├── cluster/   # 9 cluster specs
│   │   └── formality/ # 3 formality specs
│   ├── masking/       # 11 masking engine specs + utils/
│   ├── mask-safety/
│   ├── feedback/
│   ├── purification/
│   └── state/
├── python/            # Pytest & Selenium tests
└── scripts/           # Shell smoke tests
```
