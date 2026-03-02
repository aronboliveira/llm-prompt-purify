# Testing Subagent

## Scope

Own Jest unit coverage, Playwright end-to-end validation, and test-fixture quality.

## Responsibilities

- Build extensive fixtures for:
  - Brazilian Portuguese
  - LatAm Spanish
  - American English
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
- Logged test commands and results
