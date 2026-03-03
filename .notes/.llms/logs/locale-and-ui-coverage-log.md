# Locale And UI Coverage Log

## Scope

This pass expanded two areas:

- PT-BR and ES-LatAm masking coverage for additional document and address-adjacent identifiers.
- Component-level interaction tests for modal, toast, and group-policy surfaces that were previously covered only by Playwright.

## New locale-sensitive detection

### PT-BR

- `cep-labeled`
- `pis-pasep-labeled`
- `rg-labeled`
- `titulo-eleitor-labeled`

### ES-LatAm

- `chile-rut`
- `cedula-labeled`
- `dni-labeled`
- `ruc-labeled`

## Validator additions

- `isValidPisPasep`
- `isValidChileanRut`
- `isLikelyBrazilianStateId`
- `looksLikeBrazilianVoterId`
- `looksLikeLatamNationalId`
- `looksLikeLatamTaxId`

## Test additions

- Shared locale fixtures in `src/app/testing/constants/locale-mask-fixtures.constants.ts`
- Shared component fixtures in `src/app/testing/constants/component-fixtures.constants.ts`
- Component specs:
  - `help-modal.component.spec.ts`
  - `mask-group-panel.component.spec.ts`
  - `toast-stack.component.spec.ts`
- Service spec:
  - `toast-center.service.spec.ts`

## Validation

- `npm run test -- --runInBand`
- `npm run build`
- `npm run test:e2e`
