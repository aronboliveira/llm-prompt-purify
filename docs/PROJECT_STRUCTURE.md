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
│   │   ├── purification/ # Isomorphic content purification (XSS, XXE, SQLi)
│   │   └── state/        # Session state management
│   ├── features/         # Feature modules
│   │   ├── feedback/     # Feedback UI components
│   │   └── scanner/      # Main scanner UI
│   ├── shared/           # Reusable components, utils
│   └── testing/          # Test fixtures & mocks
├── tests/                # All test suites
│   ├── e2e/              # Playwright E2E tests
│   │   ├── _helpers/     # Shared E2E helpers & registrators
│   │   ├── io/           # Extreme-IO & high-entropy specs
│   │   ├── workflow/     # Scan-workflow & visual-demo specs
│   │   └── corpus/       # Prompt-corpus specs
│   │       ├── cluster/  # 9 plain + 27 cluster×formality specs
│   │       ├── formality/# 3 formality-level specs
│   │       ├── lang/     # 4 per-language specs (en, pt-br, es, zh)
│   │       └── role/     # 28 per-role specs
│   ├── jest/             # Jest unit & integration tests
│   │   ├── corpus/       # Prompt-corpus unit specs
│   │   │   ├── cluster/  # 9 cluster specs
│   │   │   └── formality/# 3 formality specs
│   │   ├── masking/      # Masking engine specs (11 + utils/)
│   │   ├── mask-safety/  # Mask-safety validation specs
│   │   ├── feedback/     # Feedback service specs
│   │   ├── purification/ # Purification engine specs
│   │   └── state/        # State management specs
│   ├── python/           # Python test scripts (pytest, Selenium)
│   └── scripts/          # Shell-based smoke & corpus tests
├── backend/              # .NET 8 API
│   ├── LLMPromptPurify.Api/
│   └── LLMPromptPurify.Api.Tests/
├── http/                 # HTTP API test scripts
├── docker/               # Docker configs
└── docs/                 # Documentation
```

## TypeScript Path Aliases

Configured in `tsconfig.json` and `jest.config.js`:

| Alias         | Path                 | Usage                     |
| ------------- | -------------------- | ------------------------- |
| `@core/*`     | `src/app/core/*`     | Core services & engines   |
| `@shared/*`   | `src/app/shared/*`   | Shared utilities & styles |
| `@features/*` | `src/app/features/*` | Feature modules           |
| `@testing/*`  | `src/app/testing/*`  | Test fixtures & mocks     |

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

| File                   | Purpose                       |
| ---------------------- | ----------------------------- |
| `angular.json`         | Angular CLI configuration     |
| `jest.config.js`       | Jest test runner config       |
| `playwright.config.ts` | E2E test configuration        |
| `eslint.config.mjs`    | ESLint flat config (lax mode) |
| `tsconfig.json`        | TypeScript configuration      |
| `docker-compose.yml`   | Local development stack       |

## Scripts

```bash
npm start           # Dev server (localhost:4200)
npm run build       # Production build
npm test            # Run Jest tests (44 suites / 4576+ tests)
npm run test:e2e    # Run all Playwright tests (685 specs)
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix lint issues
npm run docker:up   # Start Docker stack
```

## Docker Services

| Service  | Port  | Description           |
| -------- | ----- | --------------------- |
| frontend | 44200 | Angular app (nginx)   |
| backend  | 48080 | .NET API              |
| db       | -     | PostgreSQL (internal) |

## Core Modules

### Masking Engine (`core/masking/`)

Pattern-based PII detection and masking engine. Supports multiple locales (US, BR) with configurable detection profiles.

```
masking/
├── constants/           # Pattern definitions, locale configs
│   └── polyglot-pools.constants.ts  # Unicode character pools (21 scripts)
├── declarations/        # ScanMatch, MaskResult types
├── strategies/          # Strategy pattern for mask generation
│   ├── strategy-registry.ts
│   └── masking-strategy.interface.ts
├── utils/               # Luhn generation, mask formatting
│   └── polyglot-mask.utils.ts       # Polyglot mask generator
├── masking.engine.ts    # Main engine class (deterministic, pure)
└── masking.engine.ts    # Main engine class (deterministic, pure)
```

#### Polyglot Mask Alphabet

When the "random" strategy is active, users can opt into **polyglot masking** — masks built from characters drawn across four Unicode writing-system families:

| Family     | Scripts included                                            |
| ---------- | ----------------------------------------------------------- |
| Abugida    | Devanagari, Bengali, Tamil, Telugu, Gujarati, Kannada, Thai |
| Alphabetic | Cyrillic, Extended Latin, Armenian, Georgian                |
| Syllabary  | Katakana, Hiragana, Hangul Jamo, Ethiopic                   |
| Symbol     | Keyboard, Math, Arrows, Geometric, Box-drawing, Misc        |

Key invariant: **no two consecutive characters may come from the same family**, making it impossible for masked output to form real words in any language. Users can enable/disable families and exclude specific subtypes via the Masking Settings modal.

### Purification Module (`core/purification/`)

Isomorphic content sanitization for security threats. Works in both browser and server environments without DOM dependencies.

```
purification/
├── declarations/
│   └── purification.types.ts    # ThreatMatch, PurificationResult
├── utils/
│   ├── xss-purify.utils.ts      # XSS patterns & HTML encoding
│   ├── sql-detect.utils.ts      # SQL injection detection
│   ├── xxe-detect.utils.ts      # XXE/XML entity detection
│   └── path-traversal.utils.ts  # Path traversal detection
├── purification.service.ts      # ContentPurifier service
└── index.ts                     # Public API exports
```

**Threat Types:**

- **XSS**: Script injection, event handlers, javascript: protocol
- **SQL Injection**: OR-based, UNION SELECT, stacked queries, blind injection
- **XXE**: External entities, DTD references, XInclude
- **Path Traversal**: `../` sequences, URL-encoded variants, absolute paths

**Usage:**

```typescript
import { ContentPurifier, purifyContent } from "@core/purification";

// Angular DI
const purifier = inject(ContentPurifier);
const result = purifier.purify(userInput, { stripThreats: true });

// Standalone (no Angular)
const threats = detectThreats(userInput);
const clean = purifyContent(userInput, { encodeHtml: true });
```
