const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;

export function sanitize(input: string | undefined | null): string | null {
  if (!input || !input.trim()) return null;
  let sanitized = input;
  sanitized = sanitized.replace(SCRIPT_TAG_RE, "");
  sanitized = sanitized.replace(EVENT_HANDLER_RE, "");
  return htmlEncode(sanitized);
}

export function sanitizeAndTrim(
  input: string | undefined | null,
  defaultValue = ""
): string {
  if (!input || !input.trim()) return defaultValue;
  return sanitize(input.trim()) ?? defaultValue;
}

export function htmlEncode(input: string | undefined | null): string | null {
  if (!input) return null;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
