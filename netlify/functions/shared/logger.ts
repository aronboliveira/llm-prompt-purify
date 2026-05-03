/**
 * Structured JSON logger for Netlify functions.
 *
 * Output is single-line JSON written to stdout/stderr so Netlify log drains and
 * external aggregators (Datadog, Logtail, etc.) can parse it directly.
 *
 * Severity → stream:
 *   - "error" → console.error
 *   - "warn"  → console.warn
 *   - "info"  → console.log
 */

export type LogSeverity = "info" | "warn" | "error";

export interface LogPayload {
  readonly [key: string]: unknown;
}

export function logFunctionEvent(
  fn: string,
  event: string,
  severity: LogSeverity,
  payload: LogPayload = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    fn,
    event,
    severity,
    ...payload,
  });

  if (severity === "error") console.error(line);
  else if (severity === "warn") console.warn(line);
  else console.log(line);
}
