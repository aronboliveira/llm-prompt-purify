CREATE TABLE IF NOT EXISTS schema_migrations (
  version  integer PRIMARY KEY,
  name     text    NOT NULL,
  applied_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_register (
  id uuid PRIMARY KEY,
  category text NOT NULL,
  email text,
  message text NOT NULL,
  name text,
  rating integer,
  source text NOT NULL,
  subject text,
  wants_reply boolean NOT NULL DEFAULT false,
  delivery_status text NOT NULL CHECK (delivery_status IN ('pending', 'emailed', 'failed')),
  delivery_error text,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  locked_until_at timestamptz,
  created_at_utc timestamptz NOT NULL,
  updated_at_utc timestamptz NOT NULL DEFAULT now(),
  emailed_at_utc timestamptz,
  expires_at_utc timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE TABLE IF NOT EXISTS feedback_ledger (
  event_id bigserial PRIMARY KEY,
  feedback_id uuid NOT NULL,
  event_type text NOT NULL,
  delivery_status text NOT NULL,
  event_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_register_due
  ON feedback_register (next_attempt_at)
  WHERE delivery_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_feedback_register_expires
  ON feedback_register (expires_at_utc);

CREATE INDEX IF NOT EXISTS idx_feedback_ledger_feedback
  ON feedback_ledger (feedback_id, created_at_utc);
