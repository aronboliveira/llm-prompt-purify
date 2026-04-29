/**
 * Shared backend-API helpers for E2E tests that probe HTTP headers
 * or other backend-only behaviour.
 *
 * The backend URL defaults to the Angular dev-server (which proxies
 * /api/* via proxy.conf.json).  Override with the BACKEND_URL env var
 * when a separate server (Netlify Dev, Kestrel, etc.) is running.
 */

export const BACKEND_URL =
  process.env["BACKEND_URL"] || "http://127.0.0.1:4200";

let _reachable: boolean | null = null;

/**
 * Returns `true` when the backend health endpoint responds as the real JSON
 * API. Dev-server proxy errors are HTTP responses too, so status and body are
 * checked before backend-only tests are enabled.
 */
export async function isBackendReachable(): Promise<boolean> {
  if (_reachable !== null) return _reachable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      _reachable = false;
      return _reachable;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      _reachable = false;
      return _reachable;
    }
    const body = (await response.json().catch(() => null)) as
      | { status?: unknown }
      | null;
    _reachable = body?.status === "ok";
  } catch {
    _reachable = false;
  }
  return _reachable;
}
