# Project Structure

> Last updated: March 2026

## Directory Layout

```
llm-prompt-purify/
├── src/app/              # Angular application
│   ├── core/             # Singleton services, engines, state
│   │   ├── feedback/     # Feedback submission service
│   │   ├── masking/      # Masking engine & rules
│   │   ├── mask-safety/  # Mask validation service
│   │   └── state/        # Session state management
│   ├── features/         # Feature modules
│   │   ├── feedback/     # Feedback UI components
│   │   └── scanner/      # Main scanner UI
│   ├── shared/           # Reusable components, utils
│   └── testing/          # Test fixtures & mocks
├── backend/              # .NET 8 API
│   ├── LLMPromptPurify.Api/
│   └── LLMPromptPurify.Api.Tests/
├── e2e/                  # Playwright E2E tests
├── http/                 # HTTP API test scripts
├── docker/               # Docker configs
└── docs/                 # Documentation
```

## TypeScript Path Aliases

Configured in `tsconfig.json` and `jest.config.js`:

| Alias       | Path                  | Usage                     |
| ----------- | --------------------- | ------------------------- |
| `@core/*`   | `src/app/core/*`      | Core services & engines   |
| `@shared/*` | `src/app/shared/*`    | Shared utilities & styles |
| `@features/*` | `src/app/features/*` | Feature modules           |
| `@testing/*` | `src/app/testing/*`  | Test fixtures & mocks     |

### Usage Example

```typescript
// Before (deep relative imports - avoid)
import { MaskingEngine } from "../../../../core/masking/masking.engine";

// After (path aliases - preferred)
import { MaskingEngine } from "@core/masking/masking.engine";
```

## Module Organization Pattern

Each domain folder follows this structure:

```
domain/
├── constants/            # Frozen const values
│   └── domain.constants.ts
├── declarations/         # Types & interfaces
│   └── domain.types.ts
├── utils/                # Pure utility functions
│   └── domain.utils.ts
└── domain.service.ts     # Main service file
```

## Key Files

| File | Purpose |
| ---- | ------- |
| `angular.json` | Angular CLI configuration |
| `jest.config.js` | Jest test runner config |
| `playwright.config.ts` | E2E test configuration |
| `eslint.config.mjs` | ESLint flat config (lax mode) |
| `tsconfig.json` | TypeScript configuration |
| `docker-compose.yml` | Local development stack |

## Scripts

```bash
npm start           # Dev server (localhost:4200)
npm run build       # Production build
npm test            # Run Jest tests
npm run test:e2e    # Run Playwright tests
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix lint issues
npm run docker:up   # Start Docker stack
```

## Docker Services

| Service  | Port  | Description |
| -------- | ----- | ----------- |
| frontend | 44200 | Angular app (nginx) |
| backend  | 48080 | .NET API |
| db       | -     | PostgreSQL (internal) |
