# Masking Engine Subagent

## Scope

Own token detection, match normalization, mask generation, and final masked-output assembly.

## Responsibilities

- Build deterministic pure functions for scanning and masking.
- Focus current coverage on American English, Brazilian Portuguese, and LatAm Spanish.
- Separate rules into confidence bands:
  - direct secret or identifier value
  - contextual value with label support
  - weak heuristic
- Preserve match order and allow per-match enable or disable behavior.

## Constraints

- Avoid shared mutable regex instances during scans.
- No DOM access.
- No clipboard, storage, or Angular dependencies.
- Mask generation must preserve output stability within one scan result unless the user explicitly regenerates.

## Deliverables

- Rule catalog
- Normalized match model
- Mask generation helpers
- Final output assembler that recomputes masked text from current toggle state
