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

| Variable                          | Required | Default                                 | Purpose                                                                                       |
| --------------------------------- | -------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGIN`                  | Yes      | `https://llm-prompt-purify.netlify.app` | CORS allow-origin for both `/api/feedback` and `/api/mask-safety/validate`. Set to your custom domain if used. |
| `DATABASE_URL`                    | No       | —                                       | PostgreSQL connection string for the durable feedback outbox.                                 |
| `DATABASE_SSL`                    | No       | auto                                    | Set to `false` for local PostgreSQL without TLS. Hosted databases use verified TLS by default.|
| `DATABASE_SSL_CA`                 | No       | —                                       | CA certificate (PEM content) for providers whose CA is not in the default system trust store (e.g., DigitalOcean Managed Postgres). |
| `DATABASE_SSL_REJECT_UNAUTHORIZED`| No       | `true`                                  | Set to `false` only for self-signed certificates in controlled environments. Do not set in production. |
| `FEEDBACK_RETRY_SECRET`           | Yes*     | —                                       | Shared secret for the scheduled `/api/feedback-retry` endpoint. Required if outbox is used.   |
| `FEEDBACK_OUTBOX_AUTO_MIGRATE`    | No       | enabled                                 | Set to `false` if tables are managed by external migration tooling.                           |
| `DEVELOPER_EMAIL_TO`              | Yes      | —                                       | Recipient inbox for feedback submissions.                                                     |
| `SMTP_HOST`                       | Yes      | —                                       | SMTP server (e.g., `smtp.gmail.com`).                                                         |
| `SMTP_PORT`                       | No       | `587`                                   | SMTP port. `465` switches the transport to TLS-on-connect.                                    |
| `SMTP_USERNAME`                   | Yes      | —                                       | SMTP auth username.                                                                           |
| `SMTP_PASSWORD`                   | Yes      | —                                       | SMTP auth password / app password. Treat as a secret; never commit.                           |
| `SMTP_SENDER_EMAIL`               | No       | falls back to `SMTP_USERNAME`           | `From:` address on outbound feedback emails.                                                  |

If any of `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, or
`DEVELOPER_EMAIL_TO` is missing, feedback can still be written to the outbox
when `DATABASE_URL` is configured. The client receives
`deliveryStatus: "queued"` and the scheduled `feedback-retry` function retries
SMTP delivery every five minutes.

The outbox uses a mutable `feedback_register` table for pending retry state and
an append-only `feedback_ledger` table for delivery events. The SQL reference is
in [docs/feedback-outbox.postgres.sql](docs/feedback-outbox.postgres.sql).

**Schema migrations:** The `ensureSchema` runner maintains a `schema_migrations`
table and applies pending migrations in version order. Each migration is
idempotent (`CREATE TABLE IF NOT EXISTS`, etc.) and recorded with a timestamp.
By default migrations run automatically at function startup (`FEEDBACK_OUTBOX_AUTO_MIGRATE` defaults to enabled). For production databases, set
`FEEDBACK_OUTBOX_AUTO_MIGRATE=false` and apply migrations externally before
deploying.

If neither SMTP nor `DATABASE_URL` is configured, feedback validation still
returns `201` with `deliveryStatus: "not-delivered"` so development flows do
not break, but nothing durable is stored.

For Gmail, use an [App Password](https://myaccount.google.com/apppasswords)
rather than the account password.

### Rate limiting

`/api/feedback` and `/api/mask-safety/validate` enforce per-IP rate limits via
an in-memory limiter ([rate-limiter.ts](netlify/functions/shared/rate-limiter.ts)).
The limiter is best-effort: state resets on cold starts and does not coordinate
across parallel function instances. For production workloads requiring strict,
durable rate limits, replace the in-memory implementation with an external
store (e.g., Upstash Redis + `@upstash/ratelimit`). The function interface
(`checkRateLimit` / `rateLimitResponse`) is narrow to support this swap.

### Feedback retry endpoint auth

The `/api/feedback-retry` endpoint is invoked by Netlify's scheduled-function
cron queue (every 5 minutes) but is also reachable via direct HTTP. It requires
the `x-feedback-retry-secret` header to match `FEEDBACK_RETRY_SECRET`. Netlify
scheduled invocations include `x-netlify-event: schedule` and are always
authorized; direct HTTP calls without the correct secret receive 401.

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
- `GET /.netlify/functions/feedback-retry` returns 401 without
  the `x-feedback-retry-secret` header.
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

## 6. Docker (local nginx container)

The Docker setup in [docker/](docker/) builds a production Angular bundle and
serves it through nginx. It is **not** a full local stack — the nginx config
proxies `/api/*` to the live Netlify deployment:

```
proxy_pass https://llm-prompt-purify.netlify.app;
```

This means API calls from the Docker container always hit the production
Netlify functions, not local ones. The SMTP and database credentials used
are whatever is configured in the production Netlify environment variables.

To point the Docker container at a local `netlify dev` instance instead,
override the upstream in `docker/nginx.conf` or mount a custom config:

```nginx
# Replace the proxy_pass line:
proxy_pass http://host.docker.internal:8888;
```

Then start `npx netlify dev --port 8888` on the host before running the
container. The `.env` file in the project root will be used for function
environment variables.

If you do not need API calls at all from Docker, remove or comment out the
`location /api/` block in `docker/nginx.conf`.
