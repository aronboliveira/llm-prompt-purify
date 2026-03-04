# LLM Prompt Purify

Client-side prompt sanitization for masking sensitive data before pasting content into web-based LLM interfaces.

## What the app does

The app lets a user:

1. paste raw content into a textarea
2. run a local scan in the browser
3. get a masked output immediately
4. disable individual masks if needed
5. copy the current masked output

The current rule focus is:

- American English
- Brazilian Portuguese
- LatAm Spanish

No prompt text is sent to a third party during masking.

## Current architecture

- Angular standalone app
- .NET 8 feedback API under `backend/LLMPromptPurify.Api`
- PostgreSQL persistence for stored feedback submissions
- pure masking engine under `src/app/core/masking`
- signal-based session state under `src/app/core/state`
- Jest for unit coverage
- xUnit for backend unit coverage
- Playwright for end-to-end flow checks
- Angular SSR server in `server.ts`

## Project status

This repository was overhauled from an earlier prototype. The current app is intentionally narrower:

- no modal-heavy review flow
- no copied regex engine in a separate browser extension
- no dead feedback/contact surfaces
- no primary action that copies raw unmasked input

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm start
```

Build:

```bash
npm run build
```

Run unit tests:

```bash
npm run test -- --runInBand
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## Docker stack

Copy the sample environment file, then fill the SMTP values from `.sct/app-password.yml`:

```bash
cp .env.docker.example .env.docker
```

Build and run the frontend, backend, and database containers:

```bash
docker compose --env-file .env.docker up --build
```

The services are exposed as:

- frontend: `http://127.0.0.1:4200`
- backend: `http://127.0.0.1:8080/api/health`
- database: internal `db:5432` inside the Compose network

## Important paths

- app shell: `src/app/app.component.ts`
- feedback UI: `src/app/features/feedback/components/feedback-sheet`
- feedback API: `backend/LLMPromptPurify.Api`
- backend tests: `backend/LLMPromptPurify.Api.Tests`
- masking engine: `src/app/core/masking/masking.engine.ts`
- scan state: `src/app/core/state/scan-session.service.ts`
- unit tests: `src/app/core/**/*.spec.ts`
- e2e tests: `e2e/scan-workflow.spec.ts`
- LLM workflow notes: `.notes/.llms/`

## Notes

- `.notes/` now holds durable project and agent guidance.
- `.tmp/` holds volatile logs and verification artifacts.
- the old Chromium extension prototype was removed during the overhaul because it had drifted from the application behavior.
