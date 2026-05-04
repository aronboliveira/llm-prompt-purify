<div align="center">
  <h1>LLM Prompt Purify</h1>
  <p><i>Client-side prompt sanitization — mask sensitive data before it reaches web-based LLMs.</i></p>
</div>

---

## About

LLM Prompt Purify is an **Angular 18 single-page web app** deployed on Netlify.
Paste or type a prompt, and the app scans it for sensitive data (API keys,
credit cards, PII, emails, IPs, Brazilian IDs, and more) using a regex +
heuristic rule engine. Detected secrets are replaced with safe placeholders so
you can copy the purified text into ChatGPT, Claude, or any web-based LLM
without accidentally leaking credentials.

**All scanning happens in your browser.** No prompt text leaves your device
unless you choose to submit optional feedback through the feedback form.

---

## Key Features

- **100% client-side scanning** — prompts never leave your browser during
  normal use.
- **Rule engine** — detects API keys, credit cards, CPF/CNPJ, emails, IPs,
  and more via regex and heuristic validation.
- **Polyglot mask alphabet** — optional Unicode masking interleaves characters
  from abugidas, syllabaries, and scripts (Cyrillic, Armenian, Georgian, math
  symbols) so no two consecutive characters belong to the same writing system.
- **Security purification** — detects and neutralizes XSS, XXE, SQL injection,
  and path traversal attacks in pasted content.
- **Offline-capable** — Angular service worker enables instant loading after
  the first visit and works without a network connection.
- **Feedback API** — optional feedback form backed by Netlify serverless
  functions with SMTP delivery and a PostgreSQL outbox for retry reliability.
- **Global error overlay** — unhandled errors render a custom alert dialog
  instead of a blank white screen.

---

## Architecture

| Layer           | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Frontend        | Angular 18 (standalone components, signals, OnPush)           |
| Hosting         | Netlify (static SPA)                                          |
| API / backend   | Netlify serverless functions (Node.js 22, TypeScript)         |
| Outbox database | PostgreSQL (optional — enables durable feedback retry)        |
| Email delivery  | Nodemailer via SMTP                                           |
| Tests           | Jest (unit), Playwright (E2E), pytest (corpus), shell scripts |
| CI              | GitHub Actions                                                |

### API Endpoints

| Path                        | Methods       | Description                                                            |
| --------------------------- | ------------- | ---------------------------------------------------------------------- |
| `/api/health`               | GET           | Health check                                                           |
| `/api/feedback`             | POST, OPTIONS | Submit feedback (validates, stores to outbox, emails)                  |
| `/api/feedback-retry`       | GET, POST     | Scheduled retry of pending feedback (requires `FEEDBACK_RETRY_SECRET`) |
| `/api/mask-safety/validate` | POST, OPTIONS | Batch validation of masked candidates against API-backed rules         |

Full API contracts are in [docs/API.md](docs/API.md).

---

## Development

```bash
# Install dependencies
npm install

# Start frontend with API proxy (localhost)
npm start

# Start frontend + Netlify functions together (recommended)
npx netlify dev

# Lint
npm run lint

# Unit tests (Jest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Production build
npm run build:prod

# Python corpus tests
pip install -r tests/python/requirements.txt
python -m pytest tests/python/ -v

# Shell corpus checks
bash tests/scripts/test-prompt-corpus-structure.sh
```

---

## Deployment

The app deploys to Netlify via `netlify.toml`. See [DEPLOYMENT.md](DEPLOYMENT.md)
for environment variable setup, database configuration, SSL and rate-limiting
guidance, and deploy verification steps.

---

## Privacy & data handling

The app processes all prompt text **locally** in your browser. No prompt content
is ever sent to external servers.

The optional **feedback form** can collect your name, email, category, and a
free-text message. When submitted:

- Feedback is stored in a PostgreSQL outbox (if `DATABASE_URL` is configured)
  and retained for **30 days**.
- If SMTP is configured, feedback is forwarded to the project maintainers by
  email. Email addresses in the `reply-to` field appear only if you request a
  reply.
- You can use the feedback form without providing your name or email.
- Set `FEEDBACK_OUTBOX_AUTO_MIGRATE=false` and `DATABASE_URL` to empty to
  disable persistent storage entirely.

No tracking, analytics, or third-party cookies are used.
