# API Reference

All endpoints are Netlify serverless functions reachable at
`https://llm-prompt-purify.netlify.app/.netlify/functions/<name>` or
via the `/api/*` redirect rules defined in `netlify.toml`.

---

## GET /api/health

Returns the service health status.

**Response 200**

```json
{
  "status": "ok",
  "service": "feedback-api"
}
```

**Rate limit:** 30 requests per minute per IP.

---

## POST /api/feedback

Submits user feedback. The function validates the payload, writes it to the
PostgreSQL outbox (if configured), and attempts SMTP delivery.

**Request body**

```json
{
  "category": "bug-report",
  "email": "user@example.com",
  "message": "The scan button stays disabled after pasting a multi-paragraph prompt.",
  "name": "Jane",
  "rating": null,
  "subject": "Scan button disabled",
  "wantsReply": true
}
```

| Field      | Type      | Required | Constraints            |
| ---------- | --------- | -------- | ---------------------- |
| `category` | string    | Yes      | One of `appraisal`, `bug-report`, `contact-developers`, `general-feedback` |
| `email`    | string    | No       | Valid email when `wantsReply: true` or `category: "contact-developers"` |
| `message`  | string    | Yes      | Trimmed, 1–4000 chars. Sanitized for XSS. |
| `name`     | string    | No       | Max 80 chars. Sanitized. |
| `rating`   | number    | No       | 1–5. Required when `category` is `appraisal`. |
| `subject`  | string    | No       | Required when `category` is `contact-developers`. Max 160 chars. Sanitized. |
| `wantsReply`| boolean  | No       | When `true`, email becomes required and is set as `reply-to`. |

**Response 201 — Submitted**

```json
{
  "createdAtUtc": "2026-05-01T14:00:00.000Z",
  "deliveryStatus": "emailed",
  "id": "b3e8c1d2-...",
  "message": "Feedback saved and emailed to the developers."
}
```

`deliveryStatus` is one of:

- `emailed` — SMTP delivery succeeded.
- `queued` — stored in the outbox for retry (SMTP failed or is unconfigured).
- `not-delivered` — no durable outbox or SMTP is configured.

**Response 400** — Invalid JSON body.

**Response 405** — Method not allowed (only POST and OPTIONS).

**Response 422** — Validation errors.

```json
{
  "errors": {
    "message": ["Write a short note before submitting feedback."],
    "email": ["Use a valid email address."]
  }
}
```

**Response 429** — Rate limited.

```json
{
  "error": "Too many requests. Please slow down.",
  "retryAfter": 42
}
```

Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

**Rate limit:** 5 submissions per 15 minutes per IP, minimum 8 s between calls.

---

## POST /api/feedback-retry

Scheduled retry of pending outbox entries. Invoked by Netlify's cron queue
every 5 minutes (`x-netlify-event: schedule`). Also callable via direct HTTP
with a shared secret.

**Headers**

| Header                     | Required | Description                                           |
| -------------------------- | -------- | ----------------------------------------------------- |
| `x-feedback-retry-secret`  | Yes*     | Must match `FEEDBACK_RETRY_SECRET` env var.           |
| `x-netlify-event`          | No       | If set to `schedule`, the secret check is bypassed.   |

**Response 200** — Batch completed.

```json
{
  "cleaned": 3,
  "emailed": 5,
  "failed": 1,
  "scanned": 6
}
```

**Response 401** — Missing or invalid secret.
**Response 503** — `FEEDBACK_RETRY_SECRET` is not configured.

---

## POST /api/mask-safety/validate

Batch validation of masked candidates against API-backed compromising-identifier
rules. Each candidate is checked against the validator registered for its rule
ID. Used by the safety-check retry loop in the scanner.

**Request body**

```json
{
  "candidates": [
    { "ruleId": "cpf", "candidateValue": "123.456.789-00" },
    { "ruleId": "email", "candidateValue": "alice@company.com" }
  ]
}
```

| Field            | Type   | Required | Constraints                            |
| ---------------- | ------ | -------- | -------------------------------------- |
| `candidates`     | array  | Yes      | 1–128 items.                           |
| `candidates[].ruleId`        | string | Yes      | Registered validator key.              |
| `candidates[].candidateValue`| string | Yes      | The unmasked text to evaluate.         |

**Response 200**

```json
{
  "results": [
    {
      "candidateValue": "123.456.789-00",
      "decision": "compromising",
      "isCompromising": true,
      "isSupported": true,
      "message": "The candidate still passes the target identifier validation and should be regenerated.",
      "ruleId": "cpf"
    },
    {
      "candidateValue": "alice@company.com",
      "decision": "safe",
      "isCompromising": false,
      "isSupported": true,
      "message": "The candidate no longer passes the target identifier validation.",
      "ruleId": "email"
    }
  ]
}
```

`decision` values:
- `compromising` — the candidate still looks like a real identifier; re-generate the mask.
- `safe` — the candidate no longer passes the identifier validation.
- `unsupported` — the rule has no API-backed validator yet.

**Response 400** — Invalid JSON body.
**Response 405** — Method not allowed.
**Response 422** — `candidates` is missing or exceeds 128 items.
**Response 429** — Rate limited.

**Rate limit:** 60 validations per minute per IP, minimum 500 ms between calls.

---

## Common response headers

All endpoints return these security headers:

```
Content-Security-Policy: default-src 'none'; script-src 'none'; style-src 'none'; ...
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

CORS headers (`Access-Control-Allow-Origin`, etc.) are included on
preflight and response paths.
