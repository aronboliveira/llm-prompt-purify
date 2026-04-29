# Deployment

This app deploys to Netlify as a static SPA plus serverless functions in
[netlify/functions/](netlify/functions/). The Docker setup in [docker/](docker/)
is retained only for spinning up a local nginx-served build of the Angular app
without the serverless layer.

## 1. Netlify project setup

1. Create a new site from the Git repo. Netlify auto-detects [netlify.toml](netlify.toml).
2. Confirm the build settings match `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/llm-prompt-purify/browser`
   - **Functions directory:** `netlify/functions`
   - **Node version:** `22` (set via `[build.environment]`)

## 2. Required environment variables

Set these in **Site settings → Environment variables** in the Netlify
dashboard. Values are read at function runtime by
[netlify/functions/feedback.ts](netlify/functions/feedback.ts) and
[netlify/functions/mask-safety-validate.ts](netlify/functions/mask-safety-validate.ts).

| Variable                        | Required | Default                                 | Purpose                                                                                       |
| ------------------------------- | -------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGIN`                | Yes      | `https://llm-prompt-purify.netlify.app` | CORS allow-origin for both `/api/feedback` and `/api/mask-safety/validate`. Set to your custom domain if used. |
| `DATABASE_URL`                  | No       | —                                       | PostgreSQL connection string for the durable feedback outbox.                                 |
| `DATABASE_SSL`                  | No       | auto                                    | Set to `false` for local PostgreSQL without TLS. Hosted databases use TLS by default.         |
| `FEEDBACK_OUTBOX_AUTO_MIGRATE`  | No       | enabled                                 | Set to `false` if tables are managed by migrations instead of function startup.               |
| `DEVELOPER_EMAIL_TO`            | Yes      | —                                       | Recipient inbox for feedback submissions.                                                     |
| `SMTP_HOST`                     | Yes      | —                                       | SMTP server (e.g., `smtp.gmail.com`).                                                         |
| `SMTP_PORT`                     | No       | `587`                                   | SMTP port. `465` switches the transport to TLS-on-connect.                                    |
| `SMTP_USERNAME`                 | Yes      | —                                       | SMTP auth username.                                                                           |
| `SMTP_PASSWORD`                 | Yes      | —                                       | SMTP auth password / app password. Treat as a secret; never commit.                           |
| `SMTP_SENDER_EMAIL`             | No       | falls back to `SMTP_USERNAME`           | `From:` address on outbound feedback emails.                                                  |

If any of `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, or
`DEVELOPER_EMAIL_TO` is missing, feedback can still be written to the outbox
when `DATABASE_URL` is configured. The client receives
`deliveryStatus: "queued"` and the scheduled `feedback-retry` function retries
SMTP delivery every five minutes.

The outbox uses a mutable `feedback_register` table for pending retry state and
an append-only `feedback_ledger` table for delivery events. The SQL definition
is in [docs/feedback-outbox.postgres.sql](docs/feedback-outbox.postgres.sql).
By default the functions create the tables if they are missing; set
`FEEDBACK_OUTBOX_AUTO_MIGRATE=false` if your database should be migration-only.

If neither SMTP nor `DATABASE_URL` is configured, feedback validation still
returns `201` with `deliveryStatus: "not-delivered"` so development flows do
not break, but nothing durable is stored.

For Gmail, use an [App Password](https://myaccount.google.com/apppasswords)
rather than the account password.

## 3. Custom domain

If you point a custom domain at the site:

1. Add the domain in **Site settings → Domain management**.
2. Update `ALLOWED_ORIGIN` to the new origin (no trailing slash).
3. Verify TLS is provisioned and that
   `Strict-Transport-Security` is being served — the header is configured in
   [netlify.toml](netlify.toml). Once stable, optionally submit the domain to
   the [HSTS preload list](https://hstspreload.org/).

## 4. Verifying a deploy

After the first successful deploy, confirm:

- `GET /api/health` returns `{"status":"ok","service":"feedback-api"}`.
- `OPTIONS /api/feedback` returns the configured CORS headers.
- The browser console shows no CSP violations on first load.
- The service worker (`ngsw-worker.js`) registers — visible in
  DevTools → Application → Service Workers.

## 5. Local development

```sh
# Frontend only (proxies /api to localhost via proxy.conf.json)
npm start

# Frontend + functions together (recommended for /api work)
npx netlify dev
```

`netlify dev` reads environment variables from a local `.env` file. Copy
[.env.docker.example](.env.docker.example) as a template, but rename SMTP
values for local testing — never commit the resulting `.env`.
