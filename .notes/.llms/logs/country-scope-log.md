# Country Scope Log

## Scope

This pass introduced an explicit country picker with flag emojis and a global-only scan mode.

## Product behavior

- The user now selects a country profile before scanning.
- Shared global rules still run by default.
- A global-only toggle disables country-specific document rules while keeping shared credentials,
  emails, financial patterns, and generic labeled fields active.
- Changing the country scope with text already present triggers a fresh local scan so the output
  stays synchronized with the active rule set.

## Country profiles in this pass

- Brazil
- United States
- Mexico
- Argentina
- Chile
- Colombia
- Peru

## Validation

- `npm run test -- --runInBand`
- `npm run build`
- `npm run test:e2e`
