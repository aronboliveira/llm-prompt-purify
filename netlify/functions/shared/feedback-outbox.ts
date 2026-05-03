import { Pool, type PoolConfig, type QueryResultRow } from "pg";
import type { FeedbackEmailDispatchResult } from "./feedback-mailer.js";
import type { FeedbackEntry } from "./types.js";

type FeedbackOutboxStatus = "emailed" | "failed" | "pending";

interface FeedbackOutboxRow extends QueryResultRow {
  id: string;
  category: string;
  created_at_utc: Date;
  delivery_error: string | null;
  delivery_status: FeedbackOutboxStatus;
  email: string | null;
  message: string;
  name: string | null;
  rating: number | null;
  source: string;
  subject: string | null;
  wants_reply: boolean;
}

export interface FeedbackOutboxWriteResult {
  readonly error: string | null;
  readonly status: "disabled" | "failed" | "stored";
}

export interface FeedbackRetryBatchResult {
  readonly cleaned: number;
  readonly emailed: number;
  readonly failed: number;
  readonly scanned: number;
}

const MAX_RETRY_ATTEMPTS = 8;
const REGISTER_TTL_DAYS = 30;
const RETRY_LIMIT = 25;
const LOCK_TTL_SECONDS = 120;
const RETRY_BACKOFF_SECONDS = [60, 300, 900, 3_600, 10_800, 21_600, 43_200];

interface Migration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: "create_schema_migrations",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version  integer PRIMARY KEY,
        name     text    NOT NULL,
        applied_at_utc timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
  {
    version: 2,
    name: "create_feedback_outbox",
    sql: `
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
        expires_at_utc timestamptz NOT NULL DEFAULT (now() + interval '${REGISTER_TTL_DAYS} days')
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
    `,
  },
];

let pool: Pool | null | undefined;
let schemaReady: Promise<void> | null = null;

function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocalDatabase = /(?:localhost|127\.0\.0\.1)/.test(connectionString);
  const sslDisabled = process.env.DATABASE_SSL === "false" || isLocalDatabase;

  if (sslDisabled) {
    return { connectionString, max: 3, ssl: false };
  }

  const sslConfig: NonNullable<PoolConfig["ssl"]> = {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
  };

  const ca = process.env.DATABASE_SSL_CA;
  if (ca) {
    try {
      sslConfig.ca = JSON.parse(ca) as string;
    } catch {
      sslConfig.ca = ca;
    }
  }

  return { connectionString, max: 3, ssl: sslConfig };
}

function getPool(): Pool | null {
  if (pool !== undefined) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    pool = null;
    return pool;
  }

  pool = new Pool(buildPoolConfig(connectionString));
  return pool;
}

async function ensureSchema(activePool: Pool): Promise<void> {
  if (process.env.FEEDBACK_OUTBOX_AUTO_MIGRATE === "false") return;
  schemaReady ??= (async () => {
    const client = await activePool.connect();
    try {
      // Migration v1 (schema_migrations table) must run first so we can track
      // future migrations, but it uses IF NOT EXISTS so it is safe even if
      // a prior function run already created the table.
      for (const migration of MIGRATIONS) {
        const { rows } = await client.query<{ version: number }>(
          "SELECT version FROM schema_migrations WHERE version = $1",
          [migration.version],
        );
        if (rows.length > 0) continue;
        try {
          await client.query("BEGIN");
          await client.query(migration.sql);
          await client.query(
            "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
            [migration.version, migration.name],
          );
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      }
    } finally {
      client.release();
    }
  })();

  await schemaReady;
}

function nextRetryDelaySeconds(attempts: number): number {
  return RETRY_BACKOFF_SECONDS[
    Math.min(attempts, RETRY_BACKOFF_SECONDS.length - 1)
  ];
}

function rowToEntry(row: FeedbackOutboxRow): FeedbackEntry {
  return {
    category: row.category,
    createdAtUtc: row.created_at_utc.toISOString(),
    deliveryError: row.delivery_error,
    deliveryStatus: row.delivery_status === "emailed" ? "emailed" : "queued",
    email: row.email,
    id: row.id,
    message: row.message,
    name: row.name,
    rating: row.rating,
    source: row.source,
    subject: row.subject,
    wantsReply: row.wants_reply,
  };
}

async function withOutbox<T>(
  callback: (activePool: Pool) => Promise<T>,
): Promise<T | null> {
  const activePool = getPool();
  if (!activePool) return null;

  await ensureSchema(activePool);
  return callback(activePool);
}

export async function cleanupExpiredFeedbackRegisters(): Promise<number> {
  const result = await withOutbox(async activePool => {
    const deleteResult = await activePool.query(
      "DELETE FROM feedback_register WHERE expires_at_utc <= now()",
    );
    return deleteResult.rowCount ?? 0;
  });

  return result ?? 0;
}

export async function createFeedbackOutboxEntry(
  entry: FeedbackEntry,
): Promise<FeedbackOutboxWriteResult> {
  try {
    const result = await withOutbox(async activePool => {
      const client = await activePool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO feedback_register (
            id, category, email, message, name, rating, source, subject,
            wants_reply, delivery_status, delivery_error, next_attempt_at,
            created_at_utc, updated_at_utc, expires_at_utc
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, 'pending', NULL, now(),
            $10::timestamptz, now(), now() + ($11::text || ' days')::interval
          )`,
          [
            entry.id,
            entry.category,
            entry.email,
            entry.message,
            entry.name,
            entry.rating,
            entry.source,
            entry.subject,
            entry.wantsReply,
            entry.createdAtUtc,
            REGISTER_TTL_DAYS,
          ],
        );
        await client.query(
          `INSERT INTO feedback_ledger (
            feedback_id, event_type, delivery_status, metadata
          ) VALUES ($1, 'received', 'pending', $2::jsonb)`,
          [
            entry.id,
            JSON.stringify({
              category: entry.category,
              source: entry.source,
              wantsReply: entry.wantsReply,
            }),
          ],
        );
        await client.query("COMMIT");
        return { error: null, status: "stored" } as const;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });

    return result ?? { error: null, status: "disabled" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      status: "failed",
    };
  }
}

export async function claimPendingFeedbackEntries(
  limit = RETRY_LIMIT,
): Promise<readonly FeedbackEntry[]> {
  const result = await withOutbox(async activePool => {
    const queryResult = await activePool.query<FeedbackOutboxRow>(
      `WITH due AS (
        SELECT id
        FROM feedback_register
        WHERE delivery_status = 'pending'
          AND next_attempt_at <= now()
          AND expires_at_utc > now()
          AND (locked_until_at IS NULL OR locked_until_at <= now())
        ORDER BY next_attempt_at ASC, created_at_utc ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE feedback_register register
      SET locked_until_at = now() + ($2::text || ' seconds')::interval,
          updated_at_utc = now()
      FROM due
      WHERE register.id = due.id
      RETURNING register.*`,
      [limit, LOCK_TTL_SECONDS],
    );

    return queryResult.rows.map(rowToEntry);
  });

  return result ?? [];
}

export async function recordFeedbackEmailResult(
  entry: Pick<FeedbackEntry, "id">,
  dispatch: FeedbackEmailDispatchResult,
): Promise<FeedbackOutboxWriteResult> {
  try {
    const result = await withOutbox(async activePool => {
      const client = await activePool.connect();
      try {
        await client.query("BEGIN");
        const attemptsResult = await client.query<{ attempts: number }>(
          `SELECT attempts
           FROM feedback_register
           WHERE id = $1
           FOR UPDATE`,
          [entry.id],
        );

        const currentAttempts = attemptsResult.rows[0]?.attempts;
        if (currentAttempts === undefined) {
          await client.query("ROLLBACK");
          return {
            error: "Feedback outbox entry was not found.",
            status: "failed",
          } as const;
        }

        const nextAttempts = currentAttempts + 1,
          wasEmailed = dispatch.status === "emailed",
          nextStatus: FeedbackOutboxStatus = wasEmailed
            ? "emailed"
            : nextAttempts >= MAX_RETRY_ATTEMPTS
              ? "failed"
              : "pending",
          retryDelaySeconds = nextRetryDelaySeconds(nextAttempts - 1);

        await client.query(
          `UPDATE feedback_register
           SET attempts = $2,
               delivery_status = $3,
               delivery_error = $4,
               next_attempt_at = CASE
                 WHEN $3 = 'pending'
                   THEN now() + ($5::text || ' seconds')::interval
                 ELSE NULL
               END,
               locked_until_at = NULL,
               emailed_at_utc = CASE WHEN $3 = 'emailed' THEN now() ELSE emailed_at_utc END,
               updated_at_utc = now()
           WHERE id = $1`,
          [
            entry.id,
            nextAttempts,
            nextStatus,
            dispatch.error,
            retryDelaySeconds,
          ],
        );
        await client.query(
          `INSERT INTO feedback_ledger (
            feedback_id, event_type, delivery_status, event_error, metadata
          ) VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            entry.id,
            wasEmailed ? "email_delivered" : "email_attempt_failed",
            nextStatus,
            dispatch.error,
            JSON.stringify({
              attempts: nextAttempts,
              nextRetryDelaySeconds:
                nextStatus === "pending" ? retryDelaySeconds : null,
            }),
          ],
        );
        await client.query("COMMIT");

        return { error: dispatch.error, status: "stored" } as const;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });

    return result ?? { error: null, status: "disabled" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      status: "failed",
    };
  }
}

export async function retryPendingFeedbackEmails(
  sendEmail: (entry: FeedbackEntry) => Promise<FeedbackEmailDispatchResult>,
): Promise<FeedbackRetryBatchResult> {
  const entries = await claimPendingFeedbackEntries();
  let emailed = 0,
    failed = 0;

  for (const entry of entries) {
    const dispatch = await sendEmail(entry);
    if (dispatch.status === "emailed") emailed += 1;
    else failed += 1;
    await recordFeedbackEmailResult(entry, dispatch);
  }

  return {
    cleaned: await cleanupExpiredFeedbackRegisters(),
    emailed,
    failed,
    scanned: entries.length,
  };
}
