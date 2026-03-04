# Mask Safety API Log

## Purpose

Introduce an API-backed validation layer for generated masks so the app can reject replacements that still look like real identifiers or financial values.

## Backend

- Added `POST /api/mask-safety/validate` in `backend/LLMPromptPurify.Api/Program.cs`.
- Added feature contracts under `backend/LLMPromptPurify.Api/Features/MaskSafety/Contracts`.
- Added algorithmic validators under `backend/LLMPromptPurify.Api/Features/MaskSafety/Services/IdentifierValidationAlgorithms.cs`.
- Added the batch validator service in `backend/LLMPromptPurify.Api/Features/MaskSafety/Services/MaskSafetyValidationService.cs`.
- Added xUnit coverage in `backend/LLMPromptPurify.Api.Tests/MaskSafetyValidationServiceTests.cs`.
- Made feedback database initialization non-fatal during API startup so mask-safety checks can run without a live Postgres instance.

## Supported API-backed rule ids

- `credit-card`
- `iban`
- `cpf`
- `cnpj`
- `pis-pasep-labeled`
- `chile-rut`
- `cuit`
- `nit`
- `ruc-labeled`
- `pt-nif-labeled`
- `es-dni-labeled`
- `es-nie-labeled`
- `cn-resident-id-labeled`
- `ru-inn-labeled`
- `ru-snils-labeled`
- `in-aadhaar-labeled`

Unsupported rules are returned as `unsupported`, which keeps the frontend from retrying them forever.

## Frontend

- Added `src/app/core/mask-safety/` for HTTP contracts, batching, grouping, and retry logic.
- `ScanSessionService` now runs local masking first and then calls the mask-safety hardener before publishing the final protected output.
- Regeneration actions are async now, so manual mask refreshes also get the same safety pass.
- Added a fallback `invalidateCandidateMask` mutation so a repeatedly compromising candidate can be nudged off the validator path before the final API check.
- Added a new scan phase message: `validating`.

## Verification

- `npm run test -- --runInBand` passed with 13 suites and 352 tests.
- `npm run build` passed.
- Backend execution and curl verification are still blocked in this workspace because `dotnet` is not installed on `PATH`.
- Curl samples are stored in `.tmp/mask-safety-api/curl-commands.md`.
