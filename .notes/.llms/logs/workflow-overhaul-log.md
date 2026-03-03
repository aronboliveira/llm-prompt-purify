# Workflow Overhaul Log

## Scope

- Re-centered the app on the exact paste → local scan → protected output → review → copy flow.
- Reorganized Angular code into `constants/`, `declarations/`, and `utils/` folders under each relevant module.
- Added group-policy controls, per-match regenerate actions, help modals, toast feedback, and a client-side disclosure.

## Structural notes

- `src/app/core/masking/` now separates rule declarations, reusable constants, and pure helpers.
- `src/app/core/state/` now owns async scan timing, status copy, group preferences, and session persistence.
- `src/app/features/scanner/` now contains workflow copy, help topics, group controls, help modal, and toast rendering.
- `src/app/shared/` now contains reusable icon constants, SCSS utilities, and trusted HTML helpers.

## Validation

- `npm run build`
- `npm run test -- --runInBand`
- `npm run test:e2e`
