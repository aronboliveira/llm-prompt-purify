# Improvement Roadmap

## Phase 1: Make the core flow trustworthy

- Change the product flow to `paste -> scan -> get masked prompt`.
- Put the masked prompt directly in the main output area.
- Make the main copy and download actions operate only on the masked output.
- Remove or hide non-working actions until they are real.
- Fix or remove broken header links until routes exist.

Definition of done:

- a user can paste text, click one button, and immediately copy a safe version without opening a secondary workflow

## Phase 2: Separate detection quality from UI

- Extract scanning into a pure service that takes text and returns structured matches.
- Stop mutating the DOM directly for the main logic.
- Represent rules in categories:
  - strong secret values
  - contextual labels
  - weak heuristics
- Score matches by confidence instead of treating everything as equally dangerous.
- Replace shared `RegExp.exec()` state with deterministic matching using fresh regex instances or `matchAll`.

Definition of done:

- the detector can be tested with plain input/output fixtures
- UI code does not decide how matching works

## Phase 3: Reduce false positives aggressively

- Remove generic engineering terms from the "dangerous data" category unless they are paired with a real secret value.
- Add allowlists or skip rules for common harmless prompt content.
- Keep label-only matches as optional context, not primary blocking findings.
- Build a small corpus of real prompts:
  - safe technical prompts
  - obviously sensitive prompts
  - mixed prompts
  - multilingual prompts

Definition of done:

- the project can explain which prompts it intentionally flags and which it intentionally ignores

## Phase 4: Unify the web app and extension

- Move the shared rule set and masking engine into one reusable module.
- Import that module from both the Angular app and the extension.
- Keep site-specific behavior in the extension, but not the core detection corpus.

Definition of done:

- the same input produces the same detection result in both surfaces

## Phase 5: Add quality gates

- Add automated tests for:
  - detector correctness
  - masking output generation
  - major user flows
- Track regression fixtures for false positives and false negatives.
- Add a basic benchmark so performance regressions are visible.

Definition of done:

- changes to the dictionary or masking behavior require passing tests before merge

## Suggested priority order

1. Fix copy/download/output correctness.
2. Replace the current scan loop with deterministic matching.
3. Simplify the user flow to one-click masked output.
4. Calibrate the rules using real prompt examples.
5. Unify the extension and app around one engine.
