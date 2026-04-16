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
 * Returns `true` when the backend health endpoint responds (any status).
 * Caches the result for the lifetime of the worker process.
 */
export async function isBackendReachable(): Promise<boolean> {
  if (_reachable !== null) return _reachable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    await fetch(`${BACKEND_URL}/api/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    _reachable = true;
  } catch {
    _reachable = false;
  }
  return _reachable;
}
