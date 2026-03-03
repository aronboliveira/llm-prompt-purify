# Jest Regression Expansion

Date: 2026-03-03

What was added:

- A dedicated masking regression suite in `src/app/core/masking/masking.engine.regression.spec.ts`.
- A larger fixture corpus in `src/app/testing/constants/mask-regression-corpus.constants.ts`.
- New testing declarations for scope-boundary scenarios in `src/app/testing/declarations/testing.types.ts`.

Coverage focus:

- Global credentials:
  OpenAI-style keys, AWS access keys, AWS secret keys, GitHub PATs, Slack webhooks, bearer tokens, JWTs, and secret assignments.
- Global personal/contact patterns:
  emails, labeled names, labeled addresses, labeled phones, and labeled passport numbers.
- Global financial patterns:
  valid credit cards and IBAN values.
- Negative boundaries:
  weak token assignments, invalid emails, invalid cards, invalid IBAN-like values, short phone labels, one-word names, non-address prose, and short passport labels.
- Scope boundaries:
  country mismatch pass-through, multi-country activation, global-only pass-through, and mixed regional/country scope combinations.

Outcome:

- Full Jest suite passed with 10 suites and 88 tests.
- The regression corpus increases confidence that masking hides supported sensitive inputs while leaving unsupported or out-of-scope values visible.
